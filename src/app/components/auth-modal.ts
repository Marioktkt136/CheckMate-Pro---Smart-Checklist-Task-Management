import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { AuthService, UserProfile } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { UserRole } from '../core/checklist-rules';

const AVATARS = ['👨‍💼', '👩‍💼', '👑', '✨', '🛠️', '📊', '🏠', '👤', '👩‍💻', '👨‍🔧'];

@Component({
  selector: 'app-auth-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-mgmt-title"
      tabindex="-1"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-2xl">verified_user</mat-icon>
            </div>
            <div>
              <h3 id="user-mgmt-title" class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {{ i18n.isRtl() ? 'تسجيل الدخول وإدارة الحسابات' : 'Sign In & Account Management' }}
              </h3>
              <p class="text-xs text-slate-400">
                {{ i18n.isRtl()
                  ? 'الدخول عبر حساب Google أو يدويًا باسم المستخدم / البريد الإلكتروني وكلمة المرور'
                  : 'Sign in with Google or manually using Username / Email & Password' }}
              </p>
            </div>
          </div>
          @if (auth.isAuthenticated()) {
            <button
              type="button"
              (click)="closeModal.emit()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              [attr.aria-label]="i18n.t().cancel"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          }
        </div>

        <!-- Active Session Banner (when authenticated) OR Signed-Out Notice -->
        @if (auth.isAuthenticated()) {
          <div class="mt-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ auth.currentUser().avatar }}</span>
              <div>
                <div class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                  <span>{{ i18n.isRtl() ? auth.currentUser().name : auth.currentUser().nameEn }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
                    @{{ auth.currentUser().username }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span class="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                    Token: {{ (auth.token() || '').slice(0, 14) }}...
                  </span>
                  <span>•</span>
                  <span>
                    {{ i18n.t().sessionRemaining }}: <strong>{{ auth.sessionRemainingMinutes() }}m</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                (click)="onRefreshSession()"
                class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="!text-xs !w-3.5 !h-3.5">update</mat-icon>
                <span>{{ i18n.isRtl() ? 'تجديد الجلسة' : 'Extend' }}</span>
              </button>
              <button
                type="button"
                (click)="onSignOut()"
                class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <mat-icon class="!text-xs !w-3.5 !h-3.5">logout</mat-icon>
                <span>{{ i18n.t().logout }}</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
            <mat-icon class="!text-base !w-4 !h-4 text-amber-600 shrink-0">lock</mat-icon>
            <span>{{ i18n.t().signedOutBanner }}</span>
          </div>
        }

        <!-- Mode Tabs: Sign In | Sign Up | Manage Accounts (when authenticated) -->
        <div
          class="grid gap-1.5 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
          [class.grid-cols-3]="auth.isAuthenticated()"
          [class.grid-cols-2]="!auth.isAuthenticated()"
        >
          <button
            type="button"
            (click)="switchTab('signin')"
            class="py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            [class.bg-white]="currentTab() === 'signin'"
            [class.dark:bg-slate-900]="currentTab() === 'signin'"
            [class.text-blue-600]="currentTab() === 'signin'"
            [class.shadow-xs]="currentTab() === 'signin'"
            [class.text-slate-600]="currentTab() !== 'signin'"
            [class.dark:text-slate-400]="currentTab() !== 'signin'"
          >
            <mat-icon class="text-base">login</mat-icon>
            <span>{{ i18n.t().signIn }}</span>
          </button>

          <button
            type="button"
            (click)="switchTab('create')"
            class="py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            [class.bg-white]="currentTab() === 'create'"
            [class.dark:bg-slate-900]="currentTab() === 'create'"
            [class.text-blue-600]="currentTab() === 'create'"
            [class.shadow-xs]="currentTab() === 'create'"
            [class.text-slate-600]="currentTab() !== 'create'"
            [class.dark:text-slate-400]="currentTab() !== 'create'"
          >
            <mat-icon class="text-base">person_add</mat-icon>
            <span>{{ i18n.t().signUp }}</span>
          </button>

          @if (auth.isAuthenticated()) {
            <button
              type="button"
              (click)="switchTab('list')"
              class="py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              [class.bg-white]="currentTab() === 'list'"
              [class.dark:bg-slate-900]="currentTab() === 'list'"
              [class.text-blue-600]="currentTab() === 'list'"
              [class.shadow-xs]="currentTab() === 'list'"
              [class.text-slate-600]="currentTab() !== 'list'"
              [class.dark:text-slate-400]="currentTab() !== 'list'"
            >
              <mat-icon class="text-base">group</mat-icon>
              <span>{{ i18n.isRtl() ? 'الحسابات' : 'Accounts' }} ({{ auth.users().length }})</span>
            </button>
          }
        </div>

        <!-- Feedback & Error Banners -->
        @if (feedbackMessage()) {
          <div class="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <mat-icon class="!text-sm !w-4 !h-4">check_circle</mat-icon>
            <span>{{ feedbackMessage() }}</span>
          </div>
        }
        @if (errorMessage()) {
          <div class="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-2">
            <div class="font-semibold flex items-center gap-1.5">
              <mat-icon class="!text-sm !w-4 !h-4">error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <!-- Helpful recovery actions when password is wrong or account not found -->
            @if (matchedWrongPassUser()) {
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                <span class="text-[11px] text-rose-700 dark:text-rose-300">
                  {{ i18n.isRtl()
                    ? 'هل نسيت كلمة المرور لحساب (' + matchedWrongPassUser()!.username + ')؟'
                    : 'Forgot password for (@' + matchedWrongPassUser()!.username + ')?' }}
                </span>
                <button
                  type="button"
                  (click)="onResetPasswordAndSignIn()"
                  class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer transition shrink-0"
                >
                  {{ i18n.isRtl() ? 'اعتماد كلمة المرور هذه والدخول' : 'Set This Password & Sign In' }}
                </button>
              </div>
            }

            @if (showNotFoundSignUpHint()) {
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                <span class="text-[11px] text-rose-700 dark:text-rose-300">
                  {{ i18n.isRtl() ? 'هذا الحساب غير مسجل بعد.' : 'This account is not registered yet.' }}
                </span>
                <button
                  type="button"
                  (click)="prefillSignUpFromSignIn()"
                  class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer transition shrink-0"
                >
                  {{ i18n.isRtl() ? 'إنشاء حساب جديد الآن' : 'Create Account Now' }}
                </button>
              </div>
            }
          </div>
        }

        <!-- Google Authentication Button (Shown on both Sign In & Sign Up tabs) -->
        @if (currentTab() === 'signin' || currentTab() === 'create') {
          <div class="mt-4 space-y-2.5">
            <button
              type="button"
              (click)="onGoogleAuth()"
              class="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"/>
                <path fill="#34A853" d="M3.6 7.4l3.2 2.4C7.7 7.6 9.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"/>
                <path fill="#FBBC05" d="M12 21.5c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2l-3.2 2.5c1.5 3.1 4.9 5.4 8.9 5.4z"/>
                <path fill="#4285F4" d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.4-1.1 2.5-2.1 3.2l2.9 2.4c1.7-1.6 2.8-4 2.8-7.9z"/>
              </svg>
              <span>{{ i18n.t().continueWithGoogle }}</span>
            </button>

            @if (showGoogleChooser()) {
              <div class="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-slate-800/90 space-y-3 animate-in fade-in duration-150">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"/>
                      <path fill="#34A853" d="M3.6 7.4l3.2 2.4C7.7 7.6 9.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"/>
                      <path fill="#FBBC05" d="M12 21.5c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2l-3.2 2.5c1.5 3.1 4.9 5.4 8.9 5.4z"/>
                      <path fill="#4285F4" d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.4-1.1 2.5-2.1 3.2l2.9 2.4c1.7-1.6 2.8-4 2.8-7.9z"/>
                    </svg>
                    <span>
                      {{ currentTab() === 'create'
                        ? (i18n.isRtl() ? 'التسجيل باستخدام حساب Google' : 'Sign Up with Google Account')
                        : (i18n.isRtl() ? 'اختر حساب Google للمتابعة' : 'Choose a Google Account to Continue') }}
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="showGoogleChooser.set(false)"
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                  >
                    <mat-icon class="!text-base !w-4 !h-4">close</mat-icon>
                  </button>
                </div>

                @if (currentTab() === 'signin' && auth.users().length > 0) {
                  <div class="space-y-1.5">
                    @for (acc of auth.users(); track acc.id) {
                      <button
                        type="button"
                        (click)="onSelectGoogleAccount(acc)"
                        class="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 flex items-center justify-between gap-2 text-start transition cursor-pointer"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="text-base shrink-0">{{ acc.avatar }}</span>
                          <div class="min-w-0">
                            <div class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {{ i18n.isRtl() ? acc.name : acc.nameEn }}
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {{ acc.email }}
                            </div>
                          </div>
                        </div>
                        <mat-icon class="!text-sm !w-4 !h-4 text-blue-600 shrink-0">arrow_forward</mat-icon>
                      </button>
                    }
                  </div>
                }

                <div class="space-y-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <input
                    type="email"
                    [formControl]="googleEmailControl"
                    [placeholder]="i18n.isRtl() ? 'أدخل بريد Google (مثال: name@gmail.com)' : 'Enter Google email (e.g. name@gmail.com)'"
                    class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  @if (currentTab() === 'create') {
                    <input
                      type="text"
                      [formControl]="googleNameControl"
                      [placeholder]="i18n.isRtl() ? 'الاسم الكامل (اختياري)' : 'Full Name (optional)'"
                      class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  }
                  <button
                    type="button"
                    (click)="onSubmitGoogleChooserEmail()"
                    class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <mat-icon class="!text-sm !w-4 !h-4">login</mat-icon>
                    <span>{{ i18n.t().continueWithGoogle }}</span>
                  </button>
                </div>
              </div>
            }

            <!-- Divider -->
            <div class="relative flex items-center py-1">
              <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span class="shrink-0 mx-3 text-[11px] font-semibold text-slate-400">
                {{ i18n.isRtl() ? 'أو يدويًا باسم المستخدم / البريد وكلمة المرور' : 'Or manually with Username / Email & Password' }}
              </span>
              <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>
          </div>
        }

        <!-- TAB 1: Manual Sign In (Username/Email & Password) -->
        @if (currentTab() === 'signin') {
          <form [formGroup]="signInForm" (ngSubmit)="onSignInSubmit()" class="mt-2 space-y-3.5">
            <div>
              <label for="signin-identifier" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().username }} / {{ i18n.t().email }} *
              </label>
              <input
                id="signin-identifier"
                type="text"
                formControlName="identifier"
                [placeholder]="i18n.isRtl() ? 'اسم المستخدم أو البريد الإلكتروني' : 'Enter username or email address'"
                class="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="signin-password" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ i18n.t().password }} *
              </label>
              <div class="relative">
                <input
                  id="signin-password"
                  [type]="showSignInPassword() ? 'text' : 'password'"
                  formControlName="password"
                  [placeholder]="i18n.t().enterPassword"
                  class="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  (click)="showSignInPassword.set(!showSignInPassword())"
                  class="absolute inset-y-0 end-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-1"
                  [attr.aria-label]="showSignInPassword() ? 'Hide password' : 'Show password'"
                >
                  <mat-icon class="!text-base">{{ showSignInPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="signInForm.invalid"
              class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <mat-icon class="!text-sm !w-4 !h-4">login</mat-icon>
              <span>{{ i18n.t().signIn }}</span>
            </button>

            <div class="text-center pt-1">
              <button
                type="button"
                (click)="switchTab('create')"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {{ i18n.t().dontHaveAccount }}
              </button>
            </div>
          </form>
        }

        <!-- TAB 2: Manual Sign Up (Full Name, Username, Email & Password) -->
        @if (currentTab() === 'create') {
          <form [formGroup]="createUserForm" (ngSubmit)="onCreateUser()" class="mt-2 space-y-3">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-user-name" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().fullName }} *
                </label>
                <input
                  id="create-user-name"
                  type="text"
                  formControlName="name"
                  [placeholder]="i18n.isRtl() ? 'مثال: ماريو نعيم' : 'e.g. Mario Naiem'"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="create-user-username" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().username }} *
                </label>
                <input
                  id="create-user-username"
                  type="text"
                  formControlName="username"
                  placeholder="marioktkt136"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-user-email" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().email }} *
                </label>
                <input
                  id="create-user-email"
                  type="email"
                  formControlName="email"
                  (input)="onSignUpEmailInput($event)"
                  placeholder="name@example.com"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="create-user-password" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().password }} *
                </label>
                <div class="relative">
                  <input
                    id="create-user-password"
                    [type]="showSignUpPassword() ? 'text' : 'password'"
                    formControlName="password"
                    [placeholder]="i18n.t().enterPassword"
                    class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    (click)="showSignUpPassword.set(!showSignUpPassword())"
                    class="absolute inset-y-0 end-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-1"
                    [attr.aria-label]="showSignUpPassword() ? 'Hide password' : 'Show password'"
                  >
                    <mat-icon class="!text-base">{{ showSignUpPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label for="create-user-role" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().selectRole }} *
                </label>
                <select
                  id="create-user-role"
                  formControlName="role"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="admin">👑 {{ i18n.t().roleAdmin }}</option>
                  <option value="editor">🛠️ {{ i18n.t().roleEditor }}</option>
                  <option value="viewer">👀 {{ i18n.t().roleViewer }}</option>
                </select>
              </div>

              <!-- Avatar Picker -->
              <div>
                <span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {{ i18n.t().chooseAvatar }}:
                </span>
                <div class="flex flex-wrap gap-1.5">
                  @for (av of avatarOptions; track av) {
                    <button
                      type="button"
                      (click)="selectedAvatar.set(av)"
                      class="w-8 h-8 rounded-lg border text-base flex items-center justify-center transition cursor-pointer"
                      [class.border-blue-600]="selectedAvatar() === av"
                      [class.bg-blue-50]="selectedAvatar() === av"
                      [class.dark:bg-blue-950]="selectedAvatar() === av"
                      [class.scale-110]="selectedAvatar() === av"
                      [class.border-slate-200]="selectedAvatar() !== av"
                      [class.dark:border-slate-700]="selectedAvatar() !== av"
                    >
                      {{ av }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="createUserForm.invalid"
              class="w-full py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <mat-icon class="!text-sm !w-4 !h-4">person_add</mat-icon>
              <span>{{ i18n.t().signUp }}</span>
            </button>

            <div class="text-center pt-1">
              <button
                type="button"
                (click)="switchTab('signin')"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {{ i18n.t().alreadyHaveAccount }}
              </button>
            </div>
          </form>
        }

        <!-- TAB 3: Current Users List & Role Management -->
        @if (currentTab() === 'list' && auth.isAuthenticated()) {
          <div class="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            @for (user of auth.users(); track user.id) {
              <div
                class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                [class.ring-2]="auth.currentUser().id === user.id"
                [class.ring-blue-500/50]="auth.currentUser().id === user.id"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl p-2 bg-white dark:bg-slate-700 rounded-xl shadow-xs shrink-0">
                      {{ user.avatar }}
                    </span>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {{ i18n.isRtl() ? user.name : user.nameEn }}
                        </span>
                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          @{{ user.username }}
                        </span>
                        @if (auth.currentUser().id === user.id) {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {{ i18n.isRtl() ? 'الحساب النشط' : 'Active Account' }}
                          </span>
                        }
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Role Selector & Actions Bar -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500 font-medium">{{ i18n.t().selectRole }}:</span>
                    <select
                      [value]="user.role"
                      (change)="onChangeRole(user.id, $event)"
                      class="px-2.5 py-1 rounded-lg border text-xs font-bold bg-white dark:bg-slate-700 cursor-pointer focus:outline-none"
                      [class.border-emerald-300]="user.role === 'admin'"
                      [class.text-emerald-700]="user.role === 'admin'"
                      [class.border-blue-300]="user.role === 'editor'"
                      [class.text-blue-700]="user.role === 'editor'"
                      [class.border-slate-300]="user.role === 'viewer'"
                      [class.text-slate-600]="user.role === 'viewer'"
                    >
                      <option value="admin">👑 {{ i18n.t().roleAdmin }}</option>
                      <option value="editor">🛠️ {{ i18n.t().roleEditor }}</option>
                      <option value="viewer">👀 {{ i18n.t().roleViewer }}</option>
                    </select>
                  </div>

                  @if (auth.users().length > 1) {
                    <button
                      type="button"
                      (click)="confirmDeleteId.set(user.id)"
                      class="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">delete_outline</mat-icon>
                      <span>{{ i18n.isRtl() ? 'حذف' : 'Delete' }}</span>
                    </button>
                  }
                </div>

                <!-- Inline Confirmation for deletion -->
                @if (confirmDeleteId() === user.id) {
                  <div class="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
                    <div class="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-bold">
                      <mat-icon class="!text-sm !w-4 !h-4 text-rose-600">warning</mat-icon>
                      <span>
                        {{ i18n.isRtl()
                          ? 'هل تريد بالتأكيد حذف حساب (' + user.name + ') نهائياً؟'
                          : 'Are you sure you want to permanently delete (' + user.nameEn + ')?' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        (click)="confirmDelete(user)"
                        class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                      >
                        {{ i18n.isRtl() ? 'نعم، احذف' : 'Yes, Delete' }}
                      </button>
                      <button
                        type="button"
                        (click)="confirmDeleteId.set(null)"
                        class="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer transition"
                      >
                        {{ i18n.t().cancel }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
})
export class AuthModalComponent {
  i18n = inject(I18nService);
  auth = inject(AuthService);
  storage = inject(StorageService);

  closeModal = output<void>();

  currentTab = signal<'signin' | 'create' | 'list'>('signin');
  selectedAvatar = signal<string>('👨‍💼');
  avatarOptions = AVATARS;
  feedbackMessage = signal<string>('');
  errorMessage = signal<string>('');
  confirmDeleteId = signal<string | null>(null);
  showSignInPassword = signal<boolean>(false);
  showSignUpPassword = signal<boolean>(false);

  matchedWrongPassUser = signal<UserProfile | null>(null);
  showNotFoundSignUpHint = signal<boolean>(false);
  showGoogleChooser = signal<boolean>(false);

  googleEmailControl = new FormControl('');
  googleNameControl = new FormControl('');

  signInForm = new FormGroup({
    identifier: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  createUserForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    username: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    role: new FormControl<UserRole>('editor', [Validators.required]),
  });

  switchTab(tab: 'signin' | 'create' | 'list') {
    this.currentTab.set(tab);
    this.feedbackMessage.set('');
    this.errorMessage.set('');
    this.matchedWrongPassUser.set(null);
    this.showNotFoundSignUpHint.set(false);
    this.showGoogleChooser.set(false);
  }

  onSignUpEmailInput(event: Event) {
    const val = (event.target as HTMLInputElement).value || '';
    const currentUsername = this.createUserForm.controls.username.value || '';
    if (val.includes('@') && !currentUsername.trim()) {
      const prefix = val.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();
      if (prefix) {
        this.createUserForm.controls.username.setValue(prefix);
      }
    }
  }

  async onGoogleAuth() {
    this.errorMessage.set('');
    this.feedbackMessage.set('');
    this.matchedWrongPassUser.set(null);
    this.showNotFoundSignUpHint.set(false);

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const mode = this.currentTab() === 'create' ? 'create' : 'signin';

    // 1. If the user already typed an email/username in the active form, use it directly
    const typedIdentifier =
      mode === 'signin'
        ? (this.signInForm.value.identifier || '').trim()
        : (this.createUserForm.value.email || this.createUserForm.value.username || '').trim();
    const typedName = mode === 'create' ? (this.createUserForm.value.name || '').trim() : '';

    if (typedIdentifier) {
      await this.completeGoogleAuthWithEmail(typedIdentifier, typedName, mode);
      return;
    }

    // 2. Try Firebase Google Popup
    const result = await this.auth.signInWithGoogleProvider(mode);
    if (result.success && result.user) {
      if (result.isNewUser) {
        this.storage.resetWorkspaceForNewUser(result.user.id);
      } else {
        await this.storage.loadUserWorkspace(result.user.id);
      }
      this.showGoogleChooser.set(false);
      this.closeModal.emit();
      return;
    }

    if (result.errorCode === 'account_not_found') {
      this.showNotFoundSignUpHint.set(true);
      this.errorMessage.set(this.i18n.t().googleAccountNotFoundError);
      return;
    }

    // 3. When popup is blocked or closed in the iframe environment, open the in-modal Google Account Chooser
    await this.auth.syncUsersFromDatabase();
    this.showGoogleChooser.set(true);
  }

  async onSelectGoogleAccount(acc: UserProfile) {
    this.errorMessage.set('');
    this.feedbackMessage.set('');
    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }
    const mode = this.currentTab() === 'create' ? 'create' : 'signin';
    await this.completeGoogleAuthWithEmail(acc.email || acc.username, acc.name, mode);
  }

  async onSubmitGoogleChooserEmail() {
    const emailVal = (this.googleEmailControl.value || '').trim();
    const nameVal = (this.googleNameControl.value || '').trim();
    if (!emailVal) {
      this.errorMessage.set(
        this.i18n.isRtl()
          ? 'يرجى إدخال البريد الإلكتروني لحساب Google.'
          : 'Please enter your Google email address.'
      );
      return;
    }
    const mode = this.currentTab() === 'create' ? 'create' : 'signin';
    await this.completeGoogleAuthWithEmail(emailVal, nameVal, mode);
  }

  private async completeGoogleAuthWithEmail(
    emailOrId: string,
    displayName: string,
    mode: 'signin' | 'create'
  ) {
    const res = await this.auth.signInWithGoogleEmail(emailOrId, displayName, mode);
    if (res.success && res.user) {
      if (res.isNewUser) {
        this.storage.resetWorkspaceForNewUser(res.user.id);
      } else {
        await this.storage.loadUserWorkspace(res.user.id);
      }
      this.showGoogleChooser.set(false);
      this.googleEmailControl.setValue('');
      this.googleNameControl.setValue('');
      this.closeModal.emit();
      return;
    }

    if (res.errorCode === 'account_not_found') {
      this.signInForm.patchValue({ identifier: emailOrId });
      this.showNotFoundSignUpHint.set(true);
      this.errorMessage.set(this.i18n.t().googleAccountNotFoundError);
    }
  }

  async onSignInSubmit() {
    if (this.signInForm.invalid) return;
    this.errorMessage.set('');
    this.feedbackMessage.set('');
    this.matchedWrongPassUser.set(null);
    this.showNotFoundSignUpHint.set(false);

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const { identifier, password } = this.signInForm.value;
    const res = await this.auth.signInCheckingDatabase(identifier || '', password || '');
    if (!res.success) {
      if (res.reason === 'wrong_password' && res.matchedUser) {
        this.matchedWrongPassUser.set(res.matchedUser);
        this.errorMessage.set(
          this.i18n.isRtl()
            ? 'كلمة المرور غير صحيحة لهذا الحساب المسجل في قاعدة البيانات.'
            : 'Incorrect password for this account in the database.'
        );
      } else {
        this.showNotFoundSignUpHint.set(true);
        this.errorMessage.set(this.i18n.t().accountNotFoundError);
      }
      return;
    }

    if (res.matchedUser) {
      await this.storage.loadUserWorkspace(res.matchedUser.id);
    }
    this.closeModal.emit();
  }

  onResetPasswordAndSignIn() {
    const user = this.matchedWrongPassUser();
    const newPass = (this.signInForm.value.password || '').trim();
    if (!user || !newPass) return;

    if (newPass.length < 4) {
      this.errorMessage.set(
        this.i18n.isRtl()
          ? 'يرجى إدخال كلمة مرور لا تقل عن 4 أحرف.'
          : 'Please enter a password of at least 4 characters.'
      );
      return;
    }

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const ok = this.auth.resetPassword(user.id, newPass);
    if (ok) {
      this.matchedWrongPassUser.set(null);
      this.errorMessage.set('');
      this.storage.dataScope.set('mine');
      void this.storage.loadUserWorkspace(user.id);
      this.closeModal.emit();
    }
  }

  prefillSignUpFromSignIn() {
    const idVal = (this.signInForm.value.identifier || '').trim();
    const passVal = (this.signInForm.value.password || '').trim();
    this.switchTab('create');

    if (idVal.includes('@')) {
      const prefix = idVal.split('@')[0];
      this.createUserForm.patchValue({
        email: idVal,
        username: prefix,
        name: prefix,
        password: passVal,
      });
    } else if (idVal) {
      this.createUserForm.patchValue({
        username: idVal,
        name: idVal,
        email: `${idVal}@checkmate.local`,
        password: passVal,
      });
    }
  }

  onRefreshSession() {
    this.auth.refreshSession();
    this.feedbackMessage.set(
      this.i18n.isRtl()
        ? 'تم تجديد رمز الجلسة (Session Token) لمدة 60 دقيقة إضافية.'
        : 'Session token refreshed for another 60 minutes.'
    );
    setTimeout(() => this.feedbackMessage.set(''), 2500);
  }

  onSignOut() {
    this.storage.flushPendingSync();
    this.auth.logout(false);
    this.currentTab.set('signin');
    this.matchedWrongPassUser.set(null);
    this.showNotFoundSignUpHint.set(false);
    this.signInForm.reset({ identifier: '', password: '' });
    this.errorMessage.set('');
    this.feedbackMessage.set(
      this.i18n.isRtl() ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.'
    );
  }

  onChangeRole(userId: string, event: Event) {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.auth.updateUserRole(userId, role);
    this.feedbackMessage.set(
      this.i18n.isRtl() ? 'تم تحديث الصلاحية بنجاح.' : 'Role updated successfully.'
    );
    setTimeout(() => this.feedbackMessage.set(''), 2500);
  }

  confirmDelete(user: UserProfile) {
    const ok = this.auth.deleteUser(user.id);
    this.confirmDeleteId.set(null);
    if (ok) {
      this.feedbackMessage.set(
        this.i18n.isRtl()
          ? `تم حذف المستخدم "${user.name}" بنجاح وتحديث القائمة.`
          : `User "${user.nameEn}" deleted and list refreshed.`
      );
    } else {
      this.errorMessage.set(
        this.i18n.isRtl()
          ? 'لا يمكن حذف المستخدم الوحيد المتبقي في النظام.'
          : 'Cannot delete the only remaining user.'
      );
    }
    setTimeout(() => {
      this.feedbackMessage.set('');
      this.errorMessage.set('');
    }, 3500);
  }

  onCreateUser() {
    if (this.createUserForm.invalid) return;
    this.errorMessage.set('');
    this.feedbackMessage.set('');

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const v = this.createUserForm.value;
    const res = this.auth.signUp({
      name: v.name || '',
      nameEn: v.name || '',
      username: v.username || '',
      email: v.email || '',
      password: v.password || '',
      role: (v.role as UserRole) || 'editor',
      avatar: this.selectedAvatar(),
      provider: 'email',
    });

    if (!res.success || !res.user) {
      this.errorMessage.set(this.i18n.t().userAlreadyExists);
      return;
    }

    // Explicitly reset new user data to empty arrays [] and UI Options (Light Mode, Arabic, Active Project "")
    this.storage.resetWorkspaceForNewUser(res.user.id);
    this.storage.dataScope.set('mine');
    this.createUserForm.reset({ role: 'editor' });
    this.closeModal.emit();
  }
}
