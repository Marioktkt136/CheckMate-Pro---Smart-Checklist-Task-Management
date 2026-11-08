import { Injectable, signal, computed } from '@angular/core';
import { UserRole } from '../core/checklist-rules';

export interface UserProfile {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  role: UserRole;
  avatar: string;
  isMfaEnabled: boolean;
  department: string;
}

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'أحمد محمود',
    nameEn: 'Ahmed Mahmoud',
    email: 'ahmed@checkmate.local',
    role: 'admin',
    avatar: '👨‍💼',
    isMfaEnabled: true,
    department: 'المشرف العام وتجهيز المنزل',
  },
  {
    id: 'u2',
    name: 'سارة علي',
    nameEn: 'Sara Ali',
    email: 'sara@checkmate.local',
    role: 'editor',
    avatar: '👩‍💼',
    isMfaEnabled: true,
    department: 'متابعة المشتريات والمواصفات',
  },
  {
    id: 'u3',
    name: 'ماريون بدروس',
    nameEn: 'Marion Bedrous',
    email: 'marionbedrous@gmail.com',
    role: 'admin',
    avatar: '✨',
    isMfaEnabled: true,
    department: 'مالك المشروع / Owner',
  },
  {
    id: 'u4',
    name: 'زائر تجريبي',
    nameEn: 'Guest Viewer',
    email: 'guest@checkmate.local',
    role: 'viewer',
    avatar: '👀',
    isMfaEnabled: false,
    department: 'وضع القراءة فقط',
  },
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<UserProfile>(DEMO_USERS[0]);
  isAuthenticated = signal<boolean>(true);
  isMfaVerified = signal<boolean>(true);

  isAdmin = computed(() => this.currentUser().role === 'admin');
  isEditor = computed(() => this.currentUser().role === 'editor' || this.currentUser().role === 'admin');
  isViewer = computed(() => this.currentUser().role === 'viewer');

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUserId = localStorage.getItem('checkmate_user_id');
      if (savedUserId) {
        const found = DEMO_USERS.find(u => u.id === savedUserId);
        if (found) {
          this.currentUser.set(found);
        }
      }
    }
  }

  loginAs(user: UserProfile) {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.isMfaVerified.set(true);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('checkmate_user_id', user.id);
    }
  }

  logout() {
    this.isAuthenticated.set(false);
  }

  verifyMfa(code: string): boolean {
    if (code.length === 6 || code === '123456') {
      this.isMfaVerified.set(true);
      return true;
    }
    return false;
  }
}
