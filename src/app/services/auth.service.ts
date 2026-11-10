import { Injectable, signal, computed, inject } from '@angular/core';
import {
  UserRole,
  UserUiOptions,
  generateSecureRandomPassword,
  createEmptyUserWorkspace,
  normalizeUiOptions,
} from '../core/checklist-rules';
import { FirebaseService, CloudUserRecord } from './firebase.service';

export type AuthProviderType = 'email' | 'google';

export interface UserProfile extends CloudUserRecord {
  id: string;
  name: string;
  nameEn: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  department: string;
  provider?: AuthProviderType;
  token?: string;
  tokenExpiresAt?: number;
}

export const GUEST_USER: UserProfile = {
  id: '',
  name: 'زائر',
  nameEn: 'Guest',
  username: 'guest',
  email: '',
  password: '',
  role: 'viewer',
  avatar: '👤',
  department: '',
  provider: 'email',
  ...createEmptyUserWorkspace(),
};

export const INITIAL_USERS: UserProfile[] = [];
export const DEMO_USERS: UserProfile[] = [];

// Default session timeout: 60 minutes
export const SESSION_DURATION_MS = 60 * 60 * 1000;
const CLEAN_RESET_VERSION_KEY = 'checkmate_clean_reset_v4';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebase = inject(FirebaseService);

  users = signal<UserProfile[]>([]);
  currentUser = signal<UserProfile>(GUEST_USER);
  isAuthenticated = signal<boolean>(false);
  token = signal<string | null>(null);
  tokenExpiresAt = signal<number | null>(null);
  sessionRemainingMinutes = signal<number>(0);
  sessionExpiredNotice = signal<string | null>(null);

  // Always open the system on the Login view
  showAuthModal = signal<boolean>(true);

  isAdmin = computed(() => this.isAuthenticated() && this.currentUser().role === 'admin');
  isEditor = computed(
    () =>
      this.isAuthenticated() &&
      (this.currentUser().role === 'editor' || this.currentUser().role === 'admin')
  );
  isViewer = computed(() => !this.isAuthenticated() || this.currentUser().role === 'viewer');

  /**
   * Registered Google accounts in the database (shown in "Choose a Google Account to Continue")
   */
  googleAccounts = computed(() =>
    this.users().filter(
      u =>
        u.id &&
        u.email &&
        (u.provider === 'google' || u.email.toLowerCase().endsWith('@gmail.com'))
    )
  );

  private sessionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initCleanStateAndAlwaysOpenLogin();
  }

  private getDeletedUserIds(): Set<string> {
    if (typeof window === 'undefined' || !window.localStorage) return new Set();
    try {
      const raw = localStorage.getItem('checkmate_deleted_user_ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // Ignore parse error
    }
    return new Set();
  }

  private addDeletedUserId(id: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const set = this.getDeletedUserIds();
    set.add(id);
    localStorage.setItem('checkmate_deleted_user_ids', JSON.stringify(Array.from(set)));
  }

  private removeDeletedUserId(id: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const set = this.getDeletedUserIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem('checkmate_deleted_user_ids', JSON.stringify(Array.from(set)));
    }
  }

  /**
   * Performs one-time clean reset of legacy cached keys and ensures the app
   * ALWAYS opens on the Login view in an unauthenticated state until the user signs in.
   */
  private initCleanStateAndAlwaysOpenLogin() {
    if (typeof window === 'undefined') return;

    if (window.localStorage) {
      if (localStorage.getItem(CLEAN_RESET_VERSION_KEY) !== 'true') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('checkmate_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(CLEAN_RESET_VERSION_KEY, 'true');
      }

      // Always open on the Login view on app load / refresh
      localStorage.removeItem('checkmate_auth_token');
      localStorage.removeItem('checkmate_token_expires');
      localStorage.removeItem('checkmate_user_id');
      localStorage.setItem('checkmate_signed_out', 'true');
    }

    this.isAuthenticated.set(false);
    this.currentUser.set(GUEST_USER);
    this.token.set(null);
    this.tokenExpiresAt.set(null);
    this.sessionRemainingMinutes.set(0);
    this.showAuthModal.set(true);

    // Sync users list from Firestore database so the Google Account Chooser & Auth checks are up-to-date
    void this.syncUsersFromDatabase();
  }

  private mergeCloudUsers(cloudUsers: CloudUserRecord[]) {
    const currentDeleted = this.getDeletedUserIds();
    const mapped: UserProfile[] = cloudUsers
      .filter(u => u && u.id && u.email && !currentDeleted.has(u.id))
      .map(u => {
        const existing = this.users().find(
          x => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase()
        );
        const isGoogle = u.provider === 'google' || existing?.provider === 'google';
        const rawPass = u.password || existing?.password;
        const resolvedPassword =
          rawPass && (!isGoogle || rawPass !== 'password123')
            ? rawPass
            : isGoogle
              ? generateSecureRandomPassword(24)
              : 'password123';

        const existingIsNewer = Boolean(
          existing?.updatedAt && u.updatedAt && existing.updatedAt > u.updatedAt
        );

        return {
          ...existing,
          ...u,
          ...(existingIsNewer
            ? {
                projects: existing?.projects,
                items: existing?.items,
                categories: existing?.categories,
                notifications: existing?.notifications,
                aiChats: existing?.aiChats,
                mapLocations: existing?.mapLocations,
                uiOptions: existing?.uiOptions,
                updatedAt: existing?.updatedAt,
              }
            : {
                uiOptions: u.uiOptions ? normalizeUiOptions(u.uiOptions) : existing?.uiOptions,
              }),
          id: u.id,
          name: u.name || existing?.name || u.email.split('@')[0],
          nameEn: u.nameEn || u.name || existing?.nameEn || u.email.split('@')[0],
          username: u.username || existing?.username || u.email.split('@')[0],
          email: u.email,
          password: resolvedPassword,
          role: (u.role as UserRole) || existing?.role || 'editor',
          avatar: u.avatar || existing?.avatar || (isGoogle ? '🌐' : '👤'),
          department: u.department || existing?.department || 'فريق العمل',
          provider: isGoogle ? 'google' : 'email',
        };
      });

    this.persistUsers(mapped);

    if (this.isAuthenticated()) {
      const currentId = this.currentUser().id;
      const stillThere = mapped.find(u => u.id === currentId);
      if (stillThere) {
        const curr = this.currentUser();
        if (
          curr.name !== stillThere.name ||
          curr.email !== stillThere.email ||
          curr.role !== stillThere.role ||
          JSON.stringify(curr.uiOptions) !== JSON.stringify(stillThere.uiOptions)
        ) {
          this.currentUser.set(stillThere);
        }
      } else {
        this.logout(false);
      }
    }
  }

  /**
   * Queries Firestore database first to ensure our local users list matches the database
   */
  async syncUsersFromDatabase(): Promise<UserProfile[]> {
    const cloudUsers = await this.firebase.fetchUsersFromFirestore();
    if (this.firebase.isConnectedToFirestore()) {
      this.mergeCloudUsers(cloudUsers);
    }
    return this.users();
  }

  /**
   * Finds a user account in the database by username or email
   */
  findAccountInDatabase(identifier: string): UserProfile | undefined {
    const cleanIdentifier = (identifier || '').trim().toLowerCase().replace(/^@/, '');
    if (!cleanIdentifier) return undefined;
    return this.users().find(
      u =>
        u.username.toLowerCase() === cleanIdentifier ||
        u.email.toLowerCase() === cleanIdentifier
    );
  }

  private startSessionWatcher() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
    this.sessionTimer = setInterval(() => {
      this.checkSessionStatus();
    }, 15000);
  }

  private checkSessionStatus() {
    if (!this.isAuthenticated()) return;

    const exp = this.tokenExpiresAt();
    if (exp) {
      const diff = exp - Date.now();
      if (diff <= 0) {
        this.logout(true);
      } else {
        this.updateRemainingMinutes();
      }
    }
  }

  private updateRemainingMinutes() {
    const exp = this.tokenExpiresAt();
    if (exp) {
      const remainingMs = Math.max(0, exp - Date.now());
      const mins = Math.ceil(remainingMs / (60 * 1000));
      this.sessionRemainingMinutes.set(mins);
    }
  }

  private issueSession(user: UserProfile): string {
    const tokenStr = 'chk_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const expiresAt = Date.now() + SESSION_DURATION_MS;

    this.token.set(tokenStr);
    this.tokenExpiresAt.set(expiresAt);
    this.isAuthenticated.set(true);
    this.sessionExpiredNotice.set(null);
    this.updateRemainingMinutes();
    this.startSessionWatcher();

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('checkmate_signed_out');
      localStorage.setItem('checkmate_auth_token', tokenStr);
      localStorage.setItem('checkmate_token_expires', String(expiresAt));
      localStorage.setItem('checkmate_user_id', user.id);
    }

    return tokenStr;
  }

  private persistUsers(usersList: UserProfile[]) {
    this.users.set(usersList);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (usersList.length > 0) {
        localStorage.setItem('checkmate_managed_users', JSON.stringify(usersList));
      } else {
        localStorage.removeItem('checkmate_managed_users');
      }
    }
  }

  /**
   * Manual Sign In with Username OR Email + Password.
   * Checks first if the account exists in the database; if not, returns not_found error.
   */
  signIn(usernameOrEmail: string, pass: string): {
    success: boolean;
    reason?: 'not_found' | 'wrong_password';
    message?: string;
    matchedUser?: UserProfile;
  } {
    const cleanIdentifier = (usernameOrEmail || '').trim().toLowerCase().replace(/^@/, '');
    const cleanPass = (pass || '').trim();

    if (!cleanIdentifier || !cleanPass) {
      return {
        success: false,
        reason: 'not_found',
        message: 'Account not found in database. Please Sign Up first.',
      };
    }

    const user = this.findAccountInDatabase(cleanIdentifier);

    if (!user) {
      return {
        success: false,
        reason: 'not_found',
        message: 'Account not found in database. Please Sign Up first.',
      };
    }

    const expectedPass = user.password || '';
    if (!expectedPass || cleanPass !== expectedPass) {
      return {
        success: false,
        reason: 'wrong_password',
        message: 'Incorrect password for this account.',
        matchedUser: user,
      };
    }

    this.currentUser.set(user);
    this.issueSession(user);
    this.showAuthModal.set(false);
    return { success: true, matchedUser: user };
  }

  /**
   * Async Manual Sign-In that explicitly syncs with Firestore database first before checking account existence.
   */
  async signInCheckingDatabase(usernameOrEmail: string, pass: string): Promise<{
    success: boolean;
    reason?: 'not_found' | 'wrong_password';
    message?: string;
    matchedUser?: UserProfile;
  }> {
    await this.syncUsersFromDatabase();
    return this.signIn(usernameOrEmail, pass);
  }

  /**
   * Manual Sign Up with Username, Email & Password and clean empty account data:
   * Items: [], Categories: [], Projects: [], Notifications: [], Map Locations: [], AI Chats: [],
   * UI Options: Light Mode (darkMode: false), Arabic ('ar'), Active Project: ""
   */
  signUp(data: {
    name: string;
    nameEn?: string;
    username?: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
    avatar?: string;
    provider?: AuthProviderType;
  }): { success: boolean; message?: string; user?: UserProfile } {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUsername = (
      data.username?.trim() ||
      cleanEmail.split('@')[0] ||
      'user_' + Date.now()
    )
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/\s+/g, '_');

    if (!cleanEmail || !data.password || !cleanUsername) {
      return { success: false, message: 'invalidCredentials' };
    }

    // Check if username or email already exists in database
    const exists = this.users().some(
      u =>
        u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
    );
    if (exists) {
      return { success: false, message: 'userAlreadyExists' };
    }

    const emptyWorkspace = createEmptyUserWorkspace();

    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: data.name.trim(),
      nameEn: (data.nameEn || data.name).trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: data.password.trim(),
      role: data.role || 'admin',
      department: data.department?.trim() || 'فريق العمل والمشاريع',
      avatar: data.avatar || '👨‍💼',
      provider: data.provider || 'email',
      ...emptyWorkspace,
    };

    this.removeDeletedUserId(newUser.id);
    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(newUser);

    this.currentUser.set(newUser);
    this.issueSession(newUser);
    this.showAuthModal.set(false);

    return { success: true, user: newUser };
  }

  /**
   * Async Manual Sign-Up that syncs with Firestore first before checking duplicates and saving
   */
  async signUpCheckingDatabase(data: {
    name: string;
    nameEn?: string;
    username?: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
    avatar?: string;
    provider?: AuthProviderType;
  }): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    await this.syncUsersFromDatabase();
    const res = this.signUp(data);
    if (res.success && res.user) {
      await this.firebase.saveUserToFirestore(res.user);
    }
    return res;
  }

  /**
   * Completes Google Sign-In or Sign-Up via the "Choose a Google Account to Continue" flow:
   * - When mode === 'signin': checks Firestore database first; if found, signs in; if not found, returns 'account_not_found'.
   * - When mode === 'create': checks Firestore database first; if already exists, returns 'user_already_exists';
   *   otherwise creates new Google user with random 24-character password and empty workspace.
   */
  async signInWithGoogleEmail(
    emailOrIdentifier: string,
    displayName?: string,
    mode: 'signin' | 'create' = 'signin'
  ): Promise<{
    success: boolean;
    errorCode?: 'account_not_found' | 'user_already_exists' | 'no_user';
    user?: UserProfile;
    isNewUser?: boolean;
  }> {
    const raw = (emailOrIdentifier || '').trim().toLowerCase().replace(/^@/, '');
    if (!raw) {
      return { success: false, errorCode: 'no_user' };
    }

    const normalizedEmail = raw.includes('@') ? raw : `${raw}@gmail.com`;

    await this.syncUsersFromDatabase();
    const existing =
      this.findAccountInDatabase(raw) || this.findAccountInDatabase(normalizedEmail);

    if (mode === 'signin') {
      if (!existing) {
        return {
          success: false,
          errorCode: 'account_not_found',
        };
      }
      const user = this.completeGoogleSignIn(
        existing.email,
        displayName || existing.name,
        existing.role || 'admin',
        false
      );
      if (!user) {
        return { success: false, errorCode: 'account_not_found' };
      }
      return { success: true, user, isNewUser: false };
    }

    // mode === 'create'
    if (existing) {
      return {
        success: false,
        errorCode: 'user_already_exists',
      };
    }

    const targetName = (displayName || normalizedEmail.split('@')[0] || 'Google User').trim();
    const user = this.completeGoogleSignIn(normalizedEmail, targetName, 'admin', true);
    if (!user) {
      return { success: false, errorCode: 'no_user' };
    }
    await this.firebase.saveUserToFirestore(user);
    return { success: true, user, isNewUser: true };
  }

  /**
   * Signs in an existing Google user from the database, or creates a new one when allowCreate is true.
   * When creating a new Google user:
   * - Sets a cryptographically strong random password instead of 'password123'
   * - Resets all user workspace data to empty arrays [] and UI options to Light Mode, Arabic, and Active Project ""
   */
  completeGoogleSignIn(
    email: string,
    displayName?: string,
    role: UserRole = 'admin',
    allowCreate = true
  ): UserProfile | null {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.findAccountInDatabase(cleanEmail);

    if (existing) {
      this.currentUser.set(existing);
      this.issueSession(existing);
      this.showAuthModal.set(false);
      return existing;
    }

    if (!allowCreate) {
      return null;
    }

    const fallbackName = (displayName || cleanEmail.split('@')[0] || 'User').trim();
    const username =
      cleanEmail.split('@')[0].replace(/[^a-z0-9_.-]/g, '') || 'user_' + Date.now();
    const emptyWorkspace = createEmptyUserWorkspace();
    const randomPassword = generateSecureRandomPassword(24);

    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: fallbackName,
      nameEn: fallbackName,
      username,
      email: cleanEmail,
      password: randomPassword,
      role,
      department: 'Google Account',
      avatar: '🌐',
      provider: 'google',
      ...emptyWorkspace,
    };

    this.removeDeletedUserId(newUser.id);
    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(newUser);

    this.currentUser.set(newUser);
    this.issueSession(newUser);
    this.showAuthModal.set(false);
    return newUser;
  }

  updateUserUiOptions(userId: string, uiOptions: UserUiOptions) {
    if (!userId) return;
    const updatedList = this.users().map(u => (u.id === userId ? { ...u, uiOptions } : u));
    this.persistUsers(updatedList);
    if (this.currentUser().id === userId) {
      this.currentUser.update(curr => ({ ...curr, uiOptions }));
    }
  }

  updateUserWorkspaceSnapshot(userId: string, snapshot: Partial<UserProfile>) {
    if (!userId) return;
    const updatedList = this.users().map(u =>
      u.id === userId
        ? {
            ...u,
            ...snapshot,
          }
        : u
    );
    this.persistUsers(updatedList);
    if (this.currentUser().id === userId) {
      this.currentUser.update(curr => ({
        ...curr,
        ...snapshot,
      }));
    }
  }

  loginAs(user: UserProfile) {
    this.currentUser.set(user);
    this.issueSession(user);
    this.showAuthModal.set(false);
  }

  switchUser(id: string) {
    const found = this.users().find(u => u.id === id);
    if (found) {
      this.loginAs(found);
    }
  }

  refreshSession() {
    if (this.isAuthenticated()) {
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      this.tokenExpiresAt.set(expiresAt);
      this.updateRemainingMinutes();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('checkmate_token_expires', String(expiresAt));
      }
    }
  }

  logout(isTimeout = false) {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.isAuthenticated.set(false);
    this.currentUser.set(GUEST_USER);
    this.token.set(null);
    this.tokenExpiresAt.set(null);
    this.sessionRemainingMinutes.set(0);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('checkmate_auth_token');
      localStorage.removeItem('checkmate_token_expires');
      localStorage.removeItem('checkmate_user_id');
      localStorage.setItem('checkmate_signed_out', 'true');
    }

    void this.firebase.signOut();

    if (isTimeout) {
      this.sessionExpiredNotice.set('sessionExpired');
    }
    this.showAuthModal.set(true);
  }

  updateUserRole(userId: string, newRole: UserRole) {
    const updatedList = this.users().map(u => {
      if (u.id === userId) {
        const updated = { ...u, role: newRole };
        void this.firebase.saveUserToFirestore(updated);
        return updated;
      }
      return u;
    });

    this.persistUsers(updatedList);
    if (this.currentUser().id === userId) {
      this.currentUser.update(curr => ({ ...curr, role: newRole }));
    }
  }

  updateUser(updated: UserProfile) {
    const updatedList = this.users().map(u => (u.id === updated.id ? updated : u));
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(updated);
    if (this.currentUser().id === updated.id) {
      this.currentUser.set(updated);
    }
  }

  deleteUser(userId: string): boolean {
    if (!userId) return false;

    this.addDeletedUserId(userId);
    const updatedList = this.users().filter(u => u.id !== userId);
    this.persistUsers(updatedList);
    void this.firebase.deleteUserFromFirestore(userId);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`checkmate_workspace_v2_${userId}`);
    }

    if (this.currentUser().id === userId) {
      if (updatedList.length > 0) {
        this.loginAs(updatedList[0]);
      } else {
        this.logout(false);
      }
    }
    return true;
  }
}
