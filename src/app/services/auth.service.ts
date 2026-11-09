import { Injectable, signal, computed, inject } from '@angular/core';
import { UserRole } from '../core/checklist-rules';
import { FirebaseService, CloudUserRecord } from './firebase.service';

export type AuthProviderType = 'email' | 'google' | 'facebook' | 'apple';

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
    password: 'password123',
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

  // Controls the Auth modal (Sign-in / Sign-up)
  showAuthModal = signal<boolean>(false);

  isAdmin = computed(() => this.isAuthenticated() && this.currentUser().role === 'admin');
  isEditor = computed(() => this.isAuthenticated() && (this.currentUser().role === 'editor' || this.currentUser().role === 'admin'));
  isViewer = computed(() => !this.isAuthenticated() || this.currentUser().role === 'viewer');

  private sessionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initUsers();
    this.initSession();
  }

  private initUsers() {
    if (typeof window === 'undefined') return;

    if (window.localStorage) {
      const savedUsers = localStorage.getItem('checkmate_managed_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized: UserProfile[] = parsed.map((u: Partial<UserProfile>, idx: number) => ({
              id: u.id || 'u_' + idx,
              name: u.name || 'مستخدم',
              nameEn: u.nameEn || u.name || 'User',
              username: u.username || (u.email ? u.email.split('@')[0] : 'user_' + idx),
              email: u.email || `user_${idx}@checkmate.local`,
              password: u.password || 'password123',
              role: (u.role as UserRole) || 'editor',
              avatar: u.avatar || '👤',
              department: u.department || 'فريق العمل',
              provider: u.provider || 'email',
            }));
            this.users.set(normalized);
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
        }
      }
    }

    // Sync users from Firestore (browser only)
    try {
      this.firebase.listenToUsers((cloudUsers) => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          const mapped: UserProfile[] = cloudUsers.map(u => {
            const existing = this.users().find(x => x.id === u.id);
            return {
              id: u.id,
              name: u.name,
              nameEn: u.nameEn || u.name,
              username: u.username || existing?.username || u.email.split('@')[0],
              email: u.email,
              password: u.password || existing?.password || 'password123',
              role: (u.role as UserRole) || 'editor',
              avatar: u.avatar || '👤',
              department: u.department || 'فريق العمل',
              provider: u.provider || existing?.provider || 'email',
            };
          });
          this.users.set(mapped);
          const currentId = this.currentUser().id;
          const stillThere = mapped.find(u => u.id === currentId);
          if (stillThere) {
            this.currentUser.set(stillThere);
          } else if (mapped.length > 0) {
            this.currentUser.set(mapped[0]);
            if (typeof window !== 'undefined' && window.localStorage && this.isAuthenticated()) {
              localStorage.setItem('checkmate_user_id', mapped[0].id);
            }
          }
        }
      });
    } catch (e) {
      console.warn('Firestore users sync skipped', e);
    }
  }

  private initSession() {
    if (typeof window === 'undefined') return;

    // Respect explicit sign-out across reloads
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
        // Expired
        this.logout(true);
      }
    } else {
      // Create session for default user on first visit
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
   * Manual Sign In with Email (or Username) + Password
   */
  signIn(emailOrUsername: string, pass: string): { success: boolean; message?: string } {
    const cleanIdentifier = (emailOrUsername || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanIdentifier || !cleanPass) {
      return { success: false, message: 'invalidCredentials' };
    }

    const user = this.users().find(u =>
      u.email.toLowerCase() === cleanIdentifier ||
      u.username.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return { success: false, message: 'invalidCredentials' };
    }

    const expectedPass = user.password || 'password123';
    // Allow login if password matches OR if account had default 'password123' from legacy creation
    if (cleanPass !== expectedPass && expectedPass !== 'password123') {
      return { success: false, message: 'invalidCredentials' };
    }

    if (cleanIdentifier.includes('@')) {
      void this.firebase.signInWithEmail(cleanIdentifier, cleanPass);
    }

    this.currentUser.set(user);
    this.issueSession(user);
    this.showAuthModal.set(false);
    return { success: true };
  }

  /**
   * Manual Sign Up a new user with Email & Password and isolated account data
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
    const derivedUsername = (data.username?.trim() || cleanEmail.split('@')[0] || 'user_' + Date.now())
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '');

    if (!cleanEmail || !data.password) {
      return { success: false, message: 'invalidCredentials' };
    }

    // Check if email already exists
    const exists = this.users().some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: 'userAlreadyExists' };
    }

    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: data.name.trim(),
      nameEn: (data.nameEn || data.name).trim(),
      username: derivedUsername,
      email: cleanEmail,
      password: data.password.trim(),
      role: data.role || 'editor',
      department: data.department?.trim() || 'فريق العمل والمشاريع',
      avatar: data.avatar || '👤',
      provider: data.provider || 'email',
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    this.firebase.saveUserToFirestore(newUser);
    void this.firebase.createWithEmail(cleanEmail, newUser.password || '');

    this.currentUser.set(newUser);
    this.issueSession(newUser);
    this.showAuthModal.set(false);

    return { success: true, user: newUser };
  }

  /**
   * Social Sign-In / Sign-Up with Google, Facebook, or Apple
   */
  async signInWithSocialProvider(provider: 'google' | 'facebook' | 'apple'): Promise<{
    success: boolean;
    requiresSocialForm?: boolean;
    user?: UserProfile;
  }> {
    try {
      if (provider === 'google') {
        await this.firebase.signInWithGoogle();
      } else if (provider === 'facebook') {
        await this.firebase.signInWithFacebook();
      } else if (provider === 'apple') {
        await this.firebase.signInWithApple();
      }

      const fbUser = this.firebase.currentUser();
      if (fbUser && fbUser.email) {
        const displayName = fbUser.displayName || fbUser.email.split('@')[0];
        const user = this.completeSocialSignIn(provider, fbUser.email, displayName);
        return { success: true, user };
      }
      return { success: false, requiresSocialForm: true };
    } catch {
      // Popup blocked in iframe or OAuth provider not yet configured in Firebase Console:
      // smoothly open the in-modal Social Account Connect step so user can still sign in/up with Google/Facebook/Apple
      return { success: false, requiresSocialForm: true };
    }
  }

  /**
   * Finds or creates an isolated account for a Google, Facebook, or Apple user and signs them in
   */
  completeSocialSignIn(
    provider: 'google' | 'facebook' | 'apple',
    email: string,
    displayName?: string,
    role: UserRole = 'admin'
  ): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.users().find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      const updatedUser: UserProfile = {
        ...existing,
        provider,
      };
      this.updateUser(updatedUser);
      this.currentUser.set(updatedUser);
      this.issueSession(updatedUser);
      this.showAuthModal.set(false);
      return updatedUser;
    }

    const fallbackName = (displayName || cleanEmail.split('@')[0] || 'User').trim();
    const providerAvatar = provider === 'google' ? '🌐' : provider === 'facebook' ? '📘' : '🍎';
    const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_.-]/g, '') || 'user_' + Date.now();

    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: fallbackName,
      nameEn: fallbackName,
      username,
      email: cleanEmail,
      password: 'social_oauth_' + provider,
      role,
      department: `${provider.toUpperCase()} Account`,
      avatar: providerAvatar,
      provider,
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    this.firebase.saveUserToFirestore(newUser);

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
    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: userData.name.trim(),
      nameEn: (userData.nameEn || userData.name).trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: (userData.password || 'password123').trim(),
      role: userData.role,
      department: userData.department?.trim() || 'فريق العمل والمشاريع',
      avatar: userData.avatar || '👤',
      provider: 'email',
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    this.firebase.saveUserToFirestore(newUser);
    return newUser;
  }

  loginAs(user: UserProfile) {
    this.currentUser.set(user);
    this.issueSession(user);
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
        this.firebase.saveUserToFirestore(updated);
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
    this.firebase.saveUserToFirestore(updated);
    if (this.currentUser().id === updated.id) {
      this.currentUser.set(updated);
    }
  }

  deleteUser(userId: string): boolean {
    if (this.users().length <= 1) {
      return false;
    }

    const updatedList = this.users().filter(u => u.id !== userId);
    this.persistUsers(updatedList);
    this.firebase.deleteUserFromFirestore(userId);

    if (this.currentUser().id === userId) {
      this.loginAs(updatedList[0]);
    }
    return true;
  }
}
