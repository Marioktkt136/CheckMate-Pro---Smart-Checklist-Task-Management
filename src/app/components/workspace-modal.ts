import { ChangeDetectionStrategy, Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChecklistItem, ProjectFolder } from '../core/checklist-rules';
import { FirebaseService } from '../services/firebase.service';
import { WorkspaceService, WorkspaceExportResult } from '../services/workspace.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-workspace-modal',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      (keydown.escape)="closeModal.emit()"
    >
      <div
        class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <mat-icon>cloud_sync</mat-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
                {{ lang() === 'ar' ? 'تكامل Google Workspace و Firebase' : 'Google Workspace & Firebase Integration' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ lang() === 'ar' ? 'ربط القائمة مع Google Sheets و Drive و Gmail و Google Calendar' : 'Sync your checklist with Google Sheets, Drive, Gmail, and Google Calendar' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Auth Status & Sign In -->
        <div class="mb-6 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              @if (firebase.currentUser(); as user) {
                <img
                  [src]="user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid"
                  alt="avatar"
                  class="w-10 h-10 rounded-full border border-blue-200 shadow-xs"
                  referrerpolicy="no-referrer"
                />
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ user.displayName || 'Google User' }}</span>
                    <span class="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                      {{ lang() === 'ar' ? 'متصل بـ Google' : 'Connected to Google' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ user.email }}</p>
                </div>
              } @else {
                <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {{ lang() === 'ar' ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google' }}
                  </h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    {{ lang() === 'ar' ? 'مطلوب للمزامنة مع جداول البيانات وDrive وGmail والتقويم' : 'Required to access Sheets, Drive, Gmail and Calendar APIs' }}
                  </p>
                </div>
              }
            </div>

            <div>
              @if (firebase.currentUser()) {
                <button
                  type="button"
                  (click)="handleSignOut()"
                  class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                >
                  {{ lang() === 'ar' ? 'تسجيل خروج' : 'Sign Out' }}
                </button>
              } @else {
                <button
                  type="button"
                  (click)="handleSignIn()"
                  [disabled]="firebase.isAuthenticating()"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{{ firebase.isAuthenticating() ? (lang() === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (lang() === 'ar' ? 'تسجيل الدخول عبر Google' : 'Sign in with Google') }}</span>
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Result / Notification Banner -->
        @if (lastResult(); as res) {
          <div
            [class.bg-emerald-50]="res.success"
            [class.border-emerald-200]="res.success"
            [class.text-emerald-900]="res.success"
            [class.bg-rose-50]="!res.success"
            [class.border-rose-200]="!res.success"
            [class.text-rose-900]="!res.success"
            class="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 mb-5 shadow-xs"
          >
            <div class="flex items-center gap-2">
              <mat-icon [class.text-emerald-600]="res.success" [class.text-rose-600]="!res.success">
                {{ res.success ? 'check_circle' : 'error' }}
              </mat-icon>
              <span>{{ res.message }}</span>
            </div>
            @if (res.url) {
              <a
                [href]="res.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-bold underline px-2 py-1 bg-white/70 rounded text-[11px] hover:bg-white"
              >
                <span>{{ lang() === 'ar' ? 'فتح الرابط' : 'Open Link' }}</span>
                <mat-icon class="!text-xs !w-3 !h-3">open_in_new</mat-icon>
              </a>
            }
          </div>
        }

        <!-- 4 Workspace Action Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 1. Google Sheets Card -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <mat-icon>table_chart</mat-icon>
                </div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Google Sheets</h4>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {{ lang() === 'ar' ? 'تصدير جدول منظم يحتوي كافة الأجهزة والأسعار وملاحظات المعارض إلى حساب Google Sheets الخاص بك.' : 'Export structured table with all appliances, costs and store notes directly into your Google Sheets.' }}
              </p>
            </div>
            <button
              type="button"
              (click)="exportSheets()"
              [disabled]="isBusy() || !firebase.currentUser()"
              class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <mat-icon class="!text-sm !w-4 !h-4">file_upload</mat-icon>
              {{ lang() === 'ar' ? 'إنشاء وتصدير إلى Google Sheets' : 'Export to Google Sheets' }}
            </button>
          </div>

          <!-- 2. Google Drive Backup Card -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <mat-icon>add_to_drive</mat-icon>
                </div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Google Drive</h4>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {{ lang() === 'ar' ? 'حفظ نسخة احتياطية سحابية كاملة من القائمة والميزانية والملاحظات في مجلد Google Drive الخاص بك.' : 'Save full cloud backup of the checklist, notes and budget in your personal Google Drive.' }}
              </p>
            </div>
            <button
              type="button"
              (click)="saveDrive()"
              [disabled]="isBusy() || !firebase.currentUser()"
              class="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <mat-icon class="!text-sm !w-4 !h-4">cloud_upload</mat-icon>
              {{ lang() === 'ar' ? 'حفظ نسخة في Google Drive' : 'Backup to Google Drive' }}
            </button>
          </div>

          <!-- 3. Gmail Send Summary Card -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                  <mat-icon>email</mat-icon>
                </div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Gmail</h4>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {{ lang() === 'ar' ? 'إرسال تقرير HTML شامل مع جدول الأسعار والمصروفات عبر بريدك الإلكتروني في Gmail.' : 'Send an HTML summary email with spending stats and item table through your Gmail.' }}
              </p>
              <form [formGroup]="emailForm" class="mb-3">
                <label for="gmail-recipient" class="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {{ lang() === 'ar' ? 'البريد الإلكتروني للمستلم:' : 'Recipient Email:' }}
                </label>
                <input
                  id="gmail-recipient"
                  type="email"
                  formControlName="recipient"
                  placeholder="name@example.com"
                  class="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </form>
            </div>
            <button
              type="button"
              (click)="sendEmail()"
              [disabled]="isBusy() || !firebase.currentUser() || emailForm.invalid"
              class="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <mat-icon class="!text-sm !w-4 !h-4">send</mat-icon>
              {{ lang() === 'ar' ? 'إرسال التقرير عبر Gmail' : 'Send Report via Gmail' }}
            </button>
          </div>

          <!-- 4. Google Calendar Card -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <mat-icon>calendar_today</mat-icon>
                </div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Google Calendar</h4>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {{ lang() === 'ar' ? 'مزامنة مواعيد شراء وتوريد الأجهزة كأحداث في تقويم Google الرئيسي مع تنبيهات تلقائية.' : 'Sync purchase deadlines and delivery milestones as events directly in your primary Google Calendar.' }}
              </p>
            </div>
            <button
              type="button"
              (click)="syncCalendar()"
              [disabled]="isBusy() || !firebase.currentUser()"
              class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <mat-icon class="!text-sm !w-4 !h-4">event_available</mat-icon>
              {{ lang() === 'ar' ? 'مزامنة المواعيد مع Google Calendar' : 'Sync with Google Calendar' }}
            </button>
          </div>
        </div>

        <!-- Footer Notice -->
        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1">
            <mat-icon class="!text-sm !w-4 !h-4 text-emerald-500">lock</mat-icon>
            {{ lang() === 'ar' ? 'المزامنة تتم بأمان عبر حسابك في Google بإذن منك' : 'Secure synchronization via your Google account with user permission' }}
          </span>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200"
          >
            {{ lang() === 'ar' ? 'إغلاق' : 'Close' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class WorkspaceModal {
  readonly project = input.required<ProjectFolder>();
  readonly items = input.required<ChecklistItem[]>();
  readonly lang = input<'ar' | 'en'>('ar');
  readonly closeModal = output<void>();

  readonly firebase = inject(FirebaseService);
  readonly workspace = inject(WorkspaceService);

  readonly isBusy = signal<boolean>(false);
  readonly lastResult = signal<WorkspaceExportResult | null>(null);

  readonly emailForm = new FormGroup({
    recipient: new FormControl('marionbedrous@gmail.com', [Validators.required, Validators.email])
  });

  async handleSignIn(): Promise<void> {
    try {
      await this.firebase.signInWithGoogle();
      const user = this.firebase.currentUser();
      if (user?.email) {
        this.emailForm.patchValue({ recipient: user.email });
      }
    } catch {
      // User closed popup or error
    }
  }

  async handleSignOut(): Promise<void> {
    await this.firebase.signOut();
  }

  async exportSheets(): Promise<void> {
    const token = this.firebase.getAccessToken();
    if (!token) return;

    this.isBusy.set(true);
    this.lastResult.set(null);
    try {
      const res = await this.workspace.exportToGoogleSheets(this.project(), this.items(), token);
      this.lastResult.set(res);
    } finally {
      this.isBusy.set(false);
    }
  }

  async saveDrive(): Promise<void> {
    const token = this.firebase.getAccessToken();
    if (!token) return;

    this.isBusy.set(true);
    this.lastResult.set(null);
    try {
      const res = await this.workspace.saveToGoogleDrive(this.project(), this.items(), token);
      this.lastResult.set(res);
    } finally {
      this.isBusy.set(false);
    }
  }

  async sendEmail(): Promise<void> {
    const token = this.firebase.getAccessToken();
    const recipient = this.emailForm.value.recipient;
    if (!token || !recipient) return;

    this.isBusy.set(true);
    this.lastResult.set(null);
    try {
      const res = await this.workspace.sendEmailSummary(recipient, this.project(), this.items(), token);
      this.lastResult.set(res);
    } finally {
      this.isBusy.set(false);
    }
  }

  async syncCalendar(): Promise<void> {
    const token = this.firebase.getAccessToken();
    if (!token) return;

    this.isBusy.set(true);
    this.lastResult.set(null);
    try {
      // Sync the first item with target date, or list
      const itemsWithDate = this.items().filter(i => !!i.targetDate);
      if (itemsWithDate.length === 0) {
        this.lastResult.set({
          success: false,
          type: 'calendar',
          message: this.lang() === 'ar' ? 'لا توجد أصناف محدد لها تاريخ مستهدف حالياً' : 'No items have a target date configured yet'
        });
        return;
      }

      let lastRes: WorkspaceExportResult = {
        success: true,
        type: 'calendar',
        message: 'تمت مزامنة المواعيد'
      };

      for (const item of itemsWithDate.slice(0, 3)) {
        lastRes = await this.workspace.createCalendarEvent(item, token);
      }
      this.lastResult.set({
        ...lastRes,
        message: this.lang() === 'ar'
          ? `تمت مزامنة ${Math.min(itemsWithDate.length, 3)} مواعيد مستهدفة مع Google Calendar بنجاح!`
          : `Synced ${Math.min(itemsWithDate.length, 3)} milestone dates to Google Calendar successfully!`
      });
    } finally {
      this.isBusy.set(false);
    }
  }
}
