import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Layers,
  Zap,
  Timer,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Volume2,
  Star,
  Plus,
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Deck, DeckCard, SchoolNote } from '../lib/firebase';
import { DEFAULT_DECKS } from '../data/defaultSamples';

interface StudyStudioViewProps {
  decks: Deck[];
  notes: SchoolNote[];
  onCreateDeck: (
    deckData: { title: string; subject: string; description?: string },
    cards: Array<{ front: string; back: string; hint?: string }>
  ) => Promise<Deck>;
  onUpdateCardStatus: (
    deckId: string,
    cardId: string,
    updates: Partial<Pick<DeckCard, 'mastered' | 'starred'>>
  ) => Promise<void>;
  onDeleteDeck: (deckId: string) => Promise<void>;
  onLoadDefaultDecks: () => Promise<void>;
}

export const StudyStudioView: React.FC<StudyStudioViewProps> = ({
  decks,
  notes,
  onCreateDeck,
  onUpdateCardStatus,
  onDeleteDeck,
  onLoadDefaultDecks,
}) => {
  // Navigation & Mode selection
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || 'demo_deck_0');
  const [studyMode, setStudyMode] = useState<'flashcards' | 'learn' | 'cram' | 'memorize'>('flashcards');

  // Flashcards state
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Learn Mode state
  const [learnQuestions, setLearnQuestions] = useState<any[]>([]);
  const [learnIndex, setLearnIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [learnScore, setLearnScore] = useState<number>(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);
  const [learnFinished, setLearnFinished] = useState<boolean>(false);

  // Cram Mode state
  const [cramQuestions, setCramQuestions] = useState<any[]>([]);
  const [cramIndex, setCramIndex] = useState<number>(0);
  const [cramTimer, setCramTimer] = useState<number>(15);
  const [cramScore, setCramScore] = useState<number>(0);
  const [cramStreak, setCramStreak] = useState<number>(0);
  const [isCramRunning, setIsCramRunning] = useState<boolean>(false);
  const [cramFinished, setCramFinished] = useState<boolean>(false);

  // Memorize Mode state
  const [memorizeIndex, setMemorizeIndex] = useState<number>(0);
  const [memorizeInput, setMemorizeInput] = useState<string>('');
  const [isCheckingRecall, setIsCheckingRecall] = useState<boolean>(false);
  const [recallEvaluation, setRecallEvaluation] = useState<any | null>(null);
  const [memorizeScore, setMemorizeScore] = useState<number>(0);

  // AI Deck Generator Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [selectedNoteForDeck, setSelectedNoteForDeck] = useState<string>(notes[0]?.id || 'custom');
  const [customDeckTopic, setCustomDeckTopic] = useState<string>('');
  const [customDeckSubject, setCustomDeckSubject] = useState<string>('AP Biology');
  const [cardCountToGen, setCardCountToGen] = useState<number>(8);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState<boolean>(false);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const cards: DeckCard[] = activeDeck?.cards || [];
  const currentCard = cards[cardIndex] || cards[0];

  // Keep activeDeckId in sync with loaded decks
  useEffect(() => {
    if (decks.length > 0 && !decks.some((d) => d.id === activeDeckId)) {
      setActiveDeckId(decks[0].id);
      setCardIndex(0);
      setIsFlipped(false);
    }
  }, [decks, activeDeckId]);

  // Cram timer effect
  useEffect(() => {
    let interval: any = null;
    if (studyMode === 'cram' && isCramRunning && !cramFinished) {
      if (cramTimer > 0) {
        interval = setInterval(() => {
          setCramTimer((prev) => prev - 1);
        }, 1000);
      } else {
        // Time expired for this question
        handleCramAnswer('');
      }
    }
    return () => clearInterval(interval);
  }, [studyMode, isCramRunning, cramTimer, cramFinished]);

  // Keyboard shortcut listener for Flashcards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (studyMode !== 'flashcards') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, cardIndex, cards.length]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (cardIndex < cards.length - 1) {
      setCardIndex((prev) => prev + 1);
    } else {
      setCardIndex(0); // Loop back
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (cardIndex > 0) {
      setCardIndex((prev) => prev - 1);
    } else {
      setCardIndex(cards.length - 1);
    }
  };

  const handleMarkMastered = async (mastered: boolean) => {
    if (!currentCard || !activeDeck) return;
    await onUpdateCardStatus(activeDeck.id, currentCard.id, { mastered });
    handleNextCard();
  };

  const handleToggleStar = async () => {
    if (!currentCard || !activeDeck) return;
    await onUpdateCardStatus(activeDeck.id, currentCard.id, { starred: !currentCard.starred });
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const buildClientQuiz = (cardList: DeckCard[], mode: string) => {
    return cardList.map((card, idx) => {
      const otherBacks = cardList.filter((_, i) => i !== idx).map((c) => c.back);
      const shuffled = otherBacks.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [card.back, ...shuffled].sort(() => 0.5 - Math.random());
      return {
        id: `client_q_${idx + 1}`,
        type: 'multiple_choice',
        prompt:
          mode === 'cram'
            ? `[Speed Recall] Identify the correct definition / formula: "${card.front}"`
            : `What best matches or defines: "${card.front}"?`,
        options,
        correctAnswer: card.back,
        explanation: `Definition: ${card.back}${card.hint ? ` (Hint: ${card.hint})` : ''}`,
        sourceCardFront: card.front,
      };
    });
  };

  // Start Learn Mode
  const startLearnMode = async () => {
    if (!cards || cards.length === 0) return;
    setIsGeneratingQuiz(true);
    setLearnFinished(false);
    setLearnIndex(0);
    setLearnScore(0);
    setMissedQuestions([]);
    setSelectedAnswer(null);
    setHasAnswered(false);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards,
          mode: 'learn',
          subject: activeDeck?.subject || 'General',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setLearnQuestions(data.questions);
        setStudyMode('learn');
      } else {
        const fallback = buildClientQuiz(cards, 'learn');
        setLearnQuestions(fallback);
        setStudyMode('learn');
      }
    } catch (err) {
      console.warn('AI quiz error, falling back to instant client quiz:', err);
      const fallback = buildClientQuiz(cards, 'learn');
      setLearnQuestions(fallback);
      setStudyMode('learn');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerLearn = (option: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);

    const currentQ = learnQuestions[learnIndex];
    const isCorrect = option === currentQ.correctAnswer;
    if (isCorrect) {
      setLearnScore((prev) => prev + 1);
    } else {
      setMissedQuestions((prev) => [...prev, currentQ]);
    }
  };

  const handleNextLearnQuestion = () => {
    if (learnIndex < learnQuestions.length - 1) {
      setLearnIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setLearnFinished(true);
    }
  };

  // Start Cram Mode
  const startCramMode = async () => {
    if (!cards || cards.length === 0) return;
    setIsGeneratingQuiz(true);
    setCramFinished(false);
    setCramIndex(0);
    setCramScore(0);
    setCramStreak(0);
    setCramTimer(15);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards,
          mode: 'cram',
          subject: activeDeck?.subject || 'General',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setCramQuestions(data.questions);
        setStudyMode('cram');
        setIsCramRunning(true);
      } else {
        const fallback = buildClientQuiz(cards, 'cram');
        setCramQuestions(fallback);
        setStudyMode('cram');
        setIsCramRunning(true);
      }
    } catch (err) {
      console.warn('AI cram error, falling back to instant client cram:', err);
      const fallback = buildClientQuiz(cards, 'cram');
      setCramQuestions(fallback);
      setStudyMode('cram');
      setIsCramRunning(true);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCramAnswer = (option: string) => {
    const currentQ = cramQuestions[cramIndex];
    if (!currentQ) return;

    const isCorrect = option === currentQ.correctAnswer;
    if (isCorrect) {
      const bonus = Math.floor(cramTimer * 10);
      setCramScore((prev) => prev + 100 + bonus);
      setCramStreak((prev) => prev + 1);
    } else {
      setCramStreak(0);
    }

    if (cramIndex < cramQuestions.length - 1) {
      setCramIndex((prev) => prev + 1);
      setCramTimer(15);
    } else {
      setIsCramRunning(false);
      setCramFinished(true);
    }
  };

  // Start Memorize Mode
  const startMemorizeMode = () => {
    setStudyMode('memorize');
    setMemorizeIndex(0);
    setMemorizeInput('');
    setRecallEvaluation(null);
    setMemorizeScore(0);
  };

  const handleCheckRecall = async () => {
    if (!memorizeInput.trim() || !currentCard) return;
    setIsCheckingRecall(true);

    try {
      const res = await fetch('/api/check-memorize-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionPrompt: currentCard.front,
          targetAnswer: currentCard.back,
          userAnswer: memorizeInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecallEvaluation(data.result);
        if (data.result.isCorrect) {
          setMemorizeScore((prev) => prev + 1);
          if (activeDeck) {
            await onUpdateCardStatus(activeDeck.id, currentCard.id, { mastered: true });
          }
        }
      }
    } catch (err) {
      console.error('Check recall error:', err);
    } finally {
      setIsCheckingRecall(false);
    }
  };

  const handleNextMemorize = () => {
    setMemorizeInput('');
    setRecallEvaluation(null);
    if (memorizeIndex < cards.length - 1) {
      setMemorizeIndex((prev) => prev + 1);
    } else {
      setMemorizeIndex(0);
    }
  };

  // AI Flashcards Generation
  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingDeck(true);

    try {
      let sourceText = '';
      let title = '';
      let subject = customDeckSubject;

      if (selectedNoteForDeck !== 'custom') {
        const foundNote = notes.find((n) => n.id === selectedNoteForDeck);
        if (foundNote) {
          sourceText = foundNote.rawText;
          title = `${foundNote.title} Flashcards`;
          subject = foundNote.subject;
        }
      } else {
        sourceText = customDeckTopic;
        title = `${customDeckTopic} Deck`;
      }

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: sourceText,
          title,
          subject,
          topic: customDeckTopic,
          cardCount: cardCountToGen,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.cards)) {
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      const newDeck = await onCreateDeck(
        {
          title,
          subject,
          description: `AI-generated active recall deck with ${data.cards.length} high-yield terms and formulas.`,
        },
        data.cards
      );

      setActiveDeckId(newDeck.id);
      setIsGenerateModalOpen(false);
      setCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      alert(err.message || 'Error generating deck.');
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const masteredCount = cards.filter((c) => c.mastered).length;
  const masteryPercent = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Deck Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
              <Brain className="w-6 h-6 text-indigo-400" />
              <span>AI Study Studio</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Quizlet Style
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Master your class notes through active recall, adaptive Learn Mode, timed Cram sprints, and memory tests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {decks.length === 0 && (
            <button
              onClick={onLoadDefaultDecks}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Starter Decks</span>
            </button>
          )}

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate Deck with AI</span>
          </button>
        </div>
      </div>

      {/* Deck Selector & Study Mode Pills */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#161b22] p-4 rounded-2xl border border-[#30363d]">
        {/* Deck Dropdown */}
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="min-w-[220px]">
            <select
              value={activeDeckId}
              onChange={(e) => {
                setActiveDeckId(e.target.value);
                setCardIndex(0);
                setIsFlipped(false);
                setStudyMode('flashcards');
              }}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.cards?.length || d.cardCount || 0} cards)
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-mono text-emerald-400 font-bold">{masteryPercent}%</span>
            <span>Mastered</span>
          </div>
        </div>

        {/* 4 Study Mode Buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStudyMode('flashcards')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studyMode === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={startLearnMode}
            disabled={isGeneratingQuiz}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studyMode === 'learn'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Learn Mode</span>
          </button>

          <button
            onClick={startCramMode}
            disabled={isGeneratingQuiz}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studyMode === 'cram'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-rose-400" />
            <span>Cram For A Test</span>
          </button>

          <button
            onClick={startMemorizeMode}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studyMode === 'memorize'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Memorize Mode</span>
          </button>
        </div>
      </div>

      {isGeneratingQuiz && (
        <div className="p-8 text-center bg-[#161b22] border border-indigo-500/30 rounded-2xl space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">Generating Quizlet Adaptive Questions...</h3>
          <p className="text-xs text-slate-400">
            Gemini is compiling exam-level multiple choice questions and common traps from your flashcards.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: 3D FLASHCARDS VIEW */}
      {/* ========================================================================= */}
      {studyMode === 'flashcards' && currentCard && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Card Meta & Mastery Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">
                Card {cardIndex + 1} of {cards.length}
              </span>
              {currentCard.mastered && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                  Mastered
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => speakText(isFlipped ? currentCard.back : currentCard.front)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                title="Speak audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleStar}
                className={`p-1.5 transition-colors ${
                  currentCard.starred ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                }`}
                title="Star card"
              >
                <Star className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[320px] sm:min-h-[360px] bg-[#161b22] hover:border-indigo-500/40 rounded-3xl border-2 border-[#30363d] p-8 sm:p-12 shadow-2xl flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden select-none group"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="uppercase tracking-wider">
                {isFlipped ? 'Definition / Solution (Back)' : 'Term / Question (Front)'}
              </span>
              <span className="text-[11px] text-indigo-400/80 group-hover:text-indigo-300 flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click or Space to flip</span>
              </span>
            </div>

            {/* Main Center Content */}
            <div className="my-auto py-6 text-center space-y-4">
              <h3
                className={`font-bold transition-all ${
                  isFlipped
                    ? 'text-lg sm:text-xl text-slate-100 font-sans leading-relaxed whitespace-pre-wrap'
                    : 'text-2xl sm:text-3xl text-white font-sans tracking-tight'
                }`}
              >
                {isFlipped ? currentCard.back : currentCard.front}
              </h3>

              {showHint && currentCard.hint && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 inline-flex items-center space-x-2 animate-fadeIn">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Hint: {currentCard.hint}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions inside card */}
            <div className="flex items-center justify-between pt-4 border-t border-[#30363d]/50">
              {currentCard.hint ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-medium"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-[11px] text-slate-500 font-mono">
                Press &larr; / &rarr; to navigate
              </span>
            </div>
          </div>

          {/* Navigation & Learning Controls */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrevCard}
              className="p-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-2xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleMarkMastered(false)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Still Learning</span>
              </button>

              <button
                onClick={() => handleMarkMastered(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Mastered</span>
              </button>
            </div>

            <button
              onClick={handleNextCard}
              className="p-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-2xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Next card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: QUIZLET-STYLE LEARN MODE */}
      {/* ========================================================================= */}
      {studyMode === 'learn' && !isGeneratingQuiz && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!learnFinished && learnQuestions[learnIndex] ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Question progress */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">
                  Learn Round: {learnIndex + 1} of {learnQuestions.length}
                </span>
                <span className="text-amber-400 font-bold font-mono">
                  Score: {learnScore} / {learnIndex}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${((learnIndex + 1) / learnQuestions.length) * 100}%` }}
                />
              </div>

              {/* Prompt */}
              <div className="py-2">
                <p className="text-xs uppercase font-mono text-slate-500 mb-1">PROMPT:</p>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {learnQuestions[learnIndex].prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {learnQuestions[learnIndex].options?.map((opt: string, i: number) => {
                  const isChosen = selectedAnswer === opt;
                  const isCorrectAnswer = opt === learnQuestions[learnIndex].correctAnswer;

                  let btnStyle = 'bg-[#0d1117] text-slate-200 border-[#30363d] hover:border-indigo-500';
                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      btnStyle = 'bg-emerald-950/60 text-emerald-200 border-emerald-500';
                    } else if (isChosen && !isCorrectAnswer) {
                      btnStyle = 'bg-rose-950/60 text-rose-200 border-rose-500';
                    } else {
                      btnStyle = 'bg-[#0d1117] text-slate-500 border-[#30363d] opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswerLearn(opt)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrectAnswer && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && isChosen && !isCorrectAnswer && (
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback box when answered */}
              {hasAnswered && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                    selectedAnswer === learnQuestions[learnIndex].correctAnswer
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <p className="font-bold flex items-center space-x-1.5">
                    {selectedAnswer === learnQuestions[learnIndex].correctAnswer ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Correct! Well done.</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-rose-400" />
                        <span>Incorrect. Correct answer: &quot;{learnQuestions[learnIndex].correctAnswer}&quot;</span>
                      </>
                    )}
                  </p>
                  {learnQuestions[learnIndex].explanation && (
                    <p className="text-slate-300">{learnQuestions[learnIndex].explanation}</p>
                  )}
                </div>
              )}

              {/* Next button */}
              {hasAnswered && (
                <button
                  onClick={handleNextLearnQuestion}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Continue to Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* Learn Finished Summary */
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Learn Round Complete!</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  You scored {learnScore} out of {learnQuestions.length} (
                  {Math.round((learnScore / learnQuestions.length) * 100)}% accuracy)
                </p>
              </div>

              {missedQuestions.length > 0 ? (
                <div className="space-y-3 text-left">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    Terms to Review ({missedQuestions.length}):
                  </span>
                  <div className="space-y-2">
                    {missedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs">
                        <p className="font-bold text-white">{q.prompt}</p>
                        <p className="text-emerald-400 mt-1 font-mono">Answer: {q.correctAnswer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-emerald-400 text-xs font-bold">
                  🌟 Flawless Mastery! You nailed every question in this round.
                </p>
              )}

              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={startLearnMode}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs sm:text-sm font-bold text-white shadow-md"
                >
                  Practice Another Round
                </button>
                <button
                  onClick={() => setStudyMode('flashcards')}
                  className="px-5 py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs sm:text-sm font-bold text-slate-200"
                >
                  Back to Flashcards
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CRAM FOR A TEST MODE */}
      {/* ========================================================================= */}
      {studyMode === 'cram' && !isGeneratingQuiz && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!cramFinished && cramQuestions[cramIndex] ? (
            <div className="bg-[#161b22] border-2 border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Header with Countdown Timer & Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-extrabold uppercase">
                    ⚡ CRAM SPRINT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Q {cramIndex + 1}/{cramQuestions.length}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Streak</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      🔥 {cramStreak}x
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Score</span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      {cramScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pulsing Countdown Clock */}
              <div className="flex items-center space-x-3 p-3 bg-rose-950/30 border border-rose-600/30 rounded-xl">
                <Timer className={`w-5 h-5 ${cramTimer <= 5 ? 'text-rose-500 animate-ping' : 'text-rose-400'}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-300 font-semibold">Quick-Fire Timer</span>
                    <span className="text-rose-400 font-mono font-bold">{cramTimer}s remaining</span>
                  </div>
                  <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        cramTimer <= 5 ? 'bg-rose-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${(cramTimer / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* High Stakes Question */}
              <div className="py-2">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {cramQuestions[cramIndex].prompt}
                </h3>
              </div>

              {/* Rapid Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {cramQuestions[cramIndex].options?.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleCramAnswer(opt)}
                    className="w-full text-left p-4 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-rose-500 hover:bg-rose-950/20 text-xs sm:text-sm font-semibold text-slate-200 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Cram Finished Screen */
            <div className="bg-[#161b22] border border-rose-500/40 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                <Timer className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Test Cram Sprint Finished!</h3>
                <p className="text-sm text-slate-300">
                  Total Exam Score:{' '}
                  <span className="font-mono font-extrabold text-amber-400 text-lg">{cramScore}</span> points
                </p>
                <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs mt-2">
                  Readiness Diagnosis: Exam Ready ⚡
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={startCramMode}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs sm:text-sm font-bold text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cram Again</span>
                </button>
                <button
                  onClick={() => setStudyMode('flashcards')}
                  className="px-5 py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs sm:text-sm font-bold text-slate-200"
                >
                  Return to Deck
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: MEMORIZE MODE (ACTIVE RECALL) */}
      {/* ========================================================================= */}
      {studyMode === 'memorize' && currentCard && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#161b22] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">
                  Memorize Recall
                </span>
                <span className="text-slate-300">
                  Card {memorizeIndex + 1} of {cards.length}
                </span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">
                Mastered: {memorizeScore}
              </span>
            </div>

            {/* Prompt */}
            <div className="py-2 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                RECALL THE DEFINITION / FORMULA FOR:
              </span>
              <h3 className="text-xl font-bold text-white">{currentCard.front}</h3>
            </div>

            {/* Input area */}
            <div className="space-y-2">
              <textarea
                rows={4}
                value={memorizeInput}
                onChange={(e) => setMemorizeInput(e.target.value)}
                placeholder="Type the definition, formula, or steps from memory..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Try to recall exact keywords and mechanisms</span>
                {currentCard.hint && (
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                )}
              </div>

              {showHint && currentCard.hint && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  Hint: {currentCard.hint}
                </div>
              )}
            </div>

            {/* Check Recall Button */}
            {!recallEvaluation ? (
              <button
                onClick={handleCheckRecall}
                disabled={isCheckingRecall || !memorizeInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isCheckingRecall ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading Concept Recall with AI...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check My Answer</span>
                  </>
                )}
              </button>
            ) : (
              /* Evaluation Box */
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs sm:text-sm ${
                    recallEvaluation.isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center space-x-1.5">
                      {recallEvaluation.isCorrect ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Concept Recall: Correct ({recallEvaluation.accuracyPercent}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Close! Accuracy: {recallEvaluation.accuracyPercent}%</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{recallEvaluation.feedback}</p>

                  <div className="pt-2 border-t border-[#30363d]/50 space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block">
                      Target Answer:
                    </span>
                    <p className="font-sans text-xs text-white">{currentCard.back}</p>
                  </div>
                </div>

                <button
                  onClick={handleNextMemorize}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs sm:text-sm text-white shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Next Card</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI FLASHCARD GENERATOR MODAL */}
      {/* ========================================================================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Generate Study Deck with AI</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerateDeck} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Generate Flashcards From:
                </label>
                <select
                  value={selectedNoteForDeck}
                  onChange={(e) => setSelectedNoteForDeck(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      My Note: {n.title} ({n.subject})
                    </option>
                  ))}
                  <option value="custom">+ Custom Subject or Exam Topic</option>
                </select>
              </div>

              {selectedNoteForDeck === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject / Course
                    </label>
                    <input
                      type="text"
                      required
                      value={customDeckSubject}
                      onChange={(e) => setCustomDeckSubject(e.target.value)}
                      placeholder="e.g. AP Chemistry, US History, Linear Algebra"
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Topic or Concept Details
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={customDeckTopic}
                      onChange={(e) => setCustomDeckTopic(e.target.value)}
                      placeholder="e.g. Acids and bases, titrations, Henderson-Hasselbalch equation and buffer solutions..."
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 8, 12, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCardCountToGen(cnt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        cardCountToGen === cnt
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#0d1117] text-slate-400 border border-[#30363d]'
                      }`}
                    >
                      {cnt} Cards
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#30363d] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingDeck}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isGeneratingDeck ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Deck...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Deck</span>
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
