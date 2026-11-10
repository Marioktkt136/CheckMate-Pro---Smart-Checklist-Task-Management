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

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'أحمد محمود',
    nameEn: 'Ahmed Mahmoud',
    username: 'ahmed',
    email: 'ahmed@checkmate.local',
    password: 'password123',
    role: 'admin',
    avatar: '👨‍💼',
    department: 'المشرف العام وتجهيز المنزل',
    provider: 'email',
  },
  {
    id: 'u2',
    name: 'سارة علي',
    nameEn: 'Sara Ali',
    username: 'sara',
    email: 'sara@checkmate.local',
    password: 'password123',
    role: 'editor',
    avatar: '👩‍💼',
    department: 'متابعة المشتريات والمواصفات',
    provider: 'email',
  },
  {
    id: 'u3',
    name: 'ماريون بدروس',
    nameEn: 'Marion Bedrous',
    username: 'marion',
    email: 'marionbedrous@gmail.com',
    password: 'Ggl#9xK2!mP8vQ4zR7wL5nJ1',
    role: 'admin',
    avatar: '✨',
    department: 'مالك المشروع / Owner',
    provider: 'google',
  },
];

export const DEMO_USERS = INITIAL_USERS;

// Default session timeout: 60 minutes
export const SESSION_DURATION_MS = 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebase = inject(FirebaseService);

  users = signal<UserProfile[]>(INITIAL_USERS);
  currentUser = signal<UserProfile>(INITIAL_USERS[0]);
  isAuthenticated = signal<boolean>(true);
  token = signal<string | null>(null);
  tokenExpiresAt = signal<number | null>(null);
  sessionRemainingMinutes = signal<number>(60);
  sessionExpiredNotice = signal<string | null>(null);

  // Unified modal state
  showAuthModal = signal<boolean>(false);

  isAdmin = computed(() => this.isAuthenticated() && this.currentUser().role === 'admin');
  isEditor = computed(() => this.isAuthenticated() && (this.currentUser().role === 'editor' || this.currentUser().role === 'admin'));
  isViewer = computed(() => !this.isAuthenticated() || this.currentUser().role === 'viewer');

  private sessionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initUsers();
    this.initSession();
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

  private initUsers() {
    if (typeof window === 'undefined') return;

    const deletedIds = this.getDeletedUserIds();

    if (window.localStorage) {
      const savedUsers = localStorage.getItem('checkmate_managed_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized: UserProfile[] = parsed
              .filter((u: Partial<UserProfile>) => !u.id || !deletedIds.has(u.id))
              .map((u: Partial<UserProfile>, idx: number) => {
                const isGoogle = u.provider === 'google';
                const resolvedPassword =
                  u.password && (!isGoogle || u.password !== 'password123')
                    ? u.password
                    : isGoogle
                      ? generateSecureRandomPassword(24)
                      : 'password123';
                return {
                  ...u,
                  id: u.id || 'u_' + idx,
                  name: u.name || 'مستخدم',
                  nameEn: u.nameEn || u.name || 'User',
                  username: u.username || (u.email ? u.email.split('@')[0] : 'user_' + idx),
                  email: u.email || `user_${idx}@checkmate.local`,
                  password: resolvedPassword,
                  role: (u.role as UserRole) || 'editor',
                  avatar: u.avatar || '👤',
                  department: u.department || 'فريق العمل',
                  provider: isGoogle ? 'google' : 'email',
                };
              });
            if (normalized.length > 0) {
              this.users.set(normalized);
            }
          }
        } catch (e) {
          console.warn('Failed parsing saved users', e);
        }
      }

      const savedUserId = localStorage.getItem('checkmate_user_id');
      if (savedUserId) {
        const found = this.users().find(u => u.id === savedUserId);
        if (found) {
          this.currentUser.set(found);
        } else if (this.users().length > 0) {
          this.currentUser.set(this.users()[0]);
        }
      } else if (this.users().length > 0) {
        this.currentUser.set(this.users()[0]);
      }
    }

    // One-time sync of users from Firestore on boot
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

        return {
          ...existing,
          ...u,
          id: u.id,
          name: u.name || existing?.name || u.email.split('@')[0],
          nameEn: u.nameEn || u.name || existing?.nameEn || u.email.split('@')[0],
          username: u.username || existing?.username || u.email.split('@')[0],
          email: u.email,
          password: resolvedPassword,
          role: (u.role as UserRole) || existing?.role || 'editor',
          avatar: u.avatar || existing?.avatar || '👤',
          department: u.department || existing?.department || 'فريق العمل',
          provider: isGoogle ? 'google' : 'email',
          uiOptions: u.uiOptions ? normalizeUiOptions(u.uiOptions) : existing?.uiOptions,
        };
      });

    if (mapped.length > 0) {
      this.persistUsers(mapped);
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
        this.currentUser.set(mapped[0]);
        if (typeof window !== 'undefined' && window.localStorage && this.isAuthenticated()) {
          localStorage.setItem('checkmate_user_id', mapped[0].id);
        }
      }
    }
  }

  /**
   * Queries Firestore database first to ensure our local users list is up-to-date
   */
  async syncUsersFromDatabase(): Promise<UserProfile[]> {
    const cloudUsers = await this.firebase.fetchUsersFromFirestore();
    if (cloudUsers.length > 0) {
      this.mergeCloudUsers(cloudUsers);
    } else if (typeof window !== 'undefined' && !localStorage.getItem('checkmate_users_seeded')) {
      localStorage.setItem('checkmate_users_seeded', 'true');
      for (const u of this.users()) {
        void this.firebase.saveUserToFirestore(u);
      }
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

  private initSession() {
    if (typeof window === 'undefined') return;

    const signedOutFlag = localStorage.getItem('checkmate_signed_out');
    if (signedOutFlag === 'true') {
      this.isAuthenticated.set(false);
      this.token.set(null);
      this.tokenExpiresAt.set(null);
      this.sessionRemainingMinutes.set(0);
      this.showAuthModal.set(true);
      return;
    }

    const savedToken = localStorage.getItem('checkmate_auth_token');
    const savedExpires = localStorage.getItem('checkmate_token_expires');

    if (savedToken && savedExpires) {
      const expTimestamp = parseInt(savedExpires, 10);
      if (!isNaN(expTimestamp) && Date.now() < expTimestamp) {
        this.token.set(savedToken);
        this.tokenExpiresAt.set(expTimestamp);
        this.isAuthenticated.set(true);
        this.updateRemainingMinutes();
      } else {
        this.logout(true);
      }
    } else {
      this.issueSession(this.currentUser());
    }

    this.startSessionWatcher();
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
      localStorage.setItem('checkmate_managed_users', JSON.stringify(usersList));
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

    const expectedPass = user.password || 'password123';
    if (cleanPass !== expectedPass) {
      return {
        success: false,
        reason: 'wrong_password',
        message: 'Incorrect password for this account.',
        matchedUser: user,
      };
    }

    if (cleanIdentifier.includes('@')) {
      void this.firebase.signInWithEmail(cleanIdentifier, cleanPass);
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
   * Reset password for an account and sign in immediately
   */
  resetPassword(userId: string, newPass: string): boolean {
    const cleanPass = (newPass || '').trim();
    if (cleanPass.length < 4) return false;

    const user = this.users().find(u => u.id === userId);
    if (!user) return false;

    const updatedUser: UserProfile = {
      ...user,
      password: cleanPass,
    };

    this.updateUser(updatedUser);
    this.currentUser.set(updatedUser);
    this.issueSession(updatedUser);
    this.showAuthModal.set(false);
    return true;
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
    const cleanUsername = (data.username?.trim() || cleanEmail.split('@')[0] || 'user_' + Date.now())
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/\s+/g, '_');

    if (!cleanEmail || !data.password || !cleanUsername) {
      return { success: false, message: 'invalidCredentials' };
    }

    // Check if username or email already exists in database
    const exists = this.users().some(u =>
      u.email.toLowerCase() === cleanEmail ||
      u.username.toLowerCase() === cleanUsername
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
      role: data.role || 'editor',
      department: data.department?.trim() || 'فريق العمل والمشاريع',
      avatar: data.avatar || '👤',
      provider: data.provider || 'email',
      ...emptyWorkspace,
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(newUser);
    void this.firebase.createWithEmail(cleanEmail, newUser.password || '');

    this.currentUser.set(newUser);
    this.issueSession(newUser);
    this.showAuthModal.set(false);

    return { success: true, user: newUser };
  }

  /**
   * Google Sign-In / Sign-Up via Firebase Google Popup.
   * When mode === 'signin', checks first if the account exists in the database;
   * if not found, signs out of Firebase Auth and returns an error to the client.
   */
  async signInWithGoogleProvider(mode: 'signin' | 'create' = 'signin'): Promise<{
    success: boolean;
    errorCode?: string;
    user?: UserProfile;
    isNewUser?: boolean;
  }> {
    try {
      await this.firebase.signInWithGoogle();
      const fbUser = this.firebase.currentUser();
      if (fbUser && fbUser.email) {
        await this.syncUsersFromDatabase();
        const cleanEmail = fbUser.email.trim().toLowerCase();
        const existing = this.findAccountInDatabase(cleanEmail);

        if (mode === 'signin' && !existing) {
          await this.firebase.signOut();
          return {
            success: false,
            errorCode: 'account_not_found',
          };
        }

        const isNewUser = !existing && mode === 'create';
        const displayName = fbUser.displayName || fbUser.email.split('@')[0];
        const user = this.completeGoogleSignIn(fbUser.email, displayName, 'admin', mode === 'create');
        if (!user) {
          return {
            success: false,
            errorCode: 'account_not_found',
          };
        }
        return { success: true, user, isNewUser };
      }
      return { success: false, errorCode: 'no_user' };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || 'popup_error';
      return { success: false, errorCode: code };
    }
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
      const securePassword =
        existing.password && existing.password !== 'password123'
          ? existing.password
          : generateSecureRandomPassword(24);
      const updatedUser: UserProfile = {
        ...existing,
        password: securePassword,
        provider: 'google',
      };
      this.updateUser(updatedUser);
      this.currentUser.set(updatedUser);
      this.issueSession(updatedUser);
      this.showAuthModal.set(false);
      return updatedUser;
    }

    if (!allowCreate) {
      return null;
    }

    const fallbackName = (displayName || cleanEmail.split('@')[0] || 'User').trim();
    const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_.-]/g, '') || 'user_' + Date.now();
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

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(newUser);

    this.currentUser.set(newUser);
    this.issueSession(newUser);
    this.showAuthModal.set(false);
    return newUser;
  }

  createUser(userData: {
    name: string;
    nameEn?: string;
    username?: string;
    email: string;
    password?: string;
    role: UserRole;
    department?: string;
    avatar?: string;
  }): UserProfile {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanUsername = (userData.username || cleanEmail.split('@')[0] || 'user_' + Date.now()).trim().toLowerCase();
    const emptyWorkspace = createEmptyUserWorkspace();
    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: userData.name.trim(),
      nameEn: (userData.nameEn || userData.name).trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: (userData.password || generateSecureRandomPassword(24)).trim(),
      role: userData.role,
      department: userData.department?.trim() || 'فريق العمل والمشاريع',
      avatar: userData.avatar || '👤',
      provider: 'email',
      ...emptyWorkspace,
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    void this.firebase.saveUserToFirestore(newUser);
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
    if (this.users().length <= 1) {
      return false;
    }

    this.addDeletedUserId(userId);
    const updatedList = this.users().filter(u => u.id !== userId);
    this.persistUsers(updatedList);
    void this.firebase.deleteUserFromFirestore(userId);

    if (this.currentUser().id === userId) {
      this.loginAs(updatedList[0]);
    }
    return true;
  }
}
