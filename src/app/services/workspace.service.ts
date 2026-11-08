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
}
