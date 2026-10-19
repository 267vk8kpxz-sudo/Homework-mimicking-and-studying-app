import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Camera,
  Trash2,
  FileText,
  Sparkles,
  RefreshCw,
  FolderPlus,
  ExternalLink,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { SchoolNote } from '../lib/firebase';
import { DEFAULT_NOTES } from '../data/defaultSamples';

interface NotesVaultViewProps {
  notes: SchoolNote[];
  onAddNote: (note: Omit<SchoolNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<SchoolNote>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onLoadDefaultNotes: () => Promise<void>;
}

export const NotesVaultView: React.FC<NotesVaultViewProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
  onLoadDefaultNotes,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'text' | 'photo'>('text');

  // Form states
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteSubject, setNoteSubject] = useState<string>('AP Biology');
  const [noteTopic, setNoteTopic] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeNoteDetail, setActiveNoteDetail] = useState<SchoolNote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = ['All', ...Array.from(new Set(notes.map((n) => n.subject)))];

  const filteredNotes = notes.filter((n) => {
    const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.topic && n.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.rawText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setIsTranscribing(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/extract-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            subjectHint: noteSubject,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to transcribe notes.');
        }

        if (data.note.title && !noteTitle) setNoteTitle(data.note.title);
        if (data.note.topic && !noteTopic) setNoteTopic(data.note.topic);
        setNoteContent(data.note.rawText || '');
        setModalTab('text'); // Switch to editor to review and save
      } catch (err: any) {
        console.error('OCR Error:', err);
        setErrorMessage(err.message || 'Could not transcribe photo. Please try a clearer picture.');
      } finally {
        setIsTranscribing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      setErrorMessage('Please provide both a title and the note text content.');
      return;
    }

    try {
      await onAddNote({
        title: noteTitle.trim(),
        subject: noteSubject.trim(),
        topic: noteTopic.trim() || 'General',
        rawText: noteContent.trim(),
        sectionHeaders: '',
      });

      // Reset
      setNoteTitle('');
      setNoteTopic('');
      setNoteContent('');
      setPhotoPreview(null);
      setIsModalOpen(false);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save note to Firestore.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>School Notes Vault</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Store and organize your lecture notes and textbook study sheets. EchoStudy cites exact quotes from these notes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {notes.length === 0 && (
            <button
              onClick={onLoadDefaultNotes}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Notes</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add School Note</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
        {/* Subject Pills */}
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

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, topics, formulas..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[#161b22] hover:border-indigo-500/50 rounded-2xl border border-[#30363d] p-5 shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
              onClick={() => setActiveNoteDetail(note)}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {note.subject}
                  </span>
                  {note.topic && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {note.topic}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed font-sans">
                  {note.rawText.replace(/^#+\s+/gm, '')}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#30363d] flex items-center justify-between text-[11px] text-slate-500">
                <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                    Read note &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Notes Found</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add your notes or click &quot;Load Sample Notes&quot; to test homework solving with Biology, Calculus, and History notes.
            </p>
          </div>
          <button
            onClick={onLoadDefaultNotes}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            Load Starter Notes Now
          </button>
        </div>
      )}

      {/* Note Detail Modal */}
      {activeNoteDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeNoteDetail.subject}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{activeNoteDetail.title}</h3>
              </div>
              <button
                onClick={() => setActiveNoteDetail(null)}
                className="w-8 h-8 rounded-lg bg-[#21262d] text-slate-400 hover:text-white flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {activeNoteDetail.rawText}
            </div>

            <div className="px-6 py-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs text-slate-400">
              <span>Saved in your personal Firestore vault</span>
              <button
                onClick={() => setActiveNoteDetail(null)}
                className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <span>Add School Notes</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#30363d] bg-[#0d1117] px-6">
              <button
                onClick={() => setModalTab('text')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  modalTab === 'text'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Type / Paste Notes
              </button>
              <button
                onClick={() => setModalTab('photo')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  modalTab === 'photo'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Notebook Photo (Auto-OCR)</span>
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-6 overflow-y-auto space-y-4">
              {modalTab === 'photo' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#30363d] hover:border-indigo-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#0d1117]"
                  >
                    <Camera className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-200">
                      Upload or take a photo of your handwritten notebook or textbook
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Gemini OCR will transcribe formulas, headings, and bullet points automatically!
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {isTranscribing && (
                    <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Transcribing notebook handwriting into clean digital notes...</span>
                    </div>
                  )}

                  {photoPreview && (
                    <div className="rounded-xl overflow-hidden border border-[#30363d] max-h-48 bg-black/40">
                      <img src={photoPreview} alt="Uploaded note preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    placeholder="e.g. AP Biology, Calculus AB, Physics"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Topic / Unit
                  </label>
                  <input
                    type="text"
                    value={noteTopic}
                    onChange={(e) => setNoteTopic(e.target.value)}
                    placeholder="e.g. Cellular Respiration, Chain Rule"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Glycolysis & Electron Transport Chain"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Content (Markdown supported) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="# Section 1: Overview&#10;- Key definitions&#10;- Important equations..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20"
                >
                  Save to Notes Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
