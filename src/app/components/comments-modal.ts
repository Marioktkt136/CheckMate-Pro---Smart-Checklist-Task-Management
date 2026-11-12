import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem, ItemComment } from '../core/checklist-rules';

@Component({
  selector: 'app-comments-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-xl">forum</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                  {{ i18n.t().comments }} - {{ i18n.isRtl() ? liveItem().titleAr : (liveItem().titleEn || liveItem().titleAr) }}
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {{ comments().length }}
                </span>
              </div>
              <p class="text-xs text-slate-400">
                {{ i18n.isRtl() ? 'مناقشات وملاحظات الشراء والتنفيذ لهذا الصنف (تحديث فوري)' : 'Item discussion, showroom comparisons, and purchase notes (Live sync)' }}
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

        <!-- Status Toast Banner -->
        @if (statusBanner()) {
          <div class="mt-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-1.5">
              <mat-icon class="text-emerald-600 !text-base !w-4 !h-4">check_circle</mat-icon>
              <span>{{ statusBanner() }}</span>
            </div>
            <button type="button" (click)="statusBanner.set('')" class="text-emerald-600 hover:text-emerald-800 cursor-pointer">
              <mat-icon class="!text-sm !w-3.5 !h-3.5">close</mat-icon>
            </button>
          </div>
        }

        <!-- Quick Comment Chips -->
        <div class="mt-3 pt-1 shrink-0">
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
            {{ i18n.isRtl() ? 'إضافة تعليق سريع بنقرة واحدة:' : 'One-click quick comment:' }}
          </span>
          <div class="flex flex-wrap gap-1.5">
            @for (chip of quickChips(); track chip) {
              <button
                type="button"
                (click)="publishQuickComment(chip)"
                class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                + {{ chip }}
              </button>
            }
          </div>
        </div>

        <!-- Comments List -->
        <div class="flex-1 overflow-y-auto py-4 space-y-2.5 min-h-[180px]">
          @for (comm of comments(); track comm.id) {
            <div
              class="flex items-start gap-3 p-3 rounded-xl border transition"
              [class.bg-amber-50/70]="comm.pinned"
              [class.dark:bg-amber-950/20]="comm.pinned"
              [class.border-amber-300]="comm.pinned"
              [class.dark:border-amber-700/60]="comm.pinned"
              [class.bg-slate-50]="!comm.pinned"
              [class.dark:bg-slate-800/60]="!comm.pinned"
              [class.border-slate-100]="!comm.pinned"
              [class.dark:border-slate-800]="!comm.pinned"
            >
              <span class="text-xl p-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-2xs shrink-0">{{ comm.avatar || '👤' }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-slate-900 dark:text-slate-100">{{ comm.userName }}</span>
                    @if (comm.pinned) {
                      <span class="px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold inline-flex items-center gap-0.5">
                        <mat-icon class="!text-[10px] !w-2.5 !h-2.5">push_pin</mat-icon>
                        <span>{{ i18n.isRtl() ? 'مثبّت' : 'Pinned' }}</span>
                      </span>
                    }
                    @if (comm.edited) {
                      <span class="text-[10px] text-slate-400 italic">
                        ({{ i18n.isRtl() ? 'معدّل' : 'edited' }})
                      </span>
                    }
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[10px] text-slate-400">{{ comm.timestamp }}</span>
                    <!-- Pin / Unpin -->
                    <button
                      type="button"
                      (click)="togglePin(comm)"
                      class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تثبيت التعليق' : 'Pin comment'"
                    >
                      <mat-icon class="!text-xs !w-3.5 !h-3.5">push_pin</mat-icon>
                    </button>
                    <!-- Edit -->
                    <button
                      type="button"
                      (click)="startEdit(comm)"
                      class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تعديل' : 'Edit'"
                    >
                      <mat-icon class="!text-xs !w-3.5 !h-3.5">edit</mat-icon>
                    </button>
                    <!-- Delete -->
                    <button
                      type="button"
                      (click)="deleteComment(comm.id)"
                      class="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'حذف' : 'Delete'"
                    >
                      <mat-icon class="!text-xs !w-3.5 !h-3.5">delete_outline</mat-icon>
                    </button>
                  </div>
                </div>

                @if (editingCommentId() === comm.id) {
                  <div class="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      [formControl]="editCommentControl"
                      (keydown.enter)="saveEdit(comm.id)"
                      class="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      (click)="saveEdit(comm.id)"
                      class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer flex items-center gap-0.5"
                    >
                      <mat-icon class="!text-xs !w-3.5 !h-3.5">check</mat-icon>
                      <span>{{ i18n.t().save }}</span>
                    </button>
                    <button
                      type="button"
                      (click)="cancelEdit()"
                      class="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] cursor-pointer"
                    >
                      {{ i18n.t().cancel }}
                    </button>
                  </div>
                } @else {
                  <p class="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                    {{ comm.text }}
                  </p>
                }
              </div>
            </div>
          } @empty {
            <div class="py-12 text-center text-xs text-slate-400">
              <mat-icon class="text-3xl text-slate-300 dark:text-slate-600">chat_bubble_outline</mat-icon>
              <p class="mt-1">
                {{ i18n.isRtl() ? 'لا توجد تعليقات لهذا الصنف بعد. كن أول من يضيف ملاحظة!' : 'No comments for this item yet. Add your first note below!' }}
              </p>
            </div>
          }
        </div>

        <!-- Add Comment Form -->
        <form [formGroup]="commentForm" (ngSubmit)="onAddComment()" class="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex gap-2">
            <input
              type="text"
              formControlName="commentText"
              [placeholder]="i18n.t().writeComment"
              class="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              [disabled]="commentForm.invalid"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <mat-icon class="text-sm">send</mat-icon>
              <span>{{ i18n.t().send }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
})
export class CommentsModalComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  item = input.required<ChecklistItem>();
  closeModal = output<void>();

  statusBanner = signal<string>('');
  editingCommentId = signal<string | null>(null);
  editCommentControl = new FormControl('', [Validators.required]);

  // Always resolve the latest item state from StorageService so the screen refreshes immediately
  liveItem = computed<ChecklistItem>(() => {
    const currentId = this.item().id;
    return this.storage.items().find(i => i.id === currentId) || this.item();
  });

  comments = computed<ItemComment[]>(() => {
    const list = [...(this.liveItem().comments || [])];
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  });

  quickChips = computed<string[]>(() => {
    if (this.i18n.isRtl()) {
      return [
        '✅ تم التأكد من السعر في المعرض',
        '⏳ في انتظار عرض الخصم',
        '🛡️ شامل ضمان الوكيل الرسمي',
        '📦 متوفر للتسليم الفوري',
      ];
    }
    return [
      '✅ Verified showroom price',
      '⏳ Waiting for discount offer',
      '🛡️ Official warranty included',
      '📦 Ready for immediate delivery',
    ];
  });

  commentForm = new FormGroup({
    commentText: new FormControl('', [Validators.required, Validators.minLength(1)]),
  });

  onAddComment() {
    if (this.commentForm.invalid) return;
    const text = this.commentForm.value.commentText?.trim();
    if (!text) return;

    const user = this.auth.currentUser();
    const authorName = this.i18n.isRtl() ? user.name : (user.nameEn || user.name);
    this.storage.addComment(this.liveItem().id, text, authorName, user.avatar);
    this.commentForm.reset();
    this.showStatus(this.i18n.isRtl() ? 'تم نشر التعليق وتحديث الشاشة فوراً' : 'Comment published and screen refreshed');
  }

  publishQuickComment(text: string) {
    const user = this.auth.currentUser();
    const authorName = this.i18n.isRtl() ? user.name : (user.nameEn || user.name);
    this.storage.addComment(this.liveItem().id, text, authorName, user.avatar);
    this.showStatus(this.i18n.isRtl() ? 'تمت إضافة التعليق السريع وتحديث الشاشة' : 'Quick comment published');
  }

  togglePin(comm: ItemComment) {
    this.storage.updateComment(this.liveItem().id, comm.id, { pinned: !comm.pinned });
  }

  startEdit(comm: ItemComment) {
    this.editingCommentId.set(comm.id);
    this.editCommentControl.setValue(comm.text);
  }

  saveEdit(commentId: string) {
    const newText = (this.editCommentControl.value || '').trim();
    if (!newText) return;
    this.storage.updateComment(this.liveItem().id, commentId, { text: newText, edited: true });
    this.editingCommentId.set(null);
    this.showStatus(this.i18n.isRtl() ? 'تم تحديث التعليق' : 'Comment updated');
  }

  cancelEdit() {
    this.editingCommentId.set(null);
  }

  deleteComment(commentId: string) {
    this.storage.deleteComment(this.liveItem().id, commentId);
    this.showStatus(this.i18n.isRtl() ? 'تم حذف التعليق' : 'Comment deleted');
  }

  private showStatus(msg: string) {
    this.statusBanner.set(msg);
  }
}
