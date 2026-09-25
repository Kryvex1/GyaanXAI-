import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { Conversation, DailyUsageStats } from './types.ts';

// User's provided Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVvsK0mxKDP0tkXq_iCwZmojz-42C4Ww0",
  authDomain: "gyaanxai.firebaseapp.com",
  databaseURL: "https://gyaanxai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gyaanxai",
  storageBucket: "gyaanxai.firebasestorage.app",
  messagingSenderId: "281368221898",
  appId: "1:281368221898:web:645e16ce7061a282ae7c33",
  measurementId: "G-0XPCSY0NW6",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

const LOCAL_USER_KEY = 'gyaanx_active_user_session';

export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function saveStoredUser(user: AppUser | null) {
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

// ============================================================================
// 🔥 FIRESTORE CLOUD SYNC: Conversations & Quota Across Devices
// ============================================================================

/**
 * Fetch all conversations for logged in user from Firestore
 */
export async function fetchUserConversationsFromCloud(userId: string): Promise<Conversation[] | null> {
  if (!userId) return null;
  try {
    const colRef = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;
    const conversations: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      conversations.push(docSnap.data() as Conversation);
    });
    // Sort newest first
    return conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.warn('Could not fetch conversations from Firestore cloud:', err);
    return null;
  }
}

/**
 * Save single conversation to Firestore
 */
export async function saveUserConversationToCloud(userId: string, conversation: Conversation): Promise<void> {
  if (!userId || !conversation?.id) return;
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversation.id);
    await setDoc(docRef, conversation, { merge: true });
  } catch (err) {
    console.warn('Could not save conversation to Firestore cloud:', err);
  }
}

/**
 * Delete single conversation from Firestore
 */
export async function deleteUserConversationFromCloud(userId: string, conversationId: string): Promise<void> {
  if (!userId || !conversationId) return;
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete conversation from Firestore cloud:', err);
  }
}

/**
 * Clear all conversations from Firestore
 */
export async function clearAllUserConversationsFromCloud(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const colRef = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Could not clear conversations from Firestore cloud:', err);
  }
}

/**
 * Save account-based daily quota usage to Firestore
 */
export async function saveUserDailyQuotaToCloud(userId: string, stats: DailyUsageStats): Promise<void> {
  if (!userId || !stats?.date) return;
  try {
    const docRef = doc(db, 'users', userId, 'quota', stats.date);
    await setDoc(docRef, stats, { merge: true });
  } catch (err) {
    console.warn('Could not save quota to Firestore cloud:', err);
  }
}

/**
 * Fetch account-based daily quota usage from Firestore
 */
export async function fetchUserDailyQuotaFromCloud(userId: string, date: string): Promise<DailyUsageStats | null> {
  if (!userId || !date) return null;
  try {
    const docRef = doc(db, 'users', userId, 'quota', date);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DailyUsageStats;
    }
  } catch (err) {
    console.warn('Could not fetch quota from Firestore cloud:', err);
  }
  return null;
}

export {
  signInWithPopup,
  fbSignOut as signOut,
  fbOnAuthStateChanged as onAuthStateChanged,
  fbUpdateProfile as updateProfile,
};
export type { FirebaseUser };
