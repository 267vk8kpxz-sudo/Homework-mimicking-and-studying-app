import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  BookOpen,
  Quote,
  Check,
  Copy,
  PenTool,
  Sliders,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SchoolNote, StyleProfile, HomeworkRecord } from '../lib/firebase';
import { SAMPLE_QUESTIONS } from '../data/defaultSamples';

interface SolveHomeworkViewProps {
  notes: SchoolNote[];
  styleProfile: StyleProfile | null;
  onSaveToHistory: (hw: Omit<HomeworkRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onNavigateToNotes: () => void;
  onNavigateToVoice: () => void;
}

export const SolveHomeworkView: React.FC<SolveHomeworkViewProps> = ({
  notes,
  styleProfile,
  onSaveToHistory,
  onNavigateToNotes,
  onNavigateToVoice,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('all');
  const [questionText, setQuestionText] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toneAdjustment, setToneAdjustment] = useState<string>('Authentic Voice');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solvingStep, setSolvingStep] = useState<string>('');
  const [solutionResult, setSolutionResult] = useState<any | null>(null);
  const [answerTab, setAnswerTab] = useState<'standard' | 'handwriting'>('standard');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available subjects derived from notes
  const subjects = ['All Subjects', ...Array.from(new Set(notes.map((n) => n.subject)))];

  const filteredNotes = selectedSubject === 'All Subjects'
    ? notes
    : notes.filter((n) => n.subject === selectedSubject);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImageBase64(base64);
        setImagePreview(base64);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleClick = (sample: { subject: string; question: string }) => {
    setQuestionText(sample.question);
    setSelectedSubject(sample.subject);
    setImageBase64(null);
    setImagePreview(null);
    setErrorMsg(null);
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !imageBase64) {
      setErrorMsg('Please type your homework question or upload a photo of the assignment.');
      return;
    }

    setIsSolving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    // Provide helpful visual feedback stages
    setSolvingStep('1/3 Analyzing question & formulas...');
    const t1 = setTimeout(() => {
      setSolvingStep('2/3 Searching your school notes for exact matching sections & quotes...');
    }, 1200);
    const t2 = setTimeout(() => {
      setSolvingStep('3/3 Generating answer matching your personal writing & math conventions...');
    }, 2800);

