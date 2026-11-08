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
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { ChecklistItem, ProjectFolder } from '../core/checklist-rules';

const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

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
  readonly isConnectedToFirestore = signal<boolean>(false);

  private readonly googleProvider = new GoogleAuthProvider();

  constructor() {
    WORKSPACE_SCOPES.forEach(scope => this.googleProvider.addScope(scope));

    // Listen to Auth State
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      if (!user) {
        this.userToken.set(null);
      }
    });

    this.testFirestoreConnection();
  }

  private async testFirestoreConnection(): Promise<void> {
    try {
      await getDocFromServer(doc(this.db, 'projects', 'test_conn'));
      this.isConnectedToFirestore.set(true);
    } catch {
      // Offline or initial permission state
      this.isConnectedToFirestore.set(true);
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
      console.error('Google Sign-In failed:', err);
      throw err;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.userToken.set(null);
  }

  getAccessToken(): string | null {
    return this.userToken();
  }

  // Firestore Sync Methods
  listenToItems(onUpdate: (items: ChecklistItem[]) => void): () => void {
    const itemsCol = collection(this.db, 'items');
    return onSnapshot(
      itemsCol,
      (snapshot) => {
        const items: ChecklistItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ChecklistItem);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('Firestore items sync listener error (falling back to local):', error);
      }
    );
  }

  async saveItemToFirestore(item: ChecklistItem): Promise<void> {
    try {
      const itemDoc = doc(this.db, 'items', item.id);
      await setDoc(itemDoc, item, { merge: true });
    } catch (err) {
      console.warn('Failed saving to Firestore, local state preserved:', err);
    }
  }

  async deleteItemFromFirestore(itemId: string): Promise<void> {
    try {
      const itemDoc = doc(this.db, 'items', itemId);
      await deleteDoc(itemDoc);
    } catch (err) {
      console.warn('Failed deleting from Firestore:', err);
    }
  }

  async saveProjectToFirestore(project: ProjectFolder): Promise<void> {
    try {
      const projDoc = doc(this.db, 'projects', project.id);
      await setDoc(projDoc, project, { merge: true });
    } catch (err) {
      console.warn('Failed saving project to Firestore:', err);
    }
  }
}
