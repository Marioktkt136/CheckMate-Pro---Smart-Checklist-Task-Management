import { Injectable, signal, computed, effect } from '@angular/core';

export type Language = 'ar' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  projectTitle: string;
  allProjects: string;
  newProject: string;
  dashboard: string;
  checklist: string;
  calendar: string;
  analytics: string;
  teamChat: string;
  aiAdvisor: string;
  exportPdf: string;
  exportCsv: string;
  syncNow: string;
  synced: string;
  offline: string;
  syncing: string;
  pendingSync: string;
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
  specNotes: string;
  myNotes: string;
  status: string;
  priority: string;
  tags: string;
  cost: string;
  actualCost: string;
  targetDate: string;
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
  confirmDelete: string;
  backupData: string;
  restoreData: string;
  quickDemoUsers: string;
}

const AR_TRANSLATIONS: Translations = {
  appName: 'تشيك ميت برو',
  appSubtitle: 'قائمة الأجهزة وإدارة المهام الذكية',
  projectTitle: 'قائمة الأجهزة الكهربائية (استثمار العمر)',
  allProjects: 'المشاريع والمجلدات',
  newProject: 'مجلد مشروع جديد',
  dashboard: 'لوحة المتابعة',
  checklist: 'قائمة الفحص',
  calendar: 'التقويم والمواعيد',
  analytics: 'التحليلات والميزانية',
  teamChat: 'محادثة الفريق والمستشار',
  aiAdvisor: 'المستشار الذكي للأجهزة',
  exportPdf: 'تصدير PDF / طباعة',
  exportCsv: 'تصدير إكسل (CSV)',
  syncNow: 'مزامنة سحابية فورية',
  synced: 'متصل ومزامن سحابياً',
  offline: 'وضع غير متصل (أوفلاين)',
  syncing: 'جاري المزامنة...',
  pendingSync: 'تغييرات تنتظر المزامنة',
  totalItems: 'إجمالي الأصناف',
  completed: 'تم الشراء',
  inComparison: 'قيد المقارنة',
  pending: 'لم يتم الشراء بعد',
  delivered: 'تم التوصيل والتركيب',
  budgetAllocated: 'الميزانية المخصصة',
  budgetSpent: 'المبلغ المصروف فعلياً',
  budgetRemaining: 'المتبقي من الميزانية',
  searchPlaceholder: 'بحث في الأصناف، الماركات، المعارض، أو الملاحظات...',
  filterCategory: 'تصفية حسب المجموعة',
  filterStatus: 'تصفية حسب الحالة',
  filterPriority: 'تصفية حسب الأولوية',
  allCategories: 'جميع المجموعات',
  allStatuses: 'جميع الحالات',
  allPriorities: 'جميع الأولويات',
  addItem: 'إضافة صنف جديد',
  editItem: 'تعديل الصنف',
  deleteItem: 'حذف الصنف',
  itemNo: 'م',
  category: 'المجموعة',
  itemTitle: 'الصنف / الجهاز',
  specNotes: 'المواصفات المطلوبة',
  myNotes: 'ملاحظاتي (ماركة X - معرض Y)',
  status: 'تم الشراء؟',
  priority: 'الأولوية',
  tags: 'الوسوم',
  cost: 'السعر المقدر',
  actualCost: 'السعر الفعلي المدفوع',
  targetDate: 'تاريخ الشراء المستهدف',
  actions: 'إجراءات',
  statusPending: '⬜ لسه',
  statusComparing: '⏳ قيد المقارنة',
  statusPurchased: '✅ تم الشراء',
  statusDelivered: '🚚 تم التوصيل',
  priorityLow: 'منخفضة',
  priorityMedium: 'متوسطة',
  priorityHigh: 'مرتفعة',
  priorityUrgent: 'عاجلة جداً',
  addToGoogleCalendar: 'إضافة لتقويم جوجل',
  attachments: 'المرفقات والمستندات',
  addAttachment: 'إرفاق فاتورة / مستند / صورة',
  comments: 'التعليقات والمناقشة',
  addComment: 'إضافة تعليق',
  writeComment: 'اكتب تعليقاً أو استفساراً للفريق...',
  send: 'إرسال',
  askAi: 'استشارة الذكاء الاصطناعي',
  askAiDesc: 'مقارنة أفضل الماركات، الضمان، وكفاءة الطاقة',
  login: 'تسجيل الدخول',
  logout: 'تسجيل الخروج',
  switchUser: 'تبديل المستخدم',
  mfaSecured: 'مؤمن بالمصادقة الثنائية (2FA)',
  twoFactorAuth: 'المصادقة المتعددة (MFA)',
  roleAdmin: 'مدير النظام (Admin)',
  roleEditor: 'محرر (Editor)',
  roleViewer: 'مشاهد (Viewer)',
  notifications: 'التنبيهات والإشعارات',
  markAllRead: 'تحديد الكل كمقروء',
  noNotifications: 'لا توجد إشعارات جديدة حالياً',
  darkMode: 'الوضع الليلي',
  lightMode: 'الوضع النهاري',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirmDelete: 'هل أنت متأكد من الحذف؟',
  backupData: 'نسخ احتياطي للبيانات',
  restoreData: 'استعادة نسخة احتياطية',
  quickDemoUsers: 'حسابات التجربة السريعة',
};

