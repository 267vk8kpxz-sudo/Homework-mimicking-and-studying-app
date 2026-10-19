import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Dna,
  Brain,
  Timer,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import { loginWithGoogle, loginWithGoogleRedirect, getAuthErrorMessage } from '../lib/firebase';

interface LoginGateProps {
  onInstantStudentLogin: (studentName: string) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onInstantStudentLogin }) => {
  const [studentName, setStudentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirectLoading, setIsRedirectLoading] = useState(false);
  const [authError, setAuthError] = useState<{ title: string; message: string; actionHint?: string } | null>(null);

  const handleGoogleLoginPopup = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      const parsed = getAuthErrorMessage(err);
      setAuthError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginRedirect = async () => {
    setIsRedirectLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error('Redirect login error:', err);
      const parsed = getAuthErrorMessage(err);
      setAuthError(parsed);
    } finally {
      setIsRedirectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full space-y-6 relative z-10">
        {/* App Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 p-0.5 shadow-xl shadow-indigo-500/25">
            <div className="w-full h-full bg-[#0d1117] rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-9 h-9 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Grounded Notes &bull; Authentic Voice &bull; Quizlet Study Modes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome to EchoStudy
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-300 max-w-md mx-auto">
              Your personal homework solver and AI flashcard study studio.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-200">Exact Note Citations</span>
          </div>
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center space-x-2.5">
            <Dna className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">Authentic Voice &amp; Math</span>
          </div>
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center space-x-2.5">
            <Brain className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-200">Quizlet Learn Mode</span>
          </div>
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center space-x-2.5">
            <Timer className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-slate-200">Test Cram &amp; Memorize</span>
          </div>
        </div>

        {/* Card: 1-Tap Instant Student Sign-In (Guaranteed to work on all devices) */}
        <div className="bg-[#161b22] border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">Instant Student Access (Recommended)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
              Works on Any Device
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Skip cloud console configurations. Sign in instantly to save your school notes, calibrate your writing style, and study flashcards directly in your browser.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Your Student Name:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name (optional)"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => onInstantStudentLogin(studentName.trim() || 'Student')}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Enter EchoStudy</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Card: Google OAuth Login Option */}
        <div className="bg-[#161b22]/70 border border-[#30363d] rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Or Sign In with Google Account
          </span>

          {authError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
              <p className="font-semibold">{authError.title}</p>
              <p className="text-slate-300 text-[11px]">{authError.message}</p>
              <button
                onClick={() => onInstantStudentLogin(studentName.trim() || 'Student')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
              >
                Use Instant Access Instead &rarr;
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleGoogleLoginPopup}
              disabled={isLoading || isRedirectLoading}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-white hover:bg-slate-100 text-slate-900 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoading ? 'Connecting...' : 'Google Popup'}</span>
            </button>

            <button
              onClick={handleGoogleLoginRedirect}
              disabled={isLoading || isRedirectLoading}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#0d1117] hover:bg-[#21262d] text-slate-300 border border-[#30363d] transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isRedirectLoading ? 'Redirecting...' : 'Google Redirect (iOS)'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Storage &amp; Cloud Sync Safe</span>
        </div>
      </div>
    </div>
  );
};
