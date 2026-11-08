import { Component, ChangeDetectionStrategy, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { ChecklistItem, ItemPriority, ItemStatus } from '../core/checklist-rules';

@Component({
  selector: 'app-item-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-xl">{{ item() ? 'edit' : 'add_task' }}</mat-icon>
            </div>
            <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
              {{ item() ? i18n.t().editItem : i18n.t().addItem }}
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
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
          
          <!-- Category & Title -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="item-category" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().category }} *
              </label>
              <input
                id="item-category"
                type="text"
                formControlName="category"
                placeholder="مثال: الأجهزة الأساسية"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-title-ar" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().itemTitle }} (العربية) *
              </label>
              <input
                id="item-title-ar"
                type="text"
                formControlName="titleAr"
                placeholder="مثال: الثلاجة"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- English Title -->
          <div>
            <label for="item-title-en" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {{ i18n.t().itemTitle }} (English)
            </label>
            <input
              id="item-title-en"
              type="text"
              formControlName="titleEn"
              placeholder="e.g. Refrigerator"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Spec Notes & My Notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="item-notes" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().specNotes }}
              </label>
              <input
                id="item-notes"
                type="text"
                formControlName="notes"
                placeholder="مثال: نوفروست / أوتوماتيك"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-my-notes" class="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                {{ i18n.t().myNotes }}
              </label>
              <input
                id="item-my-notes"
                type="text"
                formControlName="myNotes"
                placeholder="ماركة X - معرض Y"
                class="w-full text-xs px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-600/60 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Status & Priority -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="item-status" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().status }}
              </label>
              <select
                id="item-status"
                formControlName="status"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">⬜ لسه (Pending)</option>
                <option value="comparing">⏳ قيد المقارنة (Comparing)</option>
                <option value="purchased">✅ تم الشراء (Purchased)</option>
                <option value="delivered">🚚 تم التوصيل (Delivered)</option>
              </select>
            </div>

            <div>
              <label for="item-priority" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().priority }}
              </label>
              <select
                id="item-priority"
                formControlName="priority"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="urgent">🔴 عاجل جداً</option>
                <option value="high">🟠 مرتفع</option>
                <option value="medium">🟡 متوسط</option>
                <option value="low">🟢 منخفض / اختياري</option>
              </select>
            </div>
          </div>

          <!-- Costs & Target Date -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="item-est-cost" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().cost }} (ج.م)
              </label>
              <input
                id="item-est-cost"
                type="number"
                formControlName="estimatedCost"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-act-cost" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().actualCost }} (ج.م)
              </label>
              <input
                id="item-act-cost"
                type="number"
                formControlName="actualCost"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-target-date" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().targetDate }}
              </label>
              <input
                id="item-target-date"
                type="date"
                formControlName="targetDate"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Tags input comma-separated -->
          <div>
            <label for="item-tags-input" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {{ i18n.t().tags }} (مفصولة بفواصل)
            </label>
            <input
              id="item-tags-input"
              type="text"
              formControlName="tagsString"
              placeholder="أساسي, مطبخ, موفر للطاقة"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Buttons -->
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
              [disabled]="form.invalid"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer"
            >
              {{ i18n.t().save }}
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
})
export class ItemModalComponent implements OnInit {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  item = input<ChecklistItem | null>(null);
  closeModal = output<void>();

  form = new FormGroup({
    category: new FormControl('', [Validators.required]),
    titleAr: new FormControl('', [Validators.required]),
    titleEn: new FormControl(''),
    notes: new FormControl(''),
    myNotes: new FormControl(''),
    status: new FormControl<ItemStatus>('pending'),
    priority: new FormControl<ItemPriority>('medium'),
    estimatedCost: new FormControl(0),
    actualCost: new FormControl(0),
    targetDate: new FormControl(''),
    tagsString: new FormControl(''),
  });

  ngOnInit() {
    const it = this.item();
    if (it) {
      this.form.patchValue({
        category: it.category,
        titleAr: it.titleAr,
        titleEn: it.titleEn,
        notes: it.notes,
        myNotes: it.myNotes,
        status: it.status,
        priority: it.priority,
        estimatedCost: it.estimatedCost,
        actualCost: it.actualCost,
        targetDate: it.targetDate,
        tagsString: (it.tags || []).join(', '),
      });
    } else {
      this.form.patchValue({
        category: 'الأجهزة الأساسية',
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const rawTags = (v.tagsString || '').split(',').map(s => s.trim()).filter(Boolean);

    const it = this.item();
    if (it) {
      this.storage.updateItem({
        ...it,
        category: v.category || it.category,
        titleAr: v.titleAr || it.titleAr,
        titleEn: v.titleEn || it.titleEn,
        notes: v.notes || '',
        myNotes: v.myNotes || '',
        status: (v.status as ItemStatus) || it.status,
        priority: (v.priority as ItemPriority) || it.priority,
        estimatedCost: Number(v.estimatedCost) || 0,
        actualCost: Number(v.actualCost) || 0,
        targetDate: v.targetDate || '',
        tags: rawTags,
      });
    } else {
      this.storage.addItem({
        folderId: this.storage.activeProjectId(),
        category: v.category || 'الأجهزة الأساسية',
        titleAr: v.titleAr || '',
        titleEn: v.titleEn || v.titleAr || '',
        notes: v.notes || '',
        myNotes: v.myNotes || '',
        status: (v.status as ItemStatus) || 'pending',
        priority: (v.priority as ItemPriority) || 'medium',
        estimatedCost: Number(v.estimatedCost) || 0,
        actualCost: Number(v.actualCost) || 0,
        currency: 'EGP',
        targetDate: v.targetDate || '',
        tags: rawTags,
      });
    }
    this.closeModal.emit();
  }
}
