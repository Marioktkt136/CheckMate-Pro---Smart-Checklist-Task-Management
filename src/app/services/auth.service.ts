import { Injectable, signal, computed, inject } from '@angular/core';
import { UserRole } from '../core/checklist-rules';
import { FirebaseService, CloudUserRecord } from './firebase.service';

export interface UserProfile extends CloudUserRecord {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
}

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'أحمد محمود',
    nameEn: 'Ahmed Mahmoud',
    email: 'ahmed@checkmate.local',
    role: 'admin',
    avatar: '👨‍💼',
    department: 'المشرف العام وتجهيز المنزل',
  },
  {
    id: 'u2',
    name: 'سارة علي',
    nameEn: 'Sara Ali',
    email: 'sara@checkmate.local',
    role: 'editor',
    avatar: '👩‍💼',
    department: 'متابعة المشتريات والمواصفات',
  },
  {
    id: 'u3',
    name: 'ماريون بدروس',
    nameEn: 'Marion Bedrous',
    email: 'marionbedrous@gmail.com',
    role: 'admin',
    avatar: '✨',
    department: 'مالك المشروع / Owner',
  },
  {
    id: 'u4',
    name: 'زائر تجريبي',
    nameEn: 'Guest Viewer',
    email: 'guest@checkmate.local',
    role: 'viewer',
    avatar: '👀',
    department: 'وضع القراءة فقط',
  },
];

export const DEMO_USERS = INITIAL_USERS;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebase = inject(FirebaseService);

  users = signal<UserProfile[]>(INITIAL_USERS);
  currentUser = signal<UserProfile>(INITIAL_USERS[0]);
  isAuthenticated = signal<boolean>(true);

  isAdmin = computed(() => this.currentUser().role === 'admin');
  isEditor = computed(() => this.currentUser().role === 'editor' || this.currentUser().role === 'admin');
  isViewer = computed(() => this.currentUser().role === 'viewer');

  constructor() {
    this.initUsers();
  }

  private initUsers() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUsers = localStorage.getItem('checkmate_managed_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.users.set(parsed);
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

    // Sync users from Firestore
    try {
      this.firebase.listenToUsers((cloudUsers) => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          const mapped: UserProfile[] = cloudUsers.map(u => ({
            id: u.id,
            name: u.name,
            nameEn: u.nameEn || u.name,
            email: u.email,
            role: (u.role as UserRole) || 'editor',
            avatar: u.avatar || '👤',
            department: u.department || 'فريق العمل',
          }));
          this.users.set(mapped);
          const currentId = this.currentUser().id;
          const stillThere = mapped.find(u => u.id === currentId);
          if (stillThere) {
            this.currentUser.set(stillThere);
          }
        }
      });
    } catch (e) {
      console.warn('Firestore users sync skipped', e);
    }
  }

  private persistUsers(usersList: UserProfile[]) {
    this.users.set(usersList);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('checkmate_managed_users', JSON.stringify(usersList));
    }
  }

  loginAs(user: UserProfile) {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('checkmate_user_id', user.id);
    }
  }

  switchUser(id: string) {
    const found = this.users().find(u => u.id === id);
    if (found) {
      this.loginAs(found);
    }
  }

  createUser(userData: {
    name: string;
    nameEn?: string;
    email: string;
    role: UserRole;
    department?: string;
    avatar?: string;
  }): UserProfile {
    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      name: userData.name.trim(),
      nameEn: (userData.nameEn || userData.name).trim(),
      email: userData.email.trim(),
      role: userData.role,
      department: userData.department?.trim() || 'فريق العمل والمشاريع',
      avatar: userData.avatar || '👤',
    };

    const updatedList = [...this.users(), newUser];
    this.persistUsers(updatedList);
    this.firebase.saveUserToFirestore(newUser);
    return newUser;
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
      return false; // Cannot delete the only user
    }

    const updatedList = this.users().filter(u => u.id !== userId);
    this.persistUsers(updatedList);
    this.firebase.deleteUserFromFirestore(userId);

    // If current user was deleted, switch to the first available user
    if (this.currentUser().id === userId) {
      this.loginAs(updatedList[0]);
    }
    return true;
  }

  logout() {
    this.isAuthenticated.set(false);
  }
}

