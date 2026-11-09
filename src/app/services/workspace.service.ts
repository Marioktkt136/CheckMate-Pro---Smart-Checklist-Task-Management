import { Injectable } from '@angular/core';
import { ChecklistItem, ProjectFolder } from '../core/checklist-rules';

export interface WorkspaceExportResult {
  success: boolean;
  type: 'sheets' | 'drive' | 'gmail' | 'calendar';
  message: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  /**
   * 1. Google Sheets Integration: Creates a new spreadsheet with the full checklist data
   */
  async exportToGoogleSheets(
    project: ProjectFolder,
    items: ChecklistItem[],
    accessToken: string
  ): Promise<WorkspaceExportResult> {
    try {
      // Step A: Create Spreadsheet
      const title = `قائمة الأجهزة - ${project.nameAr} (${new Date().toLocaleDateString()})`;
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            {
              properties: {
                title: 'الأجهزة والمواصفات',
                rightToLeft: true
              }
            }
          ]
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to create Google Sheet');
      }

      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Step B: Append rows
      const headerRow = [
        '#',
        'اسم الجهاز',
        'Item Name',
        'الفئة (Category)',
        'الحالة (Status)',
        'الأولوية (Priority)',
        'السعر التقديري (ج.م)',
        'السعر الفعلي (ج.م)',
        'الموعد المستهدف',
        'المعرض / المتجر',
        'ملاحظاتي والمواصفات'
      ];

      const dataRows = items.map(item => [
        item.itemNumber || '',
        item.titleAr,
        item.titleEn,
        item.category,
        item.status === 'purchased' ? 'تم الشراء' : item.status === 'comparing' ? 'قيد المقارنة' : 'لم يبدأ',
        item.priority,
        item.estimatedCost,
        item.actualCost,
        item.targetDate || '',
        item.storeName || '',
        item.myNotes || item.notes || ''
      ]);

