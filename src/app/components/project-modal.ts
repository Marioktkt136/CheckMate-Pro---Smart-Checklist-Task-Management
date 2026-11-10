import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
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
              {{ i18n.isRtl() ? 'اسم المجلد / المشروع (العربية) *' : 'Project / Folder Name (Arabic)' }}
            </label>
            <input
              id="proj-name-ar"
              type="text"
              formControlName="nameAr"
              [placeholder]="i18n.isRtl() ? 'مثال: تشطيبات الحمام والسباكة' : 'e.g. تشطيبات الحمام والسباكة'"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="proj-name-en" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {{ i18n.isRtl() ? 'اسم المشروع (English)' : 'Project Name (English) *' }}
            </label>
            <input
              id="proj-name-en"
              type="text"
              formControlName="nameEn"
              [placeholder]="i18n.isRtl() ? 'مثال: Bathroom & Plumbing Works' : 'e.g. Bathroom & Plumbing Works'"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="proj-budget" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.isRtl() ? 'الميزانية المخصصة (ج.م)' : 'Allocated Budget (ج.م)' }}
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
                {{ i18n.isRtl() ? 'الأيقونة' : 'Folder Icon' }}
              </label>
              <select
                id="proj-icon"
                formControlName="icon"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="folder">{{ i18n.isRtl() ? '📁 مجلد عام (Folder)' : '📁 General Folder' }}</option>
                <option value="kitchen">{{ i18n.isRtl() ? '🍳 مطبخ وأجهزة (Kitchen)' : '🍳 Kitchen & Appliances' }}</option>
                <option value="weekend">{{ i18n.isRtl() ? '🛋️ أثاث وصالون (Living)' : '🛋️ Furniture & Living' }}</option>
                <option value="bed">{{ i18n.isRtl() ? '🛏️ غرف نوم (Bedroom)' : '🛏️ Bedrooms' }}</option>
                <option value="plumbing">{{ i18n.isRtl() ? '🚿 سباكة وصحي (Plumbing)' : '🚿 Plumbing & Bath' }}</option>
                <option value="format_paint">{{ i18n.isRtl() ? '🎨 دهانات وديكور (Decor)' : '🎨 Paint & Decor' }}</option>
                <option value="devices">{{ i18n.isRtl() ? '💻 إلكترونيات وشاشات (Electronics)' : '💻 Electronics & Screens' }}</option>
              </select>
            </div>
          </div>

          <!-- Color selection -->
          <div>
            <label for="proj-color" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {{ i18n.isRtl() ? 'لون المجلد' : 'Folder Color' }}
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

          @if (storage.projects().length > 0) {
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                {{ i18n.isRtl() ? 'المشاريع الحالية' : 'Current Projects' }} ({{ storage.projects().length }})
              </div>
              <div class="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                @for (proj of storage.projects(); track proj.id) {
                  <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                    <button
                      type="button"
                      (click)="onSelectExistingProject(proj.id)"
                      class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 cursor-pointer truncate text-start flex-1"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4" [style.color]="proj.color">{{ proj.icon }}</mat-icon>
                      <span class="truncate">{{ i18n.isRtl() ? proj.nameAr : proj.nameEn }}</span>
                    </button>
                    <button
                      type="button"
                      (click)="storage.deleteProject(proj.id)"
                      class="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                      [title]="i18n.isRtl() ? 'حذف المشروع' : 'Delete Project'"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">delete_outline</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>
          }

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
              [disabled]="!hasProjectName()"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
            >
              <mat-icon class="text-sm">add</mat-icon>
              <span>{{ i18n.isRtl() ? 'إنشاء المجلد' : 'Create Project' }}</span>
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
    nameAr: new FormControl(''),
    nameEn: new FormControl(''),
    budget: new FormControl(50000),
    icon: new FormControl('folder'),
    color: new FormControl('#3b82f6'),
  });

  hasProjectName(): boolean {
    const ar = (this.folderForm.value.nameAr || '').trim();
    const en = (this.folderForm.value.nameEn || '').trim();
    return ar.length > 0 || en.length > 0;
  }

  onSelectExistingProject(id: string) {
    this.storage.selectProject(id);
    this.closeModal.emit();
  }

  onSubmit() {
    if (!this.hasProjectName()) return;
    const v = this.folderForm.value;
    const ar = (v.nameAr || '').trim();
    const en = (v.nameEn || '').trim();
    this.storage.addProject({
      nameAr: ar || en || 'مشروع جديد',
      nameEn: en || ar || 'New Project',
      budget: Number(v.budget) || 0,
      icon: v.icon || 'folder',
      color: v.color || '#3b82f6',
    });
    this.closeModal.emit();
  }
}
