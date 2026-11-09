import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { WorkspaceService, SheetColumnSchema, ParsedSheetResult } from '../services/workspace.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-google-sheet-import-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gsheet-import-title"
      tabindex="-1"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <mat-icon class="text-2xl">table_chart</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 id="gsheet-import-title" class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  استيراد البيانات من Google Sheets
                </h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  مخطط الأعمدة والصفوف
                </span>
              </div>
              <p class="text-xs text-slate-400">
                شرح هيكل الجدول، النسخ المباشر من Google Sheets، والاستيراد اللحظي
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Mode Tabs -->
        <div class="flex items-center gap-1 sm:gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            (click)="activeTab.set('schema')"
            class="flex-1 py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
            [class.bg-white]="activeTab() === 'schema'"
            [class.dark:bg-slate-900]="activeTab() === 'schema'"
            [class.text-emerald-600]="activeTab() === 'schema'"
            [class.shadow-xs]="activeTab() === 'schema'"
            [class.text-slate-600]="activeTab() !== 'schema'"
            [class.dark:text-slate-400]="activeTab() !== 'schema'"
          >
            <mat-icon class="text-base">view_column</mat-icon>
            <span>1. مخطط وهيكل الجدول (Schema & Columns)</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('import')"
            class="flex-1 py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
            [class.bg-white]="activeTab() === 'import'"
            [class.dark:bg-slate-900]="activeTab() === 'import'"
            [class.text-emerald-600]="activeTab() === 'import'"
            [class.shadow-xs]="activeTab() === 'import'"
            [class.text-slate-600]="activeTab() !== 'import'"
            [class.dark:text-slate-400]="activeTab() !== 'import'"
          >
            <mat-icon class="text-base">cloud_download</mat-icon>
            <span>2. استيراد البيانات (Import Data)</span>
          </button>
        </div>

        <!-- Scrollable Body Content -->
        <div class="mt-4 overflow-y-auto flex-1 pr-1 space-y-4">
          
          <!-- TAB 1: SCHEMA & INSTRUCTIONS -->
          @if (activeTab() === 'schema') {
            <div class="space-y-4">
              
              <!-- Visual Google Sheet Representation Box -->
              <div class="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-emerald-600 dark:text-emerald-400">table_rows</mat-icon>
                    <div>
                      <span class="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
                        شكل جدول Google Sheets المطلوب (Columns & Rows Schema)
                      </span>
                      <p class="text-[11px] text-emerald-800 dark:text-emerald-400">
                        الصف رقم 1 يحتوي على أسماء الأعمدة، والصفوف التالية تحتوي على بيانات الأجهزة والمشتريات.
                      </p>
                    </div>
                  </div>

                  <!-- Quick Action Buttons -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="copyTemplateToClipboard()"
                      class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      title="نسخ النموذج ولصقه مباشرة في صفحة Google Sheet جديدة"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">content_copy</mat-icon>
                      <span>نسخ قالب الجدول</span>
                    </button>

                    <button
                      type="button"
                      (click)="downloadSampleCsv()"
                      class="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="تحميل ملف CSV جاهز"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">download</mat-icon>
                      <span>تنزيل CSV</span>
                    </button>
                  </div>
                </div>

                <!-- Google Sheet Interactive Visual Table Grid -->
                <div class="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-xs">
                  <table class="w-full text-xs text-right border-collapse">
                    <thead>
                      <!-- Excel Column Letters Row (A, B, C...) -->
                      <tr class="bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[11px] border-b border-slate-200 dark:border-slate-700 text-center">
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700 w-10">Row</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">A</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">B</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">C</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">D</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">E</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">F</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">G</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">H</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">I</th>
                        <th class="p-1.5 border-r border-slate-200 dark:border-slate-700">J</th>
                        <th class="p-1.5">K</th>
                      </tr>
                      <!-- Row 1: Column Header Names -->
                      <tr class="bg-emerald-100/70 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800">
                        <td class="p-2 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700">1</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap"># (م)</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-blue-700 dark:text-blue-400">القسم *</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-emerald-700 dark:text-emerald-400">اسم الصنف *</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Item Name</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">المواصفات</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">ملاحظاتي الخاصة</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">الحالة</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">الأولوية</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">السعر التقديري</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">السعر الفعلي</td>
                        <td class="p-2 whitespace-nowrap">الموعد المستهدف</td>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      <!-- Row 2 (Example 1) -->
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td class="p-2 text-center font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-700">2</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">1</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-blue-600 dark:text-blue-400">الأجهزة الأساسية</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">الثلاجة</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 text-slate-400">Refrigerator</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700">نوفروست 16 قدم ديجيتال</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 bg-amber-50/40 dark:bg-amber-950/20 font-medium">شارب - بي تك</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700"><span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">لم يبدأ</span></td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700"><span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 text-[10px]">عاجلة</span></td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">38000</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">0</td>
                        <td class="p-2 font-mono text-slate-500">2026-11-20</td>
                      </tr>
                      <!-- Row 3 (Example 2) -->
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td class="p-2 text-center font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-700">3</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">2</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-blue-600 dark:text-blue-400">الأجهزة الأساسية</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">الغسالة</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 text-slate-400">Washing Machine</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700">أوتوماتيك 9 كيلو</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 bg-amber-50/40 dark:bg-amber-950/20 font-medium">إل جي انفرتر بالمجفف</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700"><span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 text-[10px]">قيد المقارنة</span></td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700"><span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 text-[10px]">عاجلة</span></td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">26000</td>
                        <td class="p-2 border-r border-slate-200 dark:border-slate-700 font-mono">0</td>
                        <td class="p-2 font-mono text-slate-500">2026-11-25</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                @if (copySuccess()) {
                  <div class="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <mat-icon class="!text-sm !w-4 !h-4">check</mat-icon>
                    <span>تم نسخ القالب بنجاح! افتح Google Sheets واضغط Ctrl+V في الخلية A1.</span>
                  </div>
                }
              </div>

              <!-- Columns Detailed Dictionary Cards -->
              <div>
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-2">
                  تفاصيل الأعمدة المعتمدة والقيم المقبولة:
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  @for (col of schemaColumns; track col.col) {
                    <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span class="w-5 h-5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                            {{ col.col }}
                          </span>
                          <span class="font-bold text-slate-900 dark:text-slate-100">{{ col.nameAr }}</span>
                        </div>
                        <span class="text-[10px] font-bold px-1.5 py-0.2 rounded"
                              [class.bg-rose-100]="col.required" [class.text-rose-700]="col.required"
                              [class.bg-slate-200]="!col.required" [class.text-slate-600]="!col.required">
                          {{ col.required ? 'إلزامي *' : 'اختياري' }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ col.descAr }}</p>
                      <div class="text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                        مثال: {{ col.example }}
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="button"
                  (click)="activeTab.set('import')"
                  class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <span>جاهز للاستيراد الآن</span>
                  <mat-icon class="!text-sm !w-4 !h-4">arrow_forward</mat-icon>
                </button>
              </div>

            </div>
          }

          <!-- TAB 2: IMPORT PROCESS -->
          @if (activeTab() === 'import') {
            <div class="space-y-4">
              
              <!-- Input Method Switcher -->
              <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  (click)="importMode.set('paste')"
                  class="p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer"
                  [class.bg-emerald-50]="importMode() === 'paste'"
                  [class.border-emerald-500]="importMode() === 'paste'"
                  [class.text-emerald-700]="importMode() === 'paste'"
                  [class.dark:bg-emerald-950/40]="importMode() === 'paste'"
                  [class.bg-slate-50]="importMode() !== 'paste'"
                  [class.border-slate-200]="importMode() !== 'paste'"
                  [class.text-slate-600]="importMode() !== 'paste'"
                >
                  <mat-icon class="text-base">content_paste</mat-icon>
                  <span>لصق الخلايا مباشرة (Copy & Paste)</span>
                </button>

                <button
                  type="button"
                  (click)="importMode.set('link')"
                  class="p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer"
                  [class.bg-emerald-50]="importMode() === 'link'"
                  [class.border-emerald-500]="importMode() === 'link'"
                  [class.text-emerald-700]="importMode() === 'link'"
                  [class.dark:bg-emerald-950/40]="importMode() === 'link'"
                  [class.bg-slate-50]="importMode() !== 'link'"
                  [class.border-slate-200]="importMode() !== 'link'"
                  [class.text-slate-600]="importMode() !== 'link'"
                >
                  <mat-icon class="text-base">link</mat-icon>
                  <span>رابط Google Sheet المباشر</span>
                </button>
              </div>

              <!-- Option 1: Paste Textarea -->
              @if (importMode() === 'paste') {
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <label for="pasted-content" class="font-bold text-slate-800 dark:text-slate-200">
                      الصق الخلايا المنسوخة من جدول Google Sheets هنا:
                    </label>
                    <span class="text-slate-400 text-[11px]">حدد الخلايا في Google Sheets، اضغط Ctrl+C ثم الصقها هنا</span>
                  </div>
                  <textarea
                    id="pasted-content"
                    [value]="pastedText()"
                    (input)="onTextInput($event)"
                    rows="6"
                    placeholder="الصق هنا (مثال: # \t القسم \t اسم الصنف \t المواصفات \t ملاحظاتي \t الحالة \t الأولوية \t السعر ...)"
                    class="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  ></textarea>
                </div>
              }

              <!-- Option 2: Google Sheets URL / ID -->
              @if (importMode() === 'link') {
                <div class="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label for="sheet-url-input" class="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    رابط جدول Google Sheet (URL) أو المعرف (ID):
                  </label>
                  <div class="flex gap-2">
                    <input
                      id="sheet-url-input"
                      type="text"
                      [value]="sheetUrl()"
                      (input)="onUrlInput($event)"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      class="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      (click)="fetchFromUrl()"
                      [disabled]="isFetching() || !sheetUrl().trim()"
                      class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      @if (isFetching()) {
                        <mat-icon class="!text-sm !w-4 !h-4 animate-spin">sync</mat-icon>
                        <span>جاري القراءة...</span>
                      } @else {
                        <mat-icon class="!text-sm !w-4 !h-4">cloud_sync</mat-icon>
                        <span>قراءة الجدول</span>
                      }
                    </button>
                  </div>
                  <p class="text-[11px] text-slate-400">
                    💡 تأكد من مشاركة الجدول برابط عام أو تسجيل الدخول بحساب Google Workspace من التطبيق.
                  </p>
                </div>
              }

              <!-- Target Project & Account Options -->
              <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label for="target-project-select" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      إضافة الأصناف إلى مشروع:
                    </label>
                    <select
                      id="target-project-select"
                      [value]="selectedProjectId()"
                      (change)="onProjectChange($event)"
                      class="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                    >
                      @for (p of storage.projects(); track p.id) {
                        <option [value]="p.id">{{ p.nameAr }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <span class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      حساب المالك وحالة النشر:
                    </span>
                    <label class="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="publishToShared()"
                        (change)="onPublishToggle($event)"
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span class="text-xs font-medium text-slate-800 dark:text-slate-200">
                        نشر الأصناف في مساحة العمل المشتركة للجميع (Published)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Live Parsed Rows Preview Table -->
              @if (parsedResult(); as res) {
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 dark:text-slate-100">
                        معاينة الأصناف المستخرجة جاهزة للحفظ ({{ res.items.length }} صنف)
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {{ res.categoriesFound.length }} تصنيف
                      </span>
                    </div>
                  </div>

                  @if (res.warnings.length > 0) {
                    <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                      {{ res.warnings[0] }}
                    </div>
                  }

                  <div class="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table class="w-full text-xs text-right border-collapse">
                      <thead class="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <tr>
                          <th class="p-2 border-b">#</th>
                          <th class="p-2 border-b">القسم</th>
                          <th class="p-2 border-b">اسم الجهاز</th>
                          <th class="p-2 border-b">المواصفات وملاحظاتي</th>
                          <th class="p-2 border-b">الحالة</th>
                          <th class="p-2 border-b">السعر</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (it of res.items; track $index) {
                          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td class="p-2 font-mono text-slate-400">{{ it.itemNumber }}</td>
                            <td class="p-2 font-semibold text-blue-600 dark:text-blue-400">{{ it.category }}</td>
                            <td class="p-2 font-bold text-slate-900 dark:text-slate-100">{{ it.titleAr }}</td>
                            <td class="p-2 text-slate-500 truncate max-w-[200px]">{{ it.myNotes || it.notes || '-' }}</td>
                            <td class="p-2">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    [class.bg-emerald-100]="it.status === 'purchased'" [class.text-emerald-800]="it.status === 'purchased'"
                                    [class.bg-amber-100]="it.status === 'comparing'" [class.text-amber-800]="it.status === 'comparing'"
                                    [class.bg-slate-100]="it.status === 'pending'" [class.text-slate-700]="it.status === 'pending'">
                                {{ it.status === 'purchased' ? 'تم الشراء' : it.status === 'comparing' ? 'قيد المقارنة' : 'لم يبدأ' }}
                              </span>
                            </td>
                            <td class="p-2 font-mono font-bold">{{ (it.actualCost || it.estimatedCost || 0).toLocaleString() }} ج.م</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Save Button -->
                  <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      سيتم ربط الأصناف بحسابك الحالي: <strong>{{ auth.currentUser().name }}</strong>
                    </span>

                    <button
                      type="button"
                      (click)="executeImport()"
                      [disabled]="res.items.length === 0"
                      class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">download_done</mat-icon>
                      <span>استيراد {{ res.items.length }} صنف إلى القائمة فوراً</span>
                    </button>
                  </div>
                </div>
              }

              @if (importSuccessMessage()) {
                <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-in zoom-in-95">
                  <mat-icon class="text-emerald-600 text-lg">check_circle</mat-icon>
                  <span>{{ importSuccessMessage() }}</span>
                </div>
              }

            </div>
          }

        </div>

      </div>
    </div>
  `
})
export class GoogleSheetImportModalComponent {
  i18n = inject(I18nService);
  workspace = inject(WorkspaceService);
  storage = inject(StorageService);
  auth = inject(AuthService);
  firebase = inject(FirebaseService);

  closeModal = output<void>();

  activeTab = signal<'schema' | 'import'>('schema');
  importMode = signal<'paste' | 'link'>('paste');

  schemaColumns: SheetColumnSchema[] = this.workspace.getSchemaColumns();

  pastedText = signal<string>('');
  sheetUrl = signal<string>('');
  isFetching = signal<boolean>(false);
  copySuccess = signal<boolean>(false);
  importSuccessMessage = signal<string>('');

  selectedProjectId = signal<string>('home_appliances');
  publishToShared = signal<boolean>(true);

  parsedResult = signal<ParsedSheetResult | null>(null);

  constructor() {
    this.selectedProjectId.set(this.storage.activeProjectId());
  }

  copyTemplateToClipboard() {
    const tsv = this.workspace.generateGoogleSheetsTemplateTsv();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tsv).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 4000);
      });
    }
  }

  downloadSampleCsv() {
    const csv = this.workspace.generateGoogleSheetsTemplateCsv();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CheckMate_Google_Sheets_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  onTextInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.pastedText.set(val);
    if (!val.trim()) {
      this.parsedResult.set(null);
      return;
    }
    const res = this.workspace.parsePastedText(val, this.selectedProjectId());
    this.parsedResult.set(res);
  }

  onUrlInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.sheetUrl.set(val);
  }

  onProjectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedProjectId.set(val);
    if (this.pastedText().trim()) {
      const res = this.workspace.parsePastedText(this.pastedText(), val);
      this.parsedResult.set(res);
    }
  }

  onPublishToggle(event: Event) {
    const val = (event.target as HTMLInputElement).checked;
    this.publishToShared.set(val);
  }

  async fetchFromUrl() {
    const url = this.sheetUrl().trim();
    if (!url) return;
    this.isFetching.set(true);
    try {
      const token = this.firebase.getAccessToken() || undefined;
      const res = await this.workspace.fetchFromGoogleSheetsApi(url, token, this.selectedProjectId());
      this.parsedResult.set(res);
      if (!res.success) {
        this.importSuccessMessage.set(res.message);
        setTimeout(() => this.importSuccessMessage.set(''), 4000);
      }
    } finally {
      this.isFetching.set(false);
    }
  }

  executeImport() {
    const res = this.parsedResult();
    if (!res || res.items.length === 0) return;

    const count = this.storage.importBatchItems(
      res.items,
      this.selectedProjectId(),
      this.publishToShared()
    );

    this.importSuccessMessage.set(`تم استيراد ${count} صنف بنجاح ومزامنتها مع مساحة عملك!`);
    this.parsedResult.set(null);
    this.pastedText.set('');
    this.sheetUrl.set('');

    setTimeout(() => {
      this.importSuccessMessage.set('');
      this.closeModal.emit();
    }, 2000);
  }
}
