/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logoutUser,
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
import { ShieldCheck } from 'lucide-react';

interface LocalStudentProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentUser, setStudentUser] = useState<LocalStudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('echostudy_student_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'solve' | 'notes' | 'voice' | 'study' | 'history'>('solve');
  const isSeedingDecksRef = React.useRef<boolean>(false);

  // Application Data States (hydrated from localStorage or defaults)
  const [notes, setNotes] = useState<SchoolNote[]>(() => {
    try {
      const saved = localStorage.getItem('echostudy_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTES.map((n, i) => ({
      ...n,
      id: `local_note_${i}`,
      userId: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(() => {
    try {
      const saved = localStorage.getItem('echostudy_style');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ...DEFAULT_STYLE_PROFILE,
      userId: 'student',
      updatedAt: new Date().toISOString(),
    };
  });

  const [samples, setSamples] = useState<WritingSample[]>(() => {
    try {
      const saved = localStorage.getItem('echostudy_samples');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SAMPLES.map((s, i) => ({
      ...s,
      id: `local_sample_${i}`,
      userId: 'student',
      createdAt: new Date().toISOString(),
    }));
  });

  const [homeworks, setHomeworks] = useState<HomeworkRecord[]>(() => {
    try {
      const saved = localStorage.getItem('echostudy_homeworks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [decks, setDecks] = useState<Deck[]>(() => {
    try {
      const saved = localStorage.getItem('echostudy_decks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DECKS.map((d, i) => ({
      id: `local_deck_${i}`,
      userId: 'student',
      title: d.title,
      subject: d.subject,
      description: d.description,
      cardCount: d.cards.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: d.cards.map((c, ci) => ({
        id: `local_card_${i}_${ci}`,
        userId: 'student',
        front: c.front,
        back: c.back,
        hint: c.hint,
        mastered: false,
        starred: false,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      })),
    }));
  });

  // Keep localStorage updated with user's progress
  useEffect(() => {
    try {
      localStorage.setItem('echostudy_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  useEffect(() => {
    if (styleProfile) {
      try {
        localStorage.setItem('echostudy_style', JSON.stringify(styleProfile));
      } catch {}
    }
  }, [styleProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('echostudy_samples', JSON.stringify(samples));
    } catch {}
  }, [samples]);

  useEffect(() => {
    try {
      localStorage.setItem('echostudy_homeworks', JSON.stringify(homeworks));
    } catch {}
  }, [homeworks]);

  useEffect(() => {
    try {
      localStorage.setItem('echostudy_decks', JSON.stringify(decks));
    } catch {}
  }, [decks]);

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
          const profile = await getStyleProfile(currentUser.uid);
          if (profile) {
            setStyleProfile(profile);
          }
        } catch (e) {
          console.warn('Firebase profile sync info:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore updates when logged in to Firebase
  useEffect(() => {
    if (!user) return;

    const unsubNotes = subscribeNotes(user.uid, (remoteNotes) => {
      if (remoteNotes.length > 0) setNotes(remoteNotes);
    });

    const unsubSamples = subscribeSamples(user.uid, (remoteSamples) => {
      if (remoteSamples.length > 0) setSamples(remoteSamples);
    });

    const unsubHomeworks = subscribeHomeworks(user.uid, (remoteHws) => {
      if (remoteHws.length > 0) setHomeworks(remoteHws);
    });

    const unsubDecks = subscribeDecks(user.uid, async (remoteDecks) => {
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
          console.warn('Seeding decks in cloud:', e);
        }
      } else if (remoteDecks.length > 0) {
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

  // Handle Instant Student Login
  const handleInstantStudentLogin = (name: string) => {
    const profile: LocalStudentProfile = {
      uid: 'student_' + Date.now(),
      displayName: name,
      email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu`,
    };
    setStudentUser(profile);
    try {
      localStorage.setItem('echostudy_student_profile', JSON.stringify(profile));
    } catch {}
  };

  const handleSignOut = async () => {
    setStudentUser(null);
    try {
      localStorage.removeItem('echostudy_student_profile');
      await logoutUser();
    } catch {}
  };

  // Actions for Notes
  const handleAddNote = async (
    newNote: Omit<SchoolNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<SchoolNote> => {
    if (user) {
      try {
        return await addNote(user.uid, newNote);
      } catch (e) {
        console.warn('Saving note to local storage:', e);
      }
    }
    const localNote: SchoolNote = {
      ...newNote,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || studentUser?.uid || 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [localNote, ...prev]);
    return localNote;
  };

  const handleDeleteNote = async (noteId: string) => {
    if (user) {
      try {
        await deleteNote(user.uid, noteId);
      } catch {}
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Actions for Style Profile & Samples
  const handleSaveStyleProfile = async (profileData: Partial<StyleProfile>) => {
    if (user) {
      try {
        await saveStyleProfile(user.uid, profileData);
        const updated = await getStyleProfile(user.uid);
        if (updated) {
          setStyleProfile(updated);
          return;
        }
      } catch {}
    }
    setStyleProfile((prev) => ({
      ...(prev || DEFAULT_STYLE_PROFILE),
      ...profileData,
      userId: user?.uid || studentUser?.uid || 'student',
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddSample = async (
    sampleData: Omit<WritingSample, 'id' | 'userId' | 'createdAt'>
  ): Promise<WritingSample> => {
    if (user) {
      try {
        return await addWritingSample(user.uid, sampleData);
      } catch {}
    }
    const localSample: WritingSample = {
      ...sampleData,
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || studentUser?.uid || 'student',
      createdAt: new Date().toISOString(),
    };
    setSamples((prev) => [localSample, ...prev]);
    return localSample;
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (user) {
      try {
        await deleteSample(user.uid, sampleId);
      } catch {}
    }
    setSamples((prev) => prev.filter((s) => s.id !== sampleId));
  };

  // Actions for Homework
  const handleSaveHomework = async (
    hwData: Omit<HomeworkRecord, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (user) {
      try {
        await saveHomework(user.uid, hwData);
      } catch {}
    }
    const localHw: HomeworkRecord = {
      ...hwData,
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || studentUser?.uid || 'student',
      createdAt: new Date().toISOString(),
    };
    setHomeworks((prev) => [localHw, ...prev]);
  };

  const handleDeleteHomework = async (hwId: string) => {
    if (user) {
      try {
        await deleteHomework(user.uid, hwId);
      } catch {}
    }
    setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
  };

  // Actions for Decks & Study Cards
  const handleCreateDeck = async (
    deckData: { title: string; subject: string; description?: string },
    cards: Array<{ front: string; back: string; hint?: string }>
  ): Promise<Deck> => {
    if (user) {
      try {
        return await createDeckWithCards(user.uid, deckData, cards);
      } catch {}
    }
    const newLocalDeck: Deck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || studentUser?.uid || 'student',
      title: deckData.title,
      subject: deckData.subject,
      description: deckData.description,
      cardCount: cards.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: cards.map((c, i) => ({
        id: `card_${Date.now()}_${i}`,
        userId: user?.uid || studentUser?.uid || 'student',
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
  };

  const handleUpdateCardStatus = async (
    deckId: string,
    cardId: string,
    updates: Partial<Pick<DeckCard, 'mastered' | 'starred'>>
  ) => {
    if (user) {
      try {
        await updateDeckCard(user.uid, deckId, cardId, updates);
      } catch {}
    }
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
      try {
        await deleteDeck(user.uid, deckId);
      } catch {}
    }
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const handleLoadDefaultNotes = async () => {
    setNotes(
      DEFAULT_NOTES.map((n, i) => ({
        ...n,
        id: `note_default_${i}_${Date.now()}`,
        userId: user?.uid || studentUser?.uid || 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const handleLoadDefaultSamples = async () => {
    setSamples(
      DEFAULT_SAMPLES.map((s, i) => ({
        ...s,
        id: `sample_default_${i}_${Date.now()}`,
        userId: user?.uid || studentUser?.uid || 'student',
        createdAt: new Date().toISOString(),
      }))
    );
    setStyleProfile({
      ...DEFAULT_STYLE_PROFILE,
      userId: user?.uid || studentUser?.uid || 'student',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLoadDefaultDecks = async () => {
    setDecks(
      DEFAULT_DECKS.map((d, i) => ({
        id: `deck_default_${i}_${Date.now()}`,
        userId: user?.uid || studentUser?.uid || 'student',
        title: d.title,
        subject: d.subject,
        description: d.description,
        cardCount: d.cards.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: d.cards.map((c, ci) => ({
          id: `card_default_${i}_${ci}`,
          userId: user?.uid || studentUser?.uid || 'student',
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
  };

  // Determine active profile for Navbar
  const effectiveUser =
    user ||
    (studentUser
      ? ({
          uid: studentUser.uid,
          displayName: studentUser.displayName,
          email: studentUser.email,
          photoURL: studentUser.photoURL,
        } as any)
      : null);

  // If not logged in and no student user is active, show the LoginGate
  if (!effectiveUser && !authLoading) {
    return <LoginGate onInstantStudentLogin={handleInstantStudentLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <Navbar
        user={effectiveUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        styleProfile={styleProfile}
        sampleCount={samples.length}
        notesCount={notes.length}
        deckCount={decks.length}
      />

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
              <span>Full Local &amp; Cloud Persistence</span>
            </span>
            <span>Powered by Gemini 3.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
