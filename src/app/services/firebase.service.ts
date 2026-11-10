import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
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
  provider?: 'email';
}

function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  private readonly firestoreDbId =
    (firebaseConfig as Record<string, string>)['firestoreDatabaseId'] ||
    'ai-studio-checkmateprosmar-13750c5e-07b2-4f6e-9764-100644db56e9';
  readonly db = getFirestore(this.app, this.firestoreDbId);

  readonly isConnectedToFirestore = signal<boolean>(true);
  private lastSavedHashByUser = new Map<string, string>();

  readonly projectId =
    (firebaseConfig as Record<string, string>)['projectId'] || 'gen-lang-client-0495942485';
  readonly databaseId = this.firestoreDbId;

  constructor() {
    if (typeof window !== 'undefined') {
      void this.testConnection();
    }
  }

  private async testConnection(): Promise<void> {
    try {
      await getDocFromServer(doc(this.db, 'test', 'connection'));
      this.isConnectedToFirestore.set(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }

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
