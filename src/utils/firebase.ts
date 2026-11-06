import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import type { UserProfile, UserStats } from '../types';

// Read configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if valid Firebase configuration is present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 0 &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain.trim().length > 0 &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim().length > 0
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
  }
}

export { auth, googleProvider };

/**
 * Maps a Firebase User instance to our internal UserProfile schema
 */
export function mapFirebaseUserToProfile(user: User, existingStats?: UserStats): UserProfile {
  const rawName = user.displayName || user.email?.split('@')[0] || 'Focus Enthusiast';
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Check if we have locally cached stats for this user
  let stats: UserStats = existingStats || {
    totalFocusMinutes: 0,
    completedFocusSessions: 0,
    completedShortBreaks: 0,
    completedLongBreaks: 0,
    completedTasksCount: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    dailyActivity: {},
    history: []
  };

  try {
    const savedAccountsStr = localStorage.getItem('phokus_accounts') || '[]';
    const accounts: UserProfile[] = JSON.parse(savedAccountsStr);
    const found = accounts.find(a => a.id === user.uid || (user.email && a.email.toLowerCase() === user.email.toLowerCase()));
    if (found?.stats) {
      stats = found.stats;
    }
  } catch {
    // Ignore parse error
  }

  return {
    id: user.uid,
    name,
    email: user.email || '',
    stats
  };
}

/**
 * Format Firebase Auth error codes into human-readable messages
 */
export function formatAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/user-not-found':
      return 'No account exists with this email. Click "Sign up" to create an account.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Popup was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Console.';
    default:
      return err.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add your credentials to .env.local');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    await updateProfile(userCredential.user, { displayName: name.trim() });
  }

  return mapFirebaseUserToProfile(userCredential.user);
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add your credentials to .env.local');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return mapFirebaseUserToProfile(userCredential.user);
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not configured. Please add your credentials to .env.local');
  }

  const userCredential = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUserToProfile(userCredential.user);
}

/**
 * Sign out from Firebase
 */
export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthUserChanged(callback: (user: User | null) => void): () => void {
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
