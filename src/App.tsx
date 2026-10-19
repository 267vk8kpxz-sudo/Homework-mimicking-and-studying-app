/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  SchoolNote,
  StyleProfile,
  WritingSample,
  HomeworkRecord,
  Deck,
  DeckCard,
} from './lib/firebase';
import {
  syncUserProfile,
  getStyleProfile,
  saveStyleProfile,
  addNote,
  deleteNote,
  subscribeNotes,
  addWritingSample,
  deleteSample,
  subscribeSamples,
  saveHomework,
  deleteHomework,
  subscribeHomeworks,
  createDeckWithCards,
  subscribeDecks,
  getDeckCards,
  updateDeckCard,
  deleteDeck,
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { LoginGate } from './components/LoginGate';
import { SolveHomeworkView } from './components/SolveHomeworkView';
import { NotesVaultView } from './components/NotesVaultView';
import { VoiceDnaView } from './components/VoiceDnaView';
import { StudyStudioView } from './components/StudyStudioView';
import { HistoryView } from './components/HistoryView';
import {
  DEFAULT_NOTES,
  DEFAULT_STYLE_PROFILE,
  DEFAULT_SAMPLES,
  DEFAULT_DECKS,
} from './data/defaultSamples';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'solve' | 'notes' | 'voice' | 'study' | 'history'>('solve');
  const [guestBypassed, setGuestBypassed] = useState<boolean>(false);
  const isSeedingDecksRef = React.useRef<boolean>(false);

  // Application Data States
  const [notes, setNotes] = useState<SchoolNote[]>([]);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkRecord[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Sync user profile document in Firestore
        try {
          await syncUserProfile(currentUser);
          const profile = await getStyleProfile(currentUser.uid);
          if (profile) {
            setStyleProfile(profile);
          }
        } catch (e) {
          console.error('Error syncing profile:', e);
        }
      } else {
        // Load initial starter demo data for guest exploration
        setNotes(
          DEFAULT_NOTES.map((n, i) => ({
            ...n,
            id: `demo_note_${i}`,
            userId: 'guest',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
        setStyleProfile({
          ...DEFAULT_STYLE_PROFILE,
          userId: 'guest',
          updatedAt: new Date().toISOString(),
        });
        setSamples(
          DEFAULT_SAMPLES.map((s, i) => ({
            ...s,
            id: `demo_sample_${i}`,
            userId: 'guest',
            createdAt: new Date().toISOString(),
          }))
        );
        setDecks(
          DEFAULT_DECKS.map((d, i) => ({
            id: `demo_deck_${i}`,
            userId: 'guest',
            title: d.title,
            subject: d.subject,
            description: d.description,
            cardCount: d.cards.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cards: d.cards.map((c, ci) => ({
              id: `demo_card_${i}_${ci}`,
              userId: 'guest',
              front: c.front,
              back: c.back,
              hint: c.hint,
              mastered: false,
              starred: false,
              reviewCount: 0,
              createdAt: new Date().toISOString(),
            })),
          }))
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore updates when logged in
  useEffect(() => {
    if (!user) return;

    const unsubNotes = subscribeNotes(user.uid, (remoteNotes) => {
      setNotes(remoteNotes);
    });

    const unsubSamples = subscribeSamples(user.uid, (remoteSamples) => {
      setSamples(remoteSamples);
    });

    const unsubHomeworks = subscribeHomeworks(user.uid, (remoteHws) => {
      setHomeworks(remoteHws);
    });

    const unsubDecks = subscribeDecks(user.uid, async (remoteDecks) => {
      // If user has no remote decks on their first sign in, populate default starter decks once
      if (remoteDecks.length === 0 && !isSeedingDecksRef.current) {
        isSeedingDecksRef.current = true;
        try {
          for (const defaultDeck of DEFAULT_DECKS) {
            await createDeckWithCards(
              user.uid,
              {
                title: defaultDeck.title,
                subject: defaultDeck.subject,
                description: defaultDeck.description,
              },
              defaultDeck.cards
            );
          }
        } catch (e) {
          console.error('Error seeding initial decks:', e);
        }
      } else if (remoteDecks.length > 0) {
        // Fetch cards for each deck
        const hydratedDecks: Deck[] = await Promise.all(
          remoteDecks.map(async (d) => {
            const cards = await getDeckCards(user.uid, d.id);
            return { ...d, cards };
          })
        );
        setDecks(hydratedDecks);
      }
    });

    return () => {
      unsubNotes();
      unsubSamples();
      unsubHomeworks();
      unsubDecks();
    };
  }, [user]);

  // Actions for Notes
  const handleAddNote = async (
    newNote: Omit<SchoolNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<SchoolNote> => {
    if (user) {
      return await addNote(user.uid, newNote);
    } else {
      const localNote: SchoolNote = {
        ...newNote,
        id: `local_note_${Date.now()}`,
        userId: 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [localNote, ...prev]);
      return localNote;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (user) {
      await deleteNote(user.uid, noteId);
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  };

  // Actions for Style Profile & Samples
  const handleSaveStyleProfile = async (profileData: Partial<StyleProfile>) => {
    if (user) {
      await saveStyleProfile(user.uid, profileData);
      const updated = await getStyleProfile(user.uid);
      if (updated) setStyleProfile(updated);
    } else {
      setStyleProfile((prev) => ({
        ...(prev || DEFAULT_STYLE_PROFILE),
        ...profileData,
        userId: 'guest',
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  const handleAddSample = async (
    sampleData: Omit<WritingSample, 'id' | 'userId' | 'createdAt'>
  ): Promise<WritingSample> => {
    if (user) {
      return await addWritingSample(user.uid, sampleData);
    } else {
      const localSample: WritingSample = {
        ...sampleData,
        id: `local_sample_${Date.now()}`,
        userId: 'guest',
        createdAt: new Date().toISOString(),
      };
      setSamples((prev) => [localSample, ...prev]);
      return localSample;
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (user) {
      await deleteSample(user.uid, sampleId);
    } else {
      setSamples((prev) => prev.filter((s) => s.id !== sampleId));
    }
  };

  // Actions for Homework
  const handleSaveHomework = async (
    hwData: Omit<HomeworkRecord, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (user) {
      await saveHomework(user.uid, hwData);
    } else {
      const localHw: HomeworkRecord = {
        ...hwData,
        id: `local_hw_${Date.now()}`,
        userId: 'guest',
        createdAt: new Date().toISOString(),
      };
      setHomeworks((prev) => [localHw, ...prev]);
    }
  };

  const handleDeleteHomework = async (hwId: string) => {
    if (user) {
      await deleteHomework(user.uid, hwId);
    } else {
      setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
    }
  };

  // Actions for Decks & Study Cards
  const handleCreateDeck = async (
    deckData: { title: string; subject: string; description?: string },
    cards: Array<{ front: string; back: string; hint?: string }>
  ): Promise<Deck> => {
    if (user) {
      return await createDeckWithCards(user.uid, deckData, cards);
    } else {
      const newLocalDeck: Deck = {
        id: `local_deck_${Date.now()}`,
        userId: 'guest',
        title: deckData.title,
        subject: deckData.subject,
        description: deckData.description,
        cardCount: cards.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: cards.map((c, i) => ({
          id: `local_card_${Date.now()}_${i}`,
          userId: 'guest',
          front: c.front,
          back: c.back,
          hint: c.hint,
          mastered: false,
          starred: false,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        })),
      };
      setDecks((prev) => [newLocalDeck, ...prev]);
      return newLocalDeck;
    }
  };

  const handleUpdateCardStatus = async (
    deckId: string,
    cardId: string,
    updates: Partial<Pick<DeckCard, 'mastered' | 'starred'>>
  ) => {
    if (user) {
      await updateDeckCard(user.uid, deckId, cardId, updates);
    }
    // Update in local state for instantaneous feedback
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          cards: (d.cards || []).map((c) => {
            if (c.id !== cardId) return c;
            return { ...c, ...updates };
          }),
        };
      })
    );
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (user) {
      await deleteDeck(user.uid, deckId);
    } else {
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    }
  };

  const handleLoadDefaultNotes = async () => {
    if (user) {
      for (const n of DEFAULT_NOTES) {
        await addNote(user.uid, n);
      }
    }
  };

  const handleLoadDefaultSamples = async () => {
    if (user) {
      for (const s of DEFAULT_SAMPLES) {
        await addWritingSample(user.uid, s);
      }
      await saveStyleProfile(user.uid, DEFAULT_STYLE_PROFILE);
      const updated = await getStyleProfile(user.uid);
      if (updated) setStyleProfile(updated);
    }
  };

  const handleLoadDefaultDecks = async () => {
    if (user) {
      for (const defaultDeck of DEFAULT_DECKS) {
        await createDeckWithCards(
          user.uid,
          {
            title: defaultDeck.title,
            subject: defaultDeck.subject,
            description: defaultDeck.description,
          },
          defaultDeck.cards
        );
      }
    }
  };

  // Google Login Gate: When not signed in and not bypassed, require sign-in first
  if (!user && !guestBypassed && !authLoading) {
    return <LoginGate onBypassForDemo={() => setGuestBypassed(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        styleProfile={styleProfile}
        sampleCount={samples.length}
        notesCount={notes.length}
        deckCount={decks.length}
      />

      {/* Guest Demo Notice if bypassed */}
      {!user && (
        <div className="bg-amber-950/30 border-b border-amber-500/20 py-2 px-4 text-center text-xs text-amber-300">
          <span>
            <strong>Demo Preview Mode:</strong> Sign in with Google anytime to save your decks and notes to the cloud.
          </span>
          <button
            onClick={() => loginWithGoogle()}
            className="ml-3 underline font-bold hover:text-white"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'solve' && (
          <SolveHomeworkView
            notes={notes}
            styleProfile={styleProfile}
            onSaveToHistory={handleSaveHomework}
            onNavigateToNotes={() => setActiveTab('notes')}
            onNavigateToVoice={() => setActiveTab('voice')}
          />
        )}

        {activeTab === 'notes' && (
          <NotesVaultView
            notes={notes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onLoadDefaultNotes={handleLoadDefaultNotes}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceDnaView
            styleProfile={styleProfile}
            samples={samples}
            onSaveStyleProfile={handleSaveStyleProfile}
            onAddSample={handleAddSample}
            onDeleteSample={handleDeleteSample}
            onLoadDefaultSamples={handleLoadDefaultSamples}
          />
        )}

        {activeTab === 'study' && (
          <StudyStudioView
            decks={decks}
            notes={notes}
            onCreateDeck={handleCreateDeck}
            onUpdateCardStatus={handleUpdateCardStatus}
            onDeleteDeck={handleDeleteDeck}
            onLoadDefaultDecks={handleLoadDefaultDecks}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            homeworks={homeworks}
            onDeleteHomework={handleDeleteHomework}
            onNavigateToSolve={() => setActiveTab('solve')}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#30363d] py-6 bg-[#0d1117] text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">EchoStudy</span>
            <span>&bull;</span>
            <span>Exact Note Grounding &bull; Student Voice Synthesis &bull; Quizlet Study Modes</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Cloud Authentication</span>
            </span>
            <span>Powered by Gemini 3.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
