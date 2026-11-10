import { Injectable, signal, computed, effect } from '@angular/core';

export type Language = 'ar' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  projectTitle: string;
  allProjects: string;
  newProject: string;
  currentProject: string;
  selectProject: string;
  dashboard: string;
  checklist: string;
  calendar: string;
  analytics: string;
  teamChat: string;
  aiAdvisor: string;
  mapsTab: string;
  exportPdf: string;
  exportCsv: string;
  syncNow: string;
  synced: string;
  offline: string;
  syncing: string;
  pendingSync: string;
  cloudOnline: string;
  cloudOffline: string;
  cloudPending: string;
  totalItems: string;
  completed: string;
  inComparison: string;
  pending: string;
  delivered: string;
  budgetAllocated: string;
  budgetSpent: string;
  budgetRemaining: string;
  searchPlaceholder: string;
  filterCategory: string;
  filterStatus: string;
  filterPriority: string;
  allCategories: string;
  allStatuses: string;
  allPriorities: string;
  addItem: string;
  editItem: string;
  deleteItem: string;
  itemNo: string;
  category: string;
  itemTitle: string;
  itemTitleAr: string;
  itemTitleEn: string;
  specNotes: string;
  myNotes: string;
  status: string;
  priority: string;
  tags: string;
  tagsCommaSeparated: string;
  cost: string;
  actualCost: string;
  targetDate: string;
  storeLocationOptional: string;
  actions: string;
  statusPending: string;
  statusComparing: string;
  statusPurchased: string;
  statusDelivered: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;
  addToGoogleCalendar: string;
  attachments: string;
  addAttachment: string;
  comments: string;
  addComment: string;
  writeComment: string;
  send: string;
  askAi: string;
  askAiDesc: string;
  login: string;
  logout: string;
  signIn: string;
  signUp: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  sessionTimeout: string;
  sessionRemaining: string;
  sessionExpired: string;
  loginToContinue: string;
  quickDemoLogin: string;
  orEnterCredentials: string;
  invalidCredentials: string;
  accountNotFoundError: string;
  googleAccountNotFoundError: string;
  userAlreadyExists: string;
  registrationSuccess: string;
  selectRole: string;
  chooseAvatar: string;
  switchUser: string;
  mfaSecured: string;
  twoFactorAuth: string;
  roleAdmin: string;
  roleEditor: string;
  roleViewer: string;
  notifications: string;
  markAllRead: string;
  noNotifications: string;
  darkMode: string;
  lightMode: string;
  save: string;
  cancel: string;
  close: string;
  confirmDelete: string;
  backupData: string;
  restoreData: string;
  quickDemoUsers: string;
  allData: string;
  myPrivateData: string;
  publishedToAll: string;
  accountData: string;
  importGoogleSheets: string;
  clickToChangeStatus: string;
  privateBadge: string;
  publishedBadge: string;
  publishedToggleHint: string;
  brandAndStore: string;
  orderExcel: string;
  byPriority: string;
  byName: string;
  byCost: string;
  byStatus: string;
  allCount: string;
  itemsUnit: string;
  continueWithGoogle: string;
  continueWithFacebook: string;
  continueWithApple: string;
  orWithEmailPassword: string;
  signedOutBanner: string;
  enterEmail: string;
  enterPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  quickSelectHint: string;
  categoryPlaceholder: string;
  titleArPlaceholder: string;
  titleEnPlaceholder: string;
  specNotesPlaceholder: string;
  myNotesPlaceholder: string;
  tagsPlaceholder: string;
  storeLocationPlaceholder: string;
  currencyEgp: string;
}

