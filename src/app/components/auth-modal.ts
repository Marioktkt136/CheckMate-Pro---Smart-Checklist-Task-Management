import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { AuthService, DEMO_USERS, UserProfile } from '../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <mat-icon class="text-xl">security</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                تسجيل الدخول والمصادقة (2FA MFA)
              </h3>
              <p class="text-[11px] text-slate-400">
                حماية خصوصية بيانات المشاريع والمشتريات
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

        @if (step() === 'select') {
          <!-- Step 1: Select User or Login -->
          <div class="mt-4 space-y-3">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              اختر حسابك التجريبي لتسجيل الدخول:
            </span>

            <div class="space-y-2">
              @for (user of demoUsers; track user.id) {
                <button
                  type="button"
                  (click)="onSelectUser(user)"
                  class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition flex items-center justify-between cursor-pointer text-right"
                  [class.border-blue-500]="selectedUser().id === user.id"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-2xl p-1 bg-white dark:bg-slate-700 rounded-lg">{{ user.avatar }}</span>
                    <div>
                      <div class="font-bold text-xs text-slate-900 dark:text-slate-100">{{ user.name }}</div>
                      <div class="text-[10px] text-slate-400">{{ user.email }} • {{ user.department }}</div>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        [class.bg-emerald-100]="user.role === 'admin'"
                        [class.text-emerald-700]="user.role === 'admin'"
                        [class.bg-blue-100]="user.role === 'editor'"
                        [class.text-blue-700]="user.role === 'editor'"
                        [class.bg-slate-200]="user.role === 'viewer'"
                        [class.text-slate-600]="user.role === 'viewer'">
                    {{ user.role.toUpperCase() }}
                  </span>
                </button>
              }
            </div>

            <!-- Proceed to 2FA button -->
            <button
              type="button"
              (click)="proceedTo2FA()"
              class="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>المتابعة إلى التحقق الثنائي (2FA)</span>
              <mat-icon class="text-sm">arrow_forward</mat-icon>
            </button>
          </div>
        } @else {
          <!-- Step 2: 2FA MFA Verification Code -->
          <div class="mt-4 space-y-4">
            <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <mat-icon class="text-emerald-600">phonelink_lock</mat-icon>
              <div>
                تم إرسال رمز الأمان أو افتح تطبيق المصادقة (Authenticator) لحساب:
                <strong>{{ selectedUser().name }}</strong>
              </div>
            </div>

            <form [formGroup]="mfaForm" (ngSubmit)="verifyCode()" class="space-y-4">
              <div>
                <label for="mfa-code-input" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  أدخل رمز التحقق المكون من 6 أرقام (الكود التجريبي: 123456)
                </label>
                <input
                  id="mfa-code-input"
                  type="text"
                  formControlName="code"
                  maxlength="6"
                  placeholder="123456"
                  class="w-full text-center tracking-[0.4em] font-mono text-lg py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              @if (errorMessage()) {
                <div class="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <mat-icon class="text-sm">error</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <div class="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  (click)="step.set('select')"
                  class="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <mat-icon class="text-sm">verified</mat-icon>
                  <span>تأكيد وتسجيل الدخول</span>
                </button>
              </div>
            </form>
          </div>
        }

      </div>
    </div>
  `,
})
export class AuthModalComponent {
  i18n = inject(I18nService);
  auth = inject(AuthService);

  closeModal = output<void>();

  demoUsers = DEMO_USERS;
  step = signal<'select' | 'mfa'>('select');
  selectedUser = signal<UserProfile>(DEMO_USERS[0]);
  errorMessage = signal<string>('');

  mfaForm = new FormGroup({
    code: new FormControl('123456', [Validators.required, Validators.minLength(6)]),
  });

  onSelectUser(user: UserProfile) {
    this.selectedUser.set(user);
  }

  proceedTo2FA() {
    this.step.set('mfa');
  }

  verifyCode() {
    const code = this.mfaForm.value.code || '';
    if (code.length === 6) {
      this.auth.loginAs(this.selectedUser());
      this.closeModal.emit();
    } else {
      this.errorMessage.set('يرجى إدخال رمز صحيح مكون من 6 أرقام (الكود التجريبي: 123456)');
    }
  }
}
