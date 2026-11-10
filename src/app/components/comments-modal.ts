import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem } from '../core/checklist-rules';

@Component({
  selector: 'app-comments-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-xl">forum</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                {{ i18n.t().comments }} - {{ i18n.isRtl() ? item().titleAr : (item().titleEn || item().titleAr) }}
              </h3>
              <p class="text-xs text-slate-400">
                {{ i18n.isRtl() ? 'مناقشات وملاحظات الشراء والتنفيذ لهذا الصنف' : 'Item discussion, showroom comparisons, and purchase notes' }}
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

        <!-- Comments List -->
        <div class="flex-1 overflow-y-auto py-4 space-y-3 min-h-[160px]">
          @for (comm of item().comments || []; track comm.id) {
            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span class="text-xl p-1 bg-white dark:bg-slate-700 rounded-lg shrink-0">{{ comm.avatar || '👤' }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-900 dark:text-slate-100">{{ comm.userName }}</span>
                  <span class="text-[10px] text-slate-400">{{ comm.timestamp }}</span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                  {{ comm.text }}
                </p>
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

  commentForm = new FormGroup({
    commentText: new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  onAddComment() {
    if (this.commentForm.invalid) return;
    const text = this.commentForm.value.commentText?.trim();
    if (!text) return;

    const user = this.auth.currentUser();
    this.storage.addComment(this.item().id, text, user.name, user.avatar);
    this.commentForm.reset();
  }
}