const AR_TRANSLATIONS: Translations = {
  appName: 'تشيك ميت برو',
  appSubtitle: 'قائمة المشتريات وإدارة المهام الذكية',
  projectTitle: 'قائمة الأجهزة الكهربائية (استثمار العمر)',
  allProjects: 'المشاريع والمجلدات',
  newProject: 'مجلد مشروع جديد',
  currentProject: 'المشروع الحالي:',
  selectProject: 'اختر مشروعاً...',
  dashboard: 'لوحة المتابعة',
  checklist: 'قائمة الفحص',
  calendar: 'التقويم والمواعيد',
  analytics: 'التحليلات والميزانية',
  teamChat: 'محادثة Gemini الذكية',
  aiAdvisor: 'مستشار Gemini الذكي',
  mapsTab: 'الخرائط والمواقع (Google Maps)',
  exportPdf: 'تصدير PDF / طباعة',
  exportCsv: 'تصدير إكسل (CSV)',
  syncNow: 'مزامنة سحابية فورية',
  synced: 'متصل ومزامن سحابياً',
  offline: 'وضع غير متصل (أوفلاين)',
  syncing: 'جاري المزامنة...',
  pendingSync: 'تغييرات تنتظر المزامنة',
  cloudOnline: 'متصل',
  cloudOffline: 'غير متصل',
  cloudPending: 'قيد المزامنة',
  totalItems: 'إجمالي الأصناف',
  completed: 'تم الشراء',
  inComparison: 'قيد المقارنة',
  pending: 'لم يتم الشراء بعد',
  delivered: 'تم التوصيل والتركيب',
  budgetAllocated: 'الميزانية المخصصة',
  budgetSpent: 'المبلغ المصروف فعلياً',
  budgetRemaining: 'المتبقي من الميزانية',
  searchPlaceholder: 'بحث في الأصناف، الماركات، المتاجر، أو الملاحظات...',
  filterCategory: 'تصفية حسب المجموعة',
  filterStatus: 'تصفية حسب الحالة',
  filterPriority: 'تصفية حسب الأولوية',
  allCategories: 'جميع المجموعات',
  allStatuses: 'جميع الحالات',
  allPriorities: 'جميع الأولويات',
  addItem: 'إضافة صنف جديد',
  editItem: 'تعديل تفاصيل الصنف',
  deleteItem: 'حذف الصنف',
  itemNo: 'م',
  category: 'المجموعة / التصنيف',
  itemTitle: 'اسم الصنف',
  itemTitleAr: 'الاسم (بالعربية)',
  itemTitleEn: 'الاسم (بالإنجليزي - EN)',
  specNotes: 'المواصفات الموصى بها',
  myNotes: 'الملاحظات',
  status: 'تم الشراء؟',
  priority: 'الأولوية',
  tags: 'الوسوم',
  tagsCommaSeparated: 'الوسوم (مفصولة بفواصل)',
  cost: 'التكلفة التقديرية (ج.م)',
  actualCost: 'السعر الفعلي المدفوع (ج.م)',
  targetDate: 'تاريخ الشراء المستهدف',
  storeLocationOptional: 'موقع المتجر / المعرض (اختياري)',
  actions: 'إجراءات',
  statusPending: '⬜ لسه (Pending)',
  statusComparing: '⏳ قيد المقارنة (Comparing)',
  statusPurchased: '✅ تم الشراء (Purchased)',
  statusDelivered: '🚚 تم التوصيل (Delivered)',
  priorityLow: 'منخفضة',
  priorityMedium: 'متوسطة',
  priorityHigh: 'مرتفعة',
  priorityUrgent: 'عاجلة جداً',
  addToGoogleCalendar: 'إضافة لتقويم جوجل',
  attachments: 'المرفقات والمستندات',
  addAttachment: 'إرفاق فاتورة / مستند / صورة',
  comments: 'التعليقات والمناقشة',
  addComment: 'إضافة تعليق',
  writeComment: 'اكتب تعليقاً أو ملاحظة حول هذا الصنف...',
  send: 'إرسال',
  askAi: 'استشارة Gemini AI',
  askAiDesc: 'مقارنة أفضل الماركات، الضمان، وكفاءة الطاقة',
  login: 'تسجيل الدخول',
  logout: 'تسجيل الخروج',
  signIn: 'تسجيل الدخول',
  signUp: 'إنشاء حساب جديد',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  fullName: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  sessionTimeout: 'مدة الجلسة',
  sessionRemaining: 'متبقي من الجلسة',
  sessionExpired: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',
  loginToContinue: 'سجل الدخول للوصول إلى قائمة مشترياتك ومزامنتها سحابياً',
  quickDemoLogin: 'دخول سريع بحساب تجريبي',
  orEnterCredentials: 'أو أدخل بيانات حسابك',
  invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  accountNotFoundError: 'خطأ: هذا الحساب غير موجود في قاعدة البيانات! يرجى إنشاء حساب جديد (Sign Up) أولاً.',
  googleAccountNotFoundError: 'خطأ: لا يوجد حساب مسجل بهذا البريد في قاعدة البيانات! يرجى الانتقال إلى تبويب "إنشاء حساب جديد" أولاً.',
  userAlreadyExists: 'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً في قاعدة البيانات',
  registrationSuccess: 'تم إنشاء الحساب بنجاح وتم تسجيل دخولك',
  selectRole: 'تحديد الصلاحية',
  chooseAvatar: 'اختر صورة رمزية',
  switchUser: 'تبديل المستخدم',
  mfaSecured: 'مؤمن بالمصادقة الثنائية (2FA)',
  twoFactorAuth: 'المصادقة المتعددة (MFA)',
  roleAdmin: 'مدير النظام (Admin)',
  roleEditor: 'مشرف / محرر (Editor)',
  roleViewer: 'مشاهد (Viewer)',
  notifications: 'التنبيهات والإشعارات',
  markAllRead: 'تحديد الكل كمقروء',
  noNotifications: 'لا توجد إشعارات جديدة حالياً',
  darkMode: 'الوضع الليلي',
  lightMode: 'الوضع النهاري',
  save: 'حفظ التعديلات',
  cancel: 'إلغاء',
  close: 'إغلاق',
  confirmDelete: 'هل أنت متأكد من الحذف؟',
  backupData: 'نسخ احتياطي للبيانات',
  restoreData: 'استعادة نسخة احتياطية',
  quickDemoUsers: 'حسابات التجربة السريعة',
  allData: 'الكل',
  myPrivateData: 'بياناتي الخاصة',
  publishedToAll: 'المنشور للجميع',
  accountData: 'بيانات الحساب:',
  importGoogleSheets: 'استيراد Google Sheets',
  clickToChangeStatus: 'انقر لتغيير حالة الشراء',
  privateBadge: 'خاص',
  publishedBadge: 'منشور',
  publishedToggleHint: 'نشر في مساحة العمل المشتركة',
  brandAndStore: 'اكتب الماركة، المتجر، أو ملاحظاتك الخاصة...',
  orderExcel: 'ترتيب القائمة (م)',
  byPriority: 'الأولوية',
  byName: 'الاسم',
  byCost: 'السعر',
  byStatus: 'الحالة',
  allCount: 'صنف',
  itemsUnit: 'صنف',
  continueWithGoogle: 'المتابعة باستخدام Google',
  continueWithFacebook: 'المتابعة باستخدام Facebook',
  continueWithApple: 'المتابعة باستخدام Apple',
  orWithEmailPassword: 'أو يدويًا عبر البريد الإلكتروني وكلمة المرور',
  signedOutBanner: 'تم تسجيل الخروج. يرجى تسجيل الدخول أو إنشاء حساب للمتابعة.',
  enterEmail: 'أدخل البريد الإلكتروني',
  enterPassword: 'أدخل كلمة المرور',
  dontHaveAccount: 'ليس لديك حساب؟ إنشاء حساب جديد',
  alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
  quickSelectHint: 'انقر للاختيار السريع',
  categoryPlaceholder: 'مثال: الأجهزة الأساسية',
  titleArPlaceholder: 'مثال: الثلاجة',
  titleEnPlaceholder: 'مثال: Refrigerator',
  specNotesPlaceholder: 'مثال: نوفروست / انفرتر موفر للطاقة',
  myNotesPlaceholder: 'مثال: ماركة شارب - معرض بي تك',
  tagsPlaceholder: 'أساسي, مطبخ, موفر للطاقة',
  storeLocationPlaceholder: 'مثال: بي تك - مدينة نصر أو رابط الموقع',
  currencyEgp: 'ج.م',
};

