import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { create } from 'zustand';
import { apiFetch, ApiError } from '@/api/client';
import { auth } from '@/api/firebase';

export type MongoUser = {
  _id: string;
  firebaseUid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarKey: string | null;
  points: number;
  currency: number;
  currentStreak: number;
  friendsOnlyProfile: boolean;
  contentPreferences: string[];
  hasSetPreferences: boolean;
};

type AuthStatus = 'loading' | 'signedOut' | 'needsBootstrap' | 'needsPreferences' | 'ready';

type AuthState = {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  mongoUser: MongoUser | null;
  error: string | null;

  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  bootstrap: (username: string, displayName: string, bio: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  clearError: () => void;
};

async function loadMe(): Promise<MongoUser | null> {
  try {
    const data = await apiFetch<{ user: MongoUser }>('/auth/me');
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function statusFor(mongoUser: MongoUser | null): AuthStatus {
  if (!mongoUser) return 'needsBootstrap';
  if (!mongoUser.hasSetPreferences) return 'needsPreferences';
  return 'ready';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  firebaseUser: null,
  mongoUser: null,
  error: null,

  signUp: async (email, password) => {
    set({ error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged below drives the resulting status transition.
    } catch (err: any) {
      set({ error: err?.message ?? 'Sign up failed' });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      set({ error: err?.message ?? 'Sign in failed' });
      throw err;
    }
  },

  signOutUser: async () => {
    await firebaseSignOut(auth);
    set({ mongoUser: null });
  },

  bootstrap: async (username, displayName, bio) => {
    set({ error: null });
    try {
      await apiFetch('/auth/bootstrap', { method: 'POST', body: { username, displayName, bio } });
      const mongoUser = await loadMe();
      set({ mongoUser, status: statusFor(mongoUser) });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Could not finish sign up' });
      throw err;
    }
  },

  refreshMe: async () => {
    const mongoUser = await loadMe();
    set({ mongoUser, status: statusFor(mongoUser) });
  },

  clearError: () => set({ error: null }),
}));

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    useAuthStore.setState({ status: 'signedOut', firebaseUser: null, mongoUser: null });
    return;
  }

  useAuthStore.setState({ firebaseUser, status: 'loading' });
  try {
    const mongoUser = await loadMe();
    useAuthStore.setState({ mongoUser, status: statusFor(mongoUser) });
  } catch (err) {
    useAuthStore.setState({
      status: 'signedOut',
      error: err instanceof Error ? err.message : 'Could not reach the server',
    });
  }
});
