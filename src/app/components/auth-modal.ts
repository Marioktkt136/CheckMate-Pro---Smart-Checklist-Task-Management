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
                  ? 'الدخول أو إنشاء حساب جديد باستخدام اسم المستخدم / البريد الإلكتروني وكلمة المرور'
                  : 'Sign in or sign up using Username / Email & Password' }}
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

            @if (showNotFoundSignUpHint()) {
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                <span class="text-[11px] text-rose-700 dark:text-rose-300">
                  {{ i18n.isRtl() ? 'هذا الحساب غير مسجل بعد في قاعدة البيانات.' : 'This account is not registered in the database yet.' }}
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

        <!-- TAB 1: Manual Sign In (Username/Email & Password) -->
        @if (currentTab() === 'signin') {
          <form [formGroup]="signInForm" (ngSubmit)="onSignInSubmit()" class="mt-4 space-y-3.5">
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
          <form [formGroup]="createUserForm" (ngSubmit)="onCreateUser()" class="mt-4 space-y-3">
            
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

  showNotFoundSignUpHint = signal<boolean>(false);

  signInForm = new FormGroup({
    identifier: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  createUserForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    username: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    role: new FormControl<UserRole>('editor', [Validators.required]),
  });

  switchTab(tab: 'signin' | 'create' | 'list') {
    this.currentTab.set(tab);
    this.feedbackMessage.set('');
    this.errorMessage.set('');
    this.showNotFoundSignUpHint.set(false);
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

  async onSignInSubmit() {
    if (this.signInForm.invalid) return;
    this.errorMessage.set('');
    this.feedbackMessage.set('');
    this.showNotFoundSignUpHint.set(false);

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const { identifier, password } = this.signInForm.value;
    const res = await this.auth.signInCheckingDatabase(identifier || '', password || '');
    if (!res.success) {
      if (res.reason === 'wrong_password') {
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
        email: '',
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
    this.storage.clearInMemoryWorkspace();
    this.currentTab.set('signin');
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

  async onCreateUser() {
    if (this.createUserForm.invalid) return;
    this.errorMessage.set('');
    this.feedbackMessage.set('');

    if (this.auth.isAuthenticated()) {
      this.storage.flushPendingSync();
    }

    const v = this.createUserForm.value;
    const res = await this.auth.signUpCheckingDatabase({
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
