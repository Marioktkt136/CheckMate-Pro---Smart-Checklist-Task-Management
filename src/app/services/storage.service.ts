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

export const DEFAULT_CATEGORIES: string[] = [
  'الأجهزة الأساسية',
  'أجهزة المطبخ',
  'أجهزة التنظيف والكي',
  'الرفاهية المطبخية',
];

export const DEFAULT_MAP_LOCATIONS: MapLocation[] = [
  {
    id: 'loc-1',
    nameAr: 'بي تك - فرع عباس العقاد، مدينة نصر',
    nameEn: 'B.Tech - Abbas El Akkad, Nasr City',
    category: 'appliances',
    brand: 'B.Tech',
    addressAr: 'شارع عباس العقاد، أمام الحديقة الدولية، مدينة نصر، القاهرة',
    addressEn: 'Abbas El Akkad St, Nasr City, Cairo',
    phone: '19966',
    rating: 4.6,
    openHours: '10:00 AM - 11:00 PM',
    specialDealsAr: 'تقسيط حتى 24 شهر بدون فوائد على الثلاجات والغسالات',
    specialDealsEn: '0% interest installment up to 24 months on fridges & washers',
    position: { lat: 30.0561, lng: 31.3412 },
  },
  {
    id: 'loc-2',
    nameAr: 'العربي سنتر - مصر الجديدة',
    nameEn: 'Elaraby Center - Heliopolis',
    category: 'appliances',
    brand: 'Elaraby',
    addressAr: 'ميدان روكسي، مصر الجديدة، القاهرة',
    addressEn: 'Roxy Square, Heliopolis, Cairo',
    phone: '19319',
    rating: 4.8,
    openHours: '09:30 AM - 10:30 PM',
    specialDealsAr: 'ضمان العربي الشامل 10 سنوات على ثلاجات ومكانس توشيبا وشارب وتورنيدو',
    specialDealsEn: '10-year official Elaraby warranty on Sharp & Tornado appliances',
    position: { lat: 30.0934, lng: 31.3182 },
  },
  {
    id: 'loc-3',
    nameAr: 'ايكيا القاهرة - كايرو فيستيفال سيتي',
    nameEn: 'IKEA Cairo - Festival City Mall',
    category: 'furniture',
    brand: 'IKEA',
    addressAr: 'الطريق الدائري، التجمع الخامس، القاهرة الجديدة',
    addressEn: 'Ring Road, 5th Settlement, New Cairo',
    phone: '16576',
    rating: 4.8,
    openHours: '10:00 AM - 11:00 PM',
    specialDealsAr: 'تشكيلة كاملة للأثاث، المطابخ، وحدات التخزين، والإضاءة الحديثة',
    specialDealsEn: 'Complete furniture, modular kitchens, storage units & lighting',
    position: { lat: 30.0286, lng: 31.4081 },
  },
  {
    id: 'loc-4',
    nameAr: 'كارفور سيتي سنتر ألماظة',
    nameEn: 'Carrefour - City Centre Almaza',
    category: 'shopping',
    brand: 'Carrefour',
    addressAr: 'طريق السويس، مصر الجديدة، القاهرة',
    addressEn: 'Suez Road, Almaza, Cairo',
    phone: '16061',
    rating: 4.7,
    openHours: '09:00 AM - 12:00 AM',
    specialDealsAr: 'خصم 10% نقاط كاش باك على الخلاطات والقلايات ومستلزمات المنزل',
    specialDealsEn: '10% MyClub cashback points on home supplies, blenders & air fryers',
    position: { lat: 30.0886, lng: 31.3654 },
  },
  {
    id: 'loc-5',
    nameAr: 'معرض السلاب للسيراميك والتشطيبات - مدينة نصر',
    nameEn: 'El Sallab Ceramics & Finishing - Nasr City',
    category: 'finishing',
    brand: 'El Sallab',
    addressAr: 'شارع مصطفى النحاس، مدينة نصر، القاهرة',
    addressEn: 'Mostafa El Nahas St, Nasr City, Cairo',
    phone: '19294',
    rating: 4.6,
    openHours: '10:00 AM - 10:30 PM',
    specialDealsAr: 'أطقم حمامات، خلاطات، سيراميك، وبورسلين بخصومات المشاريع',
    specialDealsEn: 'Sanitary ware, mixers, ceramics & porcelain project discounts',
    position: { lat: 30.0532, lng: 31.3545 },
  },
  {
    id: 'loc-6',
    nameAr: 'إل جي براند شوب - المهندسين',
    nameEn: 'LG Brand Shop - Mohandessin',
    category: 'appliances',
    brand: 'LG',
    addressAr: 'شارع جامعة الدول العربية، المهندسين، الجيزة',
    addressEn: 'Gamat El Dowal Al Arabiya St, Mohandessin, Giza',
    phone: '19960',
    rating: 4.9,
    openHours: '10:00 AM - 11:00 PM',
    specialDealsAr: 'ضمان 10 سنوات على موتور Direct Drive للغسالات والشاشات الذكية',
    specialDealsEn: '10-year direct drive motor warranty on washers & OLED TVs',
    position: { lat: 30.0524, lng: 31.2001 },
  },
];

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
    storeLocation: 'بي تك - فرع عباس العقاد، مدينة نصر',
    storeName: 'بي تك - فرع عباس العقاد، مدينة نصر',
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
    storeLocation: 'إل جي براند شوب - المهندسين',
    storeName: 'إل جي براند شوب - المهندسين',
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
    notes: 'شواية داخلية وسعة مناسبة',
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
    storeLocation: 'كارفور سيتي سنتر ألماظة',
    storeName: 'كارفور سيتي سنتر ألماظة',
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
    notes: 'شفرات ستانلس ستيل',
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
    notes: 'شفط قوي وفلتر HEPA',
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
    notes: 'متينة وقابلة للطي',
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
    notes: 'سطح غير لاصق',
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

