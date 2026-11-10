import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  ChecklistItem,
  ProjectFolder,
  ItemStatus,
  MapLocation,
  UserUiOptions,
  createEmptyUserWorkspace,
  normalizeUiOptions,
} from '../core/checklist-rules';
import { FirebaseService, CloudUserWorkspace } from './firebase.service';
import { AuthService } from './auth.service';
import { I18nService, Language } from './i18n.service';

export const EMPTY_PROJECT_PLACEHOLDER: ProjectFolder = {
  id: '',
  nameAr: 'لا يوجد مشروع نشط',
  nameEn: 'No Active Project',
  icon: 'folder_off',
  color: '#64748b',
  budget: 0,
};

export interface AppNotification {
  id: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type: 'deadline' | 'update' | 'mention' | 'info';
  read: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  text: string;
  timestamp: string;
  avatar: string;
  isAi?: boolean;
}

export const DEFAULT_CATEGORIES: string[] = [];
export const DEFAULT_MAP_LOCATIONS: MapLocation[] = [];

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private firebase = inject(FirebaseService);
  private auth = inject(AuthService);
  private i18n = inject(I18nService);

  readonly cloudProjectId = 'gen-lang-client-0495942485';
  readonly cloudDbId = 'ai-studio-checkmateprosmar-13750c5e-07b2-4f6e-9764-100644db56e9';
  readonly cloudRegion = 'europe-west1';

  // Per-User Isolated Workspace Signals (Always initialized to empty / null)
  projects = signal<ProjectFolder[]>([]);
  items = signal<ChecklistItem[]>([]);
  categories = signal<string[]>([]);
  notifications = signal<AppNotification[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  mapLocations = signal<MapLocation[]>([]);

  activeProjectId = signal<string>('');
  dataScope = signal<'all' | 'mine' | 'published'>('all');

  isOnline = signal<boolean>(true);
  isSyncing = signal<boolean>(false);
  hasPendingSync = signal<boolean>(false);
  lastSyncTime = signal<string>('الآن');

  isDarkMode = signal<boolean>(false);
  isCloudConnected = computed(() => this.firebase.isConnectedToFirestore());

  private unsubscribeUserWorkspace: (() => void) | null = null;
  private activeLoadedUserId = '';
  private firestoreWriteTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLocalMutationAt = 0;
  private isWritingToCloud = false;

  private recordLocalMutation() {
    this.lastLocalMutationAt = Date.now();
  }

  unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  activeProject = computed<ProjectFolder>(() => {
    const activeId = this.activeProjectId();
    const list = this.projects();
    if (!activeId || list.length === 0) {
      return EMPTY_PROJECT_PLACEHOLDER;
    }
    return list.find(p => p.id === activeId) || list[0] || EMPTY_PROJECT_PLACEHOLDER;
  });

  /**
   * Current Project's Items belonging to the signed-in user
   */
  currentProjectItems = computed(() => {
    const activeId = this.activeProjectId();
    return this.items().filter(item => (item.folderId || '') === activeId);
  });

  userItemsCount = computed(() => this.currentProjectItems().length);
  publishedItemsCount = computed(() => this.currentProjectItems().length);

  constructor() {
    this.initClientState();
    this.initUserWorkspaceEffect();
  }

  private initClientState() {
    if (typeof window === 'undefined') return;

    this.isDarkMode.set(false);
    document.documentElement.classList.remove('dark');

    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncWithServer();
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  private getUserCacheKey(userId: string): string {
    return `checkmate_workspace_v2_${userId}`;
  }

  clearInMemoryWorkspace() {
    this.projects.set([]);
    this.items.set([]);
    this.categories.set([]);
    this.notifications.set([]);
    this.chatMessages.set([]);
    this.mapLocations.set([]);
    this.activeProjectId.set('');
    this.isDarkMode.set(false);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }

  private initUserWorkspaceEffect() {
    if (typeof window === 'undefined') return;

    effect(() => {
      const isAuth = this.auth.isAuthenticated();
      const user = this.auth.currentUser();

      if (!isAuth || !user || !user.id) {
        if (this.unsubscribeUserWorkspace) {
          this.unsubscribeUserWorkspace();
          this.unsubscribeUserWorkspace = null;
        }
        this.activeLoadedUserId = '';
        this.lastLocalMutationAt = 0;
        this.clearInMemoryWorkspace();
        return;
      }

      if (this.activeLoadedUserId !== user.id) {
        if (this.activeLoadedUserId) {
          this.flushPendingSync(this.activeLoadedUserId);
        }
        this.activeLoadedUserId = user.id;
        this.lastLocalMutationAt = 0;
        void this.loadUserWorkspace(user.id);
      }
    });
  }

  /**
   * Resets a newly registered user's workspace to completely empty arrays and
   * UI Options: Light Mode (darkMode: false), Arabic ('ar'), and Active Project ""
   */
  resetWorkspaceForNewUser(userId: string) {
    if (!userId) return;
    const empty = createEmptyUserWorkspace();
    this.projects.set(empty.projects);
    this.items.set(empty.items);
    this.categories.set(empty.categories);
    this.notifications.set(empty.notifications);
    this.chatMessages.set(empty.aiChats);
    this.mapLocations.set(empty.mapLocations);
    this.applyUiOptions(empty.uiOptions, false);

    this.activeLoadedUserId = userId;
    this.recordLocalMutation();
    this.saveToLocalCacheOnly(userId);
    this.isWritingToCloud = true;
    void this.firebase.saveUserWorkspace(userId, this.buildCurrentWorkspacePayload(), true).finally(() => {
      this.isWritingToCloud = false;
    });
    this.hasPendingSync.set(false);
    this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  private applyWorkspaceSnapshot(userId: string, data: CloudUserWorkspace): boolean {
    let applied = false;

    if (Array.isArray(data.projects)) {
      this.projects.set(data.projects);
      applied = true;
    }
    if (Array.isArray(data.items)) {
      this.items.set(data.items);
      applied = true;
    }
    if (Array.isArray(data.categories)) {
      this.categories.set(data.categories);
      applied = true;
    }
    if (Array.isArray(data.notifications)) {
      this.notifications.set(data.notifications as AppNotification[]);
      applied = true;
    }
    if (Array.isArray(data.aiChats)) {
      this.chatMessages.set(data.aiChats as ChatMessage[]);
      applied = true;
    }
    if (Array.isArray(data.mapLocations)) {
      this.mapLocations.set(data.mapLocations);
      applied = true;
    }
    if (data.uiOptions) {
      this.applyUiOptions(data.uiOptions, false);
      applied = true;
    } else if (Array.isArray(data.projects)) {
      if (data.projects.length === 0) {
        this.activeProjectId.set('');
      } else if (!data.projects.some(p => p.id === this.activeProjectId())) {
        this.activeProjectId.set(data.projects[0].id);
      }
    }

    if (applied) {
      this.saveToLocalCacheOnly(userId);
    }
    return applied;
  }

  async loadUserWorkspace(userId: string) {
    if (typeof window === 'undefined' || !userId || !this.auth.isAuthenticated()) return;

    // 1. Unsubscribe previous user listener
    if (this.unsubscribeUserWorkspace) {
      this.unsubscribeUserWorkspace();
      this.unsubscribeUserWorkspace = null;
    }

    // 2. Check if user profile in AuthService or localStorage cache has state
    const userProfile = this.auth.users().find(u => u.id === userId);
    const cacheKey = this.getUserCacheKey(userId);
    const raw = localStorage.getItem(cacheKey);
    let hasLoadedState = false;

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CloudUserWorkspace;
        hasLoadedState = this.applyWorkspaceSnapshot(userId, parsed);
      } catch (e) {
        console.warn('Failed parsing user workspace cache', e);
      }
    }

    if (!hasLoadedState && userProfile && (Array.isArray(userProfile.projects) || userProfile.uiOptions)) {
      hasLoadedState = this.applyWorkspaceSnapshot(userId, userProfile);
    }

    if (!hasLoadedState) {
      // New user account: initialize completely empty workspace and Light Mode + Arabic + Active Project ""
      this.resetWorkspaceForNewUser(userId);
    }

    // 3. Explicitly fetch latest user workspace & UI options from Firestore database upon Sign-In / Switch
    const cloudRecord = await this.firebase.fetchUserWorkspaceFromFirestore(userId);
    if (cloudRecord && this.activeLoadedUserId === userId && this.auth.isAuthenticated()) {
      const cloudTime = cloudRecord.updatedAt ? Date.parse(cloudRecord.updatedAt) : 0;
      const localIsNewer = this.lastLocalMutationAt > 0 && cloudTime > 0 && cloudTime < this.lastLocalMutationAt;
      if (!localIsNewer && !this.isWritingToCloud && this.firestoreWriteTimer === null) {
        const updated = this.applyWorkspaceSnapshot(userId, cloudRecord);
        if (updated) {
          this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          this.hasPendingSync.set(false);
        } else {
          void this.firebase.saveUserWorkspace(userId, this.buildCurrentWorkspacePayload(), true);
        }
      }
    }

    // 4. Subscribe to Firestore `users/{userId}` real-time updates
    this.unsubscribeUserWorkspace = this.firebase.listenToUserWorkspace(userId, (cloudData) => {
      if (this.activeLoadedUserId !== userId || !this.auth.isAuthenticated()) return;
      if (this.isWritingToCloud || this.firestoreWriteTimer !== null) return;
      if (this.lastLocalMutationAt > 0 && cloudData.updatedAt) {
        const cloudTime = Date.parse(cloudData.updatedAt);
        if (!isNaN(cloudTime) && cloudTime < this.lastLocalMutationAt) {
          return;
        }
      }
      const updatedFromCloud = this.applyWorkspaceSnapshot(userId, cloudData);
      if (updatedFromCloud) {
        this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        this.hasPendingSync.set(false);
      }
    });
  }

  applyUiOptions(opts?: Partial<UserUiOptions> | null, persistToDb = false) {
    const normalized = normalizeUiOptions(opts);

    // 1. Apply Dark / Light Mode
    this.isDarkMode.set(normalized.darkMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', normalized.darkMode);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('checkmate_dark', String(normalized.darkMode));
    }

    // 2. Apply Language ('ar' | 'en')
    if (this.i18n.currentLang() !== normalized.language) {
      this.i18n.setLanguage(normalized.language);
    }

    // 3. Apply Active Project ID (supports "" when no project is active, or auto-selects first project when projects exist)
    if (normalized.activeProjectId && this.projects().some(p => p.id === normalized.activeProjectId)) {
      this.activeProjectId.set(normalized.activeProjectId);
    } else if (this.projects().length > 0) {
      this.activeProjectId.set(this.projects()[0].id);
    } else {
      this.activeProjectId.set('');
    }

    const userId = this.auth.currentUser()?.id;
    if (userId && this.auth.isAuthenticated()) {
      const finalUiOptions = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, finalUiOptions);
      if (persistToDb) {
        this.flushPendingSync(userId);
      }
    }
  }

  getCurrentUiOptions(): UserUiOptions {
    return {
      darkMode: this.isDarkMode(),
      language: this.i18n.currentLang(),
      activeProjectId: this.activeProjectId(),
    };
  }

  private buildCurrentWorkspacePayload(): CloudUserWorkspace {
    const ts =
      this.lastLocalMutationAt > 0
        ? new Date(this.lastLocalMutationAt).toISOString()
        : new Date().toISOString();
    return {
      projects: this.projects(),
      items: this.items(),
      categories: this.categories(),
      notifications: this.notifications(),
      uiOptions: this.getCurrentUiOptions(),
      aiChats: this.chatMessages(),
      mapLocations: this.mapLocations(),
      updatedAt: ts,
    };
  }

  private saveToLocalCacheOnly(userId: string) {
    if (typeof window === 'undefined' || !window.localStorage || !userId) return;
    const payload = this.buildCurrentWorkspacePayload();
    localStorage.setItem(this.getUserCacheKey(userId), JSON.stringify(payload));
    this.auth.updateUserWorkspaceSnapshot(userId, payload);
  }

  /**
   * Immediately flushes any pending workspace or UI Option changes to localStorage and Firestore
   * before signing out, switching accounts, or after project/UI option changes.
   */
  flushPendingSync(targetUserId?: string) {
    const userId = targetUserId || this.activeLoadedUserId || this.auth.currentUser()?.id;
    if (!userId || !this.auth.isAuthenticated()) return;

    if (this.firestoreWriteTimer) {
      clearTimeout(this.firestoreWriteTimer);
      this.firestoreWriteTimer = null;
    }

    this.recordLocalMutation();
    this.saveToLocalCacheOnly(userId);
    const payload = this.buildCurrentWorkspacePayload();
    this.isWritingToCloud = true;
    void this.firebase.saveUserWorkspace(userId, payload, true).finally(() => {
      this.isWritingToCloud = false;
    });
    this.hasPendingSync.set(false);
    this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  /**
   * Saves immediately to localStorage and debounces Firestore write (350ms) to avoid rate limit spikes.
   */
  persistUserWorkspace() {
    const userId = this.auth.currentUser()?.id;
    if (!userId || !this.auth.isAuthenticated()) return;

    this.recordLocalMutation();
    this.saveToLocalCacheOnly(userId);

    if (this.firestoreWriteTimer) {
      clearTimeout(this.firestoreWriteTimer);
    }

    this.firestoreWriteTimer = setTimeout(() => {
      this.firestoreWriteTimer = null;
      if (!this.auth.isAuthenticated()) return;
      const payload = this.buildCurrentWorkspacePayload();
      this.isWritingToCloud = true;
      void this.firebase.saveUserWorkspace(userId, payload).finally(() => {
        this.isWritingToCloud = false;
      });
      this.hasPendingSync.set(false);
      this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 350);
  }

  toggleDarkMode() {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('checkmate_dark', String(next));
    }
    this.flushPendingSync();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
    this.flushPendingSync();
  }

  setLanguage(lang: Language) {
    this.i18n.setLanguage(lang);
    this.flushPendingSync();
  }

  selectProject(projectId: string) {
    this.activeProjectId.set(projectId || '');
    this.flushPendingSync();
  }

  addCategory(cat: string) {
    const clean = (cat || '').trim();
    if (!clean) return;
    if (!this.categories().includes(clean)) {
      this.categories.update(prev => [...prev, clean]);
      this.persistUserWorkspace();
    }
  }

  addMapLocation(loc: Omit<MapLocation, 'id'>): MapLocation {
    const newLoc: MapLocation = {
      ...loc,
      id: 'loc-' + Date.now(),
    };
    this.mapLocations.update(prev => [newLoc, ...prev]);
    this.persistUserWorkspace();
    return newLoc;
  }

  deleteMapLocation(locId: string) {
    this.mapLocations.update(prev => prev.filter(l => l.id !== locId));
    this.persistUserWorkspace();
  }

  toggleItemStatus(id: string, targetStatus?: ItemStatus) {
    this.items.update(prev =>
      prev.map(item => {
        if (item.id === id) {
          let nextStatus: ItemStatus = targetStatus || 'pending';
          if (!targetStatus) {
            if (item.status === 'pending') nextStatus = 'comparing';
            else if (item.status === 'comparing') nextStatus = 'purchased';
            else if (item.status === 'purchased') nextStatus = 'delivered';
            else nextStatus = 'pending';
          }
          return {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  updateItem(updatedItem: ChecklistItem) {
    const itemWithTime: ChecklistItem = {
      ...updatedItem,
      storeName: updatedItem.storeLocation || updatedItem.storeName || '',
      storeLocation: updatedItem.storeLocation || updatedItem.storeName || '',
      updatedAt: new Date().toISOString(),
    };
    if (itemWithTime.category) {
      this.addCategory(itemWithTime.category);
    }
    this.items.update(prev =>
      prev.map(item => (item.id === updatedItem.id ? itemWithTime : item))
    );
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  addItem(newItem: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt' | 'itemNumber'>) {
    const currentMaxNo = this.items().reduce((max, it) => Math.max(max, it.itemNumber || 0), 0);
    const currentUserId = this.auth.currentUser().id;
    if (newItem.category && !this.categories().includes(newItem.category.trim())) {
      this.categories.update(prev => [...prev, newItem.category.trim()]);
    }
    const item: ChecklistItem = {
      ...newItem,
      id: 'item-' + Date.now(),
      itemNumber: currentMaxNo + 1,
      ownerId: currentUserId,
      storeLocation: newItem.storeLocation || newItem.storeName || '',
      storeName: newItem.storeLocation || newItem.storeName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: newItem.attachments || [],
      comments: newItem.comments || [],
    };
    this.items.update(prev => [...prev, item]);
    this.hasPendingSync.set(true);

    this.addNotification({
      title: `تمت إضافة ${item.titleAr || item.titleEn}`,
      titleEn: `Added ${item.titleEn || item.titleAr}`,
      message: `تمت إضافة صنف جديد بنجاح في مجموعة (${item.category}) ومزامنته سحابياً`,
      messageEn: `New item added under category (${item.category}) and synced to cloud`,
      type: 'update',
    });
  }

  importBatchItems(
    batch: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>[],
    targetFolderId?: string
  ): number {
    const currentUserId = this.auth.currentUser().id;
    const folderId = targetFolderId || this.activeProjectId();
    let currentMax = this.items().reduce((max, it) => Math.max(max, it.itemNumber || 0), 0);
    const now = new Date().toISOString();
    const newCategories = new Set(this.categories());

    const createdItems: ChecklistItem[] = batch.map((it, idx) => {
      currentMax++;
      if (it.category && it.category.trim()) {
        newCategories.add(it.category.trim());
      }
      return {
        ...it,
        id: 'item-' + Date.now() + '-' + idx,
        itemNumber: it.itemNumber || currentMax,
        folderId,
        ownerId: currentUserId,
        createdAt: now,
        updatedAt: now,
        attachments: it.attachments || [],
        comments: it.comments || [],
      };
    });

    this.categories.set(Array.from(newCategories));
    this.items.update(prev => [...prev, ...createdItems]);
    this.hasPendingSync.set(true);

    this.addNotification({
      title: 'تم استيراد بيانات Google Sheets',
      titleEn: 'Google Sheets imported',
      message: `تم استيراد ${createdItems.length} صنف بنجاح إلى مشروعك ومزامنتها مع السحابة`,
      messageEn: `Successfully imported ${createdItems.length} items to your project`,
      type: 'update',
    });

    return createdItems.length;
  }

  deleteItem(id: string) {
    this.items.update(prev => prev.filter(item => item.id !== id));
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  addProject(project: Omit<ProjectFolder, 'id'>): ProjectFolder {
    const currentUserId = this.auth.currentUser()?.id || '';
    const cleanNameAr = (project.nameAr || project.nameEn || 'مشروع جديد').trim();
    const cleanNameEn = (project.nameEn || project.nameAr || 'New Project').trim();
    const newProject: ProjectFolder = {
      ...project,
      nameAr: cleanNameAr,
      nameEn: cleanNameEn,
      budget: Number(project.budget) || 0,
      icon: project.icon || 'folder',
      color: project.color || '#3b82f6',
      id: 'proj-' + Date.now(),
      ownerId: currentUserId,
    };
    const wasNoProject = !this.activeProjectId() || this.projects().length === 0;
    this.projects.update(prev => [...prev, newProject]);
    if (wasNoProject) {
      this.items.update(prev =>
        prev.map(it => (!it.folderId ? { ...it, folderId: newProject.id } : it))
      );
    }
    this.activeProjectId.set(newProject.id);
    if (currentUserId) {
      this.flushPendingSync(currentUserId);
    }
    return newProject;
  }

  deleteProject(id: string) {
    const currentUserId = this.auth.currentUser()?.id || '';
    this.projects.update(prev => prev.filter(p => p.id !== id));
    this.items.update(prev => prev.filter(item => item.folderId !== id));
    const remaining = this.projects();
    this.activeProjectId.set(remaining[0]?.id || '');
    if (currentUserId) {
      this.flushPendingSync(currentUserId);
    }
  }

  addComment(itemId: string, text: string, userName: string, avatar = '👤') {
    const comment = {
      id: 'c_' + Date.now(),
      userName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar,
    };

    this.items.update(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          return {
            ...it,
            comments: [...(it.comments || []), comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return it;
      })
    );
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  addAttachment(itemId: string, attachment: { name: string; size: string; type: 'pdf' | 'image' | 'doc'; url?: string }) {
    const newAtt = {
      id: 'att_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...attachment,
    };

    this.items.update(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          return {
            ...it,
            attachments: [...(it.attachments || []), newAtt],
            updatedAt: new Date().toISOString(),
          };
        }
        return it;
      })
    );
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  postChatMessage(text: string, sender: string, senderRole: string, avatar = '👤', isAi = false) {
    const msg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender,
      senderRole,
      text,
      avatar,
      isAi,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.chatMessages.update(prev => [...prev, msg]);
    this.persistUserWorkspace();
  }

  clearAiChats() {
    this.chatMessages.set([]);
    this.persistUserWorkspace();
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) {
    const newN: AppNotification = {
      ...notif,
      id: 'notif_' + Date.now(),
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.notifications.update(prev => [newN, ...prev]);
    this.persistUserWorkspace();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newN.title, { body: newN.message, icon: '/favicon.ico' });
      } catch {
        // Ignore browser notification errors
      }
    }
  }

  markAllNotificationsRead() {
    this.notifications.update(prev => prev.map(n => ({ ...n, read: true })));
    this.persistUserWorkspace();
  }

  requestPushNotifications() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.addNotification({
            title: 'تم تفعيل الإشعارات الفورية',
            titleEn: 'Push notifications enabled',
            message: 'ستتلقى تنبيهات بمواعيد وتحديثات المشتريات والمهام',
            messageEn: 'You will receive reminders for deadlines and task updates',
            type: 'info',
          });
        }
      });
    }
  }

  async syncWithServer() {
    if (!this.auth.isAuthenticated()) return;
    this.persistUserWorkspace();
    if (!this.isOnline()) return;
    try {
      this.isSyncing.set(true);
      const payload = {
        items: this.items(),
        projects: this.projects(),
        messages: this.chatMessages(),
        notifications: this.notifications(),
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        this.hasPendingSync.set(false);
        this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.warn('Failed to push sync', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  backupToJson(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      userId: this.auth.currentUser().id,
      projects: this.projects(),
      items: this.items(),
      categories: this.categories(),
      notifications: this.notifications(),
      uiOptions: this.getCurrentUiOptions(),
      aiChats: this.chatMessages(),
      mapLocations: this.mapLocations(),
    };
    return JSON.stringify(data, null, 2);
  }

  restoreFromJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.items && Array.isArray(data.items)) {
        this.items.set(data.items);
      }
      if (data.projects && Array.isArray(data.projects)) {
        this.projects.set(data.projects);
      }
      if (data.categories && Array.isArray(data.categories)) {
        this.categories.set(data.categories);
      }
      if (data.mapLocations && Array.isArray(data.mapLocations)) {
        this.mapLocations.set(data.mapLocations);
      }
      this.hasPendingSync.set(true);
      this.persistUserWorkspace();
      void this.syncWithServer();
      return true;
    } catch (e) {
      console.error('Invalid backup JSON', e);
      return false;
    }
  }
}
