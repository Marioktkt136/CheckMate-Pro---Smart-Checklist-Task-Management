import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { ChecklistItem, ProjectFolder, MapLocation, UserUiOptions } from '../core/checklist-rules';

export interface CloudUserWorkspace {
  projects?: ProjectFolder[];
  items?: ChecklistItem[];
  categories?: string[];
  notifications?: unknown[];
  uiOptions?: UserUiOptions;
  aiChats?: unknown[];
  mapLocations?: MapLocation[];
  updatedAt?: string;
}

export interface CloudUserRecord extends CloudUserWorkspace {
  id: string;
  name: string;
  nameEn?: string;
  username?: string;
  email: string;
  password?: string;
  role: string;
  avatar?: string;
  department?: string;
  provider?: 'email' | 'google';
}

function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  readonly auth = getAuth(this.app);
  private readonly firestoreDbId =
    (firebaseConfig as Record<string, string>)['firestoreDatabaseId'] ||
    'ai-studio-checkmateprosmar-13750c5e-07b2-4f6e-9764-100644db56e9';
  readonly db = getFirestore(this.app, this.firestoreDbId);

  // Auth State
  readonly currentUser = signal<User | null>(null);
  readonly userToken = signal<string | null>(null);
  readonly isAuthenticating = signal<boolean>(false);
  readonly isConnectedToFirestore = signal<boolean>(true);

  private readonly googleProvider = new GoogleAuthProvider();
  private lastSavedHashByUser = new Map<string, string>();

  constructor() {
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    if (typeof window !== 'undefined') {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser.set(user);
        if (!user) {
          this.userToken.set(null);
        }
      });
    }
  }

  async signInWithGoogle(): Promise<string | null> {
    this.isAuthenticating.set(true);
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        this.userToken.set(token);
      }
      this.currentUser.set(result.user);
      return token;
    } catch (err) {
      console.warn('Google Sign-In popup note:', err);
      throw err;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async signInWithEmail(email: string, pass: string): Promise<User | null> {
    if (!email || !pass) return null;
    return null;
  }

  async createWithEmail(email: string, pass: string): Promise<User | null> {
    if (!email || !pass) return null;
    return null;
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch {
      // Ignore if not signed into Firebase Auth
    }
    this.currentUser.set(null);
    this.userToken.set(null);
  }

  getAccessToken(): string | null {
    return this.userToken();
  }

  readonly projectId = (firebaseConfig as Record<string, string>)['projectId'] || 'gen-lang-client-0495942485';
  readonly databaseId = this.firestoreDbId;

  /**
   * Fetch all users from Firestore database to verify account existence on Sign-In
   */
  async fetchUsersFromFirestore(): Promise<CloudUserRecord[]> {
    try {
      const usersCol = collection(this.db, 'users');
      const snap = await getDocs(usersCol);
      const list: CloudUserRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as CloudUserRecord);
      });
      this.isConnectedToFirestore.set(true);
      return list;
    } catch (err) {
      console.warn('Firestore fetchUsersFromFirestore fallback:', err);
      return [];
    }
  }

  /**
   * Fetch a single user's full record (including uiOptions and workspace arrays) directly from Firestore
   */
  async fetchUserWorkspaceFromFirestore(userId: string): Promise<CloudUserRecord | null> {
    if (!userId) return null;
    try {
      const userDoc = doc(this.db, 'users', userId);
      const snap = await getDoc(userDoc);
      if (snap.exists()) {
        this.isConnectedToFirestore.set(true);
        return snap.data() as CloudUserRecord;
      }
      return null;
    } catch (err) {
      console.warn('Firestore fetchUserWorkspaceFromFirestore fallback:', err);
      return null;
    }
  }

  /**
   * Listen to a specific user's isolated workspace data in Firestore (`users/{userId}`)
   */
  listenToUserWorkspace(
    userId: string,
    onUpdate: (data: CloudUserWorkspace) => void
  ): () => void {
    const userDoc = doc(this.db, 'users', userId);
    return onSnapshot(
      userDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CloudUserRecord;
          onUpdate({
            projects: data.projects,
            items: data.items,
            categories: data.categories,
            notifications: data.notifications,
            uiOptions: data.uiOptions,
            aiChats: data.aiChats,
            mapLocations: data.mapLocations,
            updatedAt: data.updatedAt,
          });
          this.isConnectedToFirestore.set(true);
        }
      },
      (error) => {
        console.warn('Firestore user workspace listener note:', error);
      }
    );
  }

  /**
   * Immediately save updated UI options (`darkMode`, `language`, `activeProjectId`) to Firestore `users/{userId}`
   */
  async saveUiOptionsToFirestore(userId: string, uiOptions: UserUiOptions): Promise<void> {
    if (!userId) return;
    try {
      const userDoc = doc(this.db, 'users', userId);
      await setDoc(
        userDoc,
        cleanFirestoreData({
          uiOptions,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving uiOptions to Firestore:', err);
    }
  }

  /**
   * Save partial or complete user workspace data under `users/{userId}` with deduplication to avoid rate limits.
   */
  async saveUserWorkspace(
    userId: string,
    workspace: Partial<CloudUserWorkspace>,
    forceWrite = false
  ): Promise<void> {
    if (!userId) return;
    try {
      const cleaned = cleanFirestoreData({
        projects: workspace.projects,
        items: workspace.items,
        categories: workspace.categories,
        notifications: workspace.notifications,
        uiOptions: workspace.uiOptions,
        aiChats: workspace.aiChats,
        mapLocations: workspace.mapLocations,
      });
      const contentHash = JSON.stringify(cleaned);
      if (!forceWrite && this.lastSavedHashByUser.get(userId) === contentHash) {
        return; // Skip duplicate write
      }
      this.lastSavedHashByUser.set(userId, contentHash);

      const userDoc = doc(this.db, 'users', userId);
      await setDoc(
        userDoc,
        {
          ...cleaned,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving user workspace to Firestore:', err);
    }
  }

  async saveUserToFirestore(user: CloudUserRecord): Promise<void> {
    if (!user || !user.id) return;
    try {
      const userDoc = doc(this.db, 'users', user.id);
      await setDoc(userDoc, cleanFirestoreData(user), { merge: true });
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving user to Firestore:', err);
    }
  }

  async deleteUserFromFirestore(userId: string): Promise<void> {
    if (!userId) return;
    try {
      const userDoc = doc(this.db, 'users', userId);
      await deleteDoc(userDoc);
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed deleting user from Firestore:', err);
    }
  }
}
