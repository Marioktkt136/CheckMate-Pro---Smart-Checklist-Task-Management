import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ChecklistItem, ProjectFolder, ItemStatus } from '../core/checklist-rules';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

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

const INITIAL_PROJECTS: ProjectFolder[] = [
  {
    id: 'home_appliances',
    nameAr: 'قائمة الأجهزة الكهربائية (استثمار العمر)',
    nameEn: 'Home Appliances (Lifetime Investment)',
    icon: 'kitchen',
    color: '#3b82f6',
    budget: 180000,
  },
  {
    id: 'furniture_decor',
    nameAr: 'الأثاث والديكور والمفروشات',
    nameEn: 'Furniture & Decor',
    icon: 'weekend',
    color: '#10b981',
    budget: 250000,
  },
  {
    id: 'kitchenware',
    nameAr: 'أدوات ومستلزمات المطبخ',
    nameEn: 'Kitchen Utensils & Cookware',
    icon: 'soup_kitchen',
    color: '#f59e0b',
    budget: 45000,
  },
];

const INITIAL_ITEMS: ChecklistItem[] = [
  {
    id: 'item-1',
    itemNumber: 1,
    folderId: 'home_appliances',
    category: 'الأجهزة الأساسية',
    titleAr: 'الثلاجة',
    titleEn: 'Refrigerator',
    notes: 'نوفروست',
    myNotes: 'شارب 450 لتر ديجيتال نوفروست - معرض بي تك',
    status: 'pending',
    priority: 'urgent',
    tags: ['أساسي', 'مطبخ', 'كهرباء A'],
    estimatedCost: 38000,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-11-20',
    assignee: { name: 'أحمد محمود', email: 'ahmed@example.com', avatar: '👨‍💼', role: 'admin' },
    attachments: [],
    comments: [
      { id: 'c1', userName: 'أحمد محمود', text: 'سألت في المعرض ومتاح خصم 5% حتى نهاية الأسبوع', timestamp: '2026-11-06 14:30', avatar: '👨‍💼' }
    ],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-06T14:30:00Z',
  },
  {
    id: 'item-2',
    itemNumber: 2,
    folderId: 'home_appliances',
    category: 'الأجهزة الأساسية',
    titleAr: 'الغسالة',
    titleEn: 'Washing Machine',
    notes: 'أوتوماتيك',
    myNotes: 'إل جي 9 كيلو بالمجفف Direct Drive',
    status: 'comparing',
    priority: 'urgent',
    tags: ['أساسي', 'حمام/غسيل', 'انفرتر'],
    estimatedCost: 26000,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-11-25',
    assignee: { name: 'سارة علي', email: 'sara@example.com', avatar: '👩‍💼', role: 'editor' },
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-04T10:15:00Z',
  },
  {
    id: 'item-3',
    itemNumber: 3,
    folderId: 'home_appliances',
    category: 'الأجهزة الأساسية',
    titleAr: 'البوتاجاز',
    titleEn: 'Cooker / Stove',
    notes: 'يفضل 5 شعلة أمان كامل',
    myNotes: 'فريش بروفيشنال 90 سم أمان كامل إشعال ذاتي ومروحة تبريد',
    status: 'pending',
    priority: 'high',
    tags: ['أساسي', 'مطبخ', 'أمان كامل'],
    estimatedCost: 19500,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-11-30',
    assignee: { name: 'أحمد محمود', email: 'ahmed@example.com', avatar: '👨‍💼', role: 'admin' },
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-4',
    itemNumber: 4,
    folderId: 'home_appliances',
    category: 'أجهزة المطبخ',
    titleAr: 'الميكروويف أو الفرن الكهربائي',
    titleEn: 'Microwave or Electric Oven',
    notes: '',
    myNotes: 'شارب 34 لتر بالشواية سيلفر',
    status: 'pending',
    priority: 'medium',
    tags: ['مطبخ', 'أجهزة مساعدة'],
    estimatedCost: 8500,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-12-05',
    assignee: { name: 'سارة علي', email: 'sara@example.com', avatar: '👩‍💼', role: 'editor' },
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-5',
    itemNumber: 5,
    folderId: 'home_appliances',
    category: 'أجهزة المطبخ',
    titleAr: 'الخلاط',
    titleEn: 'Blender',
    notes: 'قوي',
    myNotes: 'مولينكس فرنسا 1000 واط مع مطحنتين توابل',
    status: 'purchased',
    priority: 'high',
    tags: ['مطبخ', 'يومي'],
    estimatedCost: 3200,
    actualCost: 3100,
    currency: 'EGP',
    targetDate: '2026-11-02',
    assignee: { name: 'أحمد محمود', email: 'ahmed@example.com', avatar: '👨‍💼', role: 'admin' },
    attachments: [],
    comments: [
      { id: 'c2', userName: 'أحمد محمود', text: 'تم الشراء من كارفور مع ضمان سنتين وتجربة ممتازة', timestamp: '2026-11-03 16:00', avatar: '👨‍💼' }
    ],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-03T16:00:00Z',
  },
  {
    id: 'item-6',
    itemNumber: 6,
    folderId: 'home_appliances',
    category: 'أجهزة المطبخ',
    titleAr: 'الكبة',
    titleEn: 'Food Chopper',
    notes: '',
    myNotes: 'كينوود أو تورنيدو 500 واط وعاء زجاجي صحي',
    status: 'pending',
    priority: 'medium',
    tags: ['مطبخ'],
    estimatedCost: 1800,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-12-10',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-7',
    itemNumber: 7,
    folderId: 'home_appliances',
    category: 'أجهزة المطبخ',
    titleAr: 'العجان',
    titleEn: 'Stand Mixer',
    notes: 'اختياري لمحبي المخبوزات',
    myNotes: 'كينوود شيف 1200 واط وعاء 6.7 لتر - مؤجل للمرحلة الثانية',
    status: 'pending',
    priority: 'low',
    tags: ['مطبخ', 'اختياري', 'مخبوزات'],
    estimatedCost: 15000,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-12-25',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-8',
    itemNumber: 8,
    folderId: 'home_appliances',
    category: 'أجهزة التنظيف والكي',
    titleAr: 'المكنسة الكهربائية',
    titleEn: 'Vacuum Cleaner',
    notes: '',
    myNotes: 'باناسونيك برميل 2200 واط ياباني أو هيتاشي',
    status: 'comparing',
    priority: 'high',
    tags: ['نظافة', 'منزل'],
    estimatedCost: 8000,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-11-28',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 'item-9',
    itemNumber: 9,
    folderId: 'home_appliances',
    category: 'أجهزة التنظيف والكي',
    titleAr: 'المكواة',
    titleEn: 'Steam Iron',
    notes: 'البخار أفضل',
    myNotes: 'تيفال أو فيليبس سيراميك مضاد للتكلس قوة بخار 2400 واط',
    status: 'purchased',
    priority: 'medium',
    tags: ['كي', 'ملابس'],
    estimatedCost: 2800,
    actualCost: 2650,
    currency: 'EGP',
    targetDate: '2026-11-04',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-04T12:00:00Z',
  },
  {
    id: 'item-10',
    itemNumber: 10,
    folderId: 'home_appliances',
    category: 'أجهزة التنظيف والكي',
    titleAr: 'طاولة المكواة',
    titleEn: 'Ironing Board',
    notes: '',
    myNotes: 'طاولة معدنية قابلة لتعديل الارتفاع مع حامل للمكواة ومقبس كهربائي',
    status: 'pending',
    priority: 'low',
    tags: ['كي', 'ملحقات'],
    estimatedCost: 1200,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-12-15',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-11',
    itemNumber: 11,
    folderId: 'home_appliances',
    category: 'الرفاهية المطبخية',
    titleAr: 'الشواية الكهربائية',
    titleEn: 'Electric Grill',
    notes: '',
    myNotes: 'جريل تيفال غير لاصق تسخين سريع مع مجمع للدهون',
    status: 'pending',
    priority: 'low',
    tags: ['رفاهية', 'شواء'],
    estimatedCost: 4500,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-12-20',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'item-12',
    itemNumber: 12,
    folderId: 'home_appliances',
    category: 'الرفاهية المطبخية',
    titleAr: 'القلاية الهوائية',
    titleEn: 'Air Fryer',
    notes: 'اختياري',
    myNotes: 'فيليبس XXL سعة 7.2 لتر أصلية مزودة بتطبيق الوصفات',
    status: 'comparing',
    priority: 'medium',
    tags: ['رفاهية', 'صحي', 'طهي سريع'],
    estimatedCost: 9500,
    actualCost: 0,
    currency: 'EGP',
    targetDate: '2026-11-22',
    attachments: [],
    comments: [],
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-05T18:00:00Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private firebase = inject(FirebaseService);
  private auth = inject(AuthService);

  readonly cloudProjectId = 'gen-lang-client-0495942485';
  readonly cloudDbId = 'ai-studio-checkmateprosmar-13750c5e-07b2-4f6e-9764-100644db56e9';
  readonly cloudRegion = 'europe-west1';

  items = signal<ChecklistItem[]>(INITIAL_ITEMS);
  projects = signal<ProjectFolder[]>(INITIAL_PROJECTS);
  activeProjectId = signal<string>('home_appliances');

  /**
   * Data scope:
   * - 'all': Show all user's items + all published items (or full list for admin)
   * - 'mine': Show only items created/owned by active account
   * - 'published': Show only items published to shared workspace
   */
  dataScope = signal<'all' | 'mine' | 'published'>('all');

  isOnline = signal<boolean>(true);
  isSyncing = signal<boolean>(false);
  hasPendingSync = signal<boolean>(false);
  lastSyncTime = signal<string>('الآن (سحابة Firestore متصلة)');

  isDarkMode = signal<boolean>(false);
  isCloudConnected = computed(() => this.firebase.isConnectedToFirestore());

  notifications = signal<AppNotification[]>([
    {
      id: 'n1',
      title: 'موعد شراء الثلاجة يقترب',
      titleEn: 'Refrigerator purchase date approaching',
      message: 'متبقي 12 يوماً على الموعد المستهدف لشراء الثلاجة',
      messageEn: '12 days remaining until the target date for Refrigerator',
      type: 'deadline',
      read: false,
      timestamp: '2026-11-08 09:00',
    },
    {
      id: 'n2',
      title: 'تم تحديث حالة صنف',
      titleEn: 'Item status updated',
      message: 'قام أحمد محمود بتحديث حالة الخلاط إلى "تم الشراء"',
      messageEn: 'Ahmed updated Blender status to Purchased',
      type: 'update',
      read: true,
      timestamp: '2026-11-03 16:00',
    },
    {
      id: 'n3',
      title: 'إشعار النسخ الاحتياطي',
      titleEn: 'Backup Synced',
      message: 'تم حفظ كافة بيانات قائمة الأجهزة ومزامنتها بنجاح',
      messageEn: 'All appliances checklist data synced successfully',
      type: 'info',
      read: false,
      timestamp: '2026-11-08 02:00',
    }
  ]);

  chatMessages = signal<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'أحمد محمود',
      senderRole: 'admin',
      text: 'مرحباً بالفريق! بدأت مراجعة أسعار الأجهزة الأساسية وإضافة ملاحظات المعارض.',
      timestamp: '10:00 ص',
      avatar: '👨‍💼',
    },
    {
      id: 'm2',
      sender: 'سارة علي',
      senderRole: 'editor',
      text: 'ممتاز، قمت بمقارنة غسالات إل جي وتورنيدو وسجلت الفرق في خانة ملاحظاتي.',
      timestamp: '11:20 ص',
      avatar: '👩‍💼',
    },
    {
      id: 'm3',
      sender: 'المستشار الذكي للأجهزة',
      senderRole: 'AI Consultant',
      text: 'أهلاً بكم! أنا هنا لمساعدتكم في مقارنة الماركات، كفاءة الطاقة، والضمان لأي جهاز في قائمتكم.',
      timestamp: '11:21 ص',
      avatar: '🤖',
      isAi: true,
    }
  ]);

  unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  activeProject = computed(() => {
    return this.projects().find(p => p.id === this.activeProjectId()) || this.projects()[0];
  });

  private getItemOwnerId(it: ChecklistItem): string {
    if (it.ownerId) return it.ownerId;
    if (it.assignee?.email === 'sara@example.com') return 'u2';
    return 'u1';
  }

  /**
   * Account-Separated items computed signal
   */
  currentProjectItems = computed(() => {
    const activeId = this.activeProjectId();
    const currentUserId = this.auth.currentUser().id;
    const scope = this.dataScope();
    const all = this.items().filter(item => item.folderId === activeId);

    if (scope === 'mine') {
      return all.filter(it => this.getItemOwnerId(it) === currentUserId);
    }
    if (scope === 'published') {
      return all.filter(it => it.isPublished === true);
    }
    // 'all': Show current user's own items + explicitly published shared items
    return all.filter(it => this.getItemOwnerId(it) === currentUserId || it.isPublished === true);
  });

  userItemsCount = computed(() => {
    const activeId = this.activeProjectId();
    const currentUserId = this.auth.currentUser().id;
    return this.items().filter(it => it.folderId === activeId && this.getItemOwnerId(it) === currentUserId).length;
  });

  publishedItemsCount = computed(() => {
    const activeId = this.activeProjectId();
    return this.items().filter(it => it.folderId === activeId && it.isPublished === true).length;
  });

  constructor() {
    this.initClientState();
    this.initFirestoreSync();
    this.initSyncWatchers();
  }

  private initClientState() {
    if (typeof window === 'undefined') return;

    // Load Dark Mode preference
    const savedDark = localStorage.getItem('checkmate_dark');
    if (savedDark === 'true') {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }

    // Load cached items
    const savedItems = localStorage.getItem('checkmate_items');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.items.set(parsed);
        }
      } catch (e) {
        console.error('Failed to parse cached items', e);
      }
    }

    // Load cached projects
    const savedProjects = localStorage.getItem('checkmate_projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.projects.set(parsed);
        }
      } catch {
        // Fallback to initial projects if cache corrupted
      }
    }

    // Online status
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncWithServer();
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  private initFirestoreSync() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Real-time items sync across all devices via Firestore
      this.firebase.listenToItems((cloudItems) => {
        if (cloudItems && cloudItems.length > 0) {
          this.items.set(cloudItems);
          this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          this.hasPendingSync.set(false);
        }
      });

      // 2. Real-time projects sync across all devices
      this.firebase.listenToProjects((cloudProjects) => {
        if (cloudProjects && cloudProjects.length > 0) {
          this.projects.set(cloudProjects);
        }
      });

      // 3. Initial seeding to Firestore if cloud collection is pristine
      setTimeout(async () => {
        try {
          const currentItems = this.items();
          if (currentItems.length > 0) {
            // Ensure first item is in Firestore to bootstrap collection
            await this.firebase.saveItemToFirestore(currentItems[0]);
          }
          const currentProjects = this.projects();
          if (currentProjects.length > 0) {
            await this.firebase.saveProjectToFirestore(currentProjects[0]);
          }
        } catch (e) {
          console.warn('Initial cloud seed notice:', e);
        }
      }, 2000);
    } catch (err) {
      console.warn('Firestore real-time sync subscription error:', err);
    }
  }

  private initSyncWatchers() {
    // Save to local storage whenever items change
    effect(() => {
      const items = this.items();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('checkmate_items', JSON.stringify(items));
      }
    });

    // Auto-fetch latest cloud state on startup
    if (typeof window !== 'undefined') {
      setTimeout(() => this.fetchFromServer(), 1000);
      // Periodic background sync every 60 seconds
      setInterval(() => {
        if (this.isOnline()) {
          this.syncWithServer();
        }
      }, 60000);
    }
  }

  toggleDarkMode() {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('checkmate_dark', String(next));
    }
  }

  toggleItemStatus(id: string, targetStatus?: ItemStatus) {
    let updatedItemRef: ChecklistItem | undefined;

    this.items.update(prev =>
      prev.map(item => {
        if (item.id === id) {
          let nextStatus: ItemStatus = targetStatus || 'pending';
          if (!targetStatus) {
            // cycle: pending -> comparing -> purchased -> delivered -> pending
            if (item.status === 'pending') nextStatus = 'comparing';
            else if (item.status === 'comparing') nextStatus = 'purchased';
            else if (item.status === 'purchased') nextStatus = 'delivered';
            else nextStatus = 'pending';
          }
          const updated: ChecklistItem = {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
          updatedItemRef = updated;
          return updated;
        }
        return item;
      })
    );
    this.hasPendingSync.set(true);

    if (updatedItemRef) {
      this.firebase.saveItemToFirestore(updatedItemRef);
    }
  }

  updateItem(updatedItem: ChecklistItem) {
    const itemWithTime = { ...updatedItem, updatedAt: new Date().toISOString() };
    this.items.update(prev =>
      prev.map(item => (item.id === updatedItem.id ? itemWithTime : item))
    );
    this.hasPendingSync.set(true);
    this.firebase.saveItemToFirestore(itemWithTime);
  }

  addItem(newItem: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt' | 'itemNumber'>) {
    const currentMaxNo = this.items().reduce((max, it) => Math.max(max, it.itemNumber || 0), 0);
    const currentUserId = this.auth.currentUser().id;
    const item: ChecklistItem = {
      ...newItem,
      id: 'item-' + Date.now(),
      itemNumber: currentMaxNo + 1,
      ownerId: newItem.ownerId || currentUserId,
      isPublished: newItem.isPublished !== undefined ? newItem.isPublished : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: newItem.attachments || [],
      comments: newItem.comments || [],
    };
    this.items.update(prev => [...prev, item]);
    this.hasPendingSync.set(true);
    this.firebase.saveItemToFirestore(item);

    this.addNotification({
      title: `تمت إضافة ${item.titleAr || item.titleEn}`,
      titleEn: `Added ${item.titleEn || item.titleAr}`,
      message: `تمت إضافة صنف جديد بنجاح في مجموعة (${item.category}) ومزامنته سحابياً`,
      messageEn: `New item added under category (${item.category}) and synced to cloud`,
      type: 'update',
    });
  }

  togglePublishItem(itemId: string) {
    let updatedItemRef: ChecklistItem | undefined;
    this.items.update(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          const nextPub = !it.isPublished;
          const updated: ChecklistItem = {
            ...it,
            isPublished: nextPub,
            updatedAt: new Date().toISOString()
          };
          updatedItemRef = updated;
          return updated;
        }
        return it;
      })
    );
    this.hasPendingSync.set(true);
    if (updatedItemRef) {
      this.firebase.saveItemToFirestore(updatedItemRef);
    }
  }

  importBatchItems(
    batch: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>[],
    targetFolderId?: string,
    isPublished = true
  ): number {
    const currentUserId = this.auth.currentUser().id;
    const folderId = targetFolderId || this.activeProjectId();
    let currentMax = this.items().reduce((max, it) => Math.max(max, it.itemNumber || 0), 0);
    const now = new Date().toISOString();

    const createdItems: ChecklistItem[] = batch.map((it, idx) => {
      currentMax++;
      return {
        ...it,
        id: 'item-' + Date.now() + '-' + idx,
        itemNumber: it.itemNumber || currentMax,
        folderId,
        ownerId: currentUserId,
        isPublished,
        createdAt: now,
        updatedAt: now,
        attachments: it.attachments || [],
        comments: it.comments || [],
      };
    });

    this.items.update(prev => [...prev, ...createdItems]);
    this.hasPendingSync.set(true);

    // Save batch to Firestore
    createdItems.forEach(item => this.firebase.saveItemToFirestore(item));

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
    this.firebase.deleteItemFromFirestore(id);
  }

  addProject(project: Omit<ProjectFolder, 'id'>) {
    const newProject: ProjectFolder = {
      ...project,
      id: 'proj-' + Date.now(),
    };
    this.projects.update(prev => [...prev, newProject]);
    this.activeProjectId.set(newProject.id);
    this.hasPendingSync.set(true);
    this.firebase.saveProjectToFirestore(newProject);
  }

  deleteProject(id: string) {
    if (this.projects().length <= 1) return;
    this.projects.update(prev => prev.filter(p => p.id !== id));
    this.items.update(prev => prev.filter(item => item.folderId !== id));
    this.activeProjectId.set(this.projects()[0].id);
    this.hasPendingSync.set(true);
    this.firebase.deleteProjectFromFirestore(id);
  }

  addComment(itemId: string, text: string, userName: string, avatar = '👤') {
    const comment = {
      id: 'c_' + Date.now(),
      userName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar,
    };
    let updatedItemRef: ChecklistItem | undefined;

    this.items.update(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          const updated = {
            ...it,
            comments: [...(it.comments || []), comment],
            updatedAt: new Date().toISOString(),
          };
          updatedItemRef = updated;
          return updated;
        }
        return it;
      })
    );
    this.hasPendingSync.set(true);
    if (updatedItemRef) {
      this.firebase.saveItemToFirestore(updatedItemRef);
    }
  }

  addAttachment(itemId: string, attachment: { name: string; size: string; type: 'pdf' | 'image' | 'doc'; url?: string }) {
    const newAtt = {
      id: 'att_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...attachment,
    };
    let updatedItemRef: ChecklistItem | undefined;

    this.items.update(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          const updated = {
            ...it,
            attachments: [...(it.attachments || []), newAtt],
            updatedAt: new Date().toISOString(),
          };
          updatedItemRef = updated;
          return updated;
        }
        return it;
      })
    );
    this.hasPendingSync.set(true);
    if (updatedItemRef) {
      this.firebase.saveItemToFirestore(updatedItemRef);
    }
  }

  postChatMessage(text: string, sender: string, senderRole: string, avatar = '👤') {
    const msg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender,
      senderRole,
      text,
      avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.chatMessages.update(prev => [...prev, msg]);

    // Send to backend
    if (this.isOnline()) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(err => console.warn('Chat sync offline fallback', err));
    }
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) {
    const newN: AppNotification = {
      ...notif,
      id: 'notif_' + Date.now(),
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.notifications.update(prev => [newN, ...prev]);

    // Browser Notification API if supported
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newN.title, { body: newN.message, icon: '/favicon.ico' });
      } catch {
        // Notification permission or creation failed
      }
    }
  }

  markAllNotificationsRead() {
    this.notifications.update(prev => prev.map(n => ({ ...n, read: true })));
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

  async fetchFromServer() {
    if (!this.isOnline()) return;
    try {
      this.isSyncing.set(true);
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.items && json.data.items.length > 0 && !this.hasPendingSync()) {
            this.items.set(json.data.items);
          }
          if (json.data.projects && json.data.projects.length > 0) {
            this.projects.set(json.data.projects);
          }
          if (json.data.messages && json.data.messages.length > 0) {
            this.chatMessages.set(json.data.messages);
          }
          this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (e) {
      console.warn('Sync fetch skipped or offline', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async syncWithServer() {
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
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: this.projects(),
      items: this.items(),
      notifications: this.notifications(),
      messages: this.chatMessages(),
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
      this.hasPendingSync.set(true);
      this.syncWithServer();
      return true;
    } catch (e) {
      console.error('Invalid backup JSON', e);
      return false;
    }
  }
}