const EN_TRANSLATIONS: Translations = {
  appName: 'CheckMate Pro',
  appSubtitle: 'Smart Checklist & Task Management',
  projectTitle: 'Home Appliances Checklist (Lifetime Investment)',
  allProjects: 'Projects & Folders',
  newProject: 'New Project Folder',
  currentProject: 'Current Project:',
  selectProject: 'Select a project...',
  dashboard: 'Dashboard',
  checklist: 'Checklist',
  calendar: 'Calendar & Schedule',
  analytics: 'Analytics & Budget',
  teamChat: 'Gemini Chat',
  aiAdvisor: 'Gemini AI Advisor',
  mapsTab: 'Maps & Saved Locations',
  exportPdf: 'Export PDF / Print',
  exportCsv: 'Export Excel (CSV)',
  syncNow: 'Sync with Cloud Now',
  synced: 'Online & Synced',
  offline: 'Offline Mode (Local Sync)',
  syncing: 'Syncing...',
  pendingSync: 'Changes pending sync',
  cloudOnline: 'Online',
  cloudOffline: 'Offline',
  cloudPending: 'Pending',
  totalItems: 'Total Items',
  completed: 'Purchased',
  inComparison: 'Under Review',
  pending: 'Pending Purchase',
  delivered: 'Delivered & Installed',
  budgetAllocated: 'Allocated Budget',
  budgetSpent: 'Actual Spent',
  budgetRemaining: 'Remaining Budget',
  searchPlaceholder: 'Search items, brands, stores, notes...',
  filterCategory: 'Filter by Category',
  filterStatus: 'Filter by Status',
  filterPriority: 'Filter by Priority',
  allCategories: 'All Categories',
  allStatuses: 'All Statuses',
  allPriorities: 'All Priorities',
  addItem: 'Add New Item',
  editItem: 'Edit Item Details',
  deleteItem: 'Delete Item',
  itemNo: 'No.',
  category: 'Category',
  itemTitle: 'Item Name',
  itemTitleAr: 'Name (in AR)',
  itemTitleEn: 'Name (in EN)',
  specNotes: 'Recommended Specs',
  myNotes: 'Notes',
  status: 'Purchased?',
  priority: 'Priority',
  tags: 'Tags',
  tagsCommaSeparated: 'Tags (comma-separated, مفصولة بفواصل)',
  cost: 'Estimated Cost (ج.م)',
  actualCost: 'Actual Price Paid (ج.م)',
  targetDate: 'Target Purchase Date',
  storeLocationOptional: 'Store Location (Optional)',
  actions: 'Actions',
  statusPending: '⬜ Pending',
  statusComparing: '⏳ Comparing',
  statusPurchased: '✅ Purchased',
  statusDelivered: '🚚 Delivered',
  priorityLow: 'Low',
  priorityMedium: 'Medium',
  priorityHigh: 'High',
  priorityUrgent: 'Urgent',
  addToGoogleCalendar: 'Add to Google Calendar',
  attachments: 'Attachments & Docs',
  addAttachment: 'Attach Invoice / Image / PDF',
  comments: 'Comments & Discussion',
  addComment: 'Add Comment',
  writeComment: 'Write a comment or discussion note...',
  send: 'Send',
  askAi: 'Consult Gemini AI',
  askAiDesc: 'Compare top brands, warranties, and energy efficiency',
  login: 'Sign In',
  logout: 'Sign Out',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  username: 'Username',
  password: 'Password',
  fullName: 'Full Name',
  email: 'Email Address',
  sessionTimeout: 'Session Timeout',
  sessionRemaining: 'Session Remaining',
  sessionExpired: 'Session expired, please sign in again',
  loginToContinue: 'Sign in to access your checklist and cloud sync',
  quickDemoLogin: 'Quick Demo Login',
  orEnterCredentials: 'Or enter your credentials',
  invalidCredentials: 'Invalid username/email or password',
  accountNotFoundError: 'Error: No account found in the database with these credentials! Please Sign Up first.',
  googleAccountNotFoundError: 'Error: No account found in the database for this Google email! Please switch to Sign Up to create an account first.',
  userAlreadyExists: 'An account with this username or email already exists in the database',
  registrationSuccess: 'Account created successfully and signed in',
  selectRole: 'Select Role',
  chooseAvatar: 'Choose Avatar',
  switchUser: 'Switch User',
  mfaSecured: 'Secured with 2FA MFA',
  twoFactorAuth: 'Multi-Factor Auth (MFA)',
  roleAdmin: 'Administrator',
  roleEditor: 'Moderator / Editor',
  roleViewer: 'Viewer (Read Only)',
  notifications: 'Notifications',
  markAllRead: 'Mark all as read',
  noNotifications: 'No notifications at this time',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  save: 'Save Changes',
  cancel: 'Cancel',
  close: 'Close',
  confirmDelete: 'Are you sure you want to delete this item?',
  backupData: 'Backup Data (JSON)',
  restoreData: 'Restore Backup',
  quickDemoUsers: 'Quick Demo Accounts',
  allData: 'All',
  myPrivateData: 'My Private Data',
  publishedToAll: 'Published to All',
  accountData: 'Account Data:',
  importGoogleSheets: 'Import Google Sheets',
  clickToChangeStatus: 'Click to change status',
  privateBadge: 'Private',
  publishedBadge: 'Published',
  publishedToggleHint: 'Publish to shared workspace',
  brandAndStore: 'Enter brand, store, or custom notes...',
  orderExcel: 'List Order (No.)',
  byPriority: 'Priority',
  byName: 'Name',
  byCost: 'Cost',
  byStatus: 'Status',
  allCount: 'items',
  itemsUnit: 'items',
  continueWithGoogle: 'Continue with Google',
  continueWithFacebook: 'Continue with Facebook',
  continueWithApple: 'Continue with Apple',
  orWithEmailPassword: 'Or manually with Email and Password',
  signedOutBanner: 'You are signed out. Please sign in or sign up to continue.',
  enterEmail: 'Enter your email address',
  enterPassword: 'Enter your password',
  dontHaveAccount: "Don't have an account? Sign Up",
  alreadyHaveAccount: 'Already have an account? Sign In',
  quickSelectHint: 'Click for quick select',
  categoryPlaceholder: 'e.g. Essential Appliances',
  titleArPlaceholder: 'e.g. الثلاجة',
  titleEnPlaceholder: 'e.g. Refrigerator',
  specNotesPlaceholder: 'e.g. No-Frost / Inverter Digital',
  myNotesPlaceholder: 'e.g. Brand X - Showroom Y',
  tagsPlaceholder: 'Essential, Kitchen, Energy A++',
  storeLocationPlaceholder: 'e.g. B.Tech Nasr City or Google Maps link',
  currencyEgp: 'ج.م',
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  currentLang = signal<Language>('ar');

  t = computed<Translations>(() => {
    return this.currentLang() === 'ar' ? AR_TRANSLATIONS : EN_TRANSLATIONS;
  });

  isRtl = computed(() => this.currentLang() === 'ar');

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('checkmate_lang') as Language;
      if (saved === 'ar' || saved === 'en') {
        this.currentLang.set(saved);
      }
    }

    effect(() => {
      const lang = this.currentLang();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('checkmate_lang', lang);
        }
      }
    });
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }

  toggleLanguage() {
    this.currentLang.set(this.currentLang() === 'ar' ? 'en' : 'ar');
  }
}
