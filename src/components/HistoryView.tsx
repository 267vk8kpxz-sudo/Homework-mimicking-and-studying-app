import React, { useState } from 'react';
import {
  History,
  Search,
  BookOpen,
  Quote,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { HomeworkRecord } from '../lib/firebase';

interface HistoryViewProps {
  homeworks: HomeworkRecord[];
  onDeleteHomework: (hwId: string) => Promise<void>;
  onNavigateToSolve: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  homeworks,
  onDeleteHomework,
  onNavigateToSolve,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const subjects = ['All', ...Array.from(new Set(homeworks.map((h) => h.subject)))];

  const filtered = homeworks.filter((hw) => {
    const matchesSubject = selectedSubject === 'All' || hw.subject === selectedSubject;
    const matchesSearch =
      hw.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.personalizedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hw.exactQuote && hw.exactQuote.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Solved Homework History</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past homework questions, exact note citations, and your voice-matched answers.
          </p>
        </div>

        <button
          onClick={onNavigateToSolve}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          + Solve New Problem
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search solved problems..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((hw) => {
            const isExpanded = expandedId === hw.id;

            return (
              <div
                key={hw.id}
                className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-500/50 transition-all"
              >
                {/* Question Top Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {hw.subject}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(hw.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {hw.questionText}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCopy(hw.personalizedAnswer, hw.id)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Copy Answer"
                    >
                      {copiedId === hw.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteHomework(hw.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : hw.id)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Toggle expand"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exact Quote Citation Pill */}
                {hw.exactQuote && (
                  <div className="p-3 rounded-xl bg-[#0d1117] border-l-3 border-emerald-500 text-xs text-emerald-200/90 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                      <Quote className="w-3 h-3 text-emerald-400" />
                      <span>
                        CITED FROM: {hw.noteSourceTitle || 'School Notes'}
                        {hw.noteSection ? ` (${hw.noteSection})` : ''}
                      </span>
                    </div>
                    <p className="italic">&ldquo;{hw.exactQuote}&rdquo;</p>
                  </div>
                )}

                {/* Answer Preview / Full View */}
                <div className="pt-2 border-t border-[#30363d]/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Personalized Answer:
                  </span>
                  <div
                    className={`text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap ${
                      !isExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {hw.personalizedAnswer}
                  </div>
                </div>

                {/* Expanded Handwriting Ready View & Details */}
                {isExpanded && hw.handwritingReady && (
                  <div className="pt-3 border-t border-[#30363d] space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Handwriting-Ready Format:
                    </span>
                    <div className="notebook-paper p-4 rounded-xl font-mono-math text-xs text-slate-200 whitespace-pre-wrap">
                      {hw.handwritingReady}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-12 text-center space-y-4">
          <FileQuestion className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Solved Homework Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              When you solve a homework problem with exact note citations, your answers will be automatically archived here.
            </p>
          </div>
          <button
            onClick={onNavigateToSolve}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            Solve Your First Problem
          </button>
        </div>
      )}
    </div>
  );
};
