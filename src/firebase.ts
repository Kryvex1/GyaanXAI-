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
import { getDatabase, ref, set, get, remove } from 'firebase/database';
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
export const rtdb = getDatabase(app);

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

export const signOut = fbSignOut;
export const onAuthStateChanged = fbOnAuthStateChanged;
export const updateProfile = fbUpdateProfile;
export { signInWithPopup };

const USER_STORAGE_KEY = 'gyaanx_user_profile_v2';

export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AppUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Could not save user to localStorage', e);
  }
}

/**
 * Fetch all conversations for a user from Firebase Cloud (RTDB + Firestore)
 */
export async function fetchUserConversationsFromCloud(userId: string): Promise<Conversation[] | null> {
  if (!userId) return null;

  // 1. Try Firebase Realtime Database
  try {
    const snap = await get(ref(rtdb, `users/${userId}/conversations`));
    if (snap.exists()) {
      const data = snap.val();
      const conversations: Conversation[] = Object.values(data);
      if (Array.isArray(conversations) && conversations.length > 0) {
        return conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    }
  } catch (err) {
    console.warn('RTDB fetch failed, trying Firestore:', err);
  }

  // 2. Fallback to Cloud Firestore
  try {
    const colRef = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const conversations: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) {
          conversations.push(data as Conversation);
        }
      });
      return conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
  } catch (err) {
    console.warn('Firestore fetch failed:', err);
  }

  return null;
}

/**
 * Save single conversation to Firebase Cloud (RTDB + Firestore)
 */
export async function saveUserConversationToCloud(userId: string, conversation: Conversation): Promise<void> {
  if (!userId || !conversation?.id) return;

  // Sanitize messages to avoid payload limits
  const sanitizedMessages = (conversation.messages || []).map((m) => {
    if (m.image?.data && m.image.data.length > 400000) {
      return {
        ...m,
        image: {
          ...m.image,
          data: m.image.data.startsWith('http') ? m.image.data : '',
        },
      };
    }
    return m;
  });

  const payload = {
    ...conversation,
    messages: sanitizedMessages,
    updatedAt: Date.now(),
  };

  // 1. Save to Realtime Database (Instant & Verified)
  try {
    await set(ref(rtdb, `users/${userId}/conversations/${conversation.id}`), payload);
  } catch (err) {
    console.warn('Could not save conversation to RTDB cloud:', err);
  }

  // 2. Also save to Firestore
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversation.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('Could not save conversation to Firestore cloud:', err);
  }
}

/**
 * Delete single conversation from Firebase Cloud
 */
export async function deleteUserConversationFromCloud(userId: string, conversationId: string): Promise<void> {
  if (!userId || !conversationId) return;

  try {
    await remove(ref(rtdb, `users/${userId}/conversations/${conversationId}`));
  } catch (err) {
    console.warn('Could not delete conversation from RTDB:', err);
  }

  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete conversation from Firestore:', err);
  }
}

/**
 * Clear all conversations from Firebase Cloud
 */
export async function clearAllUserConversationsFromCloud(userId: string): Promise<void> {
  if (!userId) return;

  try {
    await remove(ref(rtdb, `users/${userId}/conversations`));
  } catch (err) {
    console.warn('Could not clear conversations from RTDB:', err);
  }

  try {
    const colRef = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Could not clear conversations from Firestore:', err);
  }
}

/**
 * Save account-based daily quota usage to Firebase
 */
export async function saveUserDailyQuotaToCloud(userId: string, stats: DailyUsageStats): Promise<void> {
  if (!userId || !stats?.date) return;
  try {
    await set(ref(rtdb, `users/${userId}/quota/${stats.date}`), stats);
  } catch (err) {
    console.warn('Could not save quota to RTDB:', err);
  }
  try {
    const docRef = doc(db, 'users', userId, 'quota', stats.date);
    await setDoc(docRef, stats, { merge: true });
  } catch (err) {
    console.warn('Could not save quota to Firestore:', err);
  }
}

/**
 * Fetch account-based daily quota usage from Firebase
 */
export async function fetchUserDailyQuotaFromCloud(userId: string, date: string): Promise<DailyUsageStats | null> {
  if (!userId || !date) return null;
  try {
    const snap = await get(ref(rtdb, `users/${userId}/quota/${date}`));
    if (snap.exists()) {
      return snap.val() as DailyUsageStats;
    }
  } catch (err) {
    console.warn('Could not fetch quota from RTDB:', err);
  }
  try {
    const docRef = doc(db, 'users', userId, 'quota', date);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DailyUsageStats;
    }
  } catch (err) {
    console.warn('Could not fetch quota from Firestore:', err);
  }
  return null;
}