const EN_TRANSLATIONS: Translations = {
  appName: 'CheckMate Pro',
  appSubtitle: 'Smart Checklist & Task Management',
  projectTitle: 'Home Appliances Checklist (Lifetime Investment)',
  allProjects: 'Projects & Folders',
  newProject: 'New Project Folder',
  dashboard: 'Dashboard',
  checklist: 'Checklist',
  calendar: 'Calendar & Schedule',
  analytics: 'Analytics & Budget',
  teamChat: 'Team Chat & Advisor',
  aiAdvisor: 'AI Appliance Consultant',
  exportPdf: 'Export PDF / Print',
  exportCsv: 'Export Excel (CSV)',
  syncNow: 'Sync with Cloud Now',
  synced: 'Online & Synced',
  offline: 'Offline Mode (Local Sync)',
  syncing: 'Syncing...',
  pendingSync: 'Changes pending sync',
  totalItems: 'Total Items',
  completed: 'Purchased',
  inComparison: 'Under Review',
  pending: 'Pending Purchase',
  delivered: 'Delivered & Installed',
  budgetAllocated: 'Allocated Budget',
  budgetSpent: 'Actual Spent',
  budgetRemaining: 'Remaining Budget',
  searchPlaceholder: 'Search appliances, brands, showrooms, notes...',
  filterCategory: 'Filter by Category',
  filterStatus: 'Filter by Status',
  filterPriority: 'Filter by Priority',
  allCategories: 'All Categories',
  allStatuses: 'All Statuses',
  allPriorities: 'All Priorities',
  addItem: 'Add New Item',
  editItem: 'Edit Item',
  deleteItem: 'Delete Item',
  itemNo: 'No.',
  category: 'Category',
  itemTitle: 'Item / Appliance',
  specNotes: 'Recommended Specs',
  myNotes: 'My Notes (Brand X - Store Y)',
  status: 'Purchased?',
  priority: 'Priority',
  tags: 'Tags',
  cost: 'Estimated Cost',
  actualCost: 'Actual Price Paid',
  targetDate: 'Target Purchase Date',
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
  writeComment: 'Write a note or mention someone...',
  send: 'Send',
  askAi: 'Consult AI',
  askAiDesc: 'Compare top brands, warranties, and energy efficiency',
  login: 'Sign In',
  logout: 'Sign Out',
  switchUser: 'Switch User',
  mfaSecured: 'Secured with 2FA MFA',
  twoFactorAuth: 'Multi-Factor Auth (MFA)',
  roleAdmin: 'Administrator',
  roleEditor: 'Editor',
  roleViewer: 'Viewer (Read Only)',
  notifications: 'Notifications',
  markAllRead: 'Mark all as read',
  noNotifications: 'No notifications at this time',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  save: 'Save Changes',
  cancel: 'Cancel',
  confirmDelete: 'Are you sure you want to delete this item?',
  backupData: 'Backup Data (JSON)',
  restoreData: 'Restore Backup',
  quickDemoUsers: 'Quick Demo Accounts',
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
    // Check saved language preference if in browser
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
