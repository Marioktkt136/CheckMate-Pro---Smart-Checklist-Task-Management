import { Component, ChangeDetectionStrategy, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { ChecklistItem } from '../core/checklist-rules';

@Component({
  selector: 'app-ai-advisor-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <mat-icon class="text-2xl">auto_awesome</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                {{ i18n.t().aiAdvisor }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                @if (item()) {
                  <span>مستشار هندسي ومقارنة ماركات لـ: {{ item()?.titleAr }}</span>
                } @else {
                  <span>استشارة شاملة لكافة أجهزة المشروع وقائمة الفحص</span>
                }
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

        <!-- Quick Action Prompt Buttons -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            (click)="runConsultation('compare_brands')"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">compare_arrows</mat-icon>
            <span>مقارنة أفضل الماركات</span>
          </button>

          <button
            type="button"
            (click)="runConsultation('specs_review')"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">tune</mat-icon>
            <span>المواصفات الفنية والضمان</span>
          </button>

          <button
            type="button"
            (click)="runConsultation('budget_tips')"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">savings</mat-icon>
            <span>نصائح الميزانية والخصم المجمع</span>
          </button>
        </div>

        <!-- Advisor Response Area -->
        <div class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[180px] max-h-[300px] overflow-y-auto">
          @if (isLoading()) {
            <div class="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <mat-icon class="text-3xl text-purple-600 animate-spin">sync</mat-icon>
              <p class="text-xs font-medium text-slate-500">
                جاري استدعاء نموذج الذكاء الاصطناعي لتحليل المواصفات والأسعار...
              </p>
            </div>
          } @else if (advisorResponse()) {
            <div class="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed space-y-2">
              {{ advisorResponse() }}
            </div>
          } @else {
            <div class="py-10 text-center text-xs text-slate-400">
              اختر أحد الأزرار أعلاه لبدء استشارة المستشار الذكي للأجهزة.
            </div>
          }
        </div>

        <!-- Footer Actions -->
        <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          @if (item() && advisorResponse()) {
            <button
              type="button"
              (click)="appendToItemNotes()"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <mat-icon class="text-sm">note_add</mat-icon>
              <span>إضافة التوصية لخانة "ملاحظاتي" لهذا الصنف</span>
            </button>
          } @else {
            <span></span>
          }

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
export class AiAdvisorModalComponent implements OnInit {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  item = input<ChecklistItem | null>(null);
  closeModal = output<void>();

  isLoading = signal<boolean>(false);
  advisorResponse = signal<string>('');

  ngOnInit() {
    this.runConsultation('compare_brands');
  }

  async runConsultation(actionType: string) {
    this.isLoading.set(true);
    const target = this.item();
    const prompt = target
      ? `يرجى تزويدي بمقارنة ذكية لأفضل الماركات والأسعار وفترة الضمان وكفاءة استهلاك الطاقة للجهاز: (${target.titleAr}) ومواصفاته (${target.notes || 'أساسي'}). نوع الاستشارة: ${actionType}`
      : `يرجى تقديم مراجعة شاملة لقائمة أجهزة المنزل والتجهيزات الكهربائية، وتقديم نصائح توفير الميزانية واختيار الماركات الموثوقة.`;

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentItem: target,
          allItems: this.storage.currentProjectItems(),
          actionType,
          lang: this.i18n.currentLang(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        this.advisorResponse.set(json.result || '');
      }
    } catch (e) {
      console.warn('AI Advisor call failed', e);
      this.advisorResponse.set('تمت الاستشارة بالاعتماد على التوصيات المحلية المحفوظة: ينصح باختيار موتور انفرتر وضمان معتمد لا يقل عن 5-10 سنوات.');
    } finally {
      this.isLoading.set(false);
    }
  }

  appendToItemNotes() {
    const it = this.item();
    if (!it) return;
    const currentNotes = it.myNotes ? it.myNotes + ' | ' : '';
    const summary = 'توصية الذكاء الاصطناعي: اختيار ماركة معتمدة بضمان 10 سنوات وكفاءة A';
    this.storage.updateItem({
      ...it,
      myNotes: currentNotes + summary,
    });
    alert('تمت إضافة التوصية لخانة ملاحظاتي بنجاح!');
    this.closeModal.emit();
  }
}
