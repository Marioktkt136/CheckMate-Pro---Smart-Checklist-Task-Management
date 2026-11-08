import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { calculateChecklistStats } from '../core/checklist-rules';

@Component({
  selector: 'app-dashboard-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="mb-6 space-y-4">
      
      <!-- Top Project Header Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-xl shadow-blue-900/10">
        <!-- Background decorative pattern -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div class="absolute left-1/3 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-1.5 max-w-2xl">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-sm">
              <mat-icon class="text-sm">verified</mat-icon>
              <span>{{ i18n.t().checklist }} - {{ i18n.isRtl() ? storage.activeProject().nameAr : storage.activeProject().nameEn }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {{ i18n.isRtl() ? storage.activeProject().nameAr : storage.activeProject().nameEn }}
            </h1>
            <p class="text-sm text-blue-100/80 leading-relaxed">
              {{ i18n.isRtl() 
                ? 'تعتبر الأجهزة الكهربائية هي الجزء الأكبر من الميزانية، لذا يجب اختيار ماركات موثوقة ومتابعة الفحص والمواصفات أولاً بأول.'
                : 'Appliances represent the primary budget commitment; track specifications, brands, and price quotes with real-time updates.' }}
            </p>
          </div>

          <!-- Progress Ring & Quick Actions -->
          <div class="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div class="relative w-16 h-16 flex items-center justify-center">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="5" class="text-white/20" fill="transparent" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="5"
                  class="text-emerald-400 transition-all duration-700 ease-out"
                  fill="transparent"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="175.9"
                  [attr.stroke-dashoffset]="175.9 - (175.9 * stats().percent) / 100" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-base font-black">{{ stats().percent }}%</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-blue-200 font-medium">
                {{ i18n.t().completed }}
              </div>
              <div class="text-lg font-bold">
                {{ stats().completed }} / {{ stats().total }}
              </div>
              <div class="text-[11px] text-blue-200/70">
                {{ stats().pending }} {{ i18n.t().pending }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metric KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <!-- Total Items -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-2xl">format_list_bulleted</mat-icon>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              {{ i18n.t().totalItems }}
            </span>
            <span class="text-xl font-bold text-slate-900 dark:text-slate-100">
              {{ stats().total }}
            </span>
          </div>
        </div>

        <!-- Purchased Items -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-2xl">check_circle</mat-icon>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              {{ i18n.t().completed }}
            </span>
            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ stats().completed }}
            </span>
          </div>
        </div>

        <!-- Comparing Items -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-2xl">hourglass_empty</mat-icon>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              {{ i18n.t().inComparison }}
            </span>
            <span class="text-xl font-bold text-amber-600 dark:text-amber-400">
              {{ stats().comparing }}
            </span>
          </div>
        </div>

        <!-- Budget Tracker -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-2xl">payments</mat-icon>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              {{ i18n.t().budgetSpent }}
            </span>
            <div class="flex items-baseline gap-1">
              <span class="text-xl font-bold text-slate-900 dark:text-slate-100">
                {{ stats().totalActual.toLocaleString() }}
              </span>
              <span class="text-xs text-slate-400 font-medium">ج.م</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class DashboardStatsComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  openNewItemModal = output<void>();
  openAiAdvisorModal = output<void>();

  stats = computed(() => {
    const items = this.storage.currentProjectItems();
    const budget = this.storage.activeProject().budget || 0;
    return calculateChecklistStats(items, budget);
  });
}
