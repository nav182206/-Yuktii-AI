import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  FileText,
  Search,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Download,
  Globe,
  Building2,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Briefcase,
  Layers,
  FileSearch,
  Zap,
  Eye,
  MessageSquare,
  Factory,
  Target,
  Network,
  Languages,
  Sliders,
  Scan,
} from "lucide-react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "employee" | "owner";
}

interface CorporateEntity {
  id: string;
  name: string;
  industry: string;
  pan: string;
  cin: string;
  status: "pending" | "processing" | "completed" | "rejected";
  score: number | null;
  limit_requested: number;
  limit_recommended: number | null;
  risk_premium: number | null;
  last_updated: string;
  primary_notes?: string;
}

interface CAMSection {
  title: string;
  content: string;
  sources: string[];
  confidence: number;
  pillar?: "Character" | "Capacity" | "Capital" | "Collateral" | "Conditions";
}

interface DecisionLogic {
  recommendation: "LEND" | "REJECT" | "CAUTION";
  limit: number;
  rate: number;
  rationale: string;
  score_breakdown: {
    character: number;
    capacity: number;
    capital: number;
    collateral: number;
    conditions: number;
  };
  factors: {
    label: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
}

// --- Mock Data ---

const MOCK_CORPORATES: CorporateEntity[] = [
  {
    id: "1",
    name: "Vardhaman Textiles Ltd",
    industry: "Textiles",
    pan: "AAACV1234A",
    cin: "L17111PB1973PLC003345",
    status: "completed",
    score: 78,
    limit_requested: 500000000,
    limit_recommended: 450000000,
    risk_premium: 2.5,
    last_updated: "2026-03-05",
    primary_notes:
      "Factory operating at 85% capacity. Management seems stable.",
  },
  {
    id: "2",
    name: "Innova Autotech Pvt Ltd",
    industry: "Automotive",
    pan: "BBBCV5678B",
    cin: "U34100DL2010PTC204567",
    status: "processing",
    score: null,
    limit_requested: 120000000,
    limit_recommended: null,
    risk_premium: null,
    last_updated: "2026-03-06",
  },
  {
    id: "3",
    name: "GreenGrid Solar Solutions",
    industry: "Renewables",
    pan: "CCCCV9012C",
    cin: "U40106MH2015PTC267890",
    status: "pending",
    score: null,
    limit_requested: 250000000,
    limit_recommended: null,
    risk_premium: null,
    last_updated: "2026-03-06",
  },
  {
    id: "4",
    name: "SteelStrong Infrastructure",
    industry: "Steel",
    pan: "DDDCV3456D",
    cin: "L27100GJ1995PLC025678",
    status: "rejected",
    score: 42,
    limit_requested: 800000000,
    limit_recommended: 0,
    risk_premium: null,
    last_updated: "2026-03-04",
    primary_notes: "High labor turnover observed during site visit.",
  },
];

const MOCK_FINANCIALS = [
  { year: "FY21", revenue: 450, ebitda: 65, pat: 32 },
  { year: "FY22", revenue: 520, ebitda: 82, pat: 45 },
  { year: "FY23", revenue: 610, ebitda: 98, pat: 58 },
  { year: "FY24", revenue: 740, ebitda: 125, pat: 72 },
  { year: "FY25 (Proj)", revenue: 880, ebitda: 155, pat: 95 },
];

const MOCK_ALERTS = [
  {
    id: 1,
    type: "warning",
    msg: "GST vs Bank Statement Mismatch: Potential circular trading detected (12% variance)",
    source: "Structured Synthesis",
  },
  {
    id: 2,
    type: "danger",
    msg: "Pending litigation in Delhi High Court regarding land acquisition",
    source: "e-Courts Portal",
  },
  {
    id: 3,
    type: "info",
    msg: "Positive sector outlook: Government PLI scheme extension",
    source: "Secondary Research",
  },
];

// --- Components ---

const StatCard = ({ label, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Live
      </span>
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <h3 className="text-2xl font-bold">{value}</h3>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("credlens_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedEntity, setSelectedEntity] = useState<CorporateEntity | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ingestion" | "research" | "forensics" | "cam" | "management" | "status"
  >("dashboard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [camOutput, setCamOutput] = useState<CAMSection[]>([]);
  const [decisionLogic, setDecisionLogic] = useState<DecisionLogic | null>(
    null,
  );
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [primaryNotes, setPrimaryNotes] = useState("");
  const [whatIfParams, setWhatIfParams] = useState({
    interestRate: 0,
    revenueDrop: 0,
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedNotes, setTranslatedNotes] = useState("");
  const [forensicResults, setForensicResults] = useState<{
    tampered: boolean;
    confidence: number;
    details: string;
  } | null>(null);

  const networkRef = useRef<SVGSVGElement>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("credlens_user", JSON.stringify(data.user));
        // Set default tab based on role
        if (data.user.role === "admin") setActiveTab("management");
        else if (data.user.role === "employee") setActiveTab("dashboard");
        else if (data.user.role === "owner") setActiveTab("status");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("credlens_user");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CredLens <span className="text-indigo-600">AI</span>
            </h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to access your credit intelligence portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="e.g., admin@bank.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
              Demo Credentials
            </p>
            <div className="grid grid-cols-1 gap-2 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600">
                <span className="font-bold text-indigo-600">Super Admin:</span> admin@bank.com / admin123
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600">
                <span className="font-bold text-indigo-600">Employee:</span> employee@bank.com / bank123
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600">
                <span className="font-bold text-indigo-600">Customer:</span> owner@company.com / owner123
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  useEffect(() => {
    if (activeTab === "forensics" && selectedEntity && networkRef.current) {
      renderNetwork();
    }
  }, [activeTab, selectedEntity]);

  const renderNetwork = () => {
    const svg = d3.select(networkRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;

    const data = {
      nodes: [
        { id: selectedEntity?.name, group: 1 },
        { id: "Promoter Spouse Co.", group: 2 },
        { id: "Related Party A", group: 2 },
        { id: "Subsidiary X", group: 3 },
        { id: "Offshore Entity Y", group: 4 },
      ],
      links: [
        {
          source: selectedEntity?.name,
          target: "Promoter Spouse Co.",
          value: 60,
        },
        { source: selectedEntity?.name, target: "Related Party A", value: 15 },
        { source: selectedEntity?.name, target: "Subsidiary X", value: 20 },
        { source: "Subsidiary X", target: "Offshore Entity Y", value: 40 },
      ],
    };

    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d: any) => (d.group === 1 ? "#4F46E5" : "#9CA3AF"))
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any,
      );

    node.append("title").text((d: any) => d.id);

    const label = svg
      .append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d: any) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  const translateNotes = async () => {
    if (!primaryNotes) return;
    setIsTranslating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following Indian vernacular site visit notes or legal text into professional English. Maintain all technical nuances: "${primaryNotes}"`,
      });
      setTranslatedNotes(response.text || "");
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const runForensicOCR = async () => {
    setIsProcessing(true);
    setProcessingStep(1);
    setResearchLogs([
      "Initializing Forensic OCR Engine...",
      "Scanning for font inconsistencies...",
      "Detecting pixel-level tampering in bank statements...",
    ]);

    await new Promise((r) => setTimeout(r, 2000));

    setForensicResults({
      tampered: true,
      confidence: 94,
      details:
        "Inconsistent font spacing detected in 'Transactions' column on Page 4. Potential manual override of credit entries.",
    });
    setIsProcessing(false);
  };

  const startAnalysis = async (entity: CorporateEntity) => {
    setSelectedEntity(entity);
    setPrimaryNotes(entity.primary_notes || "");
    setIsProcessing(true);
    setActiveTab("cam"); // Switch to CAM tab immediately to show progress
    setProcessingStep(1);
    setResearchLogs([
      "Initializing multi-source data ingestion...",
      "Connecting to Databricks cluster...",
      "Fetching GST filings (GSTR-2A vs 3B)...",
    ]);

    // Step 1: Ingestion & Synthesis
    await new Promise((r) => setTimeout(r, 1500));
    setProcessingStep(2);
    setResearchLogs((prev) => [
      ...prev,
      "Cross-leveraging GST returns against Bank Statements...",
      "Circular trading detection algorithm running...",
      "Identifying revenue inflation patterns...",
    ]);

    // Step 2: Unstructured Analysis
    await new Promise((r) => setTimeout(r, 1500));
    setProcessingStep(3);
    setResearchLogs((prev) => [
      ...prev,
      "Parsing Annual Report FY24 for financial commitments...",
      "Extracting sanction letters from other banks...",
      "Analyzing legal notices for contingent liabilities...",
    ]);

    // Step 3: Web-scale Research
    await new Promise((r) => setTimeout(r, 1500));
    setProcessingStep(4);
    setResearchLogs((prev) => [
      ...prev,
      "Crawling web for promoter news...",
      "Analyzing RBI regulatory impact (NBFC sector)...",
      "Scanning e-Courts for promoter litigation history...",
    ]);

    // Final Synthesis
    await generateCAM(entity);
    setIsProcessing(false);
  };

  const generateCAM = async (entity: CorporateEntity) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Task: Produce a professional, structured Credit Appraisal Memo (CAM) for ${entity.name}.
        
        Data Input for Analysis:
        - Structured: GSTR-2A vs 3B reconciliation showing 12% variance, Bank Statements (last 12 months), MCA charges of ₹142.5 Cr.
        - Unstructured: Annual Report FY24 extracts, Board meeting minutes mentioning "liquidity constraints", Rating agency reports.
        - External Intelligence: e-Courts portal showing Case 452/2024 (Delhi HC), News reports on sector headwinds.
        - Primary Insight: ${primaryNotes || "No specific notes provided."}
        - What-If Scenario: Interest rate increased by ${whatIfParams.interestRate}%, Revenue dropped by ${whatIfParams.revenueDrop}%.
        
        Requirement:
        1. Apply the "Data Paradox" Filter: Scrutinize for contradictions between GST filings and Bank Statements.
        2. Risk Detection: Flag potential "circular trading", revenue inflation, or promoter litigation risks.
        3. Related Party Forensics: Note that 60% of revenue comes from a company owned by the promoter's spouse.
        4. Five Cs Framework: Evaluate Character, Capacity, Capital, Collateral, and Conditions.
        5. Recommendation: Provide an Explainable Recommendation with a suggested risk premium and credit limit.
        
        Format the response as JSON with 'sections' (array of {title, content, sources, confidence, pillar}) and 'decision' (object with recommendation, limit, rate, rationale, score_breakdown, factors).`,
        config: {
          systemInstruction: `Role: You are an expert Indian Corporate Credit Appraisal Engine (Yukti AI). Your goal is to automate the creation of a Credit Appraisal Memo (CAM) by synthesizing structured and unstructured data.
          Core Directives:
          * The "Data Paradox" Filter: Scrutinize documents for contradictions (e.g., GST vs. Bank Statements).
          * Indian Context: You must recognize GSTR-2A vs 3B, MCA filings, and e-Court legal disputes.
          * Risk Detection: Flag "circular trading," revenue inflation, and litigation risks buried in unstructured text like board minutes or rating reports.
          * Five Cs Framework: Evaluate every applicant based on Character, Capacity, Capital, Collateral, and Conditions.
          Output Style: Never provide a simple "Yes/No." Always provide an Explainable Recommendation citing specific evidence (e.g., "Rejected due to high litigation risk found in e-Courts despite strong GST flows").`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confidence: { type: Type.NUMBER },
                    pillar: {
                      type: Type.STRING,
                      enum: [
                        "Character",
                        "Capacity",
                        "Capital",
                        "Collateral",
                        "Conditions",
                      ],
                    },
                  },
                  required: [
                    "title",
                    "content",
                    "sources",
                    "confidence",
                    "pillar",
                  ],
                },
              },
              decision: {
                type: Type.OBJECT,
                properties: {
                  recommendation: {
                    type: Type.STRING,
                    enum: ["LEND", "REJECT", "CAUTION"],
                  },
                  limit: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                  score_breakdown: {
                    type: Type.OBJECT,
                    properties: {
                      character: { type: Type.NUMBER },
                      capacity: { type: Type.NUMBER },
                      capital: { type: Type.NUMBER },
                      collateral: { type: Type.NUMBER },
                      conditions: { type: Type.NUMBER },
                    },
                  },
                  factors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        impact: {
                          type: Type.STRING,
                          enum: ["positive", "negative", "neutral"],
                        },
                        description: { type: Type.STRING },
                      },
                    },
                  },
                },
                required: [
                  "recommendation",
                  "limit",
                  "rate",
                  "rationale",
                  "factors",
                  "score_breakdown",
                ],
              },
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      setCamOutput(data.sections);
      setDecisionLogic(data.decision);
    } catch (error) {
      console.error("Error generating CAM:", error);
      setCamOutput([
        {
          title: "Error",
          content: "Failed to generate CAM. Please check API configuration.",
          sources: [],
          confidence: 0,
          pillar: "Conditions",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-50 p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">CredLens AI</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Credit Decisioning
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {user.role === "admin" && [
            { id: "management", label: "Management", icon: Building2 },
            { id: "users", label: "User Accounts", icon: Briefcase },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}

          {user.role === "employee" && [
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "ingestion", label: "Data Hub", icon: Database },
            { id: "research", label: "AI Research", icon: Globe },
            { id: "forensics", label: "Forensics", icon: Network },
            { id: "cam", label: "Credit Memo", icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}

          {user.role === "owner" && [
            { id: "status", label: "Status Tracker", icon: Activity },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-8 left-6 right-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Logged in as</p>
            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-[10px] text-indigo-600 font-medium uppercase mt-0.5">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <XCircle className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <header className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl font-bold">
                  {activeTab === "dashboard" && "Underwriting Dashboard"}
                  {activeTab === "management" && "Management Dashboard"}
                  {activeTab === "status" && "Application Status Tracker"}
                  {activeTab === "users" && "User Account Management"}
                  {activeTab !== "dashboard" &&
                    activeTab !== "management" &&
                    activeTab !== "status" &&
                    activeTab !== "users" &&
                    !selectedEntity &&
                    "Selection Required"}
                  {activeTab === "ingestion" &&
                    selectedEntity &&
                    `Data Hub: ${selectedEntity.name}`}
                  {activeTab === "research" &&
                    selectedEntity &&
                    `AI Research: ${selectedEntity.name}`}
                  {activeTab === "forensics" &&
                    selectedEntity &&
                    `Forensic Analysis: ${selectedEntity.name}`}
                  {activeTab === "cam" &&
                    selectedEntity &&
                    `Credit Memo: ${selectedEntity.name}`}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {activeTab === "dashboard" &&
                    "Real-time overview of corporate credit applications"}
                  {activeTab === "management" &&
                    "System administration and data ingestion control"}
                  {activeTab === "status" &&
                    "Track the real-time progress of your loan application"}
                  {activeTab !== "dashboard" &&
                    activeTab !== "management" &&
                    activeTab !== "status" &&
                    activeTab !== "users" &&
                    !selectedEntity &&
                    "Please select a corporate entity from the dashboard to begin analysis"}
                  {activeTab === "ingestion" &&
                    selectedEntity &&
                    "Stitching structured and unstructured data points"}
                  {activeTab === "research" &&
                    selectedEntity &&
                    "Deep intelligence from MCA, e-Courts, and News"}
                  {activeTab === "forensics" &&
                    selectedEntity &&
                    "Network analysis and OCR tampering detection"}
                  {activeTab === "cam" &&
                    selectedEntity &&
                    "AI-synthesized final credit recommendation"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                    >
                      <img
                        src={`https://picsum.photos/seed/user${i}/32/32`}
                        alt="user"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
                <button className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
                  <Clock className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </header>

            {activeTab === "management" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-bold">Add New Company</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                      Register a new corporate entity to begin the credit appraisal process.
                    </p>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Company Name"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Promoter Email"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                        Register Entity
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Download className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold">Bulk Data Ingestion</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                      Upload Structured (GST, ITR) and Unstructured (Annual Reports) data.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-2xl hover:border-indigo-200 transition-all">
                        <FileText className="w-6 h-6 text-gray-300 mb-2" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">Structured</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-2xl hover:border-indigo-200 transition-all">
                        <Layers className="w-6 h-6 text-gray-300 mb-2" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">Unstructured</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Managed Entities</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">Owner</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {MOCK_CORPORATES.map((corp) => (
                          <tr key={corp.id} className="text-sm">
                            <td className="px-6 py-4 font-bold">{corp.name}</td>
                            <td className="px-6 py-4 text-gray-500">owner@company.com</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="text-indigo-600 font-bold text-xs">Manage</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "status" && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold">Acme Corp Loan Application</h3>
                      <p className="text-sm text-gray-500">Application ID: APP-90210</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase">Current Status</p>
                      <p className="text-lg font-bold text-indigo-600">Step 2: Site Visit Pending</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                    <div className="space-y-12">
                      {[
                        { step: "Step 1", title: "Document Verification", status: "completed", desc: "GST, ITR and Bank Statements verified by AI Engine" },
                        { step: "Step 2", title: "Site Visit & Primary Insights", status: "current", desc: "Bank official scheduled to visit factory premises" },
                        { step: "Step 3", title: "Risk Assessment", status: "pending", desc: "Final credit score calculation and limit recommendation" },
                        { step: "Step 4", title: "CAM Approval", status: "pending", desc: "Final Credit Appraisal Memo generation and sign-off" },
                      ].map((item, i) => (
                        <div key={i} className="relative pl-12">
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                            item.status === 'completed' ? 'bg-emerald-500' : 
                            item.status === 'current' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-2 border-gray-100'
                          }`}>
                            {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-white" /> : 
                             item.status === 'current' ? <Activity className="w-4 h-4 text-white" /> : 
                             <Clock className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.step}</p>
                            <h4 className={`font-bold ${item.status === 'pending' ? 'text-gray-400' : 'text-slate-900'}`}>{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">Need Help?</h4>
                      <p className="text-indigo-200 text-sm mt-1">Contact your dedicated Relationship Manager</p>
                    </div>
                    <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">
                      Chat with RM
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    label="Active Applications"
                    value="24"
                    subValue="+3 from last week"
                    icon={Briefcase}
                    color="bg-blue-500"
                  />
                  <StatCard
                    label="Avg. Processing Time"
                    value="4.2 Days"
                    subValue="Down from 18 days (Manual)"
                    icon={Clock}
                    color="bg-indigo-500"
                  />
                  <StatCard
                    label="Approval Rate"
                    value="68%"
                    subValue="Target: 70%"
                    icon={CheckCircle2}
                    color="bg-emerald-500"
                  />
                  <StatCard
                    label="Risk Alerts"
                    value="12"
                    subValue="4 High Priority"
                    icon={AlertTriangle}
                    color="bg-amber-500"
                  />
                </div>

                {/* Application Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold">Recent Applications</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search PAN/CIN..."
                          className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Corporate Entity</th>
                          <th className="px-6 py-4">Industry</th>
                          <th className="px-6 py-4">Limit Requested</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Score</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {MOCK_CORPORATES.map((entity) => (
                          <tr
                            key={entity.id}
                            onClick={() => startAnalysis(entity)}
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">
                                    {entity.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {entity.pan}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md">
                                {entity.industry}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold">
                                ₹
                                {(entity.limit_requested / 10000000).toFixed(1)}{" "}
                                Cr
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    entity.status === "completed"
                                      ? "bg-emerald-500"
                                      : entity.status === "processing"
                                        ? "bg-amber-500 animate-pulse"
                                        : entity.status === "rejected"
                                          ? "bg-red-500"
                                          : "bg-gray-300"
                                  }`}
                                />
                                <span className="text-xs capitalize">
                                  {entity.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {entity.score ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${entity.score > 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                                      style={{ width: `${entity.score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold">
                                    {entity.score}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "dashboard" && !selectedEntity && (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  No Entity Selected
                </h3>
                <p className="text-gray-500 text-sm mt-1 mb-6">
                  Select a corporate from the dashboard to view detailed
                  analysis
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {activeTab === "ingestion" && selectedEntity && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" /> Structured
                      Data Pipeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "GSTR-2A vs 3B",
                          status: "Verified",
                          date: "Feb 2026",
                          icon: FileText,
                        },
                        {
                          label: "CIBIL Commercial",
                          status: "Fetched",
                          date: "Score: 742",
                          icon: Shield,
                        },
                        {
                          label: "Bank Statements",
                          status: "Parsed",
                          date: "Last 12m",
                          icon: BarChart3,
                        },
                        {
                          label: "ITR-V (3Y)",
                          status: "Verified",
                          date: "AY 2025-26",
                          icon: Database,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-50 rounded-2xl border border-gray-100"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <item.icon className="w-5 h-5 text-indigo-600" />
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold mb-1">{item.label}</p>
                          <p className="text-[10px] text-gray-400">
                            {item.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />{" "}
                        Circular Trading Detection
                      </h3>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">
                        Anomaly Detected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "GST Sales", value: 120 },
                              { name: "Bank Credits", value: 105 },
                              { name: "GST Purchase", value: 115 },
                              { name: "Bank Debits", value: 102 },
                            ]}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#F3F4F6"
                            />
                            <XAxis dataKey="name" hide />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#4F46E5"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">
                            Variance Alert
                          </p>
                          <p className="text-xs leading-relaxed">
                            12.5% variance between GST Sales and Bank Credits. 3
                            high-value transactions with "Entity X" show
                            circular flow patterns.
                          </p>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                          <span>Confidence Score</span>
                          <span>88%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: "88%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <FileSearch className="w-5 h-5 text-indigo-600" />{" "}
                      Unstructured Document Analysis
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Annual_Report_FY24.pdf",
                          size: "12.4 MB",
                          status: "Analyzed",
                          tags: ["Financials", "RPT"],
                        },
                        {
                          name: "Board_Minutes_Q3.pdf",
                          size: "2.1 MB",
                          status: "Analyzed",
                          tags: ["Governance"],
                        },
                        {
                          name: "Rating_Agency_Report.pdf",
                          size: "0.8 MB",
                          status: "Analyzed",
                          tags: ["External"],
                        },
                      ].map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{doc.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {doc.size} • {doc.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[8px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-gray-900 p-8 rounded-3xl text-white">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Factory className="w-5 h-5 text-indigo-400" /> Primary
                      Insights
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-2">
                          Site Visit Notes
                        </p>
                        <p className="text-xs text-gray-300 leading-relaxed italic">
                          "Factory operational at 85% capacity. New machinery
                          installed in Dec. Safety protocols strictly followed."
                        </p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-2">
                          Management Interview
                        </p>
                        <p className="text-xs text-gray-300 leading-relaxed italic">
                          "CFO confident about debt servicing. Export orders up
                          20% for next quarter."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "research" && selectedEntity && (
              <div className="space-y-8">
                {/* Sentiment Volatility Tracker */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" /> Sector
                      Sentiment Volatility
                    </h3>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase">
                      High Volatility
                    </span>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { time: "09:00", sentiment: 65 },
                          { time: "10:00", sentiment: 42 },
                          { time: "11:00", sentiment: 58 },
                          { time: "12:00", sentiment: 31 },
                          { time: "13:00", sentiment: 45 },
                          { time: "14:00", sentiment: 22 },
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="sentiment"
                          stroke="#EF4444"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Real-time tracking of raw material price hikes and
                    regulatory shifts in the {selectedEntity.industry} sector.
                    AI adjusts "Conditions" pillar dynamically.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Globe className="w-5 h-5 text-indigo-600" />{" "}
                          Web-Scale Intelligence
                        </h3>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />{" "}
                            MCA Live
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />{" "}
                            e-Courts Live
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-bold">
                              MCA Filings & Charges
                            </h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Active Charges
                              </span>
                              <span className="font-bold">₹142.5 Cr</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Directors List
                              </span>
                              <span className="font-bold text-indigo-600">
                                View 4 Profiles
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Compliance Status
                              </span>
                              <span className="font-bold text-emerald-600">
                                Active / Compliant
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-bold">
                              Legal & Litigation (e-Courts)
                            </h4>
                          </div>
                          <div className="space-y-4">
                            <div className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100">
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                              <div>
                                <p className="text-xs font-bold">
                                  Civil Dispute: Land Acquisition
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Delhi High Court • Case No: 452/2024 • Status:
                                  Pending
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div>
                                <p className="text-xs font-bold">
                                  Labor Dispute Resolved
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Mumbai Labor Court • Settled in favor of
                                  management
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Insight Integration Portal */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-indigo-600" />{" "}
                          Primary Insight Integration
                        </h3>
                        <button
                          onClick={translateNotes}
                          disabled={isTranslating || !primaryNotes}
                          className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                        >
                          <Languages className="w-3 h-3" />{" "}
                          {isTranslating
                            ? "Translating..."
                            : "Translate Vernacular"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Input qualitative observations (English or Vernacular).
                        The AI will translate and adjust the risk score.
                      </p>
                      <textarea
                        value={primaryNotes}
                        onChange={(e) => setPrimaryNotes(e.target.value)}
                        placeholder="e.g., Factory found operating at 40% capacity. Management seems evasive about new debt..."
                        className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                      {translatedNotes && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">
                            AI Translation
                          </p>
                          <p className="text-xs italic text-gray-700 leading-relaxed">
                            {translatedNotes}
                          </p>
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() =>
                            selectedEntity && startAnalysis(selectedEntity)
                          }
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" /> Re-calculate Risk Score
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" /> Sector
                      Trends
                    </h3>
                    <div className="space-y-6">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_FINANCIALS}>
                            <defs>
                              <linearGradient
                                id="colorRev"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#4F46E5"
                                  stopOpacity={0.1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#4F46E5"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#F3F4F6"
                            />
                            <XAxis dataKey="year" hide />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#4F46E5"
                              fillOpacity={1}
                              fill="url(#colorRev)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
                            AI Insight
                          </p>
                          <p className="text-xs leading-relaxed">
                            Sector is entering a growth phase. Raw material
                            prices stabilizing. PLI scheme benefits expected to
                            hit FY26.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forensics" && selectedEntity && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Related Party Network */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Network className="w-5 h-5 text-indigo-600" /> Related
                        Party Forensics
                      </h3>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase">
                        High Risk Connection
                      </span>
                    </div>
                    <div className="flex justify-center bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                      <svg
                        ref={networkRef}
                        width="600"
                        height="400"
                        className="max-w-full"
                      />
                    </div>
                    <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">
                        Character Risk Flag
                      </p>
                      <p className="text-xs leading-relaxed">
                        AI detected that 60% of total revenue is derived from
                        "Promoter Spouse Co." This indicates potential revenue
                        circularity and high concentration risk.
                      </p>
                    </div>
                  </div>

                  {/* Forensic OCR */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Scan className="w-5 h-5 text-indigo-600" /> Forensic
                        OCR Engine
                      </h3>
                      <button
                        onClick={runForensicOCR}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                      >
                        Run Deep Scan
                      </button>
                    </div>

                    {isProcessing && processingStep === 1 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-xs text-gray-400">
                          Scanning document integrity...
                        </p>
                      </div>
                    ) : forensicResults ? (
                      <div className="space-y-6">
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h4 className="text-sm font-bold">
                              Tampering Detected
                            </h4>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed mb-4">
                            {forensicResults.details}
                          </p>
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                            <span>Detection Confidence</span>
                            <span>{forensicResults.confidence}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${forensicResults.confidence}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                              Font Consistency
                            </p>
                            <p className="text-xs font-bold text-red-600">
                              Failed (Page 4)
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                              Pixel Alignment
                            </p>
                            <p className="text-xs font-bold text-emerald-600">
                              Passed
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Scan className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">
                          Upload messy or scanned PDFs for forensic font and
                          tampering analysis
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "cam" && selectedEntity && (
              <div className="space-y-8">
                {isProcessing ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 mb-8">
                      <motion.div
                        className="absolute inset-0 border-4 border-indigo-100 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 border-4 border-t-indigo-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Synthesizing Credit Appraisal Memo
                    </h3>
                    <p className="text-gray-500 text-sm mb-8">
                      Yukti AI is stitching {researchLogs.length} data points
                      into a final recommendation...
                    </p>

                    <div className="w-full max-w-md space-y-3">
                      {researchLogs.slice(-4).map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 text-xs text-gray-400"
                        >
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          {log}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* CAM Sections */}
                    <div className="lg:col-span-8 space-y-8">
                      {/* Five Cs Summary */}
                      <div className="grid grid-cols-5 gap-4">
                        {[
                          "Character",
                          "Capacity",
                          "Capital",
                          "Collateral",
                          "Conditions",
                        ].map((c) => {
                          const section = camOutput.find((s) => s.pillar === c);
                          return (
                            <div
                              key={c}
                              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center"
                            >
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {c}
                              </p>
                              <div className="flex justify-center mb-2">
                                {section ? (
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      section.confidence > 0.8
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-amber-50 text-amber-600"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold">
                                {section
                                  ? `${(section.confidence * 100).toFixed(0)}%`
                                  : "--"}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {camOutput.map((section, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <FileText className="w-4 h-4" />
                              </div>
                              <h3 className="text-lg font-bold">
                                {section.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Confidence
                              </span>
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500"
                                  style={{
                                    width: `${section.confidence * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                            {section.content.split("\n").map((p, j) => (
                              <p key={j} className="mb-4">
                                {p}
                              </p>
                            ))}
                          </div>
                          <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-2">
                            {section.sources.map((source, j) => (
                              <span
                                key={j}
                                className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recommendation Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                      {/* Interactive What-If Stress Tester */}
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-indigo-600" />{" "}
                          "What-If" Stress Tester
                        </h3>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Interest Rate Hike
                              </span>
                              <span className="font-bold">
                                +{whatIfParams.interestRate}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="0.5"
                              value={whatIfParams.interestRate}
                              onChange={(e) =>
                                setWhatIfParams((prev) => ({
                                  ...prev,
                                  interestRate: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Revenue Drop
                              </span>
                              <span className="font-bold">
                                -{whatIfParams.revenueDrop}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="5"
                              value={whatIfParams.revenueDrop}
                              onChange={(e) =>
                                setWhatIfParams((prev) => ({
                                  ...prev,
                                  revenueDrop: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                          <button
                            onClick={() => startAnalysis(selectedEntity)}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" /> Recalculate Risk
                          </button>
                        </div>
                      </div>

                      {decisionLogic && (
                        <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-xl">
                          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                            <TargetIcon className="w-5 h-5 text-indigo-400" />{" "}
                            Decision Logic
                          </h3>

                          <div className="space-y-8">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">
                                  Recommendation
                                </p>
                                <h4
                                  className={`text-2xl font-bold ${
                                    decisionLogic.recommendation === "LEND"
                                      ? "text-emerald-400"
                                      : decisionLogic.recommendation ===
                                          "REJECT"
                                        ? "text-red-400"
                                        : "text-amber-400"
                                  }`}
                                >
                                  {decisionLogic.recommendation}
                                </h4>
                              </div>
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  decisionLogic.recommendation === "LEND"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : decisionLogic.recommendation === "REJECT"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {decisionLogic.recommendation === "LEND" ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : decisionLogic.recommendation ===
                                  "REJECT" ? (
                                  <XCircle className="w-6 h-6" />
                                ) : (
                                  <AlertTriangle className="w-6 h-6" />
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">
                                  Limit
                                </p>
                                <p className="text-xl font-bold">
                                  ₹{(decisionLogic.limit / 10000000).toFixed(1)}{" "}
                                  Cr
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">
                                  Premium
                                </p>
                                <p className="text-xl font-bold">
                                  {decisionLogic.rate}%
                                </p>
                              </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-2">
                                Explainable Rationale
                              </p>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {decisionLogic.rationale}
                              </p>
                            </div>

                            <div className="space-y-4">
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
                                Scoring Model Breakdown
                              </p>
                              <div className="space-y-3">
                                {[
                                  {
                                    label: "Character",
                                    val: decisionLogic.score_breakdown
                                      .character,
                                  },
                                  {
                                    label: "Capacity",
                                    val: decisionLogic.score_breakdown.capacity,
                                  },
                                  {
                                    label: "Capital",
                                    val: decisionLogic.score_breakdown.capital,
                                  },
                                  {
                                    label: "Collateral",
                                    val: decisionLogic.score_breakdown
                                      .collateral,
                                  },
                                  {
                                    label: "Conditions",
                                    val: decisionLogic.score_breakdown
                                      .conditions,
                                  },
                                ].map((s) => (
                                  <div key={s.label} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-gray-400">
                                        {s.label}
                                      </span>
                                      <span className="font-bold">
                                        {s.val}/100
                                      </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${s.val > 70 ? "bg-emerald-500" : s.val > 40 ? "bg-amber-500" : "bg-red-500"}`}
                                        style={{ width: `${s.val}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
                                Key Factors
                              </p>
                              {decisionLogic.factors.map((factor, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl"
                                >
                                  {factor.impact === "positive" ? (
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : factor.impact === "negative" ? (
                                    <ArrowDownRight className="w-4 h-4 text-red-400 shrink-0" />
                                  ) : (
                                    <Activity className="w-4 h-4 text-gray-400 shrink-0" />
                                  )}
                                  <div>
                                    <p className="text-xs font-bold">
                                      {factor.label}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {factor.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                const blob = new Blob(
                                  [
                                    JSON.stringify(
                                      {
                                        entity: selectedEntity,
                                        cam: camOutput,
                                        decision: decisionLogic,
                                      },
                                      null,
                                      2,
                                    ),
                                  ],
                                  { type: "application/json" },
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `CAM_${selectedEntity?.name.replace(/\s+/g, "_")}.json`;
                                a.click();
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Export CAM (JSON)
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />{" "}
                          Early Warning Signals
                        </h3>
                        <div className="space-y-4">
                          {MOCK_ALERTS.map((alert) => (
                            <div
                              key={alert.id}
                              className="p-4 bg-gray-50 rounded-2xl border border-gray-100"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    alert.type === "danger"
                                      ? "bg-red-50 text-red-600"
                                      : alert.type === "warning"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-blue-50 text-blue-600"
                                  }`}
                                >
                                  {alert.type}
                                </span>
                                <span className="text-[8px] text-gray-400 font-bold uppercase">
                                  {alert.source}
                                </span>
                              </div>
                              <p className="text-xs font-medium leading-relaxed">
                                {alert.msg}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const TargetIcon = ({ className }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
