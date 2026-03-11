import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { Shield, Mail, Lock, User, Briefcase, ChevronRight, AlertCircle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'employee' as 'admin' | 'employee' | 'owner' | 'approver',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        
        if (data.user) {
          // In a real app, we'd fetch the role from a profiles table
          // For this hackathon, we'll use metadata or a mock role if not found
          const userRole = data.user.user_metadata?.role || 'employee';
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || 'User',
            role: userRole,
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: formData.role,
            },
          },
        });

        if (authError) throw authError;
        
        if (data.user) {
          setError("Signup successful! Please check your email or sign in.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = (role: 'admin' | 'employee' | 'owner' | 'approver') => {
    onAuthSuccess({
      id: 'mock-id',
      email: `demo-${role}@yukti.ai`,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role,
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Left Side: Branding & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_-5px_rgba(79,70,229,0.6)]">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] block mb-1">Intelligence Core</span>
                <span className="text-sm font-bold text-white uppercase tracking-[0.2em]">Yukti AI</span>
              </div>
            </div>
            
            <h1 className="text-8xl font-bold text-white tracking-tighter leading-[0.85] mb-10">
              Precision <br />
              <span className="text-indigo-500">Decisioning.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-md leading-relaxed mb-16 font-medium">
              The next generation of AI-powered credit underwriting and forensic analysis for modern banking institutions.
            </p>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-3">
                <div className="w-8 h-[1px] bg-indigo-500" />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Forensic Engine</p>
                <p className="text-sm text-gray-500 leading-relaxed">Real-time circular trading detection and satellite audit verification.</p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-[1px] bg-indigo-500" />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">AI Synthesis</p>
                <p className="text-sm text-gray-500 leading-relaxed">Automated Credit Appraisal Memo generation from multi-source data.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Element */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 2, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-24 p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">System Status</p>
              <p className="text-xs font-bold text-white tracking-tight">All Engines Operational</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#050505]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Secure Access Protocol</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight mb-3">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {isLogin ? "Enter your credentials to access the intelligence suite." : "Join the next generation of credit analysis."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="John Doe"
                        required={!isLogin}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.04] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Operational Role</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.04] transition-all appearance-none cursor-pointer"
                      >
                        <option value="employee" className="bg-[#0a0a0a]">Bank Employee</option>
                        <option value="admin" className="bg-[#0a0a0a]">Data Adder (Admin)</option>
                        <option value="owner" className="bg-[#0a0a0a]">Applicant (Owner)</option>
                        <option value="approver" className="bg-[#0a0a0a]">Senior Manager (Approver)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.04] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Access Key (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.04] transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-[0_10px_30px_-5px_rgba(79,70,229,0.4)] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm tracking-tight">{isLogin ? "Initialize Session" : "Create Identity"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-[1px] flex-1 bg-white/5" />
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em] whitespace-nowrap">
                Rapid Access Protocols
              </p>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { role: 'admin', label: 'Admin', icon: Shield },
                { role: 'employee', label: 'Employee', icon: User },
                { role: 'approver', label: 'Approver', icon: Briefcase },
                { role: 'owner', label: 'Owner', icon: Play }
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleMockLogin(item.role as any)}
                  className="px-4 py-4 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-2xl text-[10px] font-bold text-gray-500 hover:text-white transition-all flex items-center justify-center gap-3 group"
                >
                  <item.icon className="w-4 h-4 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                  <span className="tracking-widest uppercase">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors font-medium tracking-tight"
            >
              {isLogin ? "New operative? Register here" : "Existing operative? Authenticate"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
