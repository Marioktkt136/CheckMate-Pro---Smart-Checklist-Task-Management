import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Parse JSON bodies for API calls
app.use(express.json({ limit: '10mb' }));

// In-memory cloud database for multi-device sync
const cloudDatabase = {
  projects: [
    {
      id: 'home_appliances',
      nameAr: 'قائمة الأجهزة الكهربائية (استثمار العمر)',
      nameEn: 'Home Appliances (Lifetime Investment)',
      icon: 'kitchen',
      color: '#3b82f6',
      budget: 180000,
      descriptionAr: 'الأجهزة الكهربائية لمنزل العمر مع الماركات والمواصفات والميزانية',
      descriptionEn: 'Essential appliances checklist for new home with specs and budget',
    },
    {
      id: 'furniture_decor',
      nameAr: 'الأثاث والديكور',
      nameEn: 'Furniture & Decor',
      icon: 'weekend',
      color: '#10b981',
      budget: 250000,
      descriptionAr: 'قائمة غرف النوم، الصالون، والمفروشات',
      descriptionEn: 'Living room, bedroom and furnishings checklist',
    },
    {
      id: 'kitchenware',
      nameAr: 'أدوات ومستلزمات المطبخ',
      nameEn: 'Kitchen Utensils & Cookware',
      icon: 'soup_kitchen',
      color: '#f59e0b',
      budget: 45000,
      descriptionAr: 'أطقم الحلل، أدوات التقطيع، والصواني',
      descriptionEn: 'Cookware sets, cutleries and kitchenware',
    }
  ],
  items: [
    {
      id: 'appliance-1',
      itemNumber: 1,
      folderId: 'home_appliances',
      category: 'الأجهزة الأساسية',
      titleAr: 'الثلاجة',
      titleEn: 'Refrigerator',
      notes: 'نوفروست',
      myNotes: 'شارب 450 لتر ديجيتال نوفروست - معرض بي تك',
      status: 'pending',
      priority: 'urgent',
      tags: ['أساسي', 'مطبخ', 'استهلاك كهرباء A'],
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
      updatedAt: '2026-11-06T14:30:00Z'
    },
    {
      id: 'appliance-2',
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
      updatedAt: '2026-11-04T10:15:00Z'
    },
    {
      id: 'appliance-3',
      itemNumber: 3,
      folderId: 'home_appliances',
      category: 'الأجهزة الأساسية',
      titleAr: 'البوتاجاز',
      titleEn: 'Cooker / Stove',
      notes: 'يفضل 5 شعلة أمان كامل',
      myNotes: 'فريش أو يونيون إير 90 سم أمان كامل إشعال ذاتي',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-4',
      itemNumber: 4,
      folderId: 'home_appliances',
      category: 'أجهزة المطبخ',
      titleAr: 'الميكروويف أو الفرن الكهربائي',
      titleEn: 'Microwave or Electric Oven',
      notes: '',
      myNotes: 'شارب 34 لتر بالشواية',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-5',
      itemNumber: 5,
      folderId: 'home_appliances',
      category: 'أجهزة المطبخ',
      titleAr: 'الخلاط',
      titleEn: 'Blender',
      notes: 'قوي',
      myNotes: 'مولينكس أو براون 1000 واط مع مطحنة توابل',
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
        { id: 'c2', userName: 'أحمد محمود', text: 'تم الشراء من كارفور مع ضمان سنتين', timestamp: '2026-11-03 16:00', avatar: '👨‍💼' }
      ],
      createdAt: '2026-11-01T08:00:00Z',
      updatedAt: '2026-11-03T16:00:00Z'
    },
    {
      id: 'appliance-6',
      itemNumber: 6,
      folderId: 'home_appliances',
      category: 'أجهزة المطبخ',
      titleAr: 'الكبة',
      titleEn: 'Food Chopper',
      notes: '',
      myNotes: 'كينوود أو تورنيدو وعاء زجاجي',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-7',
      itemNumber: 7,
      folderId: 'home_appliances',
      category: 'أجهزة المطبخ',
      titleAr: 'العجان',
      titleEn: 'Stand Mixer',
      notes: 'اختياري لمحبي المخبوزات',
      myNotes: 'كينوود شيف 1200 واط - مؤجل للشهر القادم',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-8',
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
      updatedAt: '2026-11-05T09:00:00Z'
    },
    {
      id: 'appliance-9',
      itemNumber: 9,
      folderId: 'home_appliances',
      category: 'أجهزة التنظيف والكي',
      titleAr: 'المكواة',
      titleEn: 'Steam Iron',
      notes: 'البخار أفضل',
      myNotes: 'تيفال أو فيليبس سيراميك مضاد للتكلس',
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
      updatedAt: '2026-11-04T12:00:00Z'
    },
    {
      id: 'appliance-10',
      itemNumber: 10,
      folderId: 'home_appliances',
      category: 'أجهزة التنظيف والكي',
      titleAr: 'طاولة المكواة',
      titleEn: 'Ironing Board',
      notes: '',
      myNotes: 'طاولة معدنية قابلة لتعديل الارتفاع مع حامل للمكواة',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-11',
      itemNumber: 11,
      folderId: 'home_appliances',
      category: 'الرفاهية المطبخية',
      titleAr: 'الشواية الكهربائية',
      titleEn: 'Electric Grill',
      notes: '',
      myNotes: 'جريل تيفال غير لاصق تسخين سريع',
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
      updatedAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'appliance-12',
      itemNumber: 12,
      folderId: 'home_appliances',
      category: 'الرفاهية المطبخية',
      titleAr: 'القلاية الهوائية',
      titleEn: 'Air Fryer',
      notes: 'اختياري',
      myNotes: 'فيليبس XXL سعة 7.2 لتر أصلية',
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
      updatedAt: '2026-11-05T18:00:00Z'
    }
  ],
  messages: [
    {
      id: 'm1',
      sender: 'أحمد محمود',
      senderRole: 'admin',
      text: 'مرحباً بالفريق! بدأت مراجعة أسعار الأجهزة الأساسية وإضافة ملاحظات المعارض.',
      timestamp: '2026-11-06 10:00',
      avatar: '👨‍💼',
    },
    {
      id: 'm2',
      sender: 'سارة علي',
      senderRole: 'editor',
      text: 'ممتاز، قمت بمقارنة غسالات إل جي وتورنيدو وسجلت الفرق في الخانات.',
      timestamp: '2026-11-06 11:20',
      avatar: '👩‍💼',
    }
  ],
  notifications: [
    {
      id: 'n1',
      title: 'موعد شراء الثلاجة يقترب',
      titleEn: 'Refrigerator purchase date approaching',
      message: 'متبقي 12 يوماً على الموعد المستهدف المحدد لشراء الثلاجة',
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
    }
  ],
  lastSync: new Date().toISOString()
};

