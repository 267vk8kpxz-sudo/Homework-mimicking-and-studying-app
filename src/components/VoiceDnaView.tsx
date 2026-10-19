import React, { useState, useRef } from 'react';
import {
  Dna,
  Upload,
  Plus,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Sliders,
  Trash2,
  Camera,
  RefreshCw,
  Zap,
  ArrowRight,
  Calculator,
  PenTool,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { StyleProfile, WritingSample } from '../lib/firebase';
import { DEFAULT_STYLE_PROFILE, DEFAULT_SAMPLES } from '../data/defaultSamples';

interface VoiceDnaViewProps {
  styleProfile: StyleProfile | null;
  samples: WritingSample[];
  onSaveStyleProfile: (profile: Partial<StyleProfile>) => Promise<void>;
  onAddSample: (sample: Omit<WritingSample, 'id' | 'userId' | 'createdAt'>) => Promise<WritingSample>;
  onDeleteSample: (sampleId: string) => Promise<void>;
  onLoadDefaultSamples: () => Promise<void>;
}

export const VoiceDnaView: React.FC<VoiceDnaViewProps> = ({
  styleProfile,
  samples,
  onSaveStyleProfile,
  onAddSample,
  onDeleteSample,
  onLoadDefaultSamples,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [sampleTitle, setSampleTitle] = useState<string>('');
  const [sampleSubject, setSampleSubject] = useState<string>('English Lit');
  const [sampleType, setSampleType] = useState<'essay' | 'math_homework' | 'lab_report' | 'other'>('essay');
  const [sampleText, setSampleText] = useState<string>('');
  const [sampleImageBase64, setSampleImageBase64] = useState<string | null>(null);
  const [sampleImagePreview, setSampleImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice Sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState<string>('Explain why ice floats on water');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isTestingSandbox, setIsTestingSandbox] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = styleProfile || DEFAULT_STYLE_PROFILE;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSampleImageBase64(base64);
      setSampleImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleText.trim() && !sampleImageBase64) {
      setErrorMessage('Please provide either text or a photo of your previous essay or math homework.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // 1. Call Gemini style analyzer endpoint
      const res = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleText: sampleText.trim(),
          sampleType,
          imageBase64: sampleImageBase64,
          existingProfile: styleProfile,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze writing style.');
      }

      const analyzed = data.profile;

      // 2. Add sample record
      await onAddSample({
        title: sampleTitle.trim() || `${sampleSubject} Sample`,
        subject: sampleSubject.trim(),
        type: sampleType,
        contentText: sampleText.trim() || '[Image of handwritten/printed work]',
        extractedTraits: analyzed.sampleHighlights || analyzed.summary,
      });

      // 3. Update style profile
      await onSaveStyleProfile({
        summary: analyzed.summary,
        toneDescription: analyzed.toneDescription,
        mathHabits: analyzed.mathHabits,
        commonPhrases: analyzed.commonPhrases,
        vocabularyLevel: analyzed.vocabularyLevel,
        formalityScore: analyzed.formalityScore ?? 70,
        stepDetailScore: analyzed.stepDetailScore ?? 75,
      });

      // Reset form
      setSampleTitle('');
      setSampleText('');
      setSampleImageBase64(null);
      setSampleImagePreview(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Analyze style error:', err);
      setErrorMessage(err.message || 'Error analyzing your work sample.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTestSandbox = async () => {
    if (!sandboxPrompt.trim()) return;
    setIsTestingSandbox(true);
    setSandboxResponse(null);

    try {
      const res = await fetch('/api/solve-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: sandboxPrompt.trim(),
          subject: 'Voice Test',
          notes: [],
          styleProfile: activeProfile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSandboxResponse(data.result.personalizedAnswer);
      }
    } catch (err) {
      console.error('Sandbox error:', err);
    } finally {
      setIsTestingSandbox(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Dna className="w-6 h-6 text-emerald-400" />
            <span>Voice &amp; Math DNA Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            EchoStudy learns how you naturally write sentences, transition between ideas, and lay out math formulas
            from your past work.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {samples.length === 0 && (
            <button
              onClick={onLoadDefaultSamples}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Essays &amp; Math</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Old Essay / Math</span>
          </button>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: DNA Summary & Trait Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Persona Card */}
          <div className="bg-[#161b22] rounded-2xl border border-emerald-500/30 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Linguistic &amp; Mathematical DNA
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {activeProfile.vocabularyLevel || 'Calibrated Student Voice'}
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {samples.length} Samples Analyzed
              </span>
            </div>

            {/* Summary Text */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              <p className="font-semibold text-slate-400 text-xs mb-1">VOICE PERSONA SUMMARY:</p>
              {activeProfile.summary}
            </div>

            {/* Sliders: Formality & Step Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Formality Index</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {activeProfile.formalityScore ?? 70}%
                  </span>
                </div>
                <div className="w-full bg-[#21262d] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeProfile.formalityScore ?? 70}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Casual / Direct</span>
                  <span>Academic</span>
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Step Detail (Math/Logic)</span>
                  <span className="text-indigo-400 font-bold font-mono">
                    {activeProfile.stepDetailScore ?? 75}%
                  </span>
                </div>
                <div className="w-full bg-[#21262d] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeProfile.stepDetailScore ?? 75}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Terse / Final</span>
                  <span>Every Sub-Step</span>
                </div>
              </div>
            </div>

            {/* Math & Formula Habits Breakdown */}
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Math &amp; Science Formula Conventions</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
                {activeProfile.mathHabits || 'Standard algebraic lines, intermediate substitutions with arrow markers, boxed answers.'}
              </p>
            </div>

            {/* Characteristic Phrases */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">
                Your Characteristic Transitional Words
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeProfile.commonPhrases || 'Notice that, Therefore, Hence, This means that, Plugging in')
                  .split(',')
                  .map((phrase, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#21262d] text-emerald-300 border border-emerald-500/20 text-xs font-mono"
                    >
                      &quot;{phrase.trim()}&quot;
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Calibrated Samples History */}
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Analyzed Work Samples ({samples.length})</span>
            </h3>

            {samples.length > 0 ? (
              <div className="space-y-3">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                          {s.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-white">{s.title}</span>
                        <span className="text-[11px] text-slate-500">({s.subject})</span>
                      </div>
                      <p className="text-xs text-slate-400 italic line-clamp-2">
                        &quot;{s.contentText.substring(0, 140)}...&quot;
                      </p>
                      {s.extractedTraits && (
                        <p className="text-[11px] text-emerald-400/80">
                          Traits: {s.extractedTraits}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteSample(s.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors self-end sm:self-center"
                      title="Remove sample"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No custom work uploaded yet. Upload an essay or math homework to sharpen your voice replication!
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Voice Simulator / Sandbox (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Voice DNA Sandbox</h3>
            </div>
            <p className="text-xs text-slate-400">
              Test how EchoStudy writes answers in your exact voice before solving actual school homework.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Test Prompt / Question
              </label>
              <textarea
                rows={3}
                value={sandboxPrompt}
                onChange={(e) => setSandboxPrompt(e.target.value)}
                placeholder="Ask any question to hear your voice..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Why does ice float on water?',
                'Solve: 3(2x - 4) = 18',
                'Why did the Roman Empire decline?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSandboxPrompt(q)}
                  className="px-2 py-1 text-[11px] bg-[#0d1117] border border-[#30363d] rounded-lg text-slate-400 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              onClick={handleTestSandbox}
              disabled={isTestingSandbox}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isTestingSandbox ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing in Your Voice...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Test in My Voice</span>
                </>
              )}
            </button>

            {sandboxResponse && (
              <div className="mt-4 p-4 rounded-xl bg-[#0d1117] border border-amber-500/30 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  How You Would Write It:
                </span>
                <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {sandboxResponse}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Past Work Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Upload Old Essay or Math Homework</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAnalyzeAndSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assignment Type *
                  </label>
                  <select
                    value={sampleType}
                    onChange={(e: any) => setSampleType(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="essay">Past Essay / English Paper</option>
                    <option value="math_homework">Math Homework / Scratch Work</option>
                    <option value="lab_report">Science Lab Report</option>
                    <option value="other">History / Other Written Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course / Subject
                  </label>
                  <input
                    type="text"
                    value={sampleSubject}
                    onChange={(e) => setSampleSubject(e.target.value)}
                    placeholder="e.g. Calculus, AP Lit, Physics"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  placeholder="e.g. Macbeth Theme Essay, Derivatives Worksheet #4"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo of handwritten math or paper */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Photo of Handwritten Math or Paper (Optional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#30363d] hover:border-emerald-500/60 rounded-xl p-4 text-center cursor-pointer bg-[#0d1117]"
                >
                  <Camera className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-300">
                    Click to upload photo of math work or handwriting
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {sampleImagePreview && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#30363d] max-h-36 bg-black/40">
                    <img src={sampleImagePreview} alt="Work preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Paste Text of Your Essay or Math Solution
                </label>
                <textarea
                  rows={6}
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  placeholder="Paste a few paragraphs from an old essay or math problem steps you wrote..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#30363d] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing Voice DNA...</span>
                    </>
                  ) : (
                    <>
                      <Dna className="w-3.5 h-3.5" />
                      <span>Analyze &amp; Save Traits</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