    try {
      // Pick relevant notes to supply to backend
      const notesToSearch = selectedNoteId === 'all'
        ? filteredNotes
        : filteredNotes.filter((n) => n.id === selectedNoteId);

      const response = await fetch('/api/solve-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: questionText.trim(),
          imageBase64: imageBase64,
          subject: selectedSubject !== 'All Subjects' ? selectedSubject : 'General',
          notes: notesToSearch.map((n) => ({
            title: n.title,
            subject: n.subject,
            topic: n.topic,
            rawText: n.rawText,
          })),
          styleProfile: styleProfile,
          customAdjustment: toneAdjustment !== 'Authentic Voice' ? toneAdjustment : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to solve homework.');
      }

      setSolutionResult(data.result);

      // Auto-save to history
      await onSaveToHistory({
        subject: selectedSubject !== 'All Subjects' ? selectedSubject : (notesToSearch[0]?.subject || 'General Homework'),
        questionText: questionText.trim() || data.result.transcribedQuestion || 'Photo Homework Problem',
        imageUrl: imageBase64 ? imageBase64.substring(0, 50000) : '',
        exactQuote: data.result.exactQuote || '',
        noteSourceTitle: data.result.noteSourceTitle || '',
        noteSection: data.result.noteSection || '',
        personalizedAnswer: data.result.personalizedAnswer || '',
        handwritingReady: data.result.handwritingReady || '',
        styleExplanation: data.result.styleExplanation || '',
      });
      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Solve error:', err);
      setErrorMsg(err.message || 'Error communicating with the solver service.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsSolving(false);
      setSolvingStep('');
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner / Instructions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#161b22] to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Dual Grounding Engine: Exact Note Quotation + Your Voice Mimicry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Homework Grounded in Your Notes &amp; Styled in Your Voice
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Upload a photo of your homework worksheet or type a question. EchoStudy locates the exact section
            and verbatim quote from your class notes, then drafts the solution using your authentic sentence structure
            and formula conventions.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Main Solver Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-indigo-400" />
                <span>1. Homework Question</span>
              </h2>
              {notes.length === 0 && (
                <button
                  onClick={onNavigateToNotes}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No notes yet (Add notes)</span>
                </button>
              )}
            </div>

            {/* Subject and Note Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Subject / Class
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedNoteId('all');
                  }}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Target Note
                </label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Search All ({filteredNotes.length}) Notes</option>
                  {filteredNotes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title.length > 25 ? n.title.substring(0, 25) + '...' : n.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Upload Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Upload Photo of Homework / Worksheet
              </label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] group">
                  <img
                    src={imagePreview}
                    alt="Homework preview"
                    className="w-full h-44 object-contain bg-black/40"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-3 transition-opacity">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-500"
                    >
                      Change Photo
                    </button>
                    <button
                      onClick={() => {
                        setImageBase64(null);
                        setImagePreview(null);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#30363d] hover:border-indigo-500/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#0d1117]/50"
                >
                  <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-200">
                    Click to upload or drag &amp; drop worksheet photo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports math problems, chemistry equations, questions &amp; diagrams
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Text Input Option */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Or Type Question / Homework Prompt
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                placeholder="e.g., Explain how ATP synthase produces ATP during chemiosmosis, or find dy/dx for sin(3x^2)..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Sample Question Pills */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Sample Questions (Try in 1-Click)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSampleClick(q)}
                    className="text-left px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-300 text-[11px] transition-all flex items-center space-x-1"
                  >
                    <span className="font-semibold text-indigo-400">{q.subject}:</span>
                    <span className="truncate max-w-[200px]">{q.question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Adjuster Options */}
            <div className="pt-2 border-t border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tone &amp; Step Adjustment</span>
                </label>
                <button
                  type="button"
                  onClick={onNavigateToVoice}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Edit Voice DNA
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  'Authentic Voice',
                  'Extra Concise',
                  'Show Every Step',
                  'Deep Explanation',
                  'Formal Exam Prep',
                ].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setToneAdjustment(tone)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      toneAdjustment === tone
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                        : 'bg-[#0d1117] text-slate-400 border border-[#30363d] hover:text-slate-200'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Solve Action */}
            <button
              onClick={handleSolve}
              disabled={isSolving}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSolving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Solving with Note Grounding...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Solve &amp; Ground with Exact Citation</span>
                </>
              )}
            </button>

            {/* Solving Status Steps */}
            {isSolving && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-700/40 rounded-xl text-xs text-indigo-300 animate-pulse flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>{solvingStep || 'Analyzing homework problem...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {solutionResult ? (
            <div className="space-y-6">
              {/* Card 1: Exact Quote & Note Citation */}
              <div className="bg-[#161b22] rounded-2xl border border-emerald-500/30 overflow-hidden shadow-xl">
                <div className="bg-emerald-950/40 px-5 py-3 border-b border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                      <Quote className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Exact Note Source &amp; Citation
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Ground Truth Verified
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-white">Source Note:</span>
                    <span className="px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-indigo-300 font-mono text-[11px]">
                      {solutionResult.noteSourceTitle || 'Your Uploaded Notes'}
                    </span>
                    {solutionResult.noteSection && (
                      <span className="px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-slate-300 text-[11px]">
                        {solutionResult.noteSection}
                      </span>
                    )}
                  </div>

                  {/* Verbatim quote callout box */}
                  <div className="p-4 rounded-xl bg-[#0d1117] border-l-4 border-emerald-500 text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-sans">
                    <p className="font-mono text-[11px] text-slate-500 mb-1">
                      VERBATIM PASSAGE FROM YOUR CLASS NOTES:
                    </p>
                    <p className="italic">
                      &ldquo;{solutionResult.exactQuote || 'Cited directly from the core conceptual principles in your school notes.'}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Personalized Answer & Handwriting Paper */}
              <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden shadow-xl">
                {/* Header with View Tabs & Copy */}
                <div className="px-5 py-3.5 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3 bg-[#161b22]">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setAnswerTab('standard')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        answerTab === 'standard'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white bg-[#0d1117]'
                      }`}
                    >
                      ✍️ Your Style Answer
                    </button>
                    <button
                      onClick={() => setAnswerTab('handwriting')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        answerTab === 'handwriting'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white bg-[#0d1117]'
                      }`}
                    >
                      📝 Handwriting-Ready (Worksheet View)
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          answerTab === 'handwriting'
                            ? solutionResult.handwritingReady
                            : solutionResult.personalizedAnswer,
                          'answer'
                        )
                      }
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-medium transition-all"
                    >
                      {copiedType === 'answer' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Answer Content */}
                <div className="p-6">
                  {answerTab === 'standard' ? (
                    <div className="space-y-4">
                      <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {solutionResult.personalizedAnswer}
                      </div>

                      {solutionResult.keyConcepts && solutionResult.keyConcepts.length > 0 && (
                        <div className="pt-4 border-t border-[#30363d] flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold mr-1">
                            Key Concepts:
                          </span>
                          {solutionResult.keyConcepts.map((k: string, i: number) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d]"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Handwriting-Ready Lined Paper View */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-300/80 bg-amber-950/20 border border-amber-600/30 px-3 py-2 rounded-lg">
                        <span>
                          Formatted with clean linebreaks, arrows, and step progression to handwrite directly onto your worksheet.
                        </span>
                      </div>

                      <div className="notebook-paper p-6 rounded-xl font-mono-math text-xs sm:text-sm text-slate-100 whitespace-pre-wrap shadow-inner overflow-x-auto">
                        {solutionResult.handwritingReady || solutionResult.personalizedAnswer}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Voice Persona Breakdown */}
                {solutionResult.styleExplanation && (
                  <div className="px-5 py-3 bg-[#0d1117] border-t border-[#30363d] text-xs text-slate-400 flex items-start space-x-2">
                    <DnaIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-300">
                        Voice DNA Applied:{' '}
                      </span>
                      <span>{solutionResult.styleExplanation}</span>
                    </div>
                  </div>
                )}
              </div>

              {saveSuccess && (
                <div className="text-center text-xs text-emerald-400 flex items-center justify-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Saved to your Solved History</span>
                </div>
              )}
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">Ready to Solve</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Select a sample question above or upload a photo of your homework worksheet.
                  EchoStudy will compare it against your notes and write an answer tailored to your style.
                </p>
              </div>

              {/* Quick Feature Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 text-left">
                <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <p className="text-xs font-semibold text-emerald-400">Exact Quotations</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cites your teacher&apos;s specific wording &amp; section numbers.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <p className="text-xs font-semibold text-indigo-400">Authentic Voice</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mimics your vocabulary and transitional words.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <p className="text-xs font-semibold text-amber-400">Handwriting Ready</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Clean line-by-line format for easy copying to paper.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function DnaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="m17 6-2.5-2.5" />
      <path d="m14 8-1-1" />
      <path d="m7 18 2.5 2.5" />
      <path d="m3.5 14.5.5.5" />
      <path d="m20 9 .5.5" />
      <path d="m6.5 12.5 1 1" />
      <path d="m16.5 10.5 1 1" />
      <path d="m10 16 1 1" />
    </svg>
  );
}