// 1. Get Cloud State
app.get('/api/sync', (req, res) => {
  res.json({
    success: true,
    data: cloudDatabase,
    serverTime: new Date().toISOString(),
  });
});

// 2. Push Sync Updates
app.post('/api/sync', (req, res) => {
  const { items, projects, messages, notifications } = req.body;
  if (items && Array.isArray(items)) {
    cloudDatabase.items = items;
  }
  if (projects && Array.isArray(projects)) {
    cloudDatabase.projects = projects;
  }
  if (messages && Array.isArray(messages)) {
    cloudDatabase.messages = messages;
  }
  if (notifications && Array.isArray(notifications)) {
    cloudDatabase.notifications = notifications;
  }
  cloudDatabase.lastSync = new Date().toISOString();

  res.json({
    success: true,
    lastSync: cloudDatabase.lastSync,
    itemCount: cloudDatabase.items.length,
  });
});

// 3. Post Chat Message
app.post('/api/chat', (req, res): void => {
  const { sender, senderRole, text, avatar } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }
  const newMessage = {
    id: 'msg_' + Date.now(),
    sender: sender || 'User',
    senderRole: senderRole || 'editor',
    text,
    avatar: avatar || '👤',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  cloudDatabase.messages.push(newMessage);
  res.json({ success: true, message: newMessage });
});

// 4. Send Notification
app.post('/api/notifications', (req, res): void => {
  const { title, titleEn, message, messageEn, type } = req.body;
  const newNotification = {
    id: 'notif_' + Date.now(),
    title: title || 'إشعار جديد',
    titleEn: titleEn || 'New Notification',
    message: message || '',
    messageEn: messageEn || '',
    type: type || 'info',
    read: false,
    timestamp: new Date().toISOString(),
  };
  cloudDatabase.notifications.unshift(newNotification);
  res.json({ success: true, notification: newNotification });
});

// 5. Smart Gemini Chat & Buying Advisor Endpoint (Latest Free Gemini 3.8 Flash)
const aiResponseCache = new Map<string, { text: string; expiresAt: number }>();

interface AdvisorItemInput {
  id?: string;
  titleAr?: string;
  titleEn?: string;
  category?: string;
  status?: string;
  priority?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  myNotes?: string;
  targetDate?: string;
  storeLocation?: string;
  tags?: string[];
}

interface AdvisorProjectInput {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  budget?: number;
}

