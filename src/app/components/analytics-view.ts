import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { calculateChecklistStats } from '../core/checklist-rules';

@Component({
  selector: 'app-analytics-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-5">
      
      <!-- Analytics Header -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <mat-icon class="text-purple-600">analytics</mat-icon>
            <span>{{ i18n.t().analytics }}</span>
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ i18n.isRtl() ? 'تحليلات تفصيلية للإنفاق، توزيع الأولويات، ومؤشرات التقدم' : 'Comprehensive expenditure, priority, and progress tracking' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold">
            سقف الميزانية: {{ storage.activeProject().budget.toLocaleString() }} ج.م
          </div>
        </div>
      </div>

      <!-- Financial Health Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Total Spent Card -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>{{ i18n.t().budgetSpent }}</span>
            <mat-icon class="text-emerald-500">account_balance_wallet</mat-icon>
          </div>
          <div class="text-2xl font-black text-slate-900 dark:text-slate-100">
            {{ stats().totalActual.toLocaleString() }} <span class="text-xs text-slate-400">ج.م</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                 [style.width.%]="spentPercent()"></div>
          </div>
          <div class="text-[11px] text-slate-400">
            {{ spentPercent() }}% من إجمالي الميزانية المستهدفة
          </div>
        </div>

        <!-- Estimated Total Card -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>{{ i18n.t().budgetAllocated }} (التقديري)</span>
            <mat-icon class="text-blue-500">calculate</mat-icon>
          </div>
          <div class="text-2xl font-black text-slate-900 dark:text-slate-100">
            {{ stats().totalEstimated.toLocaleString() }} <span class="text-xs text-slate-400">ج.م</span>
          </div>
          <div class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            مجموع أسعار كافة الأصناف في القائمة
          </div>
        </div>

        <!-- Budget Remaining Card -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>{{ i18n.t().budgetRemaining }}</span>
            <mat-icon class="text-purple-500">savings</mat-icon>
          </div>
          <div class="text-2xl font-black text-purple-600 dark:text-purple-400">
            {{ stats().budgetRemaining.toLocaleString() }} <span class="text-xs text-slate-400">ج.م</span>
          </div>
          <div class="text-[11px] text-slate-400">
            سيولة متبقية للأجهزة القادمة
          </div>
        </div>

      </div>

      <!-- Category Breakdown & Priority Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <!-- Category Spend & Progress -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <mat-icon class="text-blue-600 text-lg">pie_chart</mat-icon>
            <span>توزيع الإنفاق حسب المجموعات</span>
          </h3>

          <div class="space-y-3">
            @for (cat of categoryStats(); track cat.name) {
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-slate-700 dark:text-slate-300">{{ cat.name }}</span>
                  <span class="text-slate-500 font-bold">{{ cat.cost.toLocaleString() }} ج.م ({{ cat.completed }}/{{ cat.total }})</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div class="bg-blue-600 h-full rounded-full transition-all duration-500"
                       [style.width.%]="cat.completionRate"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Priority Breakdown -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <mat-icon class="text-rose-600 text-lg">flag</mat-icon>
            <span>توزيع الأصناف حسب مستوى الأولوية</span>
          </h3>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
              <span class="text-xs font-semibold text-rose-700 dark:text-rose-300 block">عاجل جداً (Urgent)</span>
              <span class="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                {{ stats().byPriority['urgent'] || 0 }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
              <span class="text-xs font-semibold text-orange-700 dark:text-orange-300 block">مرتفع (High)</span>
              <span class="text-xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                {{ stats().byPriority['high'] || 0 }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/60">
              <span class="text-xs font-semibold text-yellow-700 dark:text-yellow-300 block">متوسط (Medium)</span>
              <span class="text-xl font-black text-yellow-600 dark:text-yellow-400 mt-1 block">
                {{ stats().byPriority['medium'] || 0 }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 block">منخفض / اختياري (Low)</span>
              <span class="text-xl font-black text-slate-700 dark:text-slate-300 mt-1 block">
                {{ stats().byPriority['low'] || 0 }}
              </span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <mat-icon class="text-blue-600 text-base shrink-0">tips_and_updates</mat-icon>
            <span>نصيحة الميزانية: يُفضل إتمام شراء الأصناف العاجلة والمرتفعة قبل البدء بالأصناف الاختيارية.</span>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class AnalyticsViewComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  stats = computed(() => {
    const items = this.storage.currentProjectItems();
    const budget = this.storage.activeProject().budget || 0;
    return calculateChecklistStats(items, budget);
  });

  spentPercent = computed(() => {
    const budget = this.storage.activeProject().budget || 1;
    const spent = this.stats().totalActual;
    return Math.min(100, Math.round((spent / budget) * 100));
  });

  categoryStats = computed(() => {
    const s = this.stats();
    return Object.entries(s.byCategory).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      cost: data.cost,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  });
}