const INITIAL_NOTIFICATIONS: AppNotification[] = [
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
    message: 'تم تحديث حالة الخلاط إلى "تم الشراء"',
    messageEn: 'Blender status updated to Purchased',
    type: 'update',
    read: true,
    timestamp: '2026-11-03 16:00',
  },
];

const INITIAL_AI_CHATS: ChatMessage[] = [
  {
    id: 'm_welcome',
    sender: 'Gemini AI',
    senderRole: 'Gemini 3.8 Flash',
    text: 'أهلاً بك في محادثة Gemini الذكية! يمكنك سؤالي عن أي جهاز، مقارنة الماركات والأسعار، تخطيط الميزانية، أو أي استفسار عام.',
    timestamp: '10:00',
    avatar: '✨',
    isAi: true,
  },
];

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

  // Per-User Isolated Workspace Signals
  projects = signal<ProjectFolder[]>(INITIAL_PROJECTS);
  items = signal<ChecklistItem[]>(INITIAL_ITEMS);
  categories = signal<string[]>(DEFAULT_CATEGORIES);
  notifications = signal<AppNotification[]>(INITIAL_NOTIFICATIONS);
  chatMessages = signal<ChatMessage[]>(INITIAL_AI_CHATS);
  mapLocations = signal<MapLocation[]>(DEFAULT_MAP_LOCATIONS);

  activeProjectId = signal<string>('home_appliances');
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

    const savedDark = localStorage.getItem('checkmate_dark');
    if (savedDark === 'true') {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode.set(false);
      document.documentElement.classList.remove('dark');
    }

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

  private isSeededDemoAccount(userId: string): boolean {
    return userId === 'u1' || userId === 'u2' || userId === 'u3';
  }

  private initUserWorkspaceEffect() {
    if (typeof window === 'undefined') return;

    effect(() => {
      const user = this.auth.currentUser();
      if (!user || !user.id) return;

      if (this.activeLoadedUserId !== user.id) {
        if (this.activeLoadedUserId) {
          this.flushPendingSync(this.activeLoadedUserId);
        }
        this.activeLoadedUserId = user.id;
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
    this.saveToLocalCacheOnly(userId);
    this.auth.updateUserUiOptions(userId, empty.uiOptions);
    void this.firebase.saveUserWorkspace(userId, empty, true);
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
    }

    if (applied) {
      this.saveToLocalCacheOnly(userId);
    }
    return applied;
  }

  async loadUserWorkspace(userId: string) {
    if (typeof window === 'undefined' || !userId) return;

    // 1. Unsubscribe previous user listener
    if (this.unsubscribeUserWorkspace) {
      this.unsubscribeUserWorkspace();
      this.unsubscribeUserWorkspace = null;
    }

    // 2. Check if user profile in AuthService already carries workspace / uiOptions (e.g. newly created user)
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
      if (this.isSeededDemoAccount(userId)) {
        const userProjects = INITIAL_PROJECTS.map(p => ({ ...p, ownerId: userId }));
        const userItems = INITIAL_ITEMS.map(it => ({ ...it, ownerId: userId }));
        this.projects.set(userProjects);
        this.items.set(userItems);
        this.categories.set([...DEFAULT_CATEGORIES]);
        this.notifications.set([...INITIAL_NOTIFICATIONS]);
        this.chatMessages.set([...INITIAL_AI_CHATS]);
        this.mapLocations.set([...DEFAULT_MAP_LOCATIONS]);
        this.applyUiOptions(
          {
            darkMode: this.isDarkMode(),
            language: this.i18n.currentLang(),
            activeProjectId: userProjects[0].id,
          },
          false
        );
        this.saveToLocalCacheOnly(userId);
      } else {
        // New user account: initialize completely empty workspace and Light Mode + Arabic + Active Project ""
        this.resetWorkspaceForNewUser(userId);
      }
    }

    // 3. Explicitly fetch latest user workspace & UI options from Firestore database upon Sign-In / Switch
    const cloudRecord = await this.firebase.fetchUserWorkspaceFromFirestore(userId);
    if (cloudRecord && this.activeLoadedUserId === userId) {
      const updated = this.applyWorkspaceSnapshot(userId, cloudRecord);
      if (updated) {
        this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        this.hasPendingSync.set(false);
      } else if (!this.isSeededDemoAccount(userId)) {
        // Ensure Firestore has the clean empty state if record had no workspace fields yet
        void this.firebase.saveUserWorkspace(userId, this.buildCurrentWorkspacePayload(), true);
      }
    }

    // 4. Subscribe to Firestore `users/{userId}` real-time updates
    this.unsubscribeUserWorkspace = this.firebase.listenToUserWorkspace(userId, (cloudData) => {
      if (this.activeLoadedUserId !== userId) return;
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

    // 3. Apply Active Project ID (supports "" when no project is active)
    if (normalized.activeProjectId === '') {
      this.activeProjectId.set('');
    } else if (this.projects().some(p => p.id === normalized.activeProjectId)) {
      this.activeProjectId.set(normalized.activeProjectId);
    } else {
      this.activeProjectId.set(this.projects()[0]?.id || '');
    }

    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const finalUiOptions = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, finalUiOptions);
      if (persistToDb) {
        this.saveToLocalCacheOnly(userId);
        void this.firebase.saveUiOptionsToFirestore(userId, finalUiOptions);
        this.persistUserWorkspace();
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
    return {
      projects: this.projects(),
      items: this.items(),
      categories: this.categories(),
      notifications: this.notifications(),
      uiOptions: this.getCurrentUiOptions(),
      aiChats: this.chatMessages(),
      mapLocations: this.mapLocations(),
      updatedAt: new Date().toISOString(),
    };
  }

  private saveToLocalCacheOnly(userId: string) {
    if (typeof window === 'undefined' || !window.localStorage || !userId) return;
    const payload = this.buildCurrentWorkspacePayload();
    localStorage.setItem(this.getUserCacheKey(userId), JSON.stringify(payload));
  }

  /**
   * Immediately flushes any pending workspace or UI Option changes to localStorage and Firestore
   * before signing out or switching accounts.
   */
  flushPendingSync(targetUserId?: string) {
    const userId = targetUserId || this.activeLoadedUserId || this.auth.currentUser()?.id;
    if (!userId) return;

    if (this.firestoreWriteTimer) {
      clearTimeout(this.firestoreWriteTimer);
      this.firestoreWriteTimer = null;
    }

    const uiOpts = this.getCurrentUiOptions();
    this.auth.updateUserUiOptions(userId, uiOpts);
    this.saveToLocalCacheOnly(userId);
    const payload = this.buildCurrentWorkspacePayload();
    void this.firebase.saveUserWorkspace(userId, payload, true);
    this.hasPendingSync.set(false);
    this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  /**
   * Saves immediately to localStorage and debounces Firestore write (400ms) to avoid rate limit spikes.
   */
  persistUserWorkspace() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const uiOpts = this.getCurrentUiOptions();
    this.auth.updateUserUiOptions(userId, uiOpts);
    this.saveToLocalCacheOnly(userId);

    if (this.firestoreWriteTimer) {
      clearTimeout(this.firestoreWriteTimer);
    }

    this.firestoreWriteTimer = setTimeout(() => {
      this.firestoreWriteTimer = null;
      const payload = this.buildCurrentWorkspacePayload();
      void this.firebase.saveUserWorkspace(userId, payload);
      this.hasPendingSync.set(false);
      this.lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 400);
  }

  toggleDarkMode() {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('checkmate_dark', String(next));
    }
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const uiOpts = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, uiOpts);
      void this.firebase.saveUiOptionsToFirestore(userId, uiOpts);
    }
    this.persistUserWorkspace();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const uiOpts = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, uiOpts);
      void this.firebase.saveUiOptionsToFirestore(userId, uiOpts);
    }
    this.persistUserWorkspace();
  }

  setLanguage(lang: Language) {
    this.i18n.setLanguage(lang);
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const uiOpts = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, uiOpts);
      void this.firebase.saveUiOptionsToFirestore(userId, uiOpts);
    }
    this.persistUserWorkspace();
  }

  selectProject(projectId: string) {
    this.activeProjectId.set(projectId || '');
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const uiOpts = this.getCurrentUiOptions();
      this.auth.updateUserUiOptions(userId, uiOpts);
      void this.firebase.saveUiOptionsToFirestore(userId, uiOpts);
    }
    this.persistUserWorkspace();
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

  addProject(project: Omit<ProjectFolder, 'id'>) {
    const newProject: ProjectFolder = {
      ...project,
      id: 'proj-' + Date.now(),
      ownerId: this.auth.currentUser().id,
    };
    const wasNoProject = !this.activeProjectId() || this.projects().length === 0;
    this.projects.update(prev => [...prev, newProject]);
    if (wasNoProject) {
      // Associate any items that were added while activeProjectId was "" with this new project
      this.items.update(prev =>
        prev.map(it => (!it.folderId ? { ...it, folderId: newProject.id } : it))
      );
    }
    this.selectProject(newProject.id);
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
  }

  deleteProject(id: string) {
    this.projects.update(prev => prev.filter(p => p.id !== id));
    this.items.update(prev => prev.filter(item => item.folderId !== id));
    const remaining = this.projects();
    this.selectProject(remaining[0]?.id || '');
    this.hasPendingSync.set(true);
    this.persistUserWorkspace();
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
