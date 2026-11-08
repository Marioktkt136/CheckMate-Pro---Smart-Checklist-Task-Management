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

// 5. Smart Gemini AI Checklist & Buying Advisor Endpoint
app.post('/api/ai-advisor', async (req, res): Promise<void> => {
  const { prompt, currentItem, actionType, lang } = req.body;
  const apiKey = process.env['GEMINI_API_KEY'];
  const isAr = lang !== 'en';

  // Fallback high-quality response if no API key or network fails
  const generateFallbackResponse = (type: string, item: { titleAr?: string; titleEn?: string } | undefined) => {
    if (type === 'compare_brands' && item) {
      return isAr
        ? `### مقارنة الماركات والمواصفات لـ (${item.titleAr || item.titleEn}):\n` +
          `1. **الفئة الممتازة (Sharp / LG / Bosch):** كفاءة طاقة A++، موتور انفرتر موفر، ضمان 10 سنوات، متانة عالية وقطع غيار أصلية.\n` +
          `2. **الفئة المتوسطة الاقتصادية (Beko / Tornado / Fresh):** قيمة ممتازة مقابل السعر، توفر مراكز صيانة محلية، وضمان معتمد 5-10 سنوات.\n` +
          `💡 **نصيحة للشراء:** احرص على التأكد من وجود صمام الأمان الكامل، وتوفير مسافة تهوية كافية (10 سم على الأقل من الجوانب).`
        : `### Brand & Specification Analysis for (${item.titleEn || item.titleAr}):\n` +
          `1. **Premium Tier (LG / Bosch / Sharp):** Inverter motor, A++ energy rating, 10-year motor warranty, silent operation.\n` +
          `2. **Value Tier (Beko / Tornado / Fresh):** Excellent value for money, easily available spare parts and local service centers.\n` +
          `💡 **Buying Tip:** Always inspect warranty terms and energy efficiency labels before completing purchase.`;
    }

    if (type === 'budget_tips') {
      return isAr
        ? `### نصائح تحسين الميزانية وتوقيت الشراء:\n` +
          `• **الشراء المجمع:** تجميع الأجهزة الأساسية (الثلاجة + الغسالة + البوتاجاز) من معرض واحد يمنحك خصماً فورياً يتراوح بين 5% إلى 10%.\n` +
          `• **توقيت العروض:** أفضل فترات التخفيضات هي عروض الجمعة البيضاء، رأس السنة، ومعارض التجهيز الكبرى.\n` +
          `• **تقسيم الأولويات:** ابدأ دائماً بالأجهزة الأساسية (الثلاجة والبوتاجاز والغسالة)، وأجّل الرفاهيات مثل القلاية الهوائية والعجان للمراحل اللاحقة.`
        : `### Budget Optimization & Buying Strategy:\n` +
          `• **Bundle Discount:** Purchasing core appliances together from a single distributor can yield 5-10% in cash discounts.\n` +
          `• **Seasonal Deals:** Leverage major shopping seasons (White Friday, Year-End, Home Expo).\n` +
          `• **Priority Phasing:** Fund Tier 1 essentials (Fridge, Stove, Washer) first; defer luxury items (Air Fryer, Stand Mixer).`;
    }

    return isAr
      ? `تحليل ذكي لقائمتك: يتوفر لديك 12 صنفاً أساسياً، تم إنجاز بعضها وتوجد عناصر قيد المقارنة. ننصح بتحديد الماركات ومعارض المعاينة والالتزام بسقف الميزانية التقديرية.`
      : `Smart analysis: Your checklist has essential home items well structured. Focus on closing high-priority pending items first within target deadlines.`;
  };

  if (!apiKey) {
    res.json({
      success: true,
      result: generateFallbackResponse(actionType, currentItem),
      source: 'offline_knowledge',
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
      ? `أنت مستشار وخبير أجهزة ومشتريات هندسي منزلي ذكي وودود (Smart Buying Advisor). تساعد المستخدمين في تجهيز منازلهم، مقارنة أفضل الماركات في السوق، نصائح الضمان، أسعار الأجهزة، وفحص قوائم المهام والأولويات.`
      : `You are an expert home appliance & procurement engineering advisor. You assist users with checklist management, brand comparisons, specs, warranties, and smart budget planning.`;
    const userMessage = prompt || `يرجى تقديم المشورة للصنف: ${JSON.stringify(currentItem || {})}`;

    const generateWithRetry = async (attempts = 2): Promise<string | undefined> => {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${systemPrompt}\n\nطلب المستخدم:\n${userMessage}`,
          });
          return response.text;
        } catch (e: unknown) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          if (i < attempts - 1 && (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE'))) {
            await new Promise((resolve) => setTimeout(resolve, (i + 1) * 750));
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    };

    const generatedText = await generateWithRetry();

    res.json({
      success: true,
      result: generatedText || generateFallbackResponse(actionType, currentItem),
      source: 'gemini',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Gemini API call failed, falling back:', errMsg);
    res.json({
      success: true,
      result: generateFallbackResponse(actionType, currentItem),
      source: 'fallback',
      error: errMsg,
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
