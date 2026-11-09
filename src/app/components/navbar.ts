import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService, UserProfile } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors w-full">
      <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div class="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          <!-- Logo & Brand (Responsive) -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <mat-icon class="text-lg sm:text-xl">checklist_rtl</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-1 sm:gap-1.5">
                <span class="font-extrabold text-xs sm:text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {{ i18n.t().appName }}
                </span>
                <span class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  PRO
                </span>
              </div>
              <p class="text-[9px] text-slate-400 hidden lg:block">
                {{ i18n.t().appSubtitle }}
              </p>
            </div>
          </div>

          <!-- Project Selector & Cloud Status (Desktop) -->
          <div class="hidden sm:flex items-center gap-2 min-w-0">
            <!-- Project Folder Selector Dropdown -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleProjectsMenu()"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer text-slate-800 dark:text-slate-200"
                aria-label="Select Project Folder"
              >
                <mat-icon class="text-blue-600 dark:text-blue-400 text-base shrink-0">folder</mat-icon>
                <span class="max-w-[140px] md:max-w-[200px] truncate text-xs sm:text-sm font-semibold">
                  {{ i18n.isRtl() ? storage.activeProject().nameAr : storage.activeProject().nameEn }}
                </span>
                <mat-icon class="text-slate-400 text-xs shrink-0">expand_more</mat-icon>
              </button>

              @if (showProjectsMenu()) {
                <div class="absolute mt-2 w-72 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                     [class.right-0]="!i18n.isRtl()" [class.left-0]="i18n.isRtl()">
                  <div class="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ i18n.t().allProjects }}
                  </div>
                  @for (project of storage.projects(); track project.id) {
                    <button
                      type="button"
                      (click)="selectProject(project.id)"
                      class="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      [class.bg-blue-50]="storage.activeProjectId() === project.id"
                      [class.dark:bg-blue-950/40]="storage.activeProjectId() === project.id"
                    >
                      <div class="flex items-center gap-2.5">
                        <mat-icon class="text-slate-500 text-lg" [style.color]="project.color">{{ project.icon }}</mat-icon>
                        <span class="font-medium text-slate-800 dark:text-slate-200">
                          {{ i18n.isRtl() ? project.nameAr : project.nameEn }}
                        </span>
                      </div>
                      @if (storage.activeProjectId() === project.id) {
                        <mat-icon class="text-blue-600 dark:text-blue-400 text-base">check</mat-icon>
                      }
                    </button>
                  }
                  <div class="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                    <button
                      type="button"
                      (click)="onOpenNewProjectModal()"
                      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium transition cursor-pointer"
                    >
                      <mat-icon class="text-base">add_circle</mat-icon>
                      <span>{{ i18n.t().newProject }}</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Real-Time Cloud Firestore Sync Badge -->
            <button
              type="button"
              (click)="storage.syncWithServer()"
              [title]="'مزامنة سحابية مع Firestore: ' + storage.cloudDbId"
              class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-mono text-[11px]">Firestore Cloud</span>
            </button>
          </div>

          <!-- Actions Bar (Desktop & Mobile) -->
          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">

            <!-- Export / Backup Dropdown (Desktop) -->
            <div class="relative hidden sm:block">
              <button
                type="button"
                (click)="toggleExportMenu()"
                class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Export and Backup Menu"
                title="تصدير ونسخ احتياطي"
              >
                <mat-icon class="text-xl">download</mat-icon>
              </button>

              @if (showExportMenu()) {
                <div class="absolute mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 z-50"
                     [class.right-0]="!i18n.isRtl()" [class.left-0]="i18n.isRtl()">
                  <button
                    type="button"
                    (click)="exportPdfTrigger()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <mat-icon class="text-rose-500 text-base">picture_as_pdf</mat-icon>
                    <span>{{ i18n.t().exportPdf }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="exportCsvTrigger()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <mat-icon class="text-emerald-500 text-base">table_view</mat-icon>
                    <span>{{ i18n.t().exportCsv }}</span>
                  </button>
                  <div class="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    type="button"
                    (click)="openGoogleSheetImport.emit(); showExportMenu.set(false)"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer font-medium"
                  >
                    <mat-icon class="text-emerald-600 dark:text-emerald-400 text-base">table_chart</mat-icon>
                    <span>استيراد من Google Sheets</span>
                  </button>
                  <div class="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    type="button"
                    (click)="workspaceModalTrigger()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer font-medium"
                  >
                    <mat-icon class="text-blue-600 dark:text-blue-400 text-base">cloud_sync</mat-icon>
                    <span>Google Workspace &amp; Firebase</span>
                  </button>
                  <div class="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    type="button"
                    (click)="backupDataTrigger()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <mat-icon class="text-blue-500 text-base">cloud_download</mat-icon>
                    <span>{{ i18n.t().backupData }}</span>
                  </button>
                  <label
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <mat-icon class="text-purple-500 text-base">cloud_upload</mat-icon>
                    <span>{{ i18n.t().restoreData }}</span>
                    <input type="file" accept=".json" (change)="onFileRestore($event)" class="hidden" />
                  </label>
                </div>
              }
            </div>

            <!-- Notifications Bell -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleNotificationsMenu()"
                class="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <mat-icon class="text-lg sm:text-xl">notifications</mat-icon>
                @if (storage.unreadNotificationsCount() > 0) {
                  <span class="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {{ storage.unreadNotificationsCount() }}
                  </span>
                }
              </button>

              @if (showNotificationsMenu()) {
                <div class="absolute mt-2 w-72 sm:w-96 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-50"
                     [class.right-0]="!i18n.isRtl()" [class.left-0]="i18n.isRtl()">
                  <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span class="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {{ i18n.t().notifications }}
                    </span>
                    <button
                      type="button"
                      (click)="storage.markAllNotificationsRead()"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {{ i18n.t().markAllRead }}
                    </button>
                  </div>

                  <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    @for (notif of storage.notifications(); track notif.id) {
                      <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-start gap-3"
                           [class.bg-blue-50/50]="!notif.read" [class.dark:bg-blue-950/20]="!notif.read">
                        <div class="p-1.5 rounded-lg shrink-0"
                             [class.bg-rose-100]="notif.type === 'deadline'"
                             [class.text-rose-600]="notif.type === 'deadline'"
                             [class.bg-blue-100]="notif.type === 'update'"
                             [class.text-blue-600]="notif.type === 'update'"
                             [class.bg-emerald-100]="notif.type === 'info'"
                             [class.text-emerald-600]="notif.type === 'info'">
                          <mat-icon class="text-base">
                            {{ notif.type === 'deadline' ? 'alarm' : notif.type === 'update' ? 'sync' : 'info' }}
                          </mat-icon>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {{ i18n.isRtl() ? notif.title : notif.titleEn }}
                          </p>
                          <p class="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {{ i18n.isRtl() ? notif.message : notif.messageEn }}
                          </p>
                          <span class="text-[10px] text-slate-400 mt-1 block">
                            {{ notif.timestamp }}
                          </span>
                        </div>
                      </div>
                    } @empty {
                      <div class="py-6 text-center text-xs text-slate-400">
                        {{ i18n.t().noNotifications }}
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Dark / Light Mode Toggle -->
            <button
              type="button"
              (click)="storage.toggleDarkMode()"
              class="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              [title]="storage.isDarkMode() ? i18n.t().lightMode : i18n.t().darkMode"
              aria-label="Toggle Theme"
            >
              <mat-icon class="text-lg sm:text-xl">
                {{ storage.isDarkMode() ? 'light_mode' : 'dark_mode' }}
              </mat-icon>
            </button>

            <!-- Language Switcher -->
            <button
              type="button"
              (click)="i18n.toggleLanguage()"
              class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              title="Toggle Language"
            >
              <mat-icon class="text-sm">translate</mat-icon>
              <span class="hidden md:inline">{{ i18n.currentLang() === 'ar' ? 'English' : 'عربي' }}</span>
            </button>

            <!-- User Profile & Roles Dropdown (Desktop) -->
            <div class="relative hidden sm:block">
              <button
                type="button"
                (click)="toggleUserMenu()"
                class="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="User Profile"
              >
                <span class="text-lg leading-none">{{ auth.currentUser().avatar }}</span>
                <div class="hidden xl:block text-right">
                  <div class="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                    {{ i18n.isRtl() ? auth.currentUser().name : auth.currentUser().nameEn }}
                  </div>
                  <div class="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {{ auth.currentUser().role.toUpperCase() }}
                  </div>
                </div>
              </button>

              @if (showUserMenu()) {
                <div class="absolute mt-2 w-64 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-50"
                     [class.right-0]="!i18n.isRtl()" [class.left-0]="i18n.isRtl()">
                  <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div class="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {{ i18n.isRtl() ? auth.currentUser().name : auth.currentUser().nameEn }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {{ auth.currentUser().email }}
                    </div>
                    <div class="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      الصلاحية: {{ auth.currentUser().role.toUpperCase() }}
                    </div>
                  </div>

                  <div class="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    تبديل سريع للمستخدم:
                  </div>

                  @for (user of auth.users(); track user.id) {
                    <button
                      type="button"
                      (click)="switchUser(user)"
                      class="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      [class.bg-blue-50]="auth.currentUser().id === user.id"
                      [class.dark:bg-blue-950/40]="auth.currentUser().id === user.id"
                    >
                      <div class="flex items-center gap-2">
                        <span>{{ user.avatar }}</span>
                        <div>
                          <div class="font-medium text-slate-800 dark:text-slate-200">
                            {{ i18n.isRtl() ? user.name : user.nameEn }}
                          </div>
                          <div class="text-[10px] text-slate-400">
                            {{ user.role }}
                          </div>
                        </div>
                      </div>
                      @if (auth.currentUser().id === user.id) {
                        <mat-icon class="text-blue-600 text-sm">check</mat-icon>
                      }
                    </button>
                  }

                  <div class="border-t border-slate-100 dark:border-slate-800 mt-2 pt-1">
                    <button
                      type="button"
                      (click)="onOpenAuthModal()"
                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold cursor-pointer"
                    >
                      <mat-icon class="text-sm">manage_accounts</mat-icon>
                      <span>إدارة المستخدمين والصلاحيات (Users &amp; Roles)</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Mobile Hamburger Menu Button (Mobile Only) -->
            <button
              type="button"
              (click)="toggleMobileMenu()"
              class="sm:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              <mat-icon class="text-2xl">{{ showMobileMenu() ? 'close' : 'menu' }}</mat-icon>
            </button>

          </div>

        </div>
      </div>

      <!-- Mobile Dropdown Drawer -->
      @if (showMobileMenu()) {
        <div class="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          
          <!-- Mobile Active User Info -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-xs">{{ auth.currentUser().avatar }}</span>
              <div>
                <div class="font-bold text-xs text-slate-900 dark:text-slate-100">{{ auth.currentUser().name }}</div>
                <div class="text-[10px] text-slate-400">{{ auth.currentUser().email }}</div>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {{ auth.currentUser().role.toUpperCase() }}
            </span>
          </div>

          <!-- Mobile Project Switcher -->
          <div>
            <div class="text-xs font-semibold text-slate-500 mb-1.5">المشروع الحالي:</div>
            <div class="grid grid-cols-1 gap-1.5">
              @for (proj of storage.projects(); track proj.id) {
                <button
                  type="button"
                  (click)="selectProject(proj.id); showMobileMenu.set(false)"
                  class="flex items-center justify-between p-2 rounded-lg text-xs font-medium border text-right transition cursor-pointer"
                  [class.bg-blue-50]="storage.activeProjectId() === proj.id"
                  [class.border-blue-300]="storage.activeProjectId() === proj.id"
                  [class.text-blue-700]="storage.activeProjectId() === proj.id"
                  [class.dark:bg-blue-950/40]="storage.activeProjectId() === proj.id"
                  [class.dark:border-blue-800]="storage.activeProjectId() === proj.id"
                  [class.dark:text-blue-300]="storage.activeProjectId() === proj.id"
                  [class.bg-white]="storage.activeProjectId() !== proj.id"
                  [class.dark:bg-slate-800]="storage.activeProjectId() !== proj.id"
                  [class.border-slate-200]="storage.activeProjectId() !== proj.id"
                  [class.dark:border-slate-700]="storage.activeProjectId() !== proj.id"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-base" [style.color]="proj.color">{{ proj.icon }}</mat-icon>
                    <span>{{ i18n.isRtl() ? proj.nameAr : proj.nameEn }}</span>
                  </div>
                  @if (storage.activeProjectId() === proj.id) {
                    <mat-icon class="text-sm">check</mat-icon>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Mobile Cloud Status Indicator -->
          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <div class="font-bold text-[11px]">قاعدة بيانات Firestore متزامنة</div>
                <div class="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">gen-lang-client-0495942485</div>
              </div>
            </div>
            <button
              type="button"
              (click)="storage.syncWithServer()"
              class="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
            >
              مزامنة الآن
            </button>
          </div>

          <!-- Mobile Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              (click)="onOpenAuthModal(); showMobileMenu.set(false)"
              class="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base">manage_accounts</mat-icon>
              <span>إدارة المستخدمين</span>
            </button>

            <button
              type="button"
              (click)="workspaceModalTrigger(); showMobileMenu.set(false)"
              class="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base">cloud_sync</mat-icon>
              <span>Google Workspace</span>
            </button>

            <button
              type="button"
              (click)="exportPdfTrigger(); showMobileMenu.set(false)"
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <mat-icon class="text-rose-500 text-base">picture_as_pdf</mat-icon>
              <span>PDF تقرير</span>
            </button>

            <button
              type="button"
              (click)="exportCsvTrigger(); showMobileMenu.set(false)"
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <mat-icon class="text-emerald-500 text-base">table_view</mat-icon>
              <span>Excel (CSV)</span>
            </button>

            <button
              type="button"
              (click)="openGoogleSheetImport.emit(); showMobileMenu.set(false)"
              class="col-span-2 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-emerald-600 dark:text-emerald-400 text-base">table_chart</mat-icon>
              <span>استيراد جدول Google Sheets (مخطط الأعمدة)</span>
            </button>
          </div>

        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  showProjectsMenu = signal<boolean>(false);
  showNotificationsMenu = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);
  showExportMenu = signal<boolean>(false);
  showMobileMenu = signal<boolean>(false);

  openNewProjectModal = output<void>();
  openAuthModal = output<void>();
  openWorkspaceModal = output<void>();
  openGoogleSheetImport = output<void>();
  triggerPdfExport = output<void>();
  triggerCsvExport = output<void>();

  toggleProjectsMenu() {
    this.showProjectsMenu.update(v => !v);
    this.showNotificationsMenu.set(false);
    this.showUserMenu.set(false);
    this.showExportMenu.set(false);
  }

  toggleNotificationsMenu() {
    this.showNotificationsMenu.update(v => !v);
    this.showProjectsMenu.set(false);
    this.showUserMenu.set(false);
    this.showExportMenu.set(false);
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
    this.showProjectsMenu.set(false);
    this.showNotificationsMenu.set(false);
    this.showExportMenu.set(false);
  }

  toggleExportMenu() {
    this.showExportMenu.update(v => !v);
    this.showProjectsMenu.set(false);
    this.showNotificationsMenu.set(false);
    this.showUserMenu.set(false);
  }

  toggleMobileMenu() {
    this.showMobileMenu.update(v => !v);
    this.showProjectsMenu.set(false);
    this.showNotificationsMenu.set(false);
    this.showUserMenu.set(false);
    this.showExportMenu.set(false);
  }

  selectProject(id: string) {
    this.storage.activeProjectId.set(id);
    this.showProjectsMenu.set(false);
  }

  switchUser(user: UserProfile) {
    this.auth.loginAs(user);
    this.showUserMenu.set(false);
    this.storage.addNotification({
      title: 'تم تبديل المستخدم',
      titleEn: 'User Switched',
      message: `أهلاً بك يا ${user.name}، صلاحيتك الآن (${user.role})`,
      messageEn: `Welcome ${user.nameEn}, your role is (${user.role})`,
      type: 'info',
    });
  }

  onOpenNewProjectModal() {
    this.showProjectsMenu.set(false);
    this.openNewProjectModal.emit();
  }

  onOpenAuthModal() {
    this.showUserMenu.set(false);
    this.openAuthModal.emit();
  }

  workspaceModalTrigger() {
    this.showExportMenu.set(false);
    this.openWorkspaceModal.emit();
  }

  exportPdfTrigger() {
    this.showExportMenu.set(false);
    this.triggerPdfExport.emit();
  }

  exportCsvTrigger() {
    this.showExportMenu.set(false);
    this.triggerCsvExport.emit();
  }

  backupDataTrigger() {
    this.showExportMenu.set(false);
    const jsonStr = this.storage.backupToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileRestore(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const ok = this.storage.restoreFromJson(content);
          if (ok) {
            alert(this.i18n.currentLang() === 'ar' ? 'تمت استعادة البيانات بنجاح!' : 'Data restored successfully!');
          } else {
            alert(this.i18n.currentLang() === 'ar' ? 'فشل استيراد الملف' : 'Failed to import backup file');
          }
        }
      };
      reader.readAsText(file);
    }
    this.showExportMenu.set(false);
  }
}
