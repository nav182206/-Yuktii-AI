import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Send, 
  Plus, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Users, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Target,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  Brain,
  Zap,
  ShieldCheck,
  Edit3,
  History
} from "lucide-react";
import { generateCampaignStrategy, analyzePerformance, extractEntities } from "./services/gemini";
import { 
  getCustomerCohort, 
  scheduleCampaign, 
  getPerformanceReport, 
  getHistoricalPerformance, 
  getSegmentEngagement, 
  Customer 
} from "./services/api";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

interface Campaign {
  id: string;
  brief: string;
  strategy: string;
  reasoning: string;
  status: string;
  created_at: string;
  variants?: Variant[];
}

interface Variant {
  id: string;
  campaign_id: string;
  subject: string;
  body: string;
  segment: string;
  send_time: string;
  tone: "Emotional" | "Rational";
  strategy_focus: string;
  status: string;
  open_rate: number;
  click_rate: number;
}

export default function App() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<"brief" | "campaigns" | "analytics" | "customers">("brief");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [extractedEntities, setExtractedEntities] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [liveStats, setLiveStats] = useState({ sent: 0, openRate: 0, clickRate: 0 });
  const [correctionLogs, setCorrectionLogs] = useState<{ time: string, msg: string, type: 'info' | 'warning' | 'success' }[]>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchCustomers();
    loadAnalyticsData();
  }, []);

  // Live Extraction Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (brief.length > 20) {
        setIsExtracting(true);
        const entities = await extractEntities(brief);
        setExtractedEntities(entities);
        setIsExtracting(false);
      } else {
        setExtractedEntities(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [brief]);

  // Live Stats Ticking Effect
  useEffect(() => {
    if (activeTab === 'analytics') {
      const interval = setInterval(() => {
        setLiveStats(prev => ({
          sent: prev.sent + Math.floor(Math.random() * 50),
          openRate: Math.min(45, prev.openRate + (Math.random() * 0.1)),
          clickRate: Math.min(15, prev.clickRate + (Math.random() * 0.05))
        }));
      }, 2000);

      // Random self-correction logs
      const logInterval = setInterval(() => {
        const logs = [
          { msg: "Open rate low for Variant A. Rewriting subject line for urgency...", type: 'warning' as const },
          { msg: "Segment 'Senior Citizens' showing high engagement. Scaling budget...", type: 'success' as const },
          { msg: "A/B Test: Rational variant outperforming emotional by 12%.", type: 'info' as const },
          { msg: "Optimizing send times for weekend engagement...", type: 'info' as const }
        ];
        const randomLog = logs[Math.floor(Math.random() * logs.length)];
        setCorrectionLogs(prev => [{ time: new Date().toLocaleTimeString(), ...randomLog }, ...prev].slice(0, 5));
      }, 8000);

      return () => {
        clearInterval(interval);
        clearInterval(logInterval);
      };
    }
  }, [activeTab]);

  const loadAnalyticsData = async () => {
    const hist = await getHistoricalPerformance();
    const seg = await getSegmentEngagement();
    setHistoricalData(hist);
    setSegmentData(seg);
  };

  const fetchCampaigns = async () => {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data);
  };

  const fetchCustomers = async () => {
    const data = await getCustomerCohort();
    setCustomers(data);
  };

  const handleCreateCampaign = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    try {
      const id = Math.random().toString(36).substring(7);
      
      // 1. Generate Strategy using Gemini
      const strategy = await generateCampaignStrategy(brief);
      
      // 2. Save Campaign
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, brief, strategy }),
      });

      // 3. Save Variants
      const variants = strategy.variants.map((v: any) => ({
        ...v,
        campaign_id: id,
        segment: JSON.stringify(strategy.segments.find(s => s.id === v.segment_id))
      }));

      await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });

      setBrief("");
      fetchCampaigns();
      setActiveTab("campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/campaigns/${id}/approve`, { method: "POST" });
    fetchCampaigns();
    if (selectedCampaign?.id === id) {
      handleSelectCampaign(id);
    }
  };

  const handleSelectCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json();
    setSelectedCampaign(data);
  };

  const handleSimulateMetrics = async (variantId: string) => {
    const report = await getPerformanceReport(variantId);
    // Gamified metrics: open rate based on clicks/opens
    const open_rate = report.opens / 1000;
    const click_rate = report.clicks / 1000;
    
    await fetch(`/api/variants/${variantId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open_rate, click_rate }),
    });
    if (selectedCampaign) {
      handleSelectCampaign(selectedCampaign.id);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCampaign?.variants) return;
    setLoading(true);
    try {
      const result = await analyzePerformance(selectedCampaign.variants);
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Target className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Yukti <span className="text-indigo-600">AI</span></h1>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["brief", "campaigns", "analytics", "customers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold">Launch New Campaign</h2>
                </div>
                <p className="text-gray-500 mb-8 max-w-2xl">
                  Provide your campaign brief in natural language. Yukti AI will "listen" and extract key banking rules immediately.
                </p>
                <div className="relative">
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="e.g., Run email campaign for launching XDeposit, a flagship term deposit product from SuperBFSI..."
                    className="w-full h-48 p-6 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none text-lg resize-none"
                  />
                  <button
                    onClick={handleCreateCampaign}
                    disabled={loading || !brief.trim()}
                    className="absolute bottom-4 right-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Generate Strategy
                  </button>
                </div>
              </div>

              {/* Live Extraction Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm">
                      <Brain className="w-4 h-4 text-indigo-600" /> Live Extraction
                    </h3>
                    {isExtracting && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                  </div>
                  <div className="space-y-3">
                    {!extractedEntities ? (
                      <p className="text-xs text-gray-400 italic">Start typing to see AI extraction...</p>
                    ) : (
                      <>
                        {[
                          { label: "Product", value: extractedEntities.product, icon: Target },
                          { label: "Segment", value: extractedEntities.segment, icon: Users },
                          { label: "Bonus", value: extractedEntities.bonus_rate, icon: Zap },
                          { label: "Goal", value: extractedEntities.goal, icon: TrendingUp }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <item.icon className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{item.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 truncate max-w-[120px]">
                              {item.value || "---"}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Agent Logic
                  </h3>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Yukti AI identifies campaign strategy for optimal performance metrics (open rate and click rate) based on demography and timing.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "campaigns" && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Campaign List */}
              <div className="lg:col-span-4 space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" /> Active Campaigns
                </h2>
                {campaigns.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                    No campaigns found
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCampaign(c.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all ${
                        selectedCampaign?.id === c.id 
                          ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          c.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{c.brief}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Campaign Detail */}
              <div className="lg:col-span-8">
                {selectedCampaign ? (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Campaign Details</h2>
                        <p className="text-sm text-gray-500">ID: {selectedCampaign.id}</p>
                      </div>
                      {selectedCampaign.status === 'pending_approval' && (
                        <div className="flex gap-3">
                          <button
                            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-200 transition-all"
                          >
                            <Edit3 className="w-5 h-5" /> Tweak Content
                          </button>
                          <button
                            onClick={() => handleApprove(selectedCampaign.id)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Deploy Campaign
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {selectedCampaign.reasoning && (
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Brain className="w-4 h-4" /> AI Reasoning
                          </h3>
                          <p className="text-indigo-900 text-sm italic">"{selectedCampaign.reasoning}"</p>
                        </div>
                      )}

                      <div className="bg-gray-50 p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Brief</h3>
                        <p className="text-gray-700 leading-relaxed">{selectedCampaign.brief}</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">A/B Test Variants</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {selectedCampaign.variants?.map((v) => (
                            <div key={v.id} className="border border-gray-100 rounded-2xl p-6 hover:bg-gray-50 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-[10px] ${
                                    v.tone === 'Emotional' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <span>{v.tone.charAt(0)}</span>
                                    <span className="text-[8px] opacity-70">{v.tone === 'Emotional' ? 'EMO' : 'RAT'}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm">{v.subject}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(v.send_time).toLocaleString()}
                                      </p>
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {v.strategy_focus}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {v.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleSimulateMetrics(v.id)}
                                      className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700"
                                    >
                                      Simulate Results
                                    </button>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                    v.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {v.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-white border border-gray-100 p-4 rounded-xl text-xs text-gray-600 mb-4 whitespace-pre-wrap">
                                {v.body}
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">Segment:</span>
                                <span className="text-xs font-medium">{JSON.parse(v.segment).description}</span>
                              </div>
                              {v.status === 'completed' && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs text-gray-500">Open Rate:</span>
                                    <span className="text-xs font-bold">{(v.open_rate * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-gray-500">Click Rate:</span>
                                    <span className="text-xs font-bold">{(v.click_rate * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 p-12">
                    <Mail className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a campaign to view details and approve</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-12"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Emails Sent", value: liveStats.sent.toLocaleString(), icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Live Open Rate", value: `${liveStats.openRate.toFixed(1)}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", goal: "Goal: >35%" },
                  { label: "Live Click Rate", value: `${liveStats.clickRate.toFixed(1)}%`, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Total Conversions", value: Math.floor(liveStats.sent * 0.02).toLocaleString(), icon: Target, color: "text-amber-600", bg: "bg-amber-50" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tabular-nums">{stat.value}</h3>
                      {stat.goal && <span className="text-[10px] font-bold text-green-600">{stat.goal}</span>}
                    </div>
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                ))}
              </div>

              {/* Main Charts & Correction Log */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Historical Trend */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" /> Historical Performance
                    </h3>
                    <select className="bg-gray-50 border-none text-xs font-bold rounded-lg px-3 py-2 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="opens" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Self-Correction Log */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600" /> Self-Correction Log
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
                      <AnimatePresence initial={false}>
                        {correctionLogs.map((log, i) => (
                          <motion.div
                            key={log.time + i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-xl border text-xs leading-relaxed ${
                              log.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                              log.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                              'bg-blue-50 border-blue-100 text-blue-800'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold uppercase text-[8px] opacity-60">{log.type}</span>
                              <span className="text-[8px] opacity-60">{log.time}</span>
                            </div>
                            {log.msg}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {correctionLogs.length === 0 && (
                        <p className="text-center text-gray-400 text-xs py-10">Monitoring campaign performance...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment Engagement */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Segment Engagement
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={segmentData}>
                        <PolarGrid stroke="#F3F4F6" />
                        <PolarAngleAxis dataKey="segment" tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                        <Radar name="Open Rate" dataKey="openRate" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
                        <Radar name="Click Rate" dataKey="clickRate" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Variant Comparison & AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                  <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold">Campaign Deep Dive</h2>
                      </div>
                      {selectedCampaign && (
                        <button
                          onClick={handleAnalyze}
                          disabled={loading}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                          Generate AI Insights
                        </button>
                      )}
                    </div>

                    {!selectedCampaign ? (
                      <div className="text-center py-20 text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Please select a campaign in the Campaigns tab first</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-gray-50 p-8 rounded-3xl">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Variant Comparison</h3>
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={selectedCampaign.variants}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="open_rate" name="Open Rate" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="click_rate" name="Click Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-8 rounded-3xl flex flex-col">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Engagement Breakdown</h3>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={selectedCampaign.variants?.map(v => ({ name: v.id, value: v.open_rate }))}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {selectedCampaign.variants?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>

                        {analysis && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100"
                          >
                            <h3 className="flex items-center gap-2 text-indigo-900 font-bold mb-4">
                              <Sparkles className="w-5 h-5" /> AI Optimization Strategy
                            </h3>
                            <div className="prose prose-indigo max-w-none text-indigo-800 leading-relaxed">
                              {analysis.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "customers" && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold">Customer Cohort</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search customers..." 
                        className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:text-indigo-600 transition-all">
                      <Filter className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Customer ID</th>
                        <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Name</th>
                        <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Age/Gender</th>
                        <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Location</th>
                        <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-4 text-sm font-mono text-gray-400">{customer.id}</td>
                          <td className="py-4">
                            <div className="font-bold text-sm">{customer.name}</div>
                            <div className="text-xs text-gray-400">{customer.email}</div>
                          </td>
                          <td className="py-4 text-sm">
                            {customer.demographics.age} / {customer.demographics.gender}
                          </td>
                          <td className="py-4 text-sm text-gray-500">
                            {customer.demographics.location}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                              customer.demographics.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {customer.demographics.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
