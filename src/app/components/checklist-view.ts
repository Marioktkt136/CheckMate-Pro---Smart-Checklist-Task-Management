import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem, ItemStatus, filterAndSortItems, createGoogleCalendarUrl } from '../core/checklist-rules';

@Component({
  selector: 'app-checklist-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-4">
      
      <!-- Filter & Controls Toolbar -->
      <div class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        
        <!-- Search & Main Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          <!-- Search input -->
          <div class="relative flex-1">
            <mat-icon class="absolute top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                      [class.right-3]="i18n.isRtl()" [class.left-3]="!i18n.isRtl()">search</mat-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              [placeholder]="i18n.t().searchPlaceholder"
              class="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.pr-9]="i18n.isRtl()" [class.pl-4]="i18n.isRtl()"
              [class.pl-9]="!i18n.isRtl()" [class.pr-4]="!i18n.isRtl()"
            />
            @if (searchQuery()) {
              <button
                type="button"
                (click)="searchQuery.set('')"
                class="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                [class.left-3]="i18n.isRtl()" [class.right-3]="!i18n.isRtl()"
              >
                <mat-icon class="text-base">close</mat-icon>
              </button>
            }
          </div>

          <!-- Actions: Add Item & AI Advisor -->
          <div class="flex items-center gap-2 shrink-0">
            @if (auth.isEditor()) {
              <button
                type="button"
                (click)="addItemTrigger.emit()"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <mat-icon class="text-base">add</mat-icon>
                <span>{{ i18n.t().addItem }}</span>
              </button>
            }

            <button
              type="button"
              (click)="openGoogleSheetImport.emit()"
              class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
              title="استيراد وتصدير Google Sheets مع شرح الأعمدة والصفوف"
            >
              <mat-icon class="text-base text-emerald-600 dark:text-emerald-400">table_chart</mat-icon>
              <span>استيراد Google Sheets</span>
            </button>

            <button
              type="button"
              (click)="consultAiTrigger.emit(null)"
              class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <mat-icon class="text-base text-purple-600 dark:text-purple-400">auto_awesome</mat-icon>
              <span>{{ i18n.t().aiAdvisor }}</span>
            </button>
          </div>
        </div>

        <!-- Account Data Separation Filter: All vs Mine vs Published -->
        <div class="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <mat-icon class="!text-sm !w-4 !h-4 text-blue-600">badge</mat-icon>
            <span>بيانات الحساب:</span>
            <span class="text-blue-600 dark:text-blue-400 font-extrabold">{{ auth.currentUser().name }}</span>
          </div>

          <div class="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              (click)="storage.dataScope.set('all')"
              class="px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer"
              [class.bg-blue-600]="storage.dataScope() === 'all'"
              [class.text-white]="storage.dataScope() === 'all'"
              [class.text-slate-600]="storage.dataScope() !== 'all'"
              [class.dark:text-slate-400]="storage.dataScope() !== 'all'"
            >
              الكل
            </button>
            <button
              type="button"
              (click)="storage.dataScope.set('mine')"
              class="px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer"
              [class.bg-blue-600]="storage.dataScope() === 'mine'"
              [class.text-white]="storage.dataScope() === 'mine'"
              [class.text-slate-600]="storage.dataScope() !== 'mine'"
              [class.dark:text-slate-400]="storage.dataScope() !== 'mine'"
            >
              بياناتي الخاصة ({{ storage.userItemsCount() }})
            </button>
            <button
              type="button"
              (click)="storage.dataScope.set('published')"
              class="px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer"
              [class.bg-blue-600]="storage.dataScope() === 'published'"
              [class.text-white]="storage.dataScope() === 'published'"
              [class.text-slate-600]="storage.dataScope() !== 'published'"
              [class.dark:text-slate-400]="storage.dataScope() !== 'published'"
            >
              المنشور للجميع ({{ storage.publishedItemsCount() }})
            </button>
          </div>
        </div>

        <!-- Category Horizontal Scrollable Bar (Mobile-Optimized) -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">category</mat-icon>
              <span>تصنيف المشتريات (Categories):</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono">
              {{ storage.currentProjectItems().length }} صنف
            </span>
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs font-semibold scrollbar-thin">
            <!-- All Categories Pill -->
            <button
              type="button"
              (click)="selectedCategory.set('all')"
              class="px-3 py-1.5 rounded-full border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
              [class.bg-blue-600]="selectedCategory() === 'all'"
              [class.text-white]="selectedCategory() === 'all'"
              [class.border-blue-600]="selectedCategory() === 'all'"
              [class.bg-slate-50]="selectedCategory() !== 'all'"
              [class.dark:bg-slate-800]="selectedCategory() !== 'all'"
              [class.border-slate-200]="selectedCategory() !== 'all'"
              [class.dark:border-slate-700]="selectedCategory() !== 'all'"
              [class.text-slate-700]="selectedCategory() !== 'all'"
              [class.dark:text-slate-200]="selectedCategory() !== 'all'"
            >
              <span>الكل (All)</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full"
                    [class.bg-blue-700]="selectedCategory() === 'all'"
                    [class.text-white]="selectedCategory() === 'all'"
                    [class.bg-slate-200]="selectedCategory() !== 'all'"
                    [class.dark:bg-slate-700]="selectedCategory() !== 'all'"
                    [class.text-slate-700]="selectedCategory() !== 'all'">
                {{ storage.currentProjectItems().length }}
              </span>
            </button>

            <!-- Individual Category Pills -->
            @for (cat of categories(); track cat) {
              <button
                type="button"
                (click)="selectedCategory.set(cat)"
                class="px-3 py-1.5 rounded-full border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
                [class.bg-blue-600]="selectedCategory() === cat"
                [class.text-white]="selectedCategory() === cat"
                [class.border-blue-600]="selectedCategory() === cat"
                [class.bg-slate-50]="selectedCategory() !== cat"
                [class.dark:bg-slate-800]="selectedCategory() !== cat"
                [class.border-slate-200]="selectedCategory() !== cat"
                [class.dark:border-slate-700]="selectedCategory() !== cat"
                [class.text-slate-700]="selectedCategory() !== cat"
                [class.dark:text-slate-200]="selectedCategory() !== cat"
              >
                <span>{{ cat }}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full"
                      [class.bg-blue-700]="selectedCategory() === cat"
                      [class.text-white]="selectedCategory() === cat"
                      [class.bg-slate-200]="selectedCategory() !== cat"
                      [class.dark:bg-slate-700]="selectedCategory() !== cat"
                      [class.text-slate-700]="selectedCategory() !== cat">
                  {{ getCategoryCount(cat) }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Filter Chips & Dropdowns (Status, Priority, Sort) -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <!-- Status Filter -->
          <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <mat-icon class="text-slate-400 text-sm">filter_alt</mat-icon>
            <select
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectedStatus.set($event)"
              class="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{{ i18n.t().allStatuses }}</option>
              <option value="pending">{{ i18n.t().statusPending }}</option>
              <option value="comparing">{{ i18n.t().statusComparing }}</option>
              <option value="purchased">{{ i18n.t().statusPurchased }}</option>
              <option value="delivered">{{ i18n.t().statusDelivered }}</option>
            </select>
          </div>

          <!-- Priority Filter -->
          <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <mat-icon class="text-slate-400 text-sm">flag</mat-icon>
            <select
              [ngModel]="selectedPriority()"
              (ngModelChange)="selectedPriority.set($event)"
              class="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{{ i18n.t().allPriorities }}</option>
              <option value="urgent">{{ i18n.t().priorityUrgent }}</option>
              <option value="high">{{ i18n.t().priorityHigh }}</option>
              <option value="medium">{{ i18n.t().priorityMedium }}</option>
              <option value="low">{{ i18n.t().priorityLow }}</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ms-auto">
            <mat-icon class="text-slate-400 text-sm">sort</mat-icon>
            <select
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)"
              class="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="number">ترتيب الإكسل (م)</option>
              <option value="priority">الأولوية</option>
              <option value="title">الاسم</option>
              <option value="cost">السعر</option>
              <option value="status">الحالة</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Instruction Hint Banner matching Excel sheet note -->
      <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <mat-icon class="text-amber-600 dark:text-amber-400 shrink-0">info</mat-icon>
        <p>
          {{ i18n.isRtl() 
            ? '💡 بعد الشراء اختر ✅ تم الشراء من القائمة. الخلايا ذات الإطار الأصفر مخصصة لملاحظاتك الخاصة (مثال: ماركة X - معرض Y أو الضمان والسعر).'
            : '💡 Once purchased, mark item as ✅ Purchased. The highlighted notes column is reserved for your custom notes (e.g., Brand X - Showroom Y).' }}
        </p>
      </div>

      <!-- Grouped Checklist Display (Desktop Table + Mobile Cards) -->
      @for (group of groupedItems(); track group.category) {
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          
          <!-- Category Header -->
          <div class="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 class="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {{ group.category }}
              </h2>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{ group.items.length }}
              </span>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              {{ group.completedCount }} / {{ group.items.length }} {{ i18n.t().completed }}
            </div>
          </div>

          <!-- 1. Mobile Cards View (< 768px) -->
          <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            @for (item of group.items; track item.id) {
              <div class="p-3.5 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                   [class.bg-emerald-50/20]="item.status === 'purchased' || item.status === 'delivered'">
                
                <!-- Card Header: Checkbox + Title + Number + Priority -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-start gap-2.5">
                    <button
                      type="button"
                      (click)="onToggleStatus(item.id)"
                      class="w-6 h-6 mt-0.5 rounded-md flex items-center justify-center text-xs transition cursor-pointer shrink-0"
                      [class.bg-emerald-600]="item.status === 'purchased' || item.status === 'delivered'"
                      [class.text-white]="item.status === 'purchased' || item.status === 'delivered'"
                      [class.border]="item.status !== 'purchased' && item.status !== 'delivered'"
                      [class.border-slate-300]="item.status !== 'purchased' && item.status !== 'delivered'"
                      [class.dark:border-slate-600]="item.status !== 'purchased' && item.status !== 'delivered'"
                    >
                      @if (item.status === 'purchased' || item.status === 'delivered') {
                        <mat-icon class="text-sm">check</mat-icon>
                      }
                    </button>
                    <div>
                      <div class="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {{ i18n.isRtl() ? item.titleAr : item.titleEn }}
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>رقم: #{{ item.itemNumber }} • {{ item.category }}</span>
                        <button
                          type="button"
                          (click)="storage.togglePublishItem(item.id)"
                          class="px-1.5 py-0.2 rounded text-[9px] font-bold inline-flex items-center gap-0.5 cursor-pointer transition"
                          [class.bg-emerald-100]="item.isPublished"
                          [class.text-emerald-800]="item.isPublished"
                          [class.dark:bg-emerald-950]="item.isPublished"
                          [class.dark:text-emerald-300]="item.isPublished"
                          [class.bg-slate-100]="!item.isPublished"
                          [class.text-slate-600]="!item.isPublished"
                          [class.dark:bg-slate-800]="!item.isPublished"
                          [title]="item.isPublished ? 'صنف منشور للجميع (انقر للتحويل إلى خاص)' : 'صنف خاص بك (انقر لنشره)'"
                        >
                          <mat-icon class="!text-[10px] !w-2.5 !h-2.5">{{ item.isPublished ? 'public' : 'lock' }}</mat-icon>
                          <span>{{ item.isPublished ? 'منشور' : 'خاص' }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        [class.bg-rose-100]="item.priority === 'urgent'"
                        [class.text-rose-700]="item.priority === 'urgent'"
                        [class.bg-orange-100]="item.priority === 'high'"
                        [class.text-orange-700]="item.priority === 'high'"
                        [class.bg-yellow-100]="item.priority === 'medium'"
                        [class.text-yellow-700]="item.priority === 'medium'"
                        [class.bg-slate-100]="item.priority === 'low'"
                        [class.text-slate-600]="item.priority === 'low'">
                    {{ item.priority === 'urgent' ? i18n.t().priorityUrgent : item.priority === 'high' ? i18n.t().priorityHigh : item.priority === 'medium' ? i18n.t().priorityMedium : i18n.t().priorityLow }}
                  </span>
                </div>

                <!-- Spec Note (if any) -->
                @if (item.notes) {
                  <div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    <mat-icon class="text-xs text-slate-400">tune</mat-icon>
                    <span>{{ item.notes }}</span>
                  </div>
                }

                <!-- Mobile Yellow MyNotes Input -->
                <div>
                  <span class="block text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                    ملاحظاتي الخاصة (الماركة / المعرض):
                  </span>
                  <input
                    type="text"
                    [ngModel]="item.myNotes"
                    (ngModelChange)="onUpdateMyNotes(item, $event)"
                    [disabled]="!auth.isEditor()"
                    placeholder="اكتب ماركة أو معرض أو سعر..."
                    class="w-full text-xs px-2.5 py-1.5 rounded-lg border-2 border-amber-300 dark:border-amber-600/70 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <!-- Status, Cost, & Interactive Actions -->
                <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <!-- Status dropdown -->
                  <select
                    [ngModel]="item.status"
                    (ngModelChange)="onSelectStatus(item.id, $event)"
                    [disabled]="!auth.isEditor()"
                    class="text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none"
                    [class.bg-emerald-100]="item.status === 'purchased'"
                    [class.text-emerald-800]="item.status === 'purchased'"
                    [class.bg-amber-100]="item.status === 'comparing'"
                    [class.text-amber-800]="item.status === 'comparing'"
                    [class.bg-teal-100]="item.status === 'delivered'"
                    [class.text-teal-800]="item.status === 'delivered'"
                    [class.bg-slate-100]="item.status === 'pending'"
                    [class.text-slate-700]="item.status === 'pending'"
                  >
                    <option value="pending">⬜ لسه (Pending)</option>
                    <option value="comparing">⏳ مقارنة</option>
                    <option value="purchased">✅ تم الشراء</option>
                    <option value="delivered">🚚 تم التوصيل</option>
                  </select>

                  <!-- Cost -->
                  <div class="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {{ (item.actualCost || item.estimatedCost || 0).toLocaleString() }}
                    <span class="text-[10px] text-slate-400 font-normal">{{ item.currency }}</span>
                  </div>

                  <!-- Quick Icons -->
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="consultAiTrigger.emit(item)"
                      class="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      title="استشارة الذكاء الاصطناعي"
                    >
                      <mat-icon class="text-base">auto_awesome</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="openCommentsTrigger.emit(item)"
                      class="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <mat-icon class="text-base">chat_bubble_outline</mat-icon>
                    </button>
                    @if (auth.isEditor()) {
                      <button
                        type="button"
                        (click)="editItemTrigger.emit(item)"
                        class="p-1 rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <mat-icon class="text-base">edit</mat-icon>
                      </button>
                    }
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        (click)="onDeleteItem(item.id)"
                        class="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <mat-icon class="text-base">delete_outline</mat-icon>
                      </button>
                    }
                  </div>
                </div>

              </div>
            }
          </div>

          <!-- 2. Desktop Table View (>= 768px) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm text-right rtl:text-right ltr:text-left">
              <thead class="text-xs uppercase bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-3 w-10 text-center">{{ i18n.t().itemNo }}</th>
                  <th class="py-3 px-4">{{ i18n.t().itemTitle }}</th>
                  <th class="py-3 px-4">{{ i18n.t().specNotes }}</th>
                  <th class="py-3 px-4 min-w-[200px]">{{ i18n.t().myNotes }}</th>
                  <th class="py-3 px-3 text-center min-w-[130px]">{{ i18n.t().status }}</th>
                  <th class="py-3 px-3 text-center">{{ i18n.t().priority }}</th>
                  <th class="py-3 px-3">{{ i18n.t().cost }}</th>
                  <th class="py-3 px-3 text-center">{{ i18n.t().actions }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (item of group.items; track item.id) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      [class.bg-emerald-50/30]="item.status === 'purchased' || item.status === 'delivered'"
                      [class.dark:bg-emerald-950/10]="item.status === 'purchased' || item.status === 'delivered'">
                    
                    <!-- 1. Number (م) -->
                    <td class="py-3.5 px-3 text-center font-bold text-slate-400 text-xs">
                      {{ item.itemNumber }}
                    </td>

                    <!-- 2. Item Title (الصنف) -->
                    <td class="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="onToggleStatus(item.id)"
                          class="w-5 h-5 rounded flex items-center justify-center text-xs transition cursor-pointer"
                          [class.bg-emerald-600]="item.status === 'purchased' || item.status === 'delivered'"
                          [class.text-white]="item.status === 'purchased' || item.status === 'delivered'"
                          [class.border]="item.status !== 'purchased' && item.status !== 'delivered'"
                          [class.border-slate-300]="item.status !== 'purchased' && item.status !== 'delivered'"
                          [class.dark:border-slate-600]="item.status !== 'purchased' && item.status !== 'delivered'"
                          title="انقر لتغيير حالة الشراء"
                        >
                          @if (item.status === 'purchased' || item.status === 'delivered') {
                            <mat-icon class="text-sm">check</mat-icon>
                          }
                        </button>
                        <div>
                          <div class="font-bold text-slate-900 dark:text-slate-100">
                            {{ i18n.isRtl() ? item.titleAr : item.titleEn }}
                          </div>
                          <div class="flex items-center gap-1.5 flex-wrap mt-1">
                            <button
                              type="button"
                              (click)="storage.togglePublishItem(item.id)"
                              class="text-[9px] px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-0.5 cursor-pointer transition"
                              [class.bg-emerald-100]="item.isPublished"
                              [class.text-emerald-800]="item.isPublished"
                              [class.dark:bg-emerald-950]="item.isPublished"
                              [class.dark:text-emerald-300]="item.isPublished"
                              [class.bg-slate-100]="!item.isPublished"
                              [class.text-slate-600]="!item.isPublished"
                              [class.dark:bg-slate-800]="!item.isPublished"
                              [class.dark:text-slate-400]="!item.isPublished"
                              [title]="item.isPublished ? 'منشور للجميع في مساحة العمل (انقر لجعله خاصاً)' : 'خاص بحسابك فقط (انقر لنشره)'"
                            >
                              <mat-icon class="!text-[10px] !w-2.5 !h-2.5">{{ item.isPublished ? 'public' : 'lock' }}</mat-icon>
                              <span>{{ item.isPublished ? 'منشور' : 'خاص' }}</span>
                            </button>

                            @if (item.tags && item.tags.length > 0) {
                              @for (tag of item.tags; track tag) {
                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  #{{ tag }}
                                </span>
                              }
                            }
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 3. Spec Notes (ملاحظات الشيت الأصلية) -->
                    <td class="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      @if (item.notes) {
                        <span class="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded text-slate-700 dark:text-slate-300 font-medium">
                          <mat-icon class="text-xs text-slate-400">tune</mat-icon>
                          {{ item.notes }}
                        </span>
                      } @else {
                        <span class="text-slate-300 dark:text-slate-600">-</span>
                      }
                    </td>

                    <!-- 4. My Notes (ملاحظاتي - الخلايا الصفراء الأصلية في الشيت للتعبئة) -->
                    <td class="py-3.5 px-4">
                      <div class="relative">
                        <input
                          type="text"
                          [ngModel]="item.myNotes"
                          (ngModelChange)="onUpdateMyNotes(item, $event)"
                          [disabled]="!auth.isEditor()"
                          placeholder="اكتب ماركة أو معرض أو سعر..."
                          class="w-full text-xs px-2.5 py-1.5 rounded-lg border-2 border-amber-300 dark:border-amber-600/70 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium placeholder:text-amber-400 dark:placeholder:text-amber-600/60 transition"
                        />
                      </div>
                    </td>

                    <!-- 5. Status Dropdown (تم الشراء؟) -->
                    <td class="py-3.5 px-3 text-center">
                      <select
                        [ngModel]="item.status"
                        (ngModelChange)="onSelectStatus(item.id, $event)"
                        [disabled]="!auth.isEditor()"
                        class="text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition"
                        [class.bg-emerald-100]="item.status === 'purchased'"
                        [class.text-emerald-800]="item.status === 'purchased'"
                        [class.border-emerald-300]="item.status === 'purchased'"
                        [class.dark:bg-emerald-950/50]="item.status === 'purchased'"
                        [class.dark:text-emerald-300]="item.status === 'purchased'"
                        [class.dark:border-emerald-700]="item.status === 'purchased'"
                        [class.bg-teal-100]="item.status === 'delivered'"
                        [class.text-teal-800]="item.status === 'delivered'"
                        [class.border-teal-300]="item.status === 'delivered'"
                        [class.bg-amber-100]="item.status === 'comparing'"
                        [class.text-amber-800]="item.status === 'comparing'"
                        [class.border-amber-300]="item.status === 'comparing'"
                        [class.bg-slate-100]="item.status === 'pending'"
                        [class.text-slate-700]="item.status === 'pending'"
                        [class.border-slate-300]="item.status === 'pending'"
                        [class.dark:bg-slate-800]="item.status === 'pending'"
                        [class.dark:text-slate-300]="item.status === 'pending'"
                      >
                        <option value="pending">⬜ لسه (Pending)</option>
                        <option value="comparing">⏳ قيد المقارنة</option>
                        <option value="purchased">✅ تم الشراء</option>
                        <option value="delivered">🚚 تم التوصيل</option>
                      </select>
                    </td>

                    <!-- 6. Priority Badge -->
                    <td class="py-3.5 px-3 text-center">
                      <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                            [class.bg-rose-100]="item.priority === 'urgent'"
                            [class.text-rose-700]="item.priority === 'urgent'"
                            [class.dark:bg-rose-950/40]="item.priority === 'urgent'"
                            [class.dark:text-rose-300]="item.priority === 'urgent'"
                            [class.bg-orange-100]="item.priority === 'high'"
                            [class.text-orange-700]="item.priority === 'high'"
                            [class.bg-yellow-100]="item.priority === 'medium'"
                            [class.text-yellow-700]="item.priority === 'medium'"
                            [class.bg-slate-100]="item.priority === 'low'"
                            [class.text-slate-600]="item.priority === 'low'">
                        <span class="w-1.5 h-1.5 rounded-full"
                              [class.bg-rose-500]="item.priority === 'urgent'"
                              [class.bg-orange-500]="item.priority === 'high'"
                              [class.bg-yellow-500]="item.priority === 'medium'"
                              [class.bg-slate-400]="item.priority === 'low'"></span>
                        {{ item.priority === 'urgent' ? i18n.t().priorityUrgent : item.priority === 'high' ? i18n.t().priorityHigh : item.priority === 'medium' ? i18n.t().priorityMedium : i18n.t().priorityLow }}
                      </span>
                    </td>

                    <!-- 7. Cost & Currency -->
                    <td class="py-3.5 px-3 text-xs">
                      <div class="font-bold text-slate-800 dark:text-slate-200">
                        {{ (item.actualCost || item.estimatedCost || 0).toLocaleString() }}
                        <span class="text-[10px] text-slate-400 font-normal">{{ item.currency }}</span>
                      </div>
                      @if (item.targetDate) {
                        <div class="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-0.5">
                          <mat-icon class="text-[11px]">event</mat-icon>
                          <span>{{ item.targetDate }}</span>
                        </div>
                      }
                    </td>

                    <!-- 8. Interactive Actions -->
                    <td class="py-3.5 px-3 text-center">
                      <div class="flex items-center justify-center gap-1">
                        
                        <!-- AI Consultant for this appliance -->
                        <button
                          type="button"
                          (click)="consultAiTrigger.emit(item)"
                          class="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                          title="استشارة الذكاء الاصطناعي لمقارنة الماركات"
                        >
                          <mat-icon class="text-base">auto_awesome</mat-icon>
                        </button>

                        <!-- Google Calendar sync -->
                        <a
                          [href]="getGoogleCalendarUrl(item)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          title="إضافة لتقويم جوجل"
                        >
                          <mat-icon class="text-base">today</mat-icon>
                        </a>

                        <!-- Comments Modal trigger -->
                        <button
                          type="button"
                          (click)="openCommentsTrigger.emit(item)"
                          class="relative p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="المناقشة والتعليقات"
                        >
                          <mat-icon class="text-base">chat_bubble_outline</mat-icon>
                          @if (item.comments && item.comments.length > 0) {
                            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center">
                              {{ item.comments.length }}
                            </span>
                          }
                        </button>

                        <!-- Attachments Modal trigger -->
                        <button
                          type="button"
                          (click)="openAttachmentsTrigger.emit(item)"
                          class="relative p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="المرفقات والفواتير"
                        >
                          <mat-icon class="text-base">attach_file</mat-icon>
                          @if (item.attachments && item.attachments.length > 0) {
                            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white text-[9px] rounded-full flex items-center justify-center">
                              {{ item.attachments.length }}
                            </span>
                          }
                        </button>

                        <!-- Edit full details -->
                        @if (auth.isEditor()) {
                          <button
                            type="button"
                            (click)="editItemTrigger.emit(item)"
                            class="p-1 rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل التفاصيل"
                          >
                            <mat-icon class="text-base">edit</mat-icon>
                          </button>
                        }

                        <!-- Delete (Admin only) -->
                        @if (auth.isAdmin()) {
                          <button
                            type="button"
                            (click)="onDeleteItem(item.id)"
                            class="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="حذف"
                          >
                            <mat-icon class="text-base">delete_outline</mat-icon>
                          </button>
                        }

                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

        </div>
      } @empty {
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <mat-icon class="text-slate-300 dark:text-slate-600 text-5xl">search_off</mat-icon>
          <h3 class="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">لا توجد نتائج مطابقة لبحثك</h3>
          <p class="text-xs text-slate-400 mt-1">جرب تغيير شروط التصفية أو مسح كلمة البحث.</p>
        </div>
      }

    </div>
  `,
})
export class ChecklistViewComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedStatus = signal<string>('all');
  selectedPriority = signal<string>('all');
  sortBy = signal<'number' | 'title' | 'priority' | 'cost' | 'status'>('number');

  addItemTrigger = output<void>();
  editItemTrigger = output<ChecklistItem>();
  consultAiTrigger = output<ChecklistItem | null>();
  openCommentsTrigger = output<ChecklistItem>();
  openAttachmentsTrigger = output<ChecklistItem>();
  openGoogleSheetImport = output<void>();

  categories = computed(() => {
    const set = new Set<string>();
    for (const it of this.storage.currentProjectItems()) {
      if (it.category) set.add(it.category);
    }
    return Array.from(set);
  });

  getCategoryCount(category: string): number {
    return this.storage.currentProjectItems().filter(it => it.category === category).length;
  }

  filteredItems = computed(() => {
    const items = this.storage.currentProjectItems();
    return filterAndSortItems(
      items,
      {
        searchQuery: this.searchQuery(),
        category: this.selectedCategory(),
        status: this.selectedStatus(),
        priority: this.selectedPriority(),
        sortBy: this.sortBy(),
      },
      this.i18n.currentLang()
    );
  });

  groupedItems = computed(() => {
    const items = this.filteredItems();
    const map = new Map<string, ChecklistItem[]>();

    for (const it of items) {
      const cat = it.category || 'عام';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(it);
    }

    const result: { category: string; items: ChecklistItem[]; completedCount: number }[] = [];
    map.forEach((catItems, category) => {
      const completedCount = catItems.filter(i => i.status === 'purchased' || i.status === 'delivered').length;
      result.push({ category, items: catItems, completedCount });
    });

    return result;
  });

  onToggleStatus(id: string) {
    if (!this.auth.isEditor()) return;
    this.storage.toggleItemStatus(id);
  }

  onSelectStatus(id: string, status: ItemStatus) {
    if (!this.auth.isEditor()) return;
    this.storage.toggleItemStatus(id, status);
  }

  onUpdateMyNotes(item: ChecklistItem, notes: string) {
    this.storage.updateItem({
      ...item,
      myNotes: notes,
    });
  }

  onDeleteItem(id: string) {
    if (confirm(this.i18n.t().confirmDelete)) {
      this.storage.deleteItem(id);
    }
  }

  getGoogleCalendarUrl(item: ChecklistItem): string {
    return createGoogleCalendarUrl(item, this.i18n.currentLang());
  }
}
