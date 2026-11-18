import React, { useState } from 'react';
import { useAuth, DEMO_USER } from '../context/AuthContext';
import {
  Boxes,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';

export default function AuthPage() {
  const { login, signup, loginWithDemo, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Inventory Manager');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFillDemo = () => {
    setError('');
    setEmail(DEMO_USER.email);
    setPassword('stockpile2026');
    setName(DEMO_USER.name);
    setRole(DEMO_USER.role);
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      loginWithDemo();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await signup({ name, email, password, role });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-base, #FAF7F2)',
        color: 'var(--text-primary, #1c1917)'
      }}
    >
      {/* Ambient Warm Gradient Orbs */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-40 dark:opacity-20"
        style={{ background: 'radial-gradient(circle, #EA580C 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 dark:opacity-15"
        style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md flex items-center justify-center p-1 mb-3">
            <img
              src="/logo.jpg"
              alt="StockPile Logo"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                // Fallback to logo.png if logo.jpg is not found
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.png';
              }}
            />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: '-0.03em'
            }}
          >
            StockPile
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 mt-0.5">
            Inventory & Supply Control Ledger
          </p>
        </div>

        {/* Liquid Glass Card Container */}
        <div
          className="w-full rounded-2xl p-6 sm:p-7 backdrop-blur-xl border shadow-xl relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            borderColor: 'var(--border-color, rgba(214, 207, 197, 0.9))',
            boxShadow: '0 20px 40px -15px rgba(234, 88, 12, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.6) inset'
          }}
        >
          {/* Quick Demo Account Banner / Buttons */}
          <div className="mb-5 p-3 rounded-xl bg-orange-50/90 dark:bg-stone-800/80 border border-orange-200/80 dark:border-orange-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#EA580C] shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  Testing the Platform?
                </p>
                <p className="text-[10px] text-stone-600 dark:text-stone-400 truncate">
                  One-click demo account ready to go
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleFillDemo}
                className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[11px] font-bold rounded-lg border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600 transition shadow-2xs cursor-pointer"
                title="Fill demo fields in form"
              >
                Fill Form
              </button>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                title="Instant login as demo user"
              >
                <span>Instant Demo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Toggle between Sign In and Create Account */}
          <div className="grid grid-cols-2 p-1 bg-stone-100/90 dark:bg-stone-800/80 rounded-xl mb-5 border border-stone-200/60 dark:border-stone-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-900 dark:text-stone-100 font-medium transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Role in Organization
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-900 dark:text-stone-100 font-medium transition cursor-pointer"
                    >
                      <option value="Inventory Director">Inventory Director</option>
                      <option value="Inventory Manager">Inventory Manager</option>
                      <option value="Store Supervisor">Store Supervisor</option>
                      <option value="Operations Lead">Operations Lead</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@stockpile.io"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-900 dark:text-stone-100 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-900 dark:text-stone-100 font-medium transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create & Access Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-700" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white/90 dark:bg-stone-900 px-2 text-stone-400">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Google Auth Integration Ready Button */}
          <button
            type="button"
            onClick={() => {
              // Prepares user for Google Auth integration
              loginWithGoogle({
                id: 'goog_demo_' + Date.now(),
                name: 'Google User',
                email: 'user@stockpile-google.com',
                role: 'Inventory Manager'
              });
            }}
            className="w-full py-2.5 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer Feature Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Deterministic Ledger
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#EA580C]" />
            SQLite Storage
          </span>
          <span className="flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-blue-600" />
            Multi-Item POS
          </span>
        </div>
      </div>
    </div>
  );
}
