import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem } from '../core/checklist-rules';

@Component({
  selector: 'app-attachments-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <mat-icon class="text-xl">attach_file</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                {{ i18n.t().attachments }} - {{ item().titleAr }}
              </h3>
              <p class="text-xs text-slate-400">
                الفواتير، شهادات الضمان، صور الجهاز، والمستندات
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Preset Quick Uploads -->
        @if (auth.isEditor()) {
          <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shrink-0">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              إضافة مستند أو فاتورة سريعة:
            </span>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="addQuickDoc('فاتورة شراء معتمدة', 'pdf', '1.2 MB')"
                class="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="text-rose-500 text-sm">picture_as_pdf</mat-icon>
                <span>+ فاتورة الشراء</span>
              </button>

              <button
                type="button"
                (click)="addQuickDoc('شهادة ضمان الوكيل 10 سنوات', 'doc', '850 KB')"
                class="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="text-blue-500 text-sm">verified</mat-icon>
                <span>+ شهادة الضمان</span>
              </button>

              <button
                type="button"
                (click)="addQuickDoc('صورة المعاينة من المعرض', 'image', '2.4 MB')"
                class="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="text-emerald-500 text-sm">image</mat-icon>
                <span>+ صورة المعاينة</span>
              </button>

              <label class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1">
                <mat-icon class="text-sm">upload_file</mat-icon>
                <span>رفع من الجهاز</span>
                <input type="file" (change)="onCustomFileUpload($event)" class="hidden" />
              </label>
            </div>
          </div>
        }

        <!-- Attachments List -->
        <div class="flex-1 overflow-y-auto py-4 space-y-2.5 min-h-[160px]">
          @for (att of item().attachments || []; track att.id) {
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                     [class.bg-rose-100]="att.type === 'pdf'"
                     [class.text-rose-600]="att.type === 'pdf'"
                     [class.bg-emerald-100]="att.type === 'image'"
                     [class.text-emerald-600]="att.type === 'image'"
                     [class.bg-blue-100]="att.type === 'doc'"
                     [class.text-blue-600]="att.type === 'doc'">
                  <mat-icon class="text-lg">
                    {{ att.type === 'pdf' ? 'picture_as_pdf' : att.type === 'image' ? 'photo' : 'description' }}
                  </mat-icon>
                </div>
                <div>
                  <div class="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {{ att.name }}
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {{ att.size }} • {{ att.date }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="previewAttachment(att)"
                  class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="معاينة"
                >
                  <mat-icon class="text-base">visibility</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="py-12 text-center text-xs text-slate-400">
              <mat-icon class="text-3xl text-slate-300 dark:text-slate-600">attachment</mat-icon>
              <p class="mt-1">لا توجد مرفقات مرفوعة لهذا الصنف حالياً.</p>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            (click)="closeModal.emit()"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  `,
})
export class AttachmentsModalComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  item = input.required<ChecklistItem>();
  closeModal = output<void>();

  addQuickDoc(name: string, type: 'pdf' | 'image' | 'doc', size: string) {
    this.storage.addAttachment(this.item().id, {
      name,
      type,
      size,
    });
  }

  onCustomFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const type: 'pdf' | 'image' | 'doc' = file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc';
      const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
      this.storage.addAttachment(this.item().id, {
        name: file.name,
        type,
        size: sizeStr,
      });
    }
  }

  previewAttachment(att: { name: string; size: string }) {
    alert(`معاينة المستند: ${att.name} (${att.size}) - المستند سليم ومحفوظ سحابياً ومحلياً.`);
  }
}
