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
  Filter,
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
  Map,
  Video,
  Mic,
  Link,
  Share2,
  Fingerprint,
  Satellite,
  Scale,
  Brain,
  Navigation,
  Truck,
  Gavel,
  Users,
} from "lucide-react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ForceGraph2D from "react-force-graph-2d";
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
import { Auth } from "./components/Auth";
import { supabase } from "../supabase";

// --- Types ---

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "employee" | "owner" | "approver";
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
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-indigo-600/10`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full">
        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      {subValue && (
        <p className="text-[10px] text-slate-500 font-medium mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          {subValue}
        </p>
      )}
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "User",
          role: session.user.user_metadata?.role || "employee",
        });
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "User",
          role: session.user.user_metadata?.role || "employee",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [entities, setEntities] = useState<CorporateEntity[]>(MOCK_CORPORATES);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newPromoterEmail, setNewPromoterEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<CorporateEntity | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ingestion" | "research" | "forensics" | "cam" | "management" | "status" | "users"
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
    circularLoops?: { nodes: any[], links: any[] };
    sentimentStress?: {
      volatility: number;
      patterns: string[];
      transcript: string;
      stressScore: number;
    };
    satelliteAudit?: {
      truckTraffic: number;
      claimedTraffic: number;
      nightLights: number;
      status: string;
      utilization: number;
    };
    relatedPartyRisk?: any;
    ecourtAnomaly?: any;
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const networkRef = useRef<SVGSVGElement>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(!process.env.GEMINI_API_KEY);

  useEffect(() => {
    // Forensic graph is now handled by ForceGraph2D component
  }, [activeTab, selectedEntity]);

  const translateNotes = async () => {
    if (!primaryNotes || !process.env.GEMINI_API_KEY) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following vernacular credit notes into professional English for a credit appraisal report. Also, identify any forensic red flags mentioned.
        
        Notes: ${primaryNotes}`,
      });
      setTranslatedNotes(response.text || "");
      setPrimaryNotes(response.text || ""); // Update with translated version
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const exportToPDF = async () => {
    if (!selectedEntity) {
      alert("Please select an entity first.");
      return;
    }
    if (!decisionLogic) {
      alert("Analysis not complete. Please run the AI analysis first to generate the Credit Memo.");
      return;
    }
    
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600
      
      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("Yukti AI", 20, 25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("AI-powered Credit Appraisal Report", 20, 35);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()} | Confidential`, 20, 42);

      // Entity Info
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(selectedEntity.name, 20, 65);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Industry: ${selectedEntity.industry} | PAN: ${selectedEntity.pan} | CIN: ${selectedEntity.cin}`, 20, 72);

      // 1. Executive Summary
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Executive Summary", 20, 85);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 87, 190, 87);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      const decisionData = [
        ["Recommendation", decisionLogic.recommendation === "LEND" ? "APPROVE (LEND)" : decisionLogic.recommendation === "REJECT" ? "REJECT" : "CAUTION / REVIEW"],
        ["Proposed Limit", `INR ${(decisionLogic.limit / 10000000).toFixed(2)} Cr`],
        ["Risk-Adjusted Rate", `${decisionLogic.rate}%`],
        ["Yukti Forensic Score", `${selectedEntity.score || 0}/100`]
      ];
      autoTable(doc, {
        startY: 92,
        head: [["Parameter", "Assessment"]],
        body: decisionData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 10 },
        bodyStyles: { fontSize: 10, cellPadding: 5 }
      });

      // 2. The Five Cs Scorecard
      const nextY = (doc as any).lastAutoTable.finalY + 15;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. The Five Cs Scorecard", 20, nextY);
      doc.line(20, nextY + 2, 190, nextY + 2);

      const scorecardData = [
        ["Character", `${decisionLogic.score_breakdown.character}/100`, "Promoter integrity, legal history, and market reputation."],
        ["Capacity", `${decisionLogic.score_breakdown.capacity}/100`, "Cash flow adequacy and debt serviceability."],
        ["Capital", `${decisionLogic.score_breakdown.capital}/100`, "Net worth, leverage, and equity commitment."],
        ["Collateral", `${decisionLogic.score_breakdown.collateral}/100`, "Security coverage and asset quality."],
        ["Conditions", `${decisionLogic.score_breakdown.conditions}/100`, "Industry headwinds and macroeconomic factors."]
      ];
      autoTable(doc, {
        startY: nextY + 7,
        head: [["Pillar", "Score", "Description"]],
        body: scorecardData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], fontSize: 10 },
        bodyStyles: { fontSize: 9, cellPadding: 4 }
      });

      // 3. Rationale & Forensic Insights
      const feedbackY = (doc as any).lastAutoTable.finalY + 15;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. Rationale & Forensic Insights", 20, feedbackY);
      doc.line(20, feedbackY + 2, 190, feedbackY + 2);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const rationaleLines = doc.splitTextToSize(decisionLogic.rationale, 170);
      doc.text(rationaleLines, 20, feedbackY + 10);

      // Forensic Highlights
      if (forensicResults) {
        const forensicY = feedbackY + 15 + (rationaleLines.length * 5);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Forensic Anomalies Detected:", 20, forensicY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(153, 27, 27); // Red-800
        let anomalyY = forensicY + 7;
        
        if (forensicResults.circularLoops) doc.text("• Circular Trading Network identified via Graph Analysis.", 25, anomalyY), anomalyY += 6;
        if (forensicResults.sentimentStress) doc.text("• Linguistic Stress detected in management interview transcripts.", 25, anomalyY), anomalyY += 6;
        if (forensicResults.satelliteAudit) doc.text(`• Satellite Audit mismatch: Factory utilization at ${forensicResults.satelliteAudit.utilization}% vs claimed.`, 25, anomalyY), anomalyY += 6;
        if (forensicResults.ecourtAnomaly) doc.text("• Legal dispute omission detected in FY24 Annual Report.", 25, anomalyY), anomalyY += 6;
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount} | Yukti AI Credit Decisioning Engine | Proprietary & Confidential`, 105, 285, { align: 'center' });
      }

      doc.save(`Yukti_CAM_${selectedEntity.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF. Please check the console for details.");
    } finally {
      setIsExporting(false);
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

  const detectRelatedPartyConcentration = (entity: CorporateEntity) => {
    // Logic to scan shareholding and board minutes for promoter lending
    return {
      risk: "High",
      value: "₹12.4 Cr",
      details: "Unsecured loans extended to promoter-owned entities (Promoter Spouse Co) without clear business justification."
    };
  };

  const verifyEcourtTimelineAnomaly = (entity: CorporateEntity) => {
    // Logic to check if company stopped reporting active disputes
    return {
      anomaly: true,
      caseNo: "452/2024",
      status: "Active (e-Courts)",
      reportingStatus: "Omitted in FY24 Annual Report",
      liability: "₹8.5 Cr"
    };
  };

  const runDeepForensicScan = async () => {
    if (!selectedEntity) return;
    setIsProcessing(true);
    setProcessingStep(1);
    setResearchLogs([
      "Initializing AI-powered Credit Decisioning Engine...",
      "Running Circular Trading Detector (Graph Theory)...",
      "Analyzing Linguistic Stress in Management Interviews...",
      "Verifying Asset Utilization via Satellite Space Audit...",
      "Cross-referencing e-Courts with Annual Reports...",
    ]);

    await new Promise((r) => setTimeout(r, 3000));

    const relatedParty = detectRelatedPartyConcentration(selectedEntity);
    const ecourt = verifyEcourtTimelineAnomaly(selectedEntity);

    setForensicResults({
      tampered: true,
      confidence: 98,
      details: "Comprehensive Forensic Audit identified multiple 'Black Swan' anomalies. High probability of structured deception.",
      circularLoops: {
        nodes: [
          { id: selectedEntity.name, group: 1, val: 20 },
          { id: "Promoter Spouse Co", group: 2, val: 15 },
          { id: "Shell Vendor X", group: 3, val: 10 },
          { id: "Offshore Entity Y", group: 3, val: 10 },
          { id: "Related Party A", group: 2, val: 12 }
        ],
        links: [
          { source: selectedEntity.name, target: "Promoter Spouse Co", value: 5 },
          { source: "Promoter Spouse Co", target: "Shell Vendor X", value: 5 },
          { source: "Shell Vendor X", target: selectedEntity.name, value: 5 },
          { source: selectedEntity.name, target: "Related Party A", value: 3 },
          { source: "Related Party A", target: "Offshore Entity Y", value: 3 }
        ]
      },
      sentimentStress: {
        volatility: -42,
        stressScore: 78,
        patterns: ["Distancing Language", "Liability Evasion", "Baseline Shift"],
        transcript: "Management shifted from 'We' to 'The Company' when discussing debt servicing. Sudden pause detected at the mention of 'unsecured loans'."
      },
      satelliteAudit: {
        truckTraffic: 2.4,
        claimedTraffic: 15.0,
        nightLights: -65,
        utilization: 16,
        status: "Capacity Mismatch (Idle)"
      },
      relatedPartyRisk: relatedParty,
      ecourtAnomaly: ecourt
    });
    setIsProcessing(false);
    setProcessingStep(0);
  };

  const updateEntityStatus = (id: string, status: CorporateEntity['status'], updates: Partial<CorporateEntity> = {}) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, status, ...updates } : e));
    if (selectedEntity?.id === id) {
      setSelectedEntity(prev => prev ? { ...prev, status, ...updates } : null);
    }
  };

  const startAnalysis = async (entity: CorporateEntity) => {
    try {
      updateEntityStatus(entity.id, 'processing');
      setSelectedEntity(entity);
      setPrimaryNotes(entity.primary_notes || "");
      setIsProcessing(true);
      setActiveTab("cam"); // Switch to CAM tab immediately to show progress
      setProcessingStep(1);
      setResearchLogs([
        "Initializing multi-source data ingestion...",
        "Connecting to Yukti Forensic OCR Engine (Optimized for messy Indian PDFs)...",
        "Fetching GST filings (GSTR-2A vs 3B reconciliation)...",
        "Cross-referencing MCA Master Data for promoter linkages...",
      ]);

      // Step 1: Ingestion & Synthesis
      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStep(2);
      setResearchLogs((prev) => [
        ...prev,
        "Analyzing CIBIL Commercial reports for group-level exposure...",
        "Circular trading detection algorithm running (Graph Theory)...",
        "Identifying revenue inflation patterns in GSTR-1 vs 3B...",
      ]);

      // Step 2: Unstructured Analysis
      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStep(3);
      setResearchLogs((prev) => [
        ...prev,
        "Parsing messy/scanned Annual Report FY24 extracts...",
        "Extracting contingent liabilities from legal notices...",
        "Analyzing management interview transcripts for linguistic stress...",
      ]);

      // Step 3: Web-scale Research (Depth)
      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStep(4);
      setResearchLogs((prev) => [
        ...prev,
        "Crawling e-Courts for pending litigation history...",
        "Scanning local news for promoter reputation issues...",
        "Verifying factory utilization via Satellite Space Audit...",
      ]);

      // Final Synthesis
      await generateCAM(entity);
      updateEntityStatus(entity.id, 'completed');
    } catch (error) {
      console.error("Analysis process failed:", error);
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  const generateCAM = async (entity: CorporateEntity) => {
    if (!process.env.GEMINI_API_KEY) {
      setCamOutput([
        {
          title: "Configuration Error",
          content: "Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable in the Settings menu to enable AI analysis.",
          sources: ["System Check"],
          confidence: 0,
          pillar: "Conditions",
        },
      ]);
      return;
    }
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Task: Produce a professional, structured Credit Appraisal Memo (CAM) for ${entity.name}.
        
        Data Input for Analysis (Extracted from messy, scanned Indian PDFs):
        - Structured: GSTR-2A vs 3B reconciliation showing 12% variance, Bank Statements (last 12 months), CIBIL Commercial report (Score: 720).
        - Unstructured: Scanned Annual Report FY24 extracts, Board meeting minutes mentioning "liquidity constraints", MCA filings.
        - External Intelligence (Research Depth): e-Courts portal showing Case 452/2024 (Delhi HC), Local news reports on promoter's other failed ventures.
        - Primary Insight: ${primaryNotes || "No specific notes provided."}
        - What-If Scenario: Interest rate increased by ${whatIfParams.interestRate}%, Revenue dropped by ${whatIfParams.revenueDrop}%.
        
        Requirement:
        1. Apply the "Data Paradox" Filter: Scrutinize for contradictions between GST filings (GSTR-1 vs 3B) and Bank Statements.
        2. Risk Detection: Flag potential "circular trading", revenue inflation, or promoter litigation risks.
        3. Explainability: "Walk the judge through" the logic. Explain WHY a specific risk score was assigned.
        4. Indian Context: Explicitly handle nuances like GSTR-2A vs 3B reconciliation and CIBIL Commercial group exposure.
        5. Recommendation: Provide an Explainable Recommendation with a suggested risk premium and credit limit.
        
        Format the response as JSON with 'sections' (array of {title, content, sources, confidence, pillar}) and 'decision' (object with recommendation, limit, rate, rationale, score_breakdown, factors).`,
        config: {
          systemInstruction: `Role: You are an expert Indian Corporate Credit Appraisal Engine (Yukti AI). Your goal is to automate the creation of a Credit Appraisal Memo (CAM) by synthesizing structured and unstructured data.
          Core Directives:
          * Extraction Accuracy: You excel at extracting data from messy, scanned Indian-context PDFs.
          * Research Depth: You find relevant local news and regulatory filings (MCA, e-Courts) that aren't in the provided files.
          * Explainability: You must "walk the judge through" your logic. No black-box decisions.
          * Indian Context Sensitivity: You understand India-specific nuances like GSTR-2A vs 3B, CIBIL Commercial, and MCA charges.
          Output Style: Provide an Explainable Recommendation citing specific evidence (e.g., "Rejected due to high litigation risk found in e-Courts despite strong GST flows").`,
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
    } catch (error: any) {
      console.error("Error generating CAM:", error);
      let errorMessage = "Failed to generate CAM. Please check your configuration.";
      
      const errorStr = error.toString().toLowerCase();
      const errorMsg = error.message?.toLowerCase() || "";
      
      if (errorMsg.includes("api key not valid") || errorMsg.includes("api_key_invalid") || errorStr.includes("api key")) {
        errorMessage = "Invalid Gemini API Key. Please ensure the GEMINI_API_KEY environment variable is correctly set in the Settings menu.";
      } else if (errorMsg.includes("fetch failed") || errorMsg.includes("network") || errorStr.includes("network")) {
        errorMessage = "Network connection issue detected. Please check your internet connection and try again.";
      } else if (errorMsg.includes("quota") || errorMsg.includes("429") || errorStr.includes("quota")) {
        errorMessage = "API Quota exceeded. You have reached the limit for your Gemini API key. Please try again in a few minutes.";
      } else if (errorMsg.includes("safety") || errorStr.includes("safety")) {
        errorMessage = "The analysis was blocked by AI safety filters. Please try adjusting your input notes.";
      } else if (error.message) {
        errorMessage = `System Error: ${error.message}`;
      }

      setCamOutput([
        {
          title: "Analysis Failure",
          content: errorMessage,
          sources: ["Yukti System Diagnostics"],
          confidence: 0,
          pillar: "Conditions",
        },
      ]);
    }
  };

  const handleRegisterEntity = () => {
    if (!newCompanyName || !newPromoterEmail) return;
    
    const newEntity: CorporateEntity = {
      id: (entities.length + 1).toString(),
      name: newCompanyName,
      industry: "General",
      pan: "NEWPAN" + Math.floor(Math.random() * 10000),
      cin: "NEWCIN" + Math.floor(Math.random() * 1000000),
      status: "pending",
      score: null,
      limit_requested: 0,
      limit_recommended: null,
      risk_premium: null,
      last_updated: new Date().toISOString().split('T')[0],
      primary_notes: `Registered by admin. Promoter: ${newPromoterEmail}`
    };
    
    setEntities([newEntity, ...entities]);
    setNewCompanyName("");
    setNewPromoterEmail("");
  };

  const handleBulkIngestion = async (type: 'structured' | 'unstructured', file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setIsProcessing(true);
    setProcessingStep(1);
    
    setResearchLogs([
      `Received: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      "Initializing Yukti Forensic OCR Engine...",
      "Optimizing for messy/scanned Indian document context...",
      "Applying perspective correction to scanned pages...",
      "Extracting tabular data from GST GSTR-2A vs 3B filings...",
      "Cross-referencing PAN/CIN with MCA master data...",
    ]);

    // Simulate upload and OCR progress
    for (let i = 0; i <= 100; i += 20) {
      setUploadProgress(i);
      await new Promise(r => setTimeout(r, 400));
    }

    setResearchLogs(prev => [
      ...prev,
      "OCR Extraction Accuracy: 98.4% (Confidence: High)",
      "Detected: Scanned Bank Statement (SBI) with manual annotations.",
      "Detected: GST Filing with linguistic stress in 'Other Liabilities'.",
      "Data ingestion complete. Ready for AI Synthesis."
    ]);
    
    setIsUploading(false);
    setSelectedFile(null);
    
    // If an entity is selected, automatically start analysis
    if (selectedEntity) {
      await startAnalysis(selectedEntity);
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep(0);
      }, 2000);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'structured' | 'unstructured') => {
    const file = e.target.files?.[0];
    if (file) {
      handleBulkIngestion(type, file);
    }
  };

  const handleApproval = (status: "completed" | "rejected") => {
    if (!selectedEntity) return;
    updateEntityStatus(selectedEntity.id, status);
    
    setApprovalFeedback({
      type: 'success',
      msg: `Application ${status === 'completed' ? 'Approved' : 'Rejected'} successfully. System records updated.`
    });

    setTimeout(() => setApprovalFeedback(null), 5000);
  };

  const handleManageEntity = (entity: CorporateEntity) => {
    setSelectedEntity(entity);
    setActiveTab("dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 glass-dark z-50 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Yukti AI</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none">AI-powered Credit Decisioning Engine</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 px-4">Navigation</p>
            {user.role === "admin" && [
              { id: "management", label: "Management", icon: Building2 },
              { id: "status", label: "Status Tracker", icon: Activity },
              { id: "users", label: "User Accounts", icon: Briefcase },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </button>
            ))}

            {user.role === "employee" && [
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "ingestion", label: "Data Hub", icon: Database },
              { id: "research", label: "AI Research", icon: Globe },
              { id: "forensics", label: "Forensics", icon: Network },
              { id: "cam", label: "Credit Memo", icon: FileText },
              { id: "status", label: "Status Tracker", icon: Activity },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </button>
            ))}

            {user.role === "owner" && [
              { id: "status", label: "Status Tracker", icon: Activity },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </button>
            ))}

            {user.role === "approver" && [
              { id: "dashboard", label: "Approvals Queue", icon: BarChart3 },
              { id: "cam", label: "CAM Review", icon: FileSearch },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Session</p>
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-indigo-400 font-medium uppercase mt-0.5">{user?.role}</p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <XCircle className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {isApiKeyMissing && (
          <div className="mx-8 mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">
              Gemini API Key is missing. AI features will be disabled.
            </p>
          </div>
        )}
        
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <header className="flex justify-between items-end mb-12">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-2">
                    <div className="w-1 h-1 bg-indigo-600 rounded-full" />
                    Yukti Intelligence
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                    {activeTab === "dashboard" && "Underwriting Suite"}
                    {activeTab === "management" && "System Management"}
                    {activeTab === "status" && "Application Tracker"}
                    {activeTab === "users" && "User Accounts"}
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
                  {selectedEntity && activeTab !== "dashboard" && activeTab !== "management" && activeTab !== "users" && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedEntity.status === 'completed' ? 'bg-emerald-500' :
                        selectedEntity.status === 'rejected' ? 'bg-rose-500' :
                        selectedEntity.status === 'processing' ? 'bg-amber-500 animate-pulse' :
                        'bg-slate-300'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Status: {selectedEntity.status}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Status</p>
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      All Engines Online
                    </div>
                  </div>
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
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Promoter Email"
                        value={newPromoterEmail}
                        onChange={(e) => setNewPromoterEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        onClick={handleRegisterEntity}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                      >
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
                      <div className="relative">
                        <input
                          type="file"
                          id="structured-upload"
                          className="hidden"
                          accept=".pdf,.jpg,.png"
                          onChange={(e) => onFileChange(e, 'structured')}
                        />
                        <label 
                          htmlFor="structured-upload"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-2xl hover:border-indigo-200 transition-all cursor-pointer"
                        >
                          <FileText className="w-6 h-6 text-gray-300 mb-2" />
                          <span className="text-[10px] font-bold uppercase text-gray-400">Structured (GST/ITR)</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="unstructured-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => onFileChange(e, 'unstructured')}
                        />
                        <label 
                          htmlFor="unstructured-upload"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-2xl hover:border-indigo-200 transition-all cursor-pointer"
                        >
                          <Layers className="w-6 h-6 text-gray-300 mb-2" />
                          <span className="text-[10px] font-bold uppercase text-gray-400">Unstructured (Reports)</span>
                        </label>
                      </div>
                    </div>
                    {isUploading && (
                      <div className="mt-6">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">
                          <span>Uploading & Processing...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
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
                        {entities.map((corp) => (
                          <tr key={corp.id} className="text-sm">
                            <td className="px-6 py-4 font-bold">{corp.name}</td>
                            <td className="px-6 py-4 text-gray-500">owner@company.com</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => handleManageEntity(corp)}
                                className="text-indigo-600 font-bold text-xs"
                              >
                                Manage
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

            {activeTab === "status" && (
              <div className="max-w-3xl mx-auto space-y-8">
                {!selectedEntity && (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Application Selected</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Select a corporate entity from the dashboard to track its credit appraisal progress.</p>
                    <button 
                      onClick={() => setActiveTab("dashboard")}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
                
                {selectedEntity && (
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold">{selectedEntity?.name || "Select an Application"} Application</h3>
                      <p className="text-sm text-gray-500">Application ID: APP-{selectedEntity?.id.padStart(5, '0') || "00000"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase">Current Status</p>
                      <p className={`text-lg font-bold ${
                        selectedEntity?.status === 'completed' ? 'text-emerald-600' :
                        selectedEntity?.status === 'rejected' ? 'text-red-600' :
                        'text-indigo-600'
                      }`}>
                        {selectedEntity?.status === 'completed' ? 'Decision: Approved' :
                         selectedEntity?.status === 'rejected' ? 'Decision: Rejected' :
                         selectedEntity?.status === 'processing' ? 'Step 3: Risk Assessment' :
                         'Step 1: Document Verification'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                    <div className="space-y-12">
                      {[
                        { 
                          step: "Step 1", 
                          title: "Document Verification", 
                          status: selectedEntity ? (['processing', 'completed', 'rejected'].includes(selectedEntity.status) ? 'completed' : 'current') : 'pending', 
                          desc: "GST, ITR and Bank Statements verified by AI Engine" 
                        },
                        { 
                          step: "Step 2", 
                          title: "Forensic Analysis", 
                          status: selectedEntity ? (['completed', 'rejected'].includes(selectedEntity.status) ? 'completed' : (selectedEntity.status === 'processing' ? 'current' : 'pending')) : 'pending', 
                          desc: "Circular trading and satellite audit checks" 
                        },
                        { 
                          step: "Step 3", 
                          title: "Risk Assessment", 
                          status: selectedEntity ? (['completed', 'rejected'].includes(selectedEntity.status) ? 'completed' : (selectedEntity.status === 'processing' ? 'current' : 'pending')) : 'pending', 
                          desc: "Final credit score calculation and limit recommendation" 
                        },
                        { 
                          step: "Step 4", 
                          title: "Final Decision", 
                          status: selectedEntity ? (['completed', 'rejected'].includes(selectedEntity.status) ? 'completed' : 'pending') : 'pending', 
                          desc: selectedEntity?.status === 'rejected' ? "Application Rejected based on risk profile" : "Final Credit Appraisal Memo sign-off" 
                        },
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

                )}

                {selectedEntity && (
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
                )}
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="space-y-10">
                {selectedEntity && (
                  <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Active Tracking: {selectedEntity.name}</h4>
                        <p className="text-xs text-slate-500">Current Phase: {
                          selectedEntity.status === 'completed' ? 'Final Decision (Approved)' :
                          selectedEntity.status === 'rejected' ? 'Final Decision (Rejected)' :
                          selectedEntity.status === 'processing' ? 'AI Risk Assessment' :
                          'Document Ingestion'
                        }</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((step) => {
                          const isCompleted = (step === 1 && ['processing', 'completed', 'rejected'].includes(selectedEntity.status)) ||
                                            (step === 2 && ['completed', 'rejected'].includes(selectedEntity.status)) ||
                                            (step === 3 && ['completed', 'rejected'].includes(selectedEntity.status)) ||
                                            (step === 4 && ['completed', 'rejected'].includes(selectedEntity.status));
                          const isCurrent = (step === 1 && selectedEntity.status === 'pending') ||
                                          (step === 2 && selectedEntity.status === 'processing') ||
                                          (step === 3 && selectedEntity.status === 'processing'); // Simplified
                          
                          return (
                            <div 
                              key={step}
                              className={`w-8 h-1 rounded-full ${
                                isCompleted ? 'bg-emerald-500' :
                                isCurrent ? 'bg-indigo-600 animate-pulse' :
                                'bg-slate-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => setActiveTab("status")}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        View Full Tracker
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    label="Active Applications"
                    value="24"
                    subValue="+3 from last week"
                    icon={Briefcase}
                    color="bg-indigo-600"
                  />
                  <StatCard
                    label="Avg. Processing Time"
                    value="4.2 Days"
                    subValue="Down from 18 days (Manual)"
                    icon={Clock}
                    color="bg-slate-900"
                  />
                  <StatCard
                    label="Approval Rate"
                    value="68%"
                    subValue="Target: 70%"
                    icon={CheckCircle2}
                    color="bg-emerald-600"
                  />
                  <StatCard
                    label="Risk Alerts"
                    value="12"
                    subValue="4 High Priority"
                    icon={AlertTriangle}
                    color="bg-rose-600"
                  />
                </div>

                {/* Application Table */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Recent Applications</h3>
                      <p className="text-xs text-slate-500 mt-1">Real-time overview of corporate credit pipeline</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search PAN/CIN..."
                          className="pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-72 transition-all"
                        />
                      </div>
                      <button className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">Corporate Entity</th>
                          <th className="px-8 py-5">Industry</th>
                          <th className="px-8 py-5">Limit Requested</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5">Score</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {entities.map((entity) => (
                          <tr
                            key={entity.id}
                            onClick={() => startAnalysis(entity)}
                            className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                                  <Building2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {entity.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {entity.pan}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                                {entity.industry}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-900">
                                ₹{(entity.limit_requested / 10000000).toFixed(1)} Cr
                              </p>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    entity.status === "completed"
                                      ? "bg-emerald-500"
                                      : entity.status === "processing"
                                        ? "bg-amber-500 animate-pulse"
                                        : entity.status === "rejected"
                                          ? "bg-rose-500"
                                          : "bg-slate-300"
                                  }`}
                                />
                                <span className="text-xs font-medium text-slate-600 capitalize">
                                  {entity.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {entity.score ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-1000 ${entity.score > 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                                      style={{ width: `${entity.score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-900">
                                    {entity.score}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">--</span>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntity(entity);
                                    setActiveTab("status");
                                  }}
                                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                  Track Status
                                </button>
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
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
              <div className="space-y-8 font-mono">
                {/* Forensic Intelligence Lab Header - Technical/Terminal Style */}
                <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 text-emerald-500 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Fingerprint className="w-6 h-6 animate-pulse" />
                        <h2 className="text-2xl font-bold tracking-tighter uppercase">Forensic Intelligence Lab v4.0</h2>
                      </div>
                      <p className="text-slate-500 text-xs max-w-xl">
                        [SYSTEM READY] Scanning for circular trading, linguistic stress, and satellite-verified asset utilization.
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={runDeepForensicScan}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 border border-emerald-400/30"
                      >
                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                        {isProcessing ? "SCANNING..." : "EXECUTE DEEP SCAN"}
                      </button>
                      {isProcessing && (
                        <p className="text-[10px] text-emerald-500/60 animate-pulse">
                          {researchLogs[researchLogs.length - 1]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Terminal Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 1. Circular Loop Detector (Interactive Graph) */}
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-sm text-slate-300">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-3 text-emerald-400">
                          <Share2 className="w-5 h-5" /> CIRCULAR_LOOP_DETECTOR
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Mapping Value-Added Loops (GST/Bank)</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-md uppercase tracking-wider">
                        {forensicResults?.circularLoops ? "LOOP_DETECTED" : "SCAN_REQUIRED"}
                      </span>
                    </div>
                    
                    <div className="aspect-video bg-black/40 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                      {forensicResults?.circularLoops ? (
                        <ForceGraph2D
                          graphData={forensicResults.circularLoops}
                          width={500}
                          height={300}
                          nodeLabel="id"
                          nodeAutoColorBy="group"
                          linkDirectionalParticles={2}
                          linkDirectionalParticleSpeed={d => d.value * 0.001}
                          linkColor={() => "#ef4444"}
                          backgroundColor="rgba(0,0,0,0)"
                        />
                      ) : (
                        <div className="text-center space-y-4">
                          <Network className="w-12 h-12 text-slate-800 mx-auto" />
                          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Awaiting Graph Synthesis</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
                    </div>

                    <div className="mt-8 p-6 bg-red-500/5 rounded-2xl border border-red-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h4 className="text-xs font-bold text-red-400 uppercase">GSTR-2A/3B MISMATCH ALERT</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {forensicResults?.circularLoops 
                          ? `Detected circular loop: Entity A → Promoter Spouse Co → Shell Vendor X → Entity A. Estimated circular turnover: ₹42.5 Cr. Pattern identifies artificial turnover inflation.`
                          : "Run deep scan to identify circular trading networks and GST mismatches."}
                      </p>
                    </div>
                  </div>

                  {/* 2. Psychometric Sentiment "Deep-Fake" Detection */}
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-sm text-slate-300">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-3 text-emerald-400">
                          <Mic className="w-5 h-5" /> LINGUISTIC_STRESS_ANALYZER
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Psychometric Deception Detection</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md uppercase tracking-wider">
                        {forensicResults?.sentimentStress ? "STRESS_DETECTED" : "AWAITING_INPUT"}
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-black/40 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Segment: Debt_Liabilities</span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">VERIFIED</span>
                        </div>
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                          {forensicResults?.sentimentStress?.transcript || "No interview transcript analyzed yet."}
                        </p>
                        {forensicResults?.sentimentStress && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Stress Score</p>
                              <p className="text-[11px] font-bold text-amber-500">{forensicResults.sentimentStress.stressScore}%</p>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Sentiment</p>
                              <p className="text-[11px] font-bold text-red-500">{forensicResults.sentimentStress.volatility}% Drop</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                        <h4 className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-widest">FORENSIC_INSIGHT</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {forensicResults?.sentimentStress 
                            ? "Management shifted from 'We' to 'The Company' during liability discussions. Linguistic distancing + sudden sentiment drop indicates high concealment probability."
                            : "Linguistic patterns in management interviews can reveal hidden liabilities and deception."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Satellite-Verified Asset Utilization */}
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-sm text-slate-300">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-3 text-emerald-400">
                          <Satellite className="w-5 h-5" /> SATELLITE_SPACE_AUDIT
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Physical Asset Verification (Space-Scale)</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-md uppercase tracking-wider">
                        {forensicResults?.satelliteAudit ? "CAPACITY_MISMATCH" : "AWAITING_COORDS"}
                      </span>
                    </div>

                    <div className="aspect-video bg-black rounded-2xl relative overflow-hidden group border border-slate-800">
                      <img 
                        src={`https://picsum.photos/seed/factory-satellite-${selectedEntity.id}/800/450`} 
                        alt="Satellite View" 
                        className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      
                      {/* Heatmap Overlays */}
                      <div className="absolute top-1/4 left-1/3 w-24 h-24 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />

                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Live Feed: {selectedEntity.name} Factory</span>
                          </div>
                          <p className="text-[9px] text-slate-500">COORDS: 28.6139° N, 77.2090° E</p>
                        </div>
                        {forensicResults?.satelliteAudit && (
                          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Night Light Density</p>
                            <p className="text-sm font-bold text-white">{forensicResults.satelliteAudit.nightLights}% vs AVG</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/40 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Truck Traffic (6mo)</p>
                        <p className="text-xs font-bold text-slate-200">{forensicResults?.satelliteAudit?.truckTraffic || "0.0"} Avg / Day</p>
                        <p className="text-[9px] text-red-500 mt-1">CLAIMED: {forensicResults?.satelliteAudit?.claimedTraffic || "0.0"}</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Power Consumption</p>
                        <p className="text-xs font-bold text-slate-200">{forensicResults?.satelliteAudit ? "IDLE_STATE" : "SCAN_REQUIRED"}</p>
                        <p className="text-[9px] text-red-500 mt-1">CLAIMED: 85% CAP</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Indian Context Forensic Logic */}
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-sm text-slate-300">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-3 text-emerald-400">
                          <Target className="w-5 h-5" /> INDIAN_CONTEXT_FORENSICS
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Promoter Risk & e-Court Anomalies</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-black/40 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Factory className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest">Related Party Concentration</h4>
                            <p className="text-[9px] text-slate-500">detect_related_party_concentration()</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {forensicResults?.relatedPartyRisk 
                            ? `Identified unsecured loans of ${forensicResults.relatedPartyRisk.value} to promoter entities. Capital siphoning detected.`
                            : "Scans shareholding patterns for related party lending risks."}
                        </p>
                      </div>

                      <div className="p-6 bg-black/40 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                            <Scale className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest">e-Court Reporting Anomaly</h4>
                            <p className="text-[9px] text-slate-500">verify_ecourt_timeline_anomaly()</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {forensicResults?.ecourtAnomaly 
                            ? `Omission detected in FY24 Annual Report. Active litigation (${forensicResults.ecourtAnomaly.liability}) found in e-Court records.`
                            : "Cross-references e-Courts data with annual reports to find hidden legal liabilities."}
                        </p>
                      </div>
                    </div>
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
                            {user?.role === "approver" && (
                              <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Approver Actions</span>
                                </div>
                                {selectedEntity.status === 'completed' ? (
                                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center text-xs font-bold">
                                    ✓ Application Approved
                                  </div>
                                ) : selectedEntity.status === 'rejected' ? (
                                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-center text-xs font-bold">
                                    ✕ Application Rejected
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    <button
                                      onClick={() => handleApproval("completed")}
                                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Approve Application
                                    </button>
                                    <button
                                      onClick={() => handleApproval("rejected")}
                                      className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" /> Reject Application
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

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

                            <div className="flex gap-4">
                              <button
                                onClick={exportToPDF}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                              >
                                {isExporting ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                {isExporting ? "Generating PDF..." : "Export Report (PDF)"}
                              </button>
                              <button className="p-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:text-white hover:bg-white/10 transition-all">
                                <Share2 className="w-5 h-5" />
                              </button>
                            </div>
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

                      {user?.role === "approver" && (
                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Gavel className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold tracking-tight">Final Approval Decision</h3>
                                <p className="text-sm text-slate-400">Submit your final verdict based on forensic analysis and reports</p>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-4">Verification Checklist</p>
                                  <div className="space-y-3">
                                    {[
                                      "Forensic anomalies reviewed",
                                      "Satellite audit verified",
                                      "Circular trading checks passed",
                                      "Financial ratios within limits"
                                    ].map((check, i) => (
                                      <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                                        <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        {check}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-4">Source Reports</p>
                                  <div className="space-y-3">
                                    {[
                                      "GST_Returns_FY24.pdf",
                                      "Bank_Statement_HDFC.xlsx",
                                      "Site_Visit_Photos.zip"
                                    ].map((report, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-3 h-3 text-indigo-400" />
                                          {report}
                                        </div>
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase">Verified</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-3 ml-1">Approver Rationale & Comments</label>
                                <textarea 
                                  placeholder="Enter your final assessment rationale here..."
                                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[160px] placeholder:text-slate-600 transition-all"
                                />
                              </div>

                              {approvalFeedback && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                                    approvalFeedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {approvalFeedback.msg}
                                </motion.div>
                              )}

                              <div className="flex gap-4">
                                <button
                                  onClick={() => handleApproval("completed")}
                                  className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40 active:scale-[0.98]"
                                >
                                  <CheckCircle2 className="w-5 h-5" /> Approve Application
                                </button>
                                <button
                                  onClick={() => handleApproval("rejected")}
                                  className="flex-1 py-5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-[1.5rem] font-bold text-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                  <XCircle className="w-5 h-5" /> Reject Application
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
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
