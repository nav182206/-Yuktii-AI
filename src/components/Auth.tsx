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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Top Status Bar */}
        <div className="px-8 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">System Secure</span>
          </div>
          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em]">v2.4.0-Forensic</span>
        </div>

        <div className="p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl flex items-center justify-center mb-6 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] relative group"
            >
              <Shield className="w-10 h-10 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Yukti AI</h1>
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-4 bg-indigo-500/50" />
              <p className="text-indigo-400/80 text-[10px] font-bold uppercase tracking-[0.3em]">
                AI-powered Credit Decisioning Engine
              </p>
              <div className="h-[1px] w-4 bg-indigo-500/50" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Enter your full name"
                        required={!isLogin}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Operational Role</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
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

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Access Key (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Verify Access Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] active:scale-[0.98]"
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

          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-white/5" />
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] whitespace-nowrap">
                Rapid Access Protocols
              </p>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'admin', label: 'Admin', icon: Shield },
                { role: 'employee', label: 'Employee', icon: User },
                { role: 'approver', label: 'Approver', icon: Briefcase },
                { role: 'owner', label: 'Owner', icon: Play }
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleMockLogin(item.role as any)}
                  className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-3 group"
                >
                  <item.icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                  {item.label}
                </button>
              ))}
            </div>
            
            {!isSupabaseConfigured && (
              <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <p className="text-[9px] text-amber-500/60 text-center font-medium italic">
                  Cloud sync offline. Local forensic mode active.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors font-medium"
            >
              {isLogin ? "New operative? Register here" : "Existing operative? Authenticate"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Distributed</span>
        </div>
      </div>
    </div>
  );
};
