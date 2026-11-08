import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { ChecklistItem, createGoogleCalendarUrl } from '../core/checklist-rules';

@Component({
  selector: 'app-calendar-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-4">
      
      <!-- Calendar Header -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <mat-icon class="text-blue-600">calendar_month</mat-icon>
            <span>{{ i18n.t().calendar }}</span>
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ i18n.isRtl() ? 'جدول زمني لمواعيد شراء واستلام الأجهزة والميلستون للمشروع' : 'Visual timeline of target purchase and delivery milestones' }}
          </p>
        </div>

        <!-- Export all to .ics calendar -->
        <button
          type="button"
          (click)="downloadIcsFile()"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
        >
          <mat-icon class="text-base">event_note</mat-icon>
          <span>تصدير ملف التقويم (.ics)</span>
        </button>
      </div>

      <!-- Timeline of Items by Target Date -->
      <div class="space-y-3">
        @for (monthGroup of timelineItems(); track monthGroup.monthYear) {
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div class="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span class="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <mat-icon class="text-blue-500 text-base">date_range</mat-icon>
                {{ monthGroup.monthYear }}
              </span>
              <span class="text-xs text-slate-500 font-medium">
                {{ monthGroup.items.length }} موعد مستهدف
              </span>
            </div>

            <div class="divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              @for (item of monthGroup.items; track item.id) {
                <div class="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center shrink-0">
                      <span class="text-[10px] font-bold uppercase">{{ getDayNumber(item.targetDate) }}</span>
                      <mat-icon class="text-base">event</mat-icon>
                    </div>

                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {{ i18n.isRtl() ? item.titleAr : item.titleEn }}
                        </span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                              [class.bg-emerald-100]="item.status === 'purchased'"
                              [class.text-emerald-700]="item.status === 'purchased'"
                              [class.bg-teal-100]="item.status === 'delivered'"
                              [class.text-teal-700]="item.status === 'delivered'"
                              [class.bg-amber-100]="item.status === 'comparing'"
                              [class.text-amber-700]="item.status === 'comparing'"
                              [class.bg-slate-100]="item.status === 'pending'"
                              [class.text-slate-600]="item.status === 'pending'">
                          {{ item.status === 'purchased' ? 'تم الشراء' : item.status === 'delivered' ? 'تم التوصيل' : item.status === 'comparing' ? 'قيد المقارنة' : 'لسه' }}
                        </span>
                      </div>

                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {{ item.category }} • {{ item.myNotes || item.notes || 'لا توجد ملاحظات إضافية' }}
                      </p>

                      <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>الميزانية: {{ (item.actualCost || item.estimatedCost || 0).toLocaleString() }} {{ item.currency }}</span>
                        @if (item.assignee) {
                          <span>• المسؤول: {{ item.assignee.name }}</span>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Google Calendar & Actions -->
                  <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      [href]="getGoogleCalendarUrl(item)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                    >
                      <mat-icon class="text-sm">event</mat-icon>
                      <span>تقويم جوجل</span>
                    </a>
                  </div>
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <mat-icon class="text-slate-300 dark:text-slate-600 text-5xl">event_busy</mat-icon>
            <h3 class="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">لا توجد مواعيد محددة بعد</h3>
            <p class="text-xs text-slate-400 mt-1">حدد تواريخ الشراء المستهدفة للأصناف لتظهر في هذا التقويم الزمني.</p>
          </div>
        }
      </div>

    </div>
  `,
})
export class CalendarViewComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);

  timelineItems = computed(() => {
    const items = this.storage.currentProjectItems().filter(i => !!i.targetDate);
    items.sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));

    const groups = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const ym = it.targetDate ? it.targetDate.substring(0, 7) : 'بدون موعد';
      if (!groups.has(ym)) {
        groups.set(ym, []);
      }
      groups.get(ym)!.push(it);
    }

    const result: { monthYear: string; items: ChecklistItem[] }[] = [];
    groups.forEach((groupItems, monthYear) => {
      result.push({ monthYear, items: groupItems });
    });
    return result;
  });

  getDayNumber(dateStr?: string): string {
    if (!dateStr) return '01';
    const parts = dateStr.split('-');
    return parts[2] || '01';
  }

  getGoogleCalendarUrl(item: ChecklistItem): string {
    return createGoogleCalendarUrl(item, this.i18n.currentLang());
  }

  downloadIcsFile() {
    const items = this.storage.currentProjectItems().filter(i => !!i.targetDate);
    if (items.length === 0) {
      alert('لا توجد أصناف بتواريخ محددة للتصدير.');
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CheckMate Pro//Home Checklist//AR\r\n";
    for (const it of items) {
      const dt = it.targetDate!.replace(/-/g, '');
      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `SUMMARY:${it.titleAr} (${it.category})\r\n`;
      icsContent += `DESCRIPTION:ملاحظاتي: ${it.myNotes || '-'}\\nملاحظات: ${it.notes || '-'}\\nالسعر: ${it.estimatedCost} ${it.currency}\r\n`;
      icsContent += `DTSTART;VALUE=DATE:${dt}\r\n`;
      icsContent += `DTEND;VALUE=DATE:${dt}\r\n`;
      icsContent += "END:VEVENT\r\n";
    }
    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkmate-schedule-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
