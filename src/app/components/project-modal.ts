import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-project-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-xl">create_new_folder</mat-icon>
            </div>
            <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
              {{ i18n.t().newProject }}
            </h3>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="folderForm" (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
          
          <div>
            <label for="proj-name-ar" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم المجلد / المشروع (العربية) *
            </label>
            <input
              id="proj-name-ar"
              type="text"
              formControlName="nameAr"
              placeholder="مثال: تشطيبات الحمام والسباكة"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="proj-name-en" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name (English)
            </label>
            <input
              id="proj-name-en"
              type="text"
              formControlName="nameEn"
              placeholder="e.g. Bathroom & Plumbing Works"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="proj-budget" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الميزانية المخصصة (ج.م)
              </label>
              <input
                id="proj-budget"
                type="number"
                formControlName="budget"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="proj-icon" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الأيقونة
              </label>
              <select
                id="proj-icon"
                formControlName="icon"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="folder">📁 مجلد عام (Folder)</option>
                <option value="kitchen">🍳 مطبخ وأجهزة (Kitchen)</option>
                <option value="weekend">🛋️ أثاث وصالون (Living)</option>
                <option value="bed">🛏️ غرف نوم (Bedroom)</option>
                <option value="plumbing">🚿 سباكة وصحي (Plumbing)</option>
                <option value="format_paint">🎨 دهانات وديكور (Decor)</option>
                <option value="devices">💻 إلكترونيات وشاشات (Electronics)</option>
              </select>
            </div>
          </div>

          <!-- Color selection -->
          <div>
            <label for="proj-color" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              لون المجلد
            </label>
            <div class="flex items-center gap-3">
              <input
                id="proj-color"
                type="color"
                formControlName="color"
                class="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <span class="text-xs text-slate-500 font-mono">{{ folderForm.value.color }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {{ i18n.t().cancel }}
            </button>
            <button
              type="submit"
              [disabled]="folderForm.invalid"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer"
            >
              إنشاء المجلد
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
})
export class ProjectModalComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  closeModal = output<void>();

  folderForm = new FormGroup({
    nameAr: new FormControl('', [Validators.required]),
    nameEn: new FormControl(''),
    budget: new FormControl(50000),
    icon: new FormControl('folder'),
    color: new FormControl('#3b82f6'),
  });

  onSubmit() {
    if (this.folderForm.invalid) return;
    const v = this.folderForm.value;
    this.storage.addProject({
      nameAr: v.nameAr || 'مشروع جديد',
      nameEn: v.nameEn || v.nameAr || 'New Project',
      budget: Number(v.budget) || 0,
      icon: v.icon || 'folder',
      color: v.color || '#3b82f6',
    });
    this.closeModal.emit();
  }
}
