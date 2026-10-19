import React from 'react';
import { User } from 'firebase/auth';
import {
  Sparkles,
  BookOpen,
  Dna,
  History,
  GraduationCap,
  LogIn,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { loginWithGoogle, logoutUser, StyleProfile } from '../lib/firebase';

interface NavbarProps {
  user: User | null;
  activeTab: 'solve' | 'notes' | 'voice' | 'study' | 'history';
  setActiveTab: (tab: 'solve' | 'notes' | 'voice' | 'study' | 'history') => void;
  styleProfile: StyleProfile | null;
  sampleCount: number;
  notesCount: number;
  deckCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  styleProfile,
  sampleCount,
  notesCount,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUserMenuOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/90 backdrop-blur-md border-b border-[#30363d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('solve')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">EchoStudy</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                  AI Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Exact Note Citations &bull; Your Authentic Voice
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center space-x-1 bg-[#161b22] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setActiveTab('solve')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'solve'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Solve Homework</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Notes</span>
              {notesCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-[#30363d] rounded-full text-slate-300">
                  {notesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'voice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
            >
              <Dna className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Voice &amp; Math DNA</span>
              <span className="sm:hidden">DNA</span>
              {sampleCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  {sampleCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'study'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
            >
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Study Modes</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </button>
          </nav>

          {/* Right Action: Voice Status & Auth */}
          <div className="flex items-center space-x-3">
            {/* Style Calibration Pill */}
            <div
              onClick={() => setActiveTab('voice')}
              className="hidden lg:flex items-center space-x-2 px-2.5 py-1 bg-emerald-950/40 border border-emerald-700/30 rounded-full cursor-pointer hover:border-emerald-600/50 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-300">
                {sampleCount > 0 ? `Voice: ${sampleCount} Work Samples` : 'Voice: Calibrated'}
              </span>
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-slate-500 transition-all text-left"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {(user.displayName || user.email || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#161b22] border border-[#30363d] shadow-xl py-2 z-50">
                    <div className="px-3 py-2 border-b border-[#30363d]">
                      <p className="text-xs font-semibold text-white truncate">{user.displayName || 'Student'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="px-3 py-2 text-[11px] text-slate-400 border-b border-[#30363d]">
                      <div className="flex items-center space-x-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Google Account Connected</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