      const values = [headerRow, ...dataRows];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );

      return {
        success: true,
        type: 'sheets',
        message: 'تم تصدير القائمة بنجاح إلى جدول بيانات Google Sheets',
        url: spreadsheetUrl
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, type: 'sheets', message: msg };
    }
  }

  /**
   * 2. Google Drive Integration: Uploads JSON report/backup to user's Drive
   */
  async saveToGoogleDrive(
    project: ProjectFolder,
    items: ChecklistItem[],
    accessToken: string
  ): Promise<WorkspaceExportResult> {
    try {
      const filename = `CheckMate_${project.id}_${new Date().toISOString().split('T')[0]}.json`;
      const fileData = JSON.stringify({ project, items, exportedAt: new Date().toISOString() }, null, 2);

      const metadata = {
        name: filename,
        mimeType: 'application/json',
        description: `Backup of checklist ${project.nameAr} created with CheckMate Pro`
      };

      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileData +
        closeDelim;

      const driveRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!driveRes.ok) {
        const errJson = await driveRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to save file to Google Drive');
      }

      const resJson = await driveRes.json();
      return {
        success: true,
        type: 'drive',
        message: `تم حفظ نسخة احتياطية بنجاح على Google Drive (${filename})`,
        url: resJson.webViewLink || `https://drive.google.com/file/d/${resJson.id}/view`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, type: 'drive', message: msg };
    }
  }

  /**
   * 3. Gmail Integration: Sends a formatted email report with checklist progress
   */
  async sendEmailSummary(
    recipientEmail: string,
    project: ProjectFolder,
    items: ChecklistItem[],
    accessToken: string
  ): Promise<WorkspaceExportResult> {
    try {
      const totalEst = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
      const totalAct = items.reduce((sum, i) => sum + (i.actualCost || 0), 0);
      const purchasedCount = items.filter(i => i.status === 'purchased').length;

      const subject = `تقرير قائمة التجهيزات: ${project.nameAr}`;
      const htmlBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">تقرير قائمة التجهيزات - ${project.nameAr}</h2>
          <p>مرحباً، إليك ملخص حالة قائمة الأجهزة والتجهيزات المنزلية:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p><strong>الميزانية المخصصة:</strong> ${project.budget.toLocaleString()} ج.م</p>
            <p><strong>التكلفة التقديرية الإجمالية:</strong> ${totalEst.toLocaleString()} ج.م</p>
            <p><strong>المصروف الفعلي حتى الآن:</strong> ${totalAct.toLocaleString()} ج.م</p>
            <p><strong>نسبة الإنجاز:</strong> ${purchasedCount} من أصل ${items.length} صنف تم شراؤه</p>
          </div>
          <h3>تفاصيل الأصناف:</h3>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border-color: #cbd5e1;">
            <tr style="background: #f1f5f9;">
              <th>الصنف</th>
              <th>الفئة</th>
              <th>الحالة</th>
              <th>المعرض / المتجر</th>
              <th>التكلفة التقديرية</th>
              <th>التكلفة الفعلية</th>
            </tr>
            ${items.map(i => `
              <tr>
                <td><strong>${i.titleAr}</strong><br><small style="color:#64748b;">${i.titleEn}</small></td>
                <td>${i.category}</td>
                <td>${i.status === 'purchased' ? 'تم الشراء' : i.status === 'comparing' ? 'قيد المقارنة' : 'لم يبدأ'}</td>
                <td>${i.storeName || '-'}</td>
                <td>${i.estimatedCost.toLocaleString()} ج.م</td>
                <td>${i.actualCost ? i.actualCost.toLocaleString() + ' ج.م' : '-'}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">تم إرسال هذا التقرير تلقائياً عبر تطبيق CheckMate Pro</p>
        </div>
      `;

      // Construct standard RFC 2822 email
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
      const emailLines = [
        `To: ${recipientEmail}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        htmlBody
      ];
      const emailContent = emailLines.join('\r\n');
      const base64UrlEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64UrlEmail })
      });

      if (!gmailRes.ok) {
        const errJson = await gmailRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to send email via Gmail');
      }

      return {
        success: true,
        type: 'gmail',
        message: `تم إرسال تقرير القائمة بنجاح عبر بريد Gmail إلى: ${recipientEmail}`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, type: 'gmail', message: msg };
    }
  }

  /**
   * 4. Google Calendar Integration: Creates real Calendar event for an item's target date
   */
  async createCalendarEvent(
    item: ChecklistItem,
    accessToken: string
  ): Promise<WorkspaceExportResult> {
    try {
      if (!item.targetDate) {
        throw new Error('يرجى تحديد موعد مستهدف للصنف أولاً');
      }

      const eventPayload = {
        summary: `موعد شراء / استلام: ${item.titleAr} (${item.titleEn})`,
        description: `المواصفات والملاحظات: ${item.myNotes || item.notes || 'لا يوجد'}\nالمعرض المختار: ${item.storeName || 'غير محدد'}\nالتكلفة التقديرية: ${item.estimatedCost} ج.م`,
        start: {
          date: item.targetDate
        },
        end: {
          date: item.targetDate
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // 1 day before
            { method: 'email', minutes: 2 * 24 * 60 } // 2 days before
          ]
        }
      };

      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        }
      );

      if (!calRes.ok) {
        const errJson = await calRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to add event to Google Calendar');
      }

      const createdEvent = await calRes.json();
      return {
        success: true,
        type: 'calendar',
        message: `تم إضافة موعد ${item.titleAr} بنجاح إلى تقويم Google Calendar`,
        url: createdEvent.htmlLink
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, type: 'calendar', message: msg };
    }
  }

  /**
   * 5. Google Sheets Instruction Schema
   * Defines standard expected columns for importing data into CheckMate Pro
   */
  getSchemaColumns(): SheetColumnSchema[] {
    return [
      {
        col: 'A',
        nameAr: '# (م)',
        nameEn: 'Item #',
        aliases: ['#', 'م', 'no', 'number', 'num', 'الرقم', 'مسلسل'],
        descAr: 'الرقم التسلسلي للصنف في القائمة',
        descEn: 'Sequential item number in list',
        example: '1',
        required: false
      },
      {
        col: 'B',
        nameAr: 'القسم / التصنيف',
        nameEn: 'Category',
        aliases: ['القسم', 'الفئة', 'التصنيف', 'المجموعة', 'category', 'cat', 'group'],
        descAr: 'المجموعة الرئيسية (مثال: الأجهزة الأساسية، أجهزة المطبخ، الأثاث...)',
        descEn: 'Main group (e.g., Major Appliances, Kitchen, Furniture)',
        example: 'الأجهزة الأساسية',
        required: true
      },
      {
        col: 'C',
        nameAr: 'اسم الصنف / الجهاز (عربي)',
        nameEn: 'Item Name (Ar)',
        aliases: ['اسم الصنف', 'اسم الجهاز', 'الجهاز', 'الصنف', 'البيان', 'title', 'name', 'item', 'item name'],
        descAr: 'اسم المشتريات أو الجهاز بالعربية',
        descEn: 'Item or appliance name in Arabic',
        example: 'الثلاجة',
        required: true
      },
      {
        col: 'D',
        nameAr: 'الاسم بالإنجليزية (اختياري)',
        nameEn: 'Item Name (En)',
        aliases: ['name en', 'title en', 'english', 'الاسم بالإنجليزية', 'english name'],
        descAr: 'ترجمة اسم الصنف بالإنجليزية',
        descEn: 'Item title translated in English',
        example: 'Refrigerator',
        required: false
      },
      {
        col: 'E',
        nameAr: 'المواصفات',
        nameEn: 'Specifications / Notes',
        aliases: ['المواصفات', 'مواصفات', 'ملاحظات', 'notes', 'specs', 'specification'],
        descAr: 'المواصفات الفنية (نوفروست، أوتوماتيك، انفرتر، سعة...)',
        descEn: 'Technical specs (No-Frost, inverter, capacity)',
        example: '16 قدم نوفروست ديجيتال',
        required: false
      },
      {
        col: 'F',
        nameAr: 'ملاحظاتي الخاصة',
        nameEn: 'My Notes / Store',
        aliases: ['ملاحظاتي', 'ملاحظاتي الخاصة', 'الماركة', 'المعرض', 'my notes', 'mynotes', 'store', 'brand'],
        descAr: 'الماركة المختارة أو المعرض المفضل والضمان',
        descEn: 'Your selected brand, store or warranty info',
        example: 'شارب - معرض بي تك - ضمان 10 سنوات',
        required: false
      },
      {
        col: 'G',
        nameAr: 'الحالة',
        nameEn: 'Status',
        aliases: ['الحالة', 'حالة', 'status', 'state'],
        descAr: 'حالة الصنف: لسه (pending)، مقارنة (comparing)، تم الشراء (purchased)، تم التوصيل (delivered)',
        descEn: 'pending, comparing, purchased, or delivered',
        example: '✅ تم الشراء',
        required: false
      },
      {
        col: 'H',
        nameAr: 'الأولوية',
        nameEn: 'Priority',
        aliases: ['الأولوية', 'أولوية', 'priority', 'level'],
        descAr: 'مستوى الأهمية: عاجلة (urgent)، مرتفعة (high)، متوسطة (medium)، منخفضة (low)',
        descEn: 'urgent, high, medium, or low',
        example: 'عاجلة جداً',
        required: false
      },
      {
        col: 'I',
        nameAr: 'السعر التقديري (ج.م)',
        nameEn: 'Estimated Cost',
        aliases: ['السعر التقديري', 'التقديري', 'الميزانية', 'estimated', 'cost', 'price', 'estimated cost'],
        descAr: 'السعر التقريبي المتوقع بالجنيه',
        descEn: 'Expected budget in currency',
        example: '38000',
        required: false
      },
      {
        col: 'J',
        nameAr: 'السعر الفعلي (ج.م)',
        nameEn: 'Actual Cost',
        aliases: ['السعر الفعلي', 'المدفوع', 'الفعلي', 'actual', 'actual cost', 'paid'],
        descAr: 'المبلغ المدفوع عند الشراء الفعلي',
        descEn: 'Actual amount paid at purchase',
        example: '37200',
        required: false
      },
      {
        col: 'K',
        nameAr: 'الموعد المستهدف',
        nameEn: 'Target Date',
        aliases: ['التاريخ', 'تاريخ الشراء', 'الموعد المستهدف', 'date', 'target date', 'deadline'],
        descAr: 'تاريخ الشراء بصيغة YYYY-MM-DD',
        descEn: 'Target date in YYYY-MM-DD format',
        example: '2026-11-20',
        required: false
      }
    ];
  }

  /**
   * Generates sample CSV template for Google Sheets
   */
  generateGoogleSheetsTemplateCsv(): string {
    const headers = [
      '#',
      'القسم',
      'اسم الصنف',
      'Item Name',
      'المواصفات',
      'ملاحظاتي الخاصة',
      'الحالة',
      'الأولوية',
      'السعر التقديري',
      'السعر الفعلي',
      'الموعد المستهدف'
    ];

    const sampleRows = [
      ['1', 'الأجهزة الأساسية', 'الثلاجة', 'Refrigerator', 'نوفروست 16 قدم ديجيتال', 'شارب سيلفر - معرض بي تك', 'لم يبدأ', 'عاجلة', '38000', '0', '2026-11-25'],
      ['2', 'الأجهزة الأساسية', 'الغسالة', 'Washing Machine', 'أوتوماتيك 9 كيلو Direct Drive', 'إل جي انفرتر بالمجفف', 'قيد المقارنة', 'عاجلة', '26000', '0', '2026-11-28'],
      ['3', 'الأجهزة الأساسية', 'البوتاجاز', 'Cooker', '5 شعلة أمان كامل ومروحة', 'فريش بروفيشنال 90 سم', 'لم يبدأ', 'مرتفعة', '19500', '0', '2026-12-05'],
      ['4', 'أجهزة المطبخ', 'الخلاط', 'Blender', '1000 واط مع مطحنتين', 'مولينكس فرنسا أصلي', 'تم الشراء', 'مرتفعة', '3200', '3100', '2026-11-02'],
      ['5', 'الرفاهية المطبخية', 'القلاية الهوائية', 'Air Fryer', 'سعة كبيرة 7 لتر بدون زيت', 'فيليبس XXL ديجيتال', 'قيد المقارنة', 'متوسطة', '9500', '0', '2026-12-10']
    ];

    const toCsvLine = (cells: string[]) => cells.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
    return [toCsvLine(headers), ...sampleRows.map(toCsvLine)].join('\r\n');
  }

  /**
   * Generates Tab-Separated string to paste directly into Google Sheets (Ctrl+V)
   */
  generateGoogleSheetsTemplateTsv(): string {
    const headers = ['#', 'القسم', 'اسم الصنف', 'Item Name', 'المواصفات', 'ملاحظاتي الخاصة', 'الحالة', 'الأولوية', 'السعر التقديري', 'السعر الفعلي', 'الموعد المستهدف'];
    const rows = [
      ['1', 'الأجهزة الأساسية', 'الثلاجة', 'Refrigerator', 'نوفروست 16 قدم ديجيتال', 'شارب سيلفر - معرض بي تك', 'لم يبدأ', 'عاجلة', '38000', '0', '2026-11-25'],
      ['2', 'الأجهزة الأساسية', 'الغسالة', 'Washing Machine', 'أوتوماتيك 9 كيلو Direct Drive', 'إل جي انفرتر بالمجفف', 'قيد المقارنة', 'عاجلة', '26000', '0', '2026-11-28'],
      ['3', 'أجهزة المطبخ', 'الخلاط', 'Blender', '1000 واط مع مطحنتين', 'مولينكس فرنسا أصلي', 'تم الشراء', 'مرتفعة', '3200', '3100', '2026-11-02'],
    ];
    return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  }

  /**
   * Extracts Spreadsheet ID from full Google Sheets URL or raw ID
   */
  extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  }

  /**
   * Parses 2D array of rows into typed ChecklistItem objects
   */
  parseGoogleSheetMatrix(
    matrix: string[][],
    defaultFolderId = 'home_appliances',
    defaultCategory = 'الأجهزة الأساسية'
  ): ParsedSheetResult {
    if (!matrix || matrix.length < 2) {
      return {
        success: false,
        items: [],
        validCount: 0,
        totalRows: 0,
        warnings: ['الملف فارغ أو لا يحتوي على صفوف بيانات كافية.'],
        categoriesFound: [],
        message: 'الجدول لا يحتوي على صفوف كافية للاستيراد'
      };
    }

    const headerRow = matrix[0].map(h => (h || '').trim().toLowerCase());

    // Find column index for each field based on aliases
    const colIndex = {
      itemNumber: -1,
      category: -1,
      titleAr: -1,
      titleEn: -1,
      notes: -1,
      myNotes: -1,
      status: -1,
      priority: -1,
      estimatedCost: -1,
      actualCost: -1,
      targetDate: -1
    };

    headerRow.forEach((header, idx) => {
      for (const [key, aliases] of Object.entries({
        itemNumber: ['#', 'م', 'no', 'number', 'num', 'مسلسل', 'الرقم'],
        category: ['القسم', 'الفئة', 'التصنيف', 'المجموعة', 'category', 'cat', 'group'],
        titleAr: ['اسم الصنف', 'اسم الجهاز', 'الجهاز', 'الصنف', 'البيان', 'title', 'name', 'item', 'item name'],
        titleEn: ['name en', 'title en', 'english', 'الاسم بالإنجليزية', 'english name'],
        notes: ['المواصفات', 'مواصفات', 'ملاحظات', 'notes', 'specs', 'specification'],
        myNotes: ['ملاحظاتي', 'ملاحظاتي الخاصة', 'الماركة', 'المعرض', 'my notes', 'mynotes', 'store', 'brand'],
        status: ['الحالة', 'حالة', 'status', 'state'],
        priority: ['الأولوية', 'أولوية', 'priority', 'level'],
        estimatedCost: ['السعر التقديري', 'التقديري', 'الميزانية', 'estimated', 'cost', 'price', 'estimated cost'],
        actualCost: ['السعر الفعلي', 'المدفوع', 'الفعلي', 'actual', 'actual cost', 'paid'],
        targetDate: ['التاريخ', 'تاريخ الشراء', 'الموعد المستهدف', 'date', 'target date', 'deadline']
      })) {
        if ((colIndex as Record<string, number>)[key] === -1) {
          if (aliases.some(alias => header.includes(alias) || alias === header)) {
            (colIndex as Record<string, number>)[key] = idx;
          }
        }
      }
    });

    // Fallbacks if headers weren't named properly
    if (colIndex.titleAr === -1 && matrix[0].length >= 3) colIndex.titleAr = 2; // Col C
    if (colIndex.category === -1 && matrix[0].length >= 2) colIndex.category = 1; // Col B
    if (colIndex.itemNumber === -1 && matrix[0].length >= 1) colIndex.itemNumber = 0; // Col A

    const items: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const warnings: string[] = [];
    const categoriesSet = new Set<string>();

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.length === 0 || row.every(c => !c || !c.trim())) {
        continue; // skip blank rows
      }

      const getVal = (idx: number): string => (idx >= 0 && idx < row.length ? (row[idx] || '').trim() : '');

      const titleAr = getVal(colIndex.titleAr) || getVal(1) || getVal(0);
      if (!titleAr) {
        warnings.push(`الصف ${r + 1}: تم تجاهله لعدم وجود اسم صنف.`);
        continue;
      }

      const category = getVal(colIndex.category) || defaultCategory;
      categoriesSet.add(category);

      const titleEn = getVal(colIndex.titleEn) || '';
      const notes = getVal(colIndex.notes) || '';
      const myNotes = getVal(colIndex.myNotes) || '';

      // Parse status
      const rawStatus = getVal(colIndex.status).toLowerCase();
      let status: 'pending' | 'comparing' | 'purchased' | 'delivered' = 'pending';
      if (rawStatus.includes('شراء') || rawStatus.includes('purchased') || rawStatus.includes('تم') || rawStatus.includes('خالص')) {
        status = 'purchased';
      } else if (rawStatus.includes('مقارنة') || rawStatus.includes('comparing') || rawStatus.includes('بحث')) {
        status = 'comparing';
      } else if (rawStatus.includes('توصيل') || rawStatus.includes('delivered') || rawStatus.includes('استلام')) {
        status = 'delivered';
      }

      // Parse priority
      const rawPriority = getVal(colIndex.priority).toLowerCase();
      let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
      if (rawPriority.includes('عاجل') || rawPriority.includes('urgent') || rawPriority.includes('قصوى')) {
        priority = 'urgent';
      } else if (rawPriority.includes('مرتفع') || rawPriority.includes('high') || rawPriority.includes('ضروري')) {
        priority = 'high';
      } else if (rawPriority.includes('منخفض') || rawPriority.includes('low') || rawPriority.includes('اختياري')) {
        priority = 'low';
      }

      // Parse numeric costs
      const parseNumber = (val: string): number => {
        const cleaned = val.replace(/[^0-9.]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      };

      const estimatedCost = parseNumber(getVal(colIndex.estimatedCost));
      const actualCost = parseNumber(getVal(colIndex.actualCost));

      // Parse item number
      const itemNumber = parseInt(getVal(colIndex.itemNumber), 10) || items.length + 1;

      // Parse date
      let targetDate = getVal(colIndex.targetDate);
      if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        const d = new Date(targetDate);
        if (!isNaN(d.getTime())) {
          targetDate = d.toISOString().split('T')[0];
        }
      }

      items.push({
        itemNumber,
        folderId: defaultFolderId,
        category,
        titleAr,
        titleEn,
        notes,
        myNotes,
        status,
        priority,
        tags: [category],
        estimatedCost,
        actualCost,
        currency: 'EGP',
        targetDate: targetDate || undefined,
        attachments: [],
        comments: []
      });
    }

    return {
      success: items.length > 0,
      items,
      validCount: items.length,
      totalRows: matrix.length - 1,
      warnings,
      categoriesFound: Array.from(categoriesSet),
      message: items.length > 0 ? `تم استخراج ${items.length} صنف بنجاح` : 'لم يتم العثور على أصناف صالحة'
    };
  }

  /**
   * Parses Raw Text from Clipboard (TSV or CSV)
   */
  parsePastedText(
    rawText: string,
    defaultFolderId = 'home_appliances',
    defaultCategory = 'الأجهزة الأساسية'
  ): ParsedSheetResult {
    const text = (rawText || '').trim();
    if (!text) {
      return {
        success: false,
        items: [],
        validCount: 0,
        totalRows: 0,
        warnings: ['النص الملصق فارغ.'],
        categoriesFound: [],
        message: 'يرجى لصق بيانات من Google Sheets أولاً'
      };
    }

    // Split by newlines
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return {
        success: false,
        items: [],
        validCount: 0,
        totalRows: 0,
        warnings: ['لا توجد أسطر بيانات.'],
        categoriesFound: [],
        message: 'لا توجد بيانات'
      };
    }

    // Determine delimiter: tab (\t) or comma (,)
    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');

    const matrix = lines.map(line => {
      if (isTab) {
        return line.split('\t');
      }
      // Simple CSV split handling quotes
      const result: string[] = [];
      let inQuotes = false;
      let curr = '';
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          result.push(curr.trim());
          curr = '';
        } else {
          curr += ch;
        }
      }
      result.push(curr.trim());
      return result;
    });

    return this.parseGoogleSheetMatrix(matrix, defaultFolderId, defaultCategory);
  }

  /**
   * Fetch data directly from Google Sheets API
   */
  async fetchFromGoogleSheetsApi(
    spreadsheetUrlOrId: string,
    accessToken?: string,
    defaultFolderId = 'home_appliances'
  ): Promise<ParsedSheetResult> {
    const sheetId = this.extractSpreadsheetId(spreadsheetUrlOrId);
    if (!sheetId) {
      return {
        success: false,
        items: [],
        validCount: 0,
        totalRows: 0,
        warnings: ['رابط أو معرف جدول Google Sheets غير صالح.'],
        categoriesFound: [],
        message: 'معرف الجدول غير صالح'
      };
    }

    try {
      // If we have an access token, use Sheets v4 API
      if (accessToken) {
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z500`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
          const json = await res.json();
          const values: string[][] = json.values || [];
          return this.parseGoogleSheetMatrix(values, defaultFolderId);
        }
      }

      // Fallback: Fetch published CSV from Google Sheets URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        return this.parsePastedText(csvText, defaultFolderId);
      }

      throw new Error('يرجى تسجيل الدخول بحساب Google Workspace أولاً للوصول إلى الجداول الخاصة، أو مشاركة الجدول ليكون متاحاً برابط عام.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        items: [],
        validCount: 0,
        totalRows: 0,
        warnings: [msg],
        categoriesFound: [],
        message: msg
      };
    }
  }
}

export interface SheetColumnSchema {
  col: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  descAr: string;
  descEn: string;
  example: string;
  required: boolean;
}

export interface ParsedSheetResult {
  success: boolean;
  items: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>[];
  validCount: number;
  totalRows: number;
  warnings: string[];
  categoriesFound: string[];
  message: string;
}
