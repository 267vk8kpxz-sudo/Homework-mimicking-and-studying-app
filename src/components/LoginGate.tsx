import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Dna,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Brain,
  Timer,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface LoginGateProps {
  onBypassForDemo?: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onBypassForDemo }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* App Logo & Title */}
        <div className="text-center space-y-4">
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
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md mx-auto">
              Please sign in with Google to access your private notes vault, personalized writing voice, and AI study deck engine.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]/80 flex items-start space-x-2.5">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Exact Note Citations</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Cites verbatim sections and definitions directly from your uploaded school notes.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]/80 flex items-start space-x-2.5">
              <Dna className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Authentic Voice &amp; Math</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Learns your sentence habits, transitions, and equation layout from past work.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]/80 flex items-start space-x-2.5">
              <Brain className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Quizlet Learn Mode</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  AI flashcards, adaptive rounds, and multiple-choice mastery tracking.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]/80 flex items-start space-x-2.5">
              <Timer className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Cram &amp; Memorize Modes</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  High-intensity test prep countdowns and active recall text verification.
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Primary Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-900 shadow-xl shadow-white/5 transition-all flex items-center justify-center space-x-3 cursor-pointer group disabled:opacity-60"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google to Continue'}</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-[#30363d]/60">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Firebase Authentication</span>
            </span>
            {onBypassForDemo && (
              <button
                onClick={onBypassForDemo}
                className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
              >
                Preview Demo Deck
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
