import { Component, ChangeDetectionStrategy, inject, input, output, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem, ItemPriority, ItemStatus } from '../core/checklist-rules';

@Component({
  selector: 'app-item-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-xl">{{ item() ? 'edit' : 'add_task' }}</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                {{ item() ? i18n.t().editItem : i18n.t().addItem }}
              </h3>
              <p class="text-[11px] text-slate-400">
                {{ i18n.isRtl() ? 'تفاصيل الصنف والمواصفات والتكلفة والموقع' : 'Item details, specs, costs, comments, and store location' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            [attr.aria-label]="i18n.t().close"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-3.5">
          
          <!-- 1. Name (in AR & EN) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="item-title-ar" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().itemTitleAr }} *
              </label>
              <input
                id="item-title-ar"
                type="text"
                formControlName="titleAr"
                [placeholder]="i18n.t().titleArPlaceholder"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-title-en" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().itemTitleEn }}
              </label>
              <input
                id="item-title-en"
                type="text"
                formControlName="titleEn"
                [placeholder]="i18n.t().titleEnPlaceholder"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- 2. Category -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="item-category" class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {{ i18n.t().category }} *
              </label>
              <span class="text-[10px] text-slate-400">{{ i18n.t().quickSelectHint }}</span>
            </div>
            <input
              id="item-category"
              type="text"
              formControlName="category"
              [placeholder]="i18n.t().categoryPlaceholder"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <!-- Quick Category Chips -->
            <div class="flex flex-wrap gap-1 mt-1.5">
              @for (cat of availableCategories(); track cat) {
                <button
                  type="button"
                  (click)="form.patchValue({ category: cat })"
                  class="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {{ cat }}
                </button>
              }
            </div>
          </div>

          <!-- 3. Recommended Specs & 4. Notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="item-notes" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().specNotes }}
              </label>
              <input
                id="item-notes"
                type="text"
                formControlName="notes"
                [placeholder]="i18n.t().specNotesPlaceholder"
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
                [placeholder]="i18n.t().myNotesPlaceholder"
                class="w-full text-xs px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-600/60 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- 5. Purchased? (Status) & 6. Priority -->
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
                <option value="pending">{{ i18n.t().statusPending }}</option>
                <option value="comparing">{{ i18n.t().statusComparing }}</option>
                <option value="purchased">{{ i18n.t().statusPurchased }}</option>
                <option value="delivered">{{ i18n.t().statusDelivered }}</option>
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
                <option value="urgent">🔴 {{ i18n.t().priorityUrgent }}</option>
                <option value="high">🟠 {{ i18n.t().priorityHigh }}</option>
                <option value="medium">🟡 {{ i18n.t().priorityMedium }}</option>
                <option value="low">🟢 {{ i18n.t().priorityLow }}</option>
              </select>
            </div>
          </div>

          <!-- 7. Estimated Cost (ج.م), 8. Actual Price Paid (ج.م), 9. Target Purchase Date -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="item-est-cost" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().cost }}
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
                {{ i18n.t().actualCost }}
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

          <!-- 10. Tags (مفصولة بفواصل) & 11. Store Location (Optional) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="item-tags-input" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().tagsCommaSeparated }}
              </label>
              <input
                id="item-tags-input"
                type="text"
                formControlName="tagsString"
                [placeholder]="i18n.t().tagsPlaceholder"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="item-store-location" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().storeLocationOptional }}
              </label>
              <input
                id="item-store-location"
                type="text"
                formControlName="storeLocation"
                [placeholder]="i18n.t().storeLocationPlaceholder"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <!-- Quick saved map locations chips -->
              <div class="flex flex-wrap gap-1 mt-1">
                @for (loc of storage.mapLocations().slice(0, 4); track loc.id) {
                  <button
                    type="button"
                    (click)="form.patchValue({ storeLocation: i18n.isRtl() ? loc.nameAr : loc.nameEn })"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <mat-icon class="!text-[10px] !w-2.5 !h-2.5">location_on</mat-icon>
                    <span>{{ i18n.isRtl() ? loc.nameAr : loc.nameEn }}</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- 12. Comments & Discussion -->
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label for="item-new-comment" class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {{ i18n.t().comments }} ({{ localComments().length }})
            </label>

            @if (localComments().length > 0) {
              <div class="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                @for (c of localComments(); track c.id) {
                  <div class="text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <span class="font-bold text-slate-800 dark:text-slate-200">{{ c.userName }}: </span>
                      <span class="text-slate-600 dark:text-slate-300">{{ c.text }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 shrink-0">{{ c.timestamp }}</span>
                  </div>
                }
              </div>
            }

            <div class="flex gap-2">
              <input
                id="item-new-comment"
                type="text"
                formControlName="newComment"
                [placeholder]="i18n.t().writeComment"
                class="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                (click)="addInlineComment()"
                class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="!text-sm !w-4 !h-4">add_comment</mat-icon>
                <span>{{ i18n.t().addComment }}</span>
              </button>
            </div>
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
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="!text-sm !w-4 !h-4">save</mat-icon>
              <span>{{ i18n.t().save }}</span>
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
  auth = inject(AuthService);

  item = input<ChecklistItem | null>(null);
  closeModal = output<void>();

  localComments = signal< NonNullable<ChecklistItem['comments']> >([]);

  availableCategories = computed(() => {
    const userCats = this.storage.categories();
    const projectCats = this.storage.currentProjectItems().map(it => it.category).filter(Boolean);
    const set = new Set<string>([...userCats, ...projectCats]);
    return Array.from(set);
  });

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
    storeLocation: new FormControl(''),
    newComment: new FormControl(''),
  });

  ngOnInit() {
    const it = this.item();
    if (it) {
      this.localComments.set([...(it.comments || [])]);
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
        storeLocation: it.storeLocation || it.storeName || '',
      });
    } else {
      const firstCat = this.availableCategories()[0] || '';
      this.form.patchValue({
        category: firstCat,
      });
    }
  }

  addInlineComment() {
    const txt = (this.form.controls.newComment.value || '').trim();
    if (!txt) return;
    const user = this.auth.currentUser();
    const nextComm = {
      id: 'c_' + Date.now(),
      userName: this.i18n.isRtl() ? user.name : user.nameEn,
      text: txt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: user.avatar,
    };
    this.localComments.update(prev => [...prev, nextComm]);
    this.form.controls.newComment.setValue('');
  }

  onSubmit() {
    if (this.form.invalid) return;
    const v = this.form.value;

    // If user typed a comment in newComment field without clicking addInlineComment, include it
    const pendingComment = (v.newComment || '').trim();
    if (pendingComment) {
      this.addInlineComment();
    }

    const rawTags = (v.tagsString || '').split(',').map(s => s.trim()).filter(Boolean);
    const storeLoc = (v.storeLocation || '').trim();

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
        storeLocation: storeLoc,
        storeName: storeLoc,
        comments: this.localComments(),
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
        storeLocation: storeLoc,
        storeName: storeLoc,
        comments: this.localComments(),
      });
    }
    this.closeModal.emit();
  }
}
