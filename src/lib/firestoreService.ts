import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
  UserProfile,
  StyleProfile,
  WritingSample,
  SchoolNote,
  HomeworkRecord,
  Deck,
  DeckCard,
} from './firebase';

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    const now = new Date().toISOString();

    const profileData: UserProfile = {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Student',
      photoURL: user.photoURL || '',
      createdAt: existing.exists() ? (existing.data().createdAt || now) : now,
      updatedAt: now,
    };

    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function getStyleProfile(userId: string): Promise<StyleProfile | null> {
  const path = `users/${userId}/styleProfiles/main`;
  try {
    const ref = doc(db, 'users', userId, 'styleProfiles', 'main');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as StyleProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveStyleProfile(userId: string, data: Partial<StyleProfile>): Promise<void> {
  const path = `users/${userId}/styleProfiles/main`;
  try {
    const ref = doc(db, 'users', userId, 'styleProfiles', 'main');
    const existing = await getDoc(ref);
    const now = new Date().toISOString();

    const profilePayload: StyleProfile = {
      userId,
      summary: data.summary || 'Clear and authentic student voice',
      toneDescription: data.toneDescription || '',
      mathHabits: data.mathHabits || '',
      commonPhrases: data.commonPhrases || '',
      vocabularyLevel: data.vocabularyLevel || 'High School / College',
      formalityScore: data.formalityScore ?? 70,
      stepDetailScore: data.stepDetailScore ?? 75,
      sampleCount: (existing.exists() ? (existing.data().sampleCount || 0) : 0) + 1,
      updatedAt: now,
    };

    await setDoc(ref, profilePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addWritingSample(userId: string, sample: Omit<WritingSample, 'id' | 'userId' | 'createdAt'>): Promise<WritingSample> {
  const sampleId = 'sample_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/samples/${sampleId}`;
  try {
    const newSample: WritingSample = {
      id: sampleId,
      userId,
      title: sample.title,
      subject: sample.subject,
      type: sample.type,
      contentText: sample.contentText,
      extractedTraits: sample.extractedTraits || '',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'samples', sampleId), newSample);
    return newSample;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeSamples(userId: string, onUpdate: (samples: WritingSample[]) => void) {
  const path = `users/${userId}/samples`;
  try {
    const q = query(collection(db, 'users', userId, 'samples'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const samples = snapshot.docs.map((d) => d.data() as WritingSample);
        onUpdate(samples);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function deleteSample(userId: string, sampleId: string): Promise<void> {
  const path = `users/${userId}/samples/${sampleId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'samples', sampleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addNote(userId: string, note: Omit<SchoolNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SchoolNote> {
  const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/notes/${noteId}`;
  const now = new Date().toISOString();
  try {
    const newNote: SchoolNote = {
      id: noteId,
      userId,
      title: note.title,
      subject: note.subject,
      topic: note.topic || 'General',
      rawText: note.rawText,
      sectionHeaders: note.sectionHeaders || '',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'users', userId, 'notes', noteId), newNote);
    return newNote;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeNotes(userId: string, onUpdate: (notes: SchoolNote[]) => void) {
  const path = `users/${userId}/notes`;
  try {
    const q = query(collection(db, 'users', userId, 'notes'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const notes = snapshot.docs.map((d) => d.data() as SchoolNote);
        onUpdate(notes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const path = `users/${userId}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveHomework(userId: string, hw: Omit<HomeworkRecord, 'id' | 'userId' | 'createdAt'>): Promise<HomeworkRecord> {
  const hwId = 'hw_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/homeworks/${hwId}`;
  const now = new Date().toISOString();
  try {
    const newHw: HomeworkRecord = {
      id: hwId,
      userId,
      subject: hw.subject,
      questionText: hw.questionText,
      imageUrl: hw.imageUrl || '',
      exactQuote: hw.exactQuote || '',
      noteSourceTitle: hw.noteSourceTitle || '',
      noteSection: hw.noteSection || '',
      personalizedAnswer: hw.personalizedAnswer,
      handwritingReady: hw.handwritingReady || '',
      styleExplanation: hw.styleExplanation || '',
      createdAt: now,
    };
    await setDoc(doc(db, 'users', userId, 'homeworks', hwId), newHw);
    return newHw;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeHomeworks(userId: string, onUpdate: (homeworks: HomeworkRecord[]) => void) {
  const path = `users/${userId}/homeworks`;
  try {
    const q = query(collection(db, 'users', userId, 'homeworks'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const hws = snapshot.docs.map((d) => d.data() as HomeworkRecord);
        onUpdate(hws);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function deleteHomework(userId: string, hwId: string): Promise<void> {
  const path = `users/${userId}/homeworks/${hwId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'homeworks', hwId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createDeckWithCards(
  userId: string,
  deckData: { title: string; subject: string; description?: string },
  cards: Array<{ front: string; back: string; hint?: string }>
): Promise<Deck> {
  const deckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/decks/${deckId}`;
  const now = new Date().toISOString();

  try {
    const newDeck: Deck = {
      id: deckId,
      userId,
      title: deckData.title,
      subject: deckData.subject,
      description: deckData.description || '',
      cardCount: cards.length,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId, 'decks', deckId), newDeck);

    // Save cards
    const createdCards: DeckCard[] = [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const cardId = 'card_' + (i + 1) + '_' + Date.now();
      const cardDoc: DeckCard = {
        id: cardId,
        userId,
        front: c.front,
        back: c.back,
        hint: c.hint || '',
        mastered: false,
        starred: false,
        reviewCount: 0,
        createdAt: now,
      };
      await setDoc(doc(db, 'users', userId, 'decks', deckId, 'cards', cardId), cardDoc);
      createdCards.push(cardDoc);
    }

    newDeck.cards = createdCards;
    return newDeck;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeDecks(userId: string, onUpdate: (decks: Deck[]) => void) {
  const path = `users/${userId}/decks`;
  try {
    const q = query(collection(db, 'users', userId, 'decks'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const decks = snapshot.docs.map((d) => d.data() as Deck);
        onUpdate(decks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function getDeckCards(userId: string, deckId: string): Promise<DeckCard[]> {
  const path = `users/${userId}/decks/${deckId}/cards`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'decks', deckId, 'cards'));
    return snap.docs.map((d) => d.data() as DeckCard);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function updateDeckCard(
  userId: string,
  deckId: string,
  cardId: string,
  updates: Partial<Pick<DeckCard, 'mastered' | 'starred' | 'reviewCount'>>
): Promise<void> {
  const path = `users/${userId}/decks/${deckId}/cards/${cardId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'decks', deckId, 'cards', cardId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDeck(userId: string, deckId: string): Promise<void> {
  const path = `users/${userId}/decks/${deckId}`;
  try {
    // Delete subcollection cards first
    const cards = await getDocs(collection(db, 'users', userId, 'decks', deckId, 'cards'));
    for (const c of cards.docs) {
      await deleteDoc(c.ref);
    }
    await deleteDoc(doc(db, 'users', userId, 'decks', deckId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

