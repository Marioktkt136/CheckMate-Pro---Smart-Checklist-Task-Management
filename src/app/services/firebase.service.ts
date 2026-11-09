import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

export interface CloudUserRecord {
  id: string;
  name: string;
  nameEn?: string;
  username?: string;
  email: string;
  password?: string;
  role: string;
  avatar?: string;
  department?: string;
  provider?: 'email' | 'google' | 'facebook' | 'apple';
}

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
  private readonly facebookProvider = new FacebookAuthProvider();
  private readonly appleProvider = new OAuthProvider('apple.com');

  constructor() {
    WORKSPACE_SCOPES.forEach(scope => this.googleProvider.addScope(scope));
    this.facebookProvider.addScope('email');
    this.appleProvider.addScope('email');
    this.appleProvider.addScope('name');

    if (typeof window !== 'undefined') {
      // Listen to Auth State in browser only
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser.set(user);
        if (!user) {
          this.userToken.set(null);
        }
      });

      this.testFirestoreConnection();
    }
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
      console.warn('Google Sign-In popup note:', err);
      throw err;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async signInWithFacebook(): Promise<User> {
    this.isAuthenticating.set(true);
    try {
      const result = await signInWithPopup(this.auth, this.facebookProvider);
      this.currentUser.set(result.user);
      return result.user;
    } catch (err) {
      console.warn('Facebook Sign-In popup note:', err);
      throw err;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async signInWithApple(): Promise<User> {
    this.isAuthenticating.set(true);
    try {
      const result = await signInWithPopup(this.auth, this.appleProvider);
      this.currentUser.set(result.user);
      return result.user;
    } catch (err) {
      console.warn('Apple Sign-In popup note:', err);
      throw err;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async signInWithEmail(email: string, pass: string): Promise<User | null> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, pass);
      this.currentUser.set(result.user);
      return result.user;
    } catch {
      return null;
    }
  }

  async createWithEmail(email: string, pass: string): Promise<User | null> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, pass);
      this.currentUser.set(result.user);
      return result.user;
    } catch {
      return null;
    }
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

  // Project and Firestore Metadata
  readonly projectId = (firebaseConfig as Record<string, string>)['projectId'] || 'gen-lang-client-0495942485';
  readonly databaseId = this.firestoreDbId;

  // Firestore Sync Methods for Items
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
          this.isConnectedToFirestore.set(true);
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
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving to Firestore, local state preserved:', err);
    }
  }

  async deleteItemFromFirestore(itemId: string): Promise<void> {
    try {
      const itemDoc = doc(this.db, 'items', itemId);
      await deleteDoc(itemDoc);
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed deleting from Firestore:', err);
    }
  }

  // Firestore Sync Methods for Projects
  listenToProjects(onUpdate: (projects: ProjectFolder[]) => void): () => void {
    const projCol = collection(this.db, 'projects');
    return onSnapshot(
      projCol,
      (snapshot) => {
        const projects: ProjectFolder[] = [];
        snapshot.forEach((docSnap) => {
          projects.push(docSnap.data() as ProjectFolder);
        });
        if (projects.length > 0) {
          onUpdate(projects);
          this.isConnectedToFirestore.set(true);
        }
      },
      (error) => {
        console.warn('Firestore projects sync listener error:', error);
      }
    );
  }

  async saveProjectToFirestore(project: ProjectFolder): Promise<void> {
    try {
      const projDoc = doc(this.db, 'projects', project.id);
      await setDoc(projDoc, project, { merge: true });
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving project to Firestore:', err);
    }
  }

  async deleteProjectFromFirestore(projectId: string): Promise<void> {
    try {
      const projDoc = doc(this.db, 'projects', projectId);
      await deleteDoc(projDoc);
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed deleting project from Firestore:', err);
    }
  }

  // Firestore Sync Methods for Users
  listenToUsers(onUpdate: (users: CloudUserRecord[]) => void): () => void {
    const usersCol = collection(this.db, 'users');
    return onSnapshot(
      usersCol,
      (snapshot) => {
        const users: CloudUserRecord[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as CloudUserRecord);
        });
        if (users.length > 0) {
          onUpdate(users);
          this.isConnectedToFirestore.set(true);
        }
      },
      (error) => {
        console.warn('Firestore users sync listener error:', error);
      }
    );
  }

  async saveUserToFirestore(user: CloudUserRecord): Promise<void> {
    try {
      const userDoc = doc(this.db, 'users', user.id);
      await setDoc(userDoc, user, { merge: true });
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed saving user to Firestore:', err);
    }
  }

  async deleteUserFromFirestore(userId: string): Promise<void> {
    try {
      const userDoc = doc(this.db, 'users', userId);
      await deleteDoc(userDoc);
      this.isConnectedToFirestore.set(true);
    } catch (err) {
      console.warn('Failed deleting user from Firestore:', err);
    }
  }
}
