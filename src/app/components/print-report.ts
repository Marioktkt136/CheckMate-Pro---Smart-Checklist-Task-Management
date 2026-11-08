import { Component, ChangeDetectionStrategy, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { calculateChecklistStats } from '../core/checklist-rules';

@Component({
  selector: 'app-print-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 flex justify-center">
      <div class="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Action Toolbar (Hidden in print) -->
        <div class="no-print flex items-center justify-between pb-4 border-b border-slate-200">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
            <mat-icon class="text-rose-600">picture_as_pdf</mat-icon>
            <span>معاينة تقرير المشتريات والمهام للطباعة / الحفظ كـ PDF</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="printDoc()"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <mat-icon class="text-base">print</mat-icon>
              <span>طباعة / حفظ PDF الآن</span>
            </button>
            <button
              type="button"
              (click)="closeReport.emit()"
              class="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

        <!-- Official Report Paper Content (Visible on Screen & in Print) -->
        <div class="space-y-6 text-right rtl:text-right ltr:text-left print-break-inside-avoid">
          
          <!-- Document Header -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 class="text-2xl font-black text-slate-900">
                {{ storage.activeProject().nameAr }}
              </h1>
              <p class="text-xs text-slate-600 mt-1">
                تقرير متابعة الأجهزة والمشتريات والمواصفات المعتمدة - CheckMate Pro
              </p>
            </div>
            <div class="text-left rtl:text-left ltr:text-right text-xs text-slate-500">
              <div><strong>تاريخ التقرير:</strong> {{ todayDate }}</div>
              <div><strong>المسؤول:</strong> {{ auth.currentUser().name }}</div>
              <div><strong>الحالة:</strong> معتمد سحابياً</div>
            </div>
          </div>

          <!-- Summary KPI Badges -->
          <div class="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <div class="text-xs text-slate-500">إجمالي الأصناف</div>
              <div class="text-lg font-bold text-slate-900">{{ stats().total }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">تم الشراء</div>
              <div class="text-lg font-bold text-emerald-600">{{ stats().completed }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">الميزانية التقديرية</div>
              <div class="text-lg font-bold text-blue-600">{{ stats().totalEstimated.toLocaleString() }} ج.م</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">المبلغ المدفوع فعلياً</div>
              <div class="text-lg font-bold text-purple-600">{{ stats().totalActual.toLocaleString() }} ج.م</div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="w-full text-xs border-collapse border border-slate-300">
            <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th class="border border-slate-300 p-2 text-center w-8">م</th>
                <th class="border border-slate-300 p-2">المجموعة</th>
                <th class="border border-slate-300 p-2">الصنف</th>
                <th class="border border-slate-300 p-2">المواصفات المطلوبة</th>
                <th class="border border-slate-300 p-2">ملاحظاتي (الماركة والمعرض)</th>
                <th class="border border-slate-300 p-2 text-center">تم الشراء؟</th>
                <th class="border border-slate-300 p-2 text-center">السعر</th>
              </tr>
            </thead>
            <tbody>
              @for (item of storage.currentProjectItems(); track item.id) {
                <tr [class.bg-emerald-50]="item.status === 'purchased' || item.status === 'delivered'">
                  <td class="border border-slate-300 p-2 text-center font-bold">{{ item.itemNumber }}</td>
                  <td class="border border-slate-300 p-2 font-semibold">{{ item.category }}</td>
                  <td class="border border-slate-300 p-2 font-bold">{{ item.titleAr }}</td>
                  <td class="border border-slate-300 p-2 text-slate-600">{{ item.notes || '-' }}</td>
                  <td class="border border-slate-300 p-2 text-amber-900 bg-amber-50/50">{{ item.myNotes || '-' }}</td>
                  <td class="border border-slate-300 p-2 text-center font-bold">
                    {{ item.status === 'purchased' ? '✅ تم الشراء' : item.status === 'delivered' ? '🚚 تم التوصيل' : item.status === 'comparing' ? '⏳ قيد المقارنة' : '⬜ لسه' }}
                  </td>
                  <td class="border border-slate-300 p-2 text-center font-semibold">
                    {{ (item.actualCost || item.estimatedCost || 0).toLocaleString() }} ج.م
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Signatures Section -->
          <div class="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div>
              <div class="font-bold text-slate-800 mb-8">إعداد ومتابعة المشتريات</div>
              <div class="border-t border-slate-400 pt-1">التوقيع: ............................</div>
            </div>
            <div>
              <div class="font-bold text-slate-800 mb-8">مهندس الإشراف والديكور</div>
              <div class="border-t border-slate-400 pt-1">التوقيع: ............................</div>
            </div>
            <div>
              <div class="font-bold text-slate-800 mb-8">اعتماد مالك المشروع</div>
              <div class="border-t border-slate-400 pt-1">التوقيع: ............................</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class PrintReportComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  closeReport = output<void>();

  todayDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  stats = computed(() => {
    return calculateChecklistStats(this.storage.currentProjectItems(), this.storage.activeProject().budget);
  });

  printDoc() {
    window.print();
  }
}