app.post('/api/ai-advisor', async (req, res): Promise<void> => {
  const {
    prompt,
    currentItem,
    allItems,
    project,
    categories,
    history,
    actionType,
    lang,
  } = req.body as {
    prompt?: string;
    currentItem?: AdvisorItemInput;
    allItems?: AdvisorItemInput[];
    project?: AdvisorProjectInput;
    categories?: string[];
    history?: { role?: string; text?: string }[];
    actionType?: string;
    lang?: string;
  };

  const apiKey = process.env['GEMINI_API_KEY'];
  const isAr = lang !== 'en';
  const itemsList: AdvisorItemInput[] = Array.isArray(allItems) ? allItems : [];

  // Compute real-time quantitative metrics from user's items & project
  const totalItems = itemsList.length;
  const completedItems = itemsList.filter(i => i.status === 'purchased' || i.status === 'delivered');
  const comparingItems = itemsList.filter(i => i.status === 'comparing');
  const pendingItems = itemsList.filter(i => !i.status || i.status === 'pending');
  const urgentPending = itemsList.filter(
    i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'purchased' && i.status !== 'delivered'
  );

  const totalEstimated = itemsList.reduce((acc, it) => acc + (Number(it.estimatedCost) || 0), 0);
  const totalActualSpent = itemsList.reduce((acc, it) => acc + (Number(it.actualCost) || 0), 0);
  const remainingEstimatedCost = itemsList
    .filter(i => i.status !== 'purchased' && i.status !== 'delivered')
    .reduce((acc, it) => acc + (Number(it.estimatedCost) || 0), 0);

  const allocatedBudget = Number(project?.budget) || 0;
  const budgetRemaining = allocatedBudget > 0 ? allocatedBudget - totalActualSpent : 0;
  const completionRate = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0;

  // Group by category
  const categoryMap = new Map<string, { count: number; done: number; est: number; spent: number }>();
  for (const it of itemsList) {
    const cat = it.category || (isAr ? 'عام' : 'General');
    const prev = categoryMap.get(cat) || { count: 0, done: 0, est: 0, spent: 0 };
    prev.count += 1;
    if (it.status === 'purchased' || it.status === 'delivered') prev.done += 1;
    prev.est += Number(it.estimatedCost) || 0;
    prev.spent += Number(it.actualCost) || 0;
    categoryMap.set(cat, prev);
  }

  const projectName = isAr
    ? project?.nameAr || project?.nameEn || 'المشروع الحالي'
    : project?.nameEn || project?.nameAr || 'Current Project';

  const generateSmartAnalysisResponse = (
    type: string | undefined,
    item: AdvisorItemInput | undefined,
    userPrompt?: string
  ): string => {
    const q = (userPrompt || '').toLowerCase();

    // 1. Specific Item Consultation (Brand Comparison / Specs Review)
    if (item && (type === 'compare_brands' || type === 'specs_review')) {
      const itemTitle = isAr ? item.titleAr || item.titleEn || 'الصنف' : item.titleEn || item.titleAr || 'Item';
      const itemEst = Number(item.estimatedCost) || 0;
      const itemSpecs = item.notes || (isAr ? 'مواصفات قياسية عالية الكفاءة' : 'High-efficiency standard specs');
      const itemCustomNotes = item.myNotes ? `\n• **${isAr ? 'ملاحظاتك المسجلة' : 'Your Saved Notes'}:** ${item.myNotes}` : '';

      if (type === 'specs_review') {
        return isAr
          ? `### 🔍 التحليل الفني ومراجعة المواصفات لـ (${itemTitle}):\n` +
            `• **المواصفات الموصى بها:** ${itemSpecs}${itemCustomNotes}\n` +
            `• **التكلفة التقديرية المرصودة:** ${itemEst > 0 ? itemEst.toLocaleString() + ' ج.م' : 'غير محددة بعد'}\n\n` +
            `#### ✅ قائمة الفحص الفني قبل الشراء:\n` +
            `1. **كفاءة الطاقة والموتور:** تأكد من وجود ملصق كفاءة الطاقة (A++ أو أعلى) وموتور Inverter لتقليل استهلاك الكهرباء بنسبة تصل إلى 40%.\n` +
            `2. **شروط الضمان وخدمة ما بعد البيع:** احرص على ضمان رسمي شامل (5 إلى 10 سنوات) من الوكيل المعتمد مع توفر مراكز صيانة قريبة.\n` +
            `3. **الأبعاد والتهوية:** قس مساحة التركيب بدقة واترك مسافة تهوية (5–10 سم) حول الجهاز لضمان أفضل أداء وعمر افتراضي أطول.`
          : `### 🔍 Technical Specification & Warranty Audit for (${itemTitle}):\n` +
            `• **Recommended Specs:** ${itemSpecs}${itemCustomNotes}\n` +
            `• **Estimated Budget:** ${itemEst > 0 ? itemEst.toLocaleString() + ' EGP' : 'Not set yet'}\n\n` +
            `#### ✅ Pre-Purchase Inspection Checklist:\n` +
            `1. **Inverter & Energy Grade:** Verify Grade A++ energy efficiency and Digital Inverter technology for up to 40% power savings and quiet operation.\n` +
            `2. **Official Warranty:** Confirm a 5–10 year official distributor warranty and accessible local service centers.\n` +
            `3. **Dimensions & Clearance:** Measure doorway and installation clearance (5–10 cm ventilation gap) before ordering.`;
      }

      return isAr
        ? `### 🏆 مقارنة الماركات والأسعار لـ (${itemTitle}):\n` +
          `• **التصنيف:** ${item.category || 'أساسي'} | **المواصفات المطلوبة:** ${itemSpecs}\n` +
          `• **الميزانية التقديرية:** ${itemEst > 0 ? itemEst.toLocaleString() + ' ج.م' : 'حسب الفئة المختارة'}${itemCustomNotes}\n\n` +
          `#### 📊 مصفوفة مقارنة الفئات في السوق:\n` +
          `1. **الفئة العليا (LG / Bosch / Sharp):**\n` +
          `   - **المميزات:** موتور انفرتر ديجيتال هادئ، كفاءة طاقة A+++، ضمان 10 سنوات، أعلى عمر افتراضي.\n` +
          `   - **التقييم:** خيار مثالي للاستثمار طويل الأجل.\n` +
          `2. **فئة القيمة مقابل السعر (Tornado / Beko / Fresh):**\n` +
          `   - **المميزات:** سعر اقتصادي متوازن، قطع غيار متوفرة بكثرة، ضمان شامل 5–10 سنوات.\n` +
          `   - **التقييم:** ممتاز لتحقيق توازن الميزانية دون التضحية بالجودة.\n\n` +
          `💡 **توصية الشراء الذكية:** قارن السعر النقدي (الكاش) بعروض التقسيط بدون فوائد في المعارض المعتمدة، وتأكد من استلام فاتورة ضريبية مختومة لتفعيل الضمان.`
        : `### 🏆 Brand & Price Comparison Matrix for (${itemTitle}):\n` +
          `• **Category:** ${item.category || 'Essential'} | **Target Specs:** ${itemSpecs}\n` +
          `• **Estimated Cost:** ${itemEst > 0 ? itemEst.toLocaleString() + ' EGP' : 'Flexible'}${itemCustomNotes}\n\n` +
          `#### 📊 Market Tier Comparison:\n` +
          `1. **Premium Tier (LG / Bosch / Sharp):**\n` +
          `   - **Highlights:** Digital Inverter motor, A+++ energy efficiency, 10-year warranty, maximum durability.\n` +
          `2. **Best Value Tier (Tornado / Beko / Fresh):**\n` +
          `   - **Highlights:** Competitive pricing, widespread local service centers, 5–10 year official warranty.\n\n` +
          `💡 **Smart Buying Tip:** Compare cash discounts vs. 0% installment offers at authorized showrooms, and register your serial number upon delivery.`;
    }

    // 2. Empty Checklist / New Account Guidance
    if (totalItems === 0) {
      return isAr
        ? `### ✨ أهلاً بك في مستشار ومحلل Gemini الذكي!\n` +
          `حسابك الآن جاهز ونظيف تماماً (لا توجد مشاريع أو أصناف مسجلة بعد).\n\n` +
          `#### 🚀 كيف تبدأ تخطيط مشروعك بذكاء؟\n` +
          `1. **إنشاء مجلد مشروع:** اضغط على زر **"مجلد مشروع جديد"** من الشريط العلوي وحدد اسم المشروع والميزانية الإجمالية (بالجنيه المصري).\n` +
          `2. **إضافة الأصناف والمواصفات:** أضف الأصناف مع تحديد الأولوية (عاجلة / مرتفعة / متوسطة / منخفضة) والتكلفة التقديرية.\n` +
          `3. **التحليل الفوري:** بمجرد إضافة أصنافك، اطلب مني **"تحليل شامل للقائمة والميزانية"** وسأقدم لك خطة أولويات مفصلة وتوصيات التوفير!\n\n` +
          `💬 *يمكنك أيضاً سؤالي الآن عن أسعار أو مواصفات أي جهاز كهربائي أو منزلي (مثل: مقارنة الثلاجات، الغسالات، البوتاجازات، أو القلايات الهوائية).*`
        : `### ✨ Welcome to Gemini Smart Advisor & Analyst!\n` +
          `Your account workspace is currently empty (0 projects and 0 items).\n\n` +
          `#### 🚀 How to Start Planning Smartly:\n` +
          `1. **Create a Project Folder:** Click **"New Project Folder"** in the top bar and set your target budget in EGP.\n` +
          `2. **Add Checklist Items:** Add items with their priority (Urgent / High / Medium / Low) and estimated cost.\n` +
          `3. **Run Instant AI Analysis:** Once items are added, click **"Full Checklist & Budget Analysis"** for a complete financial & priority breakdown!\n\n` +
          `💬 *You can also ask me right now about any appliance specs, brand comparisons, or budget strategies.*`;
    }

    // 3. Priority Action Plan (`priority_plan` or query about priorities/urgent)
    if (type === 'priority_plan' || q.includes('أولوي') || q.includes('عاجل') || q.includes('priorit') || q.includes('urgent')) {
      const urgentLines = urgentPending
        .slice(0, 8)
        .map((it, idx) => {
          const name = isAr ? it.titleAr || it.titleEn : it.titleEn || it.titleAr;
          const prLabel = it.priority === 'urgent' ? (isAr ? '🔴 عاجل جداً' : '🔴 Urgent') : (isAr ? '🟠 مرتفع' : '🟠 High');
          const costStr = (Number(it.estimatedCost) || 0).toLocaleString();
          const dateStr = it.targetDate ? ` | 📅 ${it.targetDate}` : '';
          return `${idx + 1}. **${name}** (${prLabel}) — ${costStr} ج.م${dateStr}`;
        })
        .join('\n');

      const urgentTotalCost = urgentPending.reduce((acc, it) => acc + (Number(it.estimatedCost) || 0), 0);

      return isAr
        ? `### 🎯 خطة الأولويات العاجلة وجدول الشراء (${projectName}):\n` +
          `• **إجمالي الأصناف المتبقية ذات الأولوية العاجلة/المرتفعة:** ${urgentPending.length} من أصل ${totalItems - completedItems.length} صنف غير مشترى.\n` +
          `• **التمويل المطلوب للأولويات القصوى:** **${urgentTotalCost.toLocaleString()} ج.م**\n\n` +
          `#### 📋 قائمة الأصناف التي يجب البدء بها فوراً:\n` +
          `${urgentLines || '✅ تم إنجاز جميع الأصناف العاجلة والمرتفعة!'}\n\n` +
          `#### 💡 استراتيجية التنفيذ المقترحة:\n` +
          `• **المرحلة الأولى (هذا الشهر):** التركيز حصرياً على الأصناف العاجلة (🔴) لتجنب تقلبات الأسعار.\n` +
          `• **المرحلة الثانية:** حسم الأصناف التي في حالة **"قيد المقارنة"** (${comparingItems.length} صنف) واختيار أفضل عرض سعري.\n` +
          `• **المرحلة الثالثة:** تأجيل الأصناف الاختيارية أو منخفضة الأولوية لحين استقرار الميزانية المتبقية.`
        : `### 🎯 Urgent Priorities & Action Plan (${projectName}):\n` +
          `• **Remaining Urgent/High-Priority Items:** ${urgentPending.length} out of ${totalItems - completedItems.length} unpurchased items.\n` +
          `• **Required Funding for Top Priorities:** **${urgentTotalCost.toLocaleString()} EGP**\n\n` +
          `#### 📋 Immediate Action Queue:\n` +
          `${urgentLines || '✅ All urgent and high-priority items are completed!'}\n\n` +
          `#### 💡 Recommended Execution Strategy:\n` +
          `• **Phase 1 (Immediate):** Lock in prices for Urgent (🔴) essentials first.\n` +
          `• **Phase 2:** Finalize the **${comparingItems.length} items** currently in "Comparing" status.\n` +
          `• **Phase 3:** Defer Low-priority / luxury items until core essentials are delivered.`;
    }

    // 4. Budget & Savings Strategy (`budget_tips` or query about budget/saving/تقسيم الميزانية)
    if (type === 'budget_tips' || q.includes('ميزاني') || q.includes('توفير') || q.includes('budget') || q.includes('sav')) {
      const catBreakdownLines = Array.from(categoryMap.entries())
        .map(([cat, info]) =>
          isAr
            ? `• **${cat}:** ${info.count} أصناف (مكتمل ${info.done}) — تقديري: ${info.est.toLocaleString()} ج.م | مدفوع: ${info.spent.toLocaleString()} ج.م`
            : `• **${cat}:** ${info.count} items (${info.done} done) — Est: ${info.est.toLocaleString()} EGP | Paid: ${info.spent.toLocaleString()} EGP`
        )
        .join('\n');

      const budgetStatusMsg =
        allocatedBudget > 0
          ? isAr
            ? `• **الميزانية المخصصة للمشروع:** ${allocatedBudget.toLocaleString()} ج.م\n` +
              `• **المصروف الفعلي حتى الآن:** ${totalActualSpent.toLocaleString()} ج.م\n` +
              `• **الرصيد المتبقي من الميزانية:** ${budgetRemaining.toLocaleString()} ج.م\n` +
              `• **التكلفة التقديرية للأصناف المتبقية:** ${remainingEstimatedCost.toLocaleString()} ج.م ` +
              (remainingEstimatedCost <= budgetRemaining
                ? '(✅ ضمن حدود الميزانية المتاحة)'
                : `(⚠️ يتجاوز المتبقي بـ ${(remainingEstimatedCost - budgetRemaining).toLocaleString()} ج.م)`)
            : `• **Allocated Project Budget:** ${allocatedBudget.toLocaleString()} EGP\n` +
              `• **Actual Spent So Far:** ${totalActualSpent.toLocaleString()} EGP\n` +
              `• **Remaining Budget Balance:** ${budgetRemaining.toLocaleString()} EGP\n` +
              `• **Estimated Cost of Remaining Items:** ${remainingEstimatedCost.toLocaleString()} EGP ` +
              (remainingEstimatedCost <= budgetRemaining
                ? '(✅ Within remaining budget)'
                : `(⚠️ Exceeds remaining budget by ${(remainingEstimatedCost - budgetRemaining).toLocaleString()} EGP)`)
          : isAr
            ? `• **إجمالي التكلفة التقديرية للقائمة:** ${totalEstimated.toLocaleString()} ج.م | **المدفوع فعلياً:** ${totalActualSpent.toLocaleString()} ج.م`
            : `• **Total Estimated Cost:** ${totalEstimated.toLocaleString()} EGP | **Actual Paid:** ${totalActualSpent.toLocaleString()} EGP`;

      return isAr
        ? `### 💰 التحليل المالي وخطة توفير الميزانية (${projectName}):\n` +
          `${budgetStatusMsg}\n\n` +
          `#### 📊 توزيع التكاليف حسب المجموعات:\n` +
          `${catBreakdownLines}\n\n` +
          `#### 💡 4 توصيات ذكية لتوفير 10%–15% من التكلفة المتبقية:\n` +
          `1. **خصم الفاتورة المجمعة (Bundle Deal):** جمع الأصناف المتبقية (${totalItems - completedItems.length} صنف) من موزع معتمد واحد يمنحك خصم كاش فوري أو نقاط استرداد (Cashback).\n` +
          `2. **موازنة الفئات:** اختر الماركات الأعلى للأجهزة التي تعمل 24 ساعة (مثل الثلاجة والغسالة)، واعتمد ماركات اقتصادية موثوقة للأجهزة المساعدة.\n` +
          `3. **مراقبة السعر الفعلي مقابل التقديري:** سجل السعر الفعلي المدفوع فور الشراء لمراقبة أي وفر وتحويله للأصناف التالية.\n` +
          `4. **استغلال عروض المواسم:** الشراء في عروض نهاية الشهر ومواسم التخفيضات يوفر شحناً وتركيبًا مجانياً.`
        : `### 💰 Financial Audit & Smart Budget Strategy (${projectName}):\n` +
          `${budgetStatusMsg}\n\n` +
          `#### 📊 Spend Distribution by Category:\n` +
          `${catBreakdownLines}\n\n` +
          `#### 💡 4 Actionable Ways to Save 10%–15% on Remaining Items:\n` +
          `1. **Showroom Bundle Discount:** Grouping your remaining ${totalItems - completedItems.length} items at one authorized dealer unlocks 5–10% cash or loyalty discounts.\n` +
          `2. **Tier Balancing:** Invest in premium Inverter models for 24/7 appliances (Fridge, Washer) and choose value-tier brands for secondary kitchen tools.\n` +
          `3. **Track Actual vs. Estimated Variance:** Log actual paid prices immediately to reallocate savings.\n` +
          `4. **Free Delivery & Installation:** Negotiate free delivery and official installation when purchasing 2+ major items.`;
    }

    // 5. Full Comprehensive Checklist & Project Analysis (Default / `full_analysis`)
    const topCostItems = [...itemsList]
      .sort((a, b) => (Number(b.estimatedCost) || 0) - (Number(a.estimatedCost) || 0))
      .slice(0, 4)
      .map(it => `${isAr ? it.titleAr || it.titleEn : it.titleEn || it.titleAr} (${(Number(it.estimatedCost) || 0).toLocaleString()} ج.م)`)
      .join('، ');

    const catSummary = Array.from(categoryMap.entries())
      .map(([cat, info]) =>
        isAr
          ? `• **${cat}:** إنجاز ${info.done}/${info.count} — إجمالي تقديري ${info.est.toLocaleString()} ج.م`
          : `• **${cat}:** ${info.done}/${info.count} completed — Est. ${info.est.toLocaleString()} EGP`
      )
      .join('\n');

    return isAr
      ? `### 📊 التقرير التحليلي الشامل للمشروع (${projectName}):\n` +
        `${userPrompt ? `> **رداً على سؤالك:** *"${userPrompt.slice(0, 90)}"*\n\n` : ''}` +
        `#### 1️⃣ ملخص الإنجاز والوضع المالي:\n` +
        `• **نسبة الإنجاز الكلية:** **${completionRate}%** (تم شراء/توصيل **${completedItems.length}** من أصل **${totalItems}** صنف)\n` +
        `• **الأصناف قيد المقارنة:** **${comparingItems.length}** صنف | **قيد الانتظار:** **${pendingItems.length}** صنف\n` +
        `• **الميزانية المخصصة:** **${allocatedBudget.toLocaleString()} ج.م** | **التكلفة التقديرية الكلية:** **${totalEstimated.toLocaleString()} ج.م**\n` +
        `• **المدفوع الفعلي:** **${totalActualSpent.toLocaleString()} ج.م** | **المطلوب للأصناف المتبقية:** **${remainingEstimatedCost.toLocaleString()} ج.م**\n\n` +
        `#### 2️⃣ تحليل المجموعات والتصنيفات:\n` +
        `${catSummary}\n\n` +
        `#### 3️⃣ أبرز الأصناف من حيث التكلفة والأولوية:\n` +
        `• **الأعلى تكلفة في القائمة:** ${topCostItems || 'لا يوجد'}\n` +
        `• **أصناف عاجلة/مرتفعة تنتظر الشراء:** **${urgentPending.length}** صنف\n\n` +
        `#### 💡 التوصية الذكية للخطوة القادمة:\n` +
        `ابدأ بحسم الأصناف الموجودة في حالة **"قيد المقارنة"** (${comparingItems.length}) والأصناف **العاجلة** (${urgentPending.length})، وتأكد من مقارنة كفاءة الطاقة (Inverter A++) وفترة الضمان الشامل قبل الدفع.`
      : `### 📊 Comprehensive Project & Checklist Analysis (${projectName}):\n` +
        `${userPrompt ? `> **Regarding your query:** *"${userPrompt.slice(0, 90)}"*\n\n` : ''}` +
        `#### 1️⃣ Progress & Financial Health:\n` +
        `• **Overall Completion:** **${completionRate}%** (**${completedItems.length}** of **${totalItems}** items purchased/delivered)\n` +
        `• **In Comparison:** **${comparingItems.length}** items | **Pending:** **${pendingItems.length}** items\n` +
        `• **Allocated Budget:** **${allocatedBudget.toLocaleString()} EGP** | **Total Estimated:** **${totalEstimated.toLocaleString()} EGP**\n` +
        `• **Actual Paid:** **${totalActualSpent.toLocaleString()} EGP** | **Remaining Est. Needed:** **${remainingEstimatedCost.toLocaleString()} EGP**\n\n` +
        `#### 2️⃣ Category Breakdown:\n` +
        `${catSummary}\n\n` +
        `#### 3️⃣ Highest-Impact Items & Priorities:\n` +
        `• **Highest-Cost Items:** ${topCostItems || 'None'}\n` +
        `• **Urgent / High-Priority Pending:** **${urgentPending.length}** items\n\n` +
        `#### 💡 Recommended Next Step:\n` +
        `Focus next on finalizing your **${comparingItems.length} comparing items** and **${urgentPending.length} urgent/high-priority items**, verifying Inverter A++ ratings and 5–10 year official warranties.`;
  };

  const cacheKey = `${lang || 'ar'}_${actionType || 'chat'}_${project?.id || 'none'}_${totalItems}_${totalActualSpent}_${(prompt || '').trim().slice(0, 120)}`;
  const cached = aiResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.json({
      success: true,
      result: cached.text,
      source: 'cache',
    });
    return;
  }

  if (!apiKey) {
    res.json({
      success: true,
      result: generateSmartAnalysisResponse(actionType, currentItem, prompt),
      source: 'smart_analysis',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = isAr
      ? `أنت مستشار ومحلل Gemini الذكي (Gemini 3.8 Flash) الخبير في تخطيط المشاريع، إدارة المشتريات، الأجهزة المنزلية والكهربائية، مقارنة الماركات والمواصفات الفنية، والتحليل المالي للميزانيات بالجنيه المصري (ج.م).
قدم إجابات احترافية، دقيقة، ومنظمة باستخدام عناوين واضحة ونقاط محددة:
1. إذا سأل المستخدم عن تحليل قائمته أو ميزانيته: قدم تحليلاً رقمياً دقيقاً يشمل نسبة الإنجاز، مقارنة الميزانية المخصصة بالتكلفة التقديرية والمدفوع الفعلي، ترتيب الأولويات العاجلة، وخطة التوفير.
2. إذا سأل عن صنف أو جهاز معين: قارن بين أفضل الماركات المتاحة في السوق (الفئة العليا مقابل الفئة الاقتصادية)، المواصفات الفنية الموصى بها (مثل Inverter، كفاءة الطاقة، الأمان الكامل)، متوسط الأسعار بالجنيه المصري، وفترة الضمان.
3. اجعل أسلوبك ودوداً، عملياً، ومباشراً.`
      : `You are Gemini Smart Advisor & Analyst (Gemini 3.8 Flash), an expert in project checklist management, home appliances, technical specifications, brand comparisons, and financial budget analysis in EGP.
Provide structured, insightful, and actionable responses with clear headings and bullet points:
1. For checklist or budget analysis requests: deliver an exact quantitative breakdown (completion %, allocated budget vs. estimated & actual spend, urgent priority queue, and bundle savings strategy).
2. For specific appliance or item questions: compare top market brands (Premium tier vs. Value tier), key technical specs (Inverter, energy grade, safety features), estimated EGP price ranges, and warranty terms.
3. Keep your tone helpful, clear, and practical.`;

    const metricsContext = [
      `Project: ${projectName} | Allocated Budget: ${allocatedBudget} EGP`,
      `Total Items: ${totalItems} | Completed: ${completedItems.length} (${completionRate}%) | Comparing: ${comparingItems.length} | Pending: ${pendingItems.length}`,
      `Total Estimated Cost: ${totalEstimated} EGP | Total Actual Paid: ${totalActualSpent} EGP | Remaining Est. Cost: ${remainingEstimatedCost} EGP`,
      Array.isArray(categories) && categories.length > 0 ? `User Categories: ${categories.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const itemsSummary = itemsList
      .slice(0, 30)
      .map(
        it =>
          `- [${it.status || 'pending'} | Priority: ${it.priority || 'medium'}] ${isAr ? it.titleAr : it.titleEn || it.titleAr} (${it.category || 'General'}): Est=${it.estimatedCost || 0} EGP, Paid=${it.actualCost || 0} EGP, Specs="${it.notes || ''}", Notes="${it.myNotes || ''}", TargetDate=${it.targetDate || 'N/A'}, Store="${it.storeLocation || ''}"`
      )
      .join('\n');

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map(h => `${h.role === 'model' ? 'Gemini' : 'User'}: ${h.text || ''}`)
          .join('\n')
      : '';

    const userMessage = prompt || `يرجى تقديم المشورة والتحليل للصنف: ${JSON.stringify(currentItem || {})}`;

    const fullContents = [
      systemPrompt,
      `ملخص المشروع والميزانية (Project & Financial Metrics):\n${metricsContext}`,
      itemsSummary ? `تفاصيل أصناف المستخدم الحالية (Current Checklist Items):\n${itemsSummary}` : 'قائمة أصناف المستخدم فارغة حالياً (0 items).',
      historyText ? `سياق المحادثة السابقة (Recent Chat History):\n${historyText}` : '',
      `طلب المستخدم الحالي (Action Type: ${actionType || 'chat'}):\n${userMessage}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullContents,
    });
    const generatedText = response.text;

    if (generatedText) {
      aiResponseCache.set(cacheKey, {
        text: generatedText,
        expiresAt: Date.now() + 60 * 1000,
      });
    }

    res.json({
      success: true,
      result: generatedText || generateSmartAnalysisResponse(actionType, currentItem, prompt),
      source: 'gemini',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('Gemini API note, using smart quantitative analysis fallback:', errMsg);
    res.json({
      success: true,
      result: generateSmartAnalysisResponse(actionType, currentItem, prompt),
      source: 'fallback',
    });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 3000;
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
