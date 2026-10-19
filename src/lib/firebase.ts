import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial app load as required by Firestore integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Authentication helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function loginWithGoogleRedirect() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google Sign In Redirect Error:', error);
    throw error;
  }
}

export function getAuthErrorMessage(error: any): { title: string; message: string; actionHint?: string } {
  const code = error?.code || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Safari Blocked the Sign-In Popup',
      message: 'iOS Safari blocks popup windows by default. You can try the "Sign In with Redirect" button below, or turn off "Block Pop-ups" in your iPhone/iPad Settings > Safari.',
      actionHint: 'use_redirect',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      title: 'Domain Not Authorized in Firebase',
      message: `Your current website domain ("${currentDomain}") has not been added to Firebase authorized domains yet. You must add "${currentDomain}" in Firebase Console > Authentication > Settings > Authorized domains.`,
      actionHint: 'unauthorized_domain',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      title: 'Sign-in Cancelled',
      message: 'The Google sign-in window was closed before finishing authentication.',
    };
  }

  if (code === 'auth/cancelled-popup-request') {
    return {
      title: 'Request Cancelled',
      message: 'Another sign-in attempt was already in progress.',
    };
  }

  return {
    title: 'Sign-In Error',
    message: error?.message || 'Unable to sign in with Google. Check your internet connection or use Guest Mode.',
  };
}

export async function logoutUser() {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

// Types for data models
export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StyleProfile {
  id?: string;
  userId: string;
  summary: string;
  toneDescription?: string;
  mathHabits?: string;
  commonPhrases?: string;
  vocabularyLevel?: string;
  formalityScore?: number;
  stepDetailScore?: number;
  sampleCount?: number;
  updatedAt: string;
}

export interface WritingSample {
  id: string;
  userId: string;
  title: string;
  subject: string;
  type: 'essay' | 'math_homework' | 'lab_report' | 'other';
  contentText: string;
  extractedTraits?: string;
  createdAt: string;
}

export interface SchoolNote {
  id: string;
  userId: string;
  title: string;
  subject: string;
  topic?: string;
  rawText: string;
  sectionHeaders?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkRecord {
  id: string;
  userId: string;
  subject: string;
  questionText: string;
  imageUrl?: string;
  exactQuote?: string;
  noteSourceTitle?: string;
  noteSection?: string;
  personalizedAnswer: string;
  handwritingReady?: string;
  styleExplanation?: string;
  createdAt: string;
}

export interface DeckCard {
  id: string;
  userId: string;
  front: string;
  back: string;
  hint?: string;
  mastered?: boolean;
  starred?: boolean;
  reviewCount?: number;
  createdAt: string;
}

export interface Deck {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  cards?: DeckCard[];
}

