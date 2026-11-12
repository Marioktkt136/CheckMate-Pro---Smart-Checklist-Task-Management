import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ChecklistItem, ItemStatus, filterAndSortItems, createGoogleCalendarUrl } from '../core/checklist-rules';

const CATEGORY_EN_MAP: Record<string, string> = {
  'الأجهزة الأساسية': 'Essential Appliances',
  'أجهزة المطبخ': 'Kitchen Appliances',
  'أجهزة التنظيف والكي': 'Cleaning & Ironing',
  'الرفاهية المطبخية': 'Kitchen Luxury',
  'عام': 'General',
};

@Component({
  selector: 'app-checklist-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
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
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
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

          <!-- Actions: Add Item, Google Sheets & AI Advisor -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
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
              [title]="i18n.t().importGoogleSheets"
            >
              <mat-icon class="text-base text-emerald-600 dark:text-emerald-400">table_chart</mat-icon>
              <span>{{ i18n.t().importGoogleSheets }}</span>
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

        <!-- Category Horizontal Scrollable Bar (Mobile-Optimized) -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <mat-icon class="!text-xs !w-3.5 !h-3.5">category</mat-icon>
              <span>{{ i18n.t().filterCategory }}:</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono">
              {{ storage.currentProjectItems().length }} {{ i18n.t().itemsUnit }}
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
              <span>{{ i18n.t().allCategories }}</span>
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
                <span>{{ displayCategory(cat) }}</span>
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
              [value]="selectedStatus()"
              (change)="onStatusFilterChange($event)"
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
              [value]="selectedPriority()"
              (change)="onPriorityFilterChange($event)"
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
              [value]="sortBy()"
              (change)="onSortChange($event)"
              class="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="number">{{ i18n.t().orderExcel }}</option>
              <option value="priority">{{ i18n.t().byPriority }}</option>
              <option value="title">{{ i18n.t().byName }}</option>
              <option value="cost">{{ i18n.t().byCost }}</option>
              <option value="status">{{ i18n.t().byStatus }}</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Grouped Checklist Display (Desktop Table + Mobile Cards) -->
      @for (group of groupedItems(); track group.category) {
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          
          <!-- Category Header -->
          <div class="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 class="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {{ displayCategory(group.category) }}
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
                    @if (getPrimaryImage(item); as primaryImg) {
                      <button
                        type="button"
                        (click)="openAttachmentsTrigger.emit(item)"
                        class="cursor-pointer shrink-0"
                        [title]="primaryImg.name"
                      >
                        <img
                          [src]="primaryImg.url"
                          [alt]="primaryImg.name"
                          referrerpolicy="no-referrer"
                          class="w-10 h-10 rounded-lg object-cover border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                        />
                      </button>
                    }
                    <div>
                      <div class="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {{ i18n.isRtl() ? item.titleAr : (item.titleEn || item.titleAr) }}
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>#{{ item.itemNumber }} • {{ displayCategory(item.category) }}</span>
                        @if (item.storeLocation || item.storeName) {
                          <span class="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5 font-medium">
                            <mat-icon class="!text-[10px] !w-2.5 !h-2.5">location_on</mat-icon>
                            <span>{{ item.storeLocation || item.storeName }}</span>
                          </span>
                        }
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
                    {{ i18n.t().myNotes }}:
                  </span>
                  <input
                    type="text"
                    [value]="item.myNotes"
                    (change)="onUpdateMyNotesEvent(item, $event)"
                    [disabled]="!auth.isEditor()"
                    [placeholder]="i18n.t().brandAndStore"
                    class="w-full text-xs px-2.5 py-1.5 rounded-lg border-2 border-amber-300 dark:border-amber-600/70 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <!-- Status, Cost, & Interactive Actions -->
                <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <!-- Status dropdown -->
                  <select
                    [value]="item.status"
                    (change)="onSelectStatusEvent(item.id, $event)"
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
                    <option value="pending">{{ i18n.t().statusPending }}</option>
                    <option value="comparing">{{ i18n.t().statusComparing }}</option>
                    <option value="purchased">{{ i18n.t().statusPurchased }}</option>
                    <option value="delivered">{{ i18n.t().statusDelivered }}</option>
                  </select>

                  <!-- Cost -->
                  <div class="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {{ (item.actualCost || item.estimatedCost || 0).toLocaleString() }}
                    <span class="text-[10px] text-slate-400 font-normal">{{ i18n.t().currencyEgp }}</span>
                  </div>

                  <!-- Quick Icons -->
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="consultAiTrigger.emit(item)"
                      class="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      [title]="i18n.t().askAi"
                    >
                      <mat-icon class="text-base">auto_awesome</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="openCommentsTrigger.emit(item)"
                      class="relative p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      [title]="i18n.t().comments"
                    >
                      <mat-icon class="text-base">chat_bubble_outline</mat-icon>
                      @if (item.comments && item.comments.length > 0) {
                        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center">
                          {{ item.comments.length }}
                        </span>
                      }
                    </button>
                    <button
                      type="button"
                      (click)="openAttachmentsTrigger.emit(item)"
                      class="relative p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      [title]="i18n.t().attachments"
                    >
                      <mat-icon class="text-base">attach_file</mat-icon>
                      @if (item.attachments && item.attachments.length > 0) {
                        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white text-[9px] rounded-full flex items-center justify-center">
                          {{ item.attachments.length }}
                        </span>
                      }
                    </button>
                    @if (auth.isEditor()) {
                      <button
                        type="button"
                        (click)="editItemTrigger.emit(item)"
                        class="p-1 rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        [title]="i18n.t().editItem"
                      >
                        <mat-icon class="text-base">edit</mat-icon>
                      </button>
                    }
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        (click)="onDeleteItem(item.id)"
                        class="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        [title]="i18n.t().deleteItem"
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
            <table class="w-full text-sm text-start">
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
                      <div class="flex items-center gap-2.5">
                        <button
                          type="button"
                          (click)="onToggleStatus(item.id)"
                          class="w-5 h-5 rounded flex items-center justify-center text-xs transition cursor-pointer shrink-0"
                          [class.bg-emerald-600]="item.status === 'purchased' || item.status === 'delivered'"
                          [class.text-white]="item.status === 'purchased' || item.status === 'delivered'"
                          [class.border]="item.status !== 'purchased' && item.status !== 'delivered'"
                          [class.border-slate-300]="item.status !== 'purchased' && item.status !== 'delivered'"
                          [class.dark:border-slate-600]="item.status !== 'purchased' && item.status !== 'delivered'"
                          [title]="i18n.t().clickToChangeStatus"
                        >
                          @if (item.status === 'purchased' || item.status === 'delivered') {
                            <mat-icon class="text-sm">check</mat-icon>
                          }
                        </button>
                        @if (getPrimaryImage(item); as primaryImg) {
                          <button
                            type="button"
                            (click)="openAttachmentsTrigger.emit(item)"
                            class="cursor-pointer shrink-0"
                            [title]="primaryImg.name"
                          >
                            <img
                              [src]="primaryImg.url"
                              [alt]="primaryImg.name"
                              referrerpolicy="no-referrer"
                              class="w-10 h-10 rounded-lg object-cover border border-emerald-300 dark:border-emerald-700 hover:scale-105 transition shadow-2xs"
                            />
                          </button>
                        }
                        <div>
                          <div class="font-bold text-slate-900 dark:text-slate-100">
                            {{ i18n.isRtl() ? item.titleAr : (item.titleEn || item.titleAr) }}
                          </div>
                          <div class="flex items-center gap-1.5 flex-wrap mt-1">
                            @if (item.storeLocation || item.storeName) {
                              <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5 font-medium">
                                <mat-icon class="!text-[10px] !w-2.5 !h-2.5">location_on</mat-icon>
                                <span>{{ item.storeLocation || item.storeName }}</span>
                              </span>
                            }
                            @if (item.tags && item.tags.length > 0) {
                              @for (tag of item.tags; track tag) {
                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  #{{ tag }}
                                </span>
                              }
                            }
                            @if (item.comments && item.comments.length > 0) {
                              <button
                                type="button"
                                (click)="openCommentsTrigger.emit(item)"
                                class="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <mat-icon class="!text-[10px] !w-2.5 !h-2.5">forum</mat-icon>
                                <span class="max-w-[140px] truncate">{{ item.comments[item.comments.length - 1].text }}</span>
                              </button>
                            }
                            @if (item.attachments && item.attachments.length > 0) {
                              <button
                                type="button"
                                (click)="openAttachmentsTrigger.emit(item)"
                                class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <mat-icon class="!text-[10px] !w-2.5 !h-2.5">attach_file</mat-icon>
                                <span>{{ item.attachments.length }}</span>
                              </button>
                            }
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 3. Spec Notes -->
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

                    <!-- 4. My Notes -->
                    <td class="py-3.5 px-4">
                      <div class="relative">
                        <input
                          type="text"
                          [value]="item.myNotes"
                          (change)="onUpdateMyNotesEvent(item, $event)"
                          [disabled]="!auth.isEditor()"
                          [placeholder]="i18n.t().brandAndStore"
                          class="w-full text-xs px-2.5 py-1.5 rounded-lg border-2 border-amber-300 dark:border-amber-600/70 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium placeholder:text-amber-400 dark:placeholder:text-amber-600/60 transition"
                        />
                      </div>
                    </td>

                    <!-- 5. Status Dropdown -->
                    <td class="py-3.5 px-3 text-center">
                      <select
                        [value]="item.status"
                        (change)="onSelectStatusEvent(item.id, $event)"
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
                        <option value="pending">{{ i18n.t().statusPending }}</option>
                        <option value="comparing">{{ i18n.t().statusComparing }}</option>
                        <option value="purchased">{{ i18n.t().statusPurchased }}</option>
                        <option value="delivered">{{ i18n.t().statusDelivered }}</option>
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
                        <span class="text-[10px] text-slate-400 font-normal">{{ i18n.t().currencyEgp }}</span>
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
                        
                        <!-- AI Consultant for this item -->
                        <button
                          type="button"
                          (click)="consultAiTrigger.emit(item)"
                          class="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                          [title]="i18n.t().askAi"
                        >
                          <mat-icon class="text-base">auto_awesome</mat-icon>
                        </button>

                        <!-- Google Calendar sync -->
                        <a
                          [href]="getGoogleCalendarUrl(item)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          [title]="i18n.t().addToGoogleCalendar"
                        >
                          <mat-icon class="text-base">today</mat-icon>
                        </a>

                        <!-- Comments Modal trigger -->
                        <button
                          type="button"
                          (click)="openCommentsTrigger.emit(item)"
                          class="relative p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          [title]="i18n.t().comments"
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
                          [title]="i18n.t().attachments"
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
                            [title]="i18n.t().editItem"
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
                            [title]="i18n.t().deleteItem"
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
          <h3 class="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">
            {{ i18n.isRtl() ? 'لا توجد أصناف في هذا المشروع حالياً' : 'No items found in this project' }}
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            {{ i18n.isRtl() ? 'أنشئ مشروعاً جديداً أو أضف صنفاً جديداً لحسابك أو قم باستيراد جدول Google Sheets.' : 'Create a new project, add a new item, or import a Google Sheet.' }}
          </p>
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              (click)="openNewProjectModal.emit()"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <mat-icon class="!text-sm !w-4 !h-4">create_new_folder</mat-icon>
              <span>{{ i18n.t().newProject }}</span>
            </button>
            @if (auth.isEditor()) {
              <button
                type="button"
                (click)="addItemTrigger.emit()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                <mat-icon class="!text-sm !w-4 !h-4">add</mat-icon>
                <span>{{ i18n.t().addItem }}</span>
              </button>
            }
          </div>
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
  openNewProjectModal = output<void>();

  categories = computed(() => {
    const set = new Set<string>(this.storage.categories());
    for (const it of this.storage.currentProjectItems()) {
      if (it.category) set.add(it.category);
    }
    return Array.from(set);
  });

  displayCategory(cat: string): string {
    if (this.i18n.isRtl()) return cat;
    return CATEGORY_EN_MAP[cat] || cat;
  }

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

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event) {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
  }

  onPriorityFilterChange(event: Event) {
    this.selectedPriority.set((event.target as HTMLSelectElement).value);
  }

  onSortChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as 'number' | 'title' | 'priority' | 'cost' | 'status';
    this.sortBy.set(val);
  }

  onToggleStatus(id: string) {
    if (!this.auth.isEditor()) return;
    this.storage.toggleItemStatus(id);
  }

  onSelectStatusEvent(id: string, event: Event) {
    if (!this.auth.isEditor()) return;
    const status = (event.target as HTMLSelectElement).value as ItemStatus;
    this.storage.toggleItemStatus(id, status);
  }

  onUpdateMyNotesEvent(item: ChecklistItem, event: Event) {
    const notes = (event.target as HTMLInputElement).value;
    this.storage.updateItem({
      ...item,
      myNotes: notes,
    });
  }

  onDeleteItem(id: string) {
    this.storage.deleteItem(id);
  }

  getPrimaryImage(item: ChecklistItem) {
    const list = item.attachments || [];
    const primary = list.find(a => a.type === 'image' && a.isPrimary && a.url);
    if (primary) return primary;
    return [...list].reverse().find(a => a.type === 'image' && a.url) || null;
  }

  getGoogleCalendarUrl(item: ChecklistItem): string {
    return createGoogleCalendarUrl(item, this.i18n.currentLang());
  }
}
