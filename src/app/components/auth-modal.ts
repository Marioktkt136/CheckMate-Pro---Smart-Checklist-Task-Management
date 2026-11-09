import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { AuthService, UserProfile } from '../services/auth.service';
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
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon class="text-2xl">manage_accounts</mat-icon>
            </div>
            <div>
              <h3 id="user-mgmt-title" class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                إدارة المستخدمين والصلاحيات
              </h3>
              <p class="text-xs text-slate-400">
                إنشاء، حذف، وتعديل صلاحيات المدراء (Admin) والمشرفين (Moderator)
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="إغلاق النافذة"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Mode Toggle Tabs (Users List vs Add User) -->
        <div class="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            (click)="currentTab.set('list')"
            class="flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            [class.bg-white]="currentTab() === 'list'"
            [class.dark:bg-slate-900]="currentTab() === 'list'"
            [class.text-blue-600]="currentTab() === 'list'"
            [class.shadow-xs]="currentTab() === 'list'"
            [class.text-slate-600]="currentTab() !== 'list'"
            [class.dark:text-slate-400]="currentTab() !== 'list'"
          >
            <mat-icon class="text-base">group</mat-icon>
            <span>المستخدمون الحاليون ({{ auth.users().length }})</span>
          </button>

          <button
            type="button"
            (click)="currentTab.set('create')"
            class="flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            [class.bg-white]="currentTab() === 'create'"
            [class.dark:bg-slate-900]="currentTab() === 'create'"
            [class.text-blue-600]="currentTab() === 'create'"
            [class.shadow-xs]="currentTab() === 'create'"
            [class.text-slate-600]="currentTab() !== 'create'"
            [class.dark:text-slate-400]="currentTab() !== 'create'"
          >
            <mat-icon class="text-base">person_add</mat-icon>
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>

        <!-- Tab 1: Current Users List & Role Management -->
        @if (currentTab() === 'list') {
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
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {{ user.name }}
                        </span>
                        @if (auth.currentUser().id === user.id) {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            الحساب النشط حالياً
                          </span>
                        }
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        {{ user.email }} • {{ user.department }}
                      </div>
                    </div>
                  </div>

                  <!-- Quick Switch Button -->
                  @if (auth.currentUser().id !== user.id) {
                    <button
                      type="button"
                      (click)="onSwitchUser(user)"
                      class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition cursor-pointer shrink-0"
                    >
                      تسجيل الدخول به
                    </button>
                  }
                </div>

                <!-- Role Selector & Actions Bar -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500 font-medium">الصلاحية:</span>
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
                      <option value="admin">👑 مدير نظام (Admin - تحكم كامل)</option>
                      <option value="editor">🛠️ مشرف / محرر (Moderator / Editor - تعديل وإضافة)</option>
                      <option value="viewer">👀 مشاهد (Viewer - قراءة فقط)</option>
                    </select>
                  </div>

                  @if (auth.users().length > 1) {
                    <button
                      type="button"
                      (click)="confirmDeleteId.set(user.id)"
                      class="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      title="حذف هذا المستخدم"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">delete_outline</mat-icon>
                      <span>حذف</span>
                    </button>
                  }
                </div>

                <!-- Inline Confirmation for deletion (avoiding window.confirm) -->
                @if (confirmDeleteId() === user.id) {
                  <div class="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
                    <div class="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-bold">
                      <mat-icon class="!text-sm !w-4 !h-4 text-rose-600">warning</mat-icon>
                      <span>هل تريد بالتأكيد حذف حساب ({{ user.name }}) نهائياً؟</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        (click)="confirmDelete(user)"
                        class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                      >
                        نعم، احذف
                      </button>
                      <button
                        type="button"
                        (click)="confirmDeleteId.set(null)"
                        class="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab 2: Create New User Form -->
        @if (currentTab() === 'create') {
          <form [formGroup]="createUserForm" (ngSubmit)="onCreateUser()" class="mt-4 space-y-3.5">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-user-name" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل (بالعربية) *
                </label>
                <input
                  id="create-user-name"
                  type="text"
                  formControlName="name"
                  placeholder="مثال: مريم خالد"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="create-user-name-en" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم (English)
                </label>
                <input
                  id="create-user-name-en"
                  type="text"
                  formControlName="nameEn"
                  placeholder="e.g. Mariam Khaled"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-user-email" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  id="create-user-email"
                  type="email"
                  formControlName="email"
                  placeholder="name@checkmate.local"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="create-user-role" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مستوى الصلاحية *
                </label>
                <select
                  id="create-user-role"
                  formControlName="role"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="admin">👑 مدير نظام (Admin - صلاحيات كاملة)</option>
                  <option value="editor">🛠️ مشرف / محرر (Moderator/Editor - تعديل ومشتريات)</option>
                  <option value="viewer">👀 مشاهد (Viewer - قراءة فقط)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="create-user-dept" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                القسم أو التخصص
              </label>
              <input
                id="create-user-dept"
                type="text"
                formControlName="department"
                placeholder="مثال: فني تجهيز ديكور / متابعة أسعار المعارض"
                class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Avatar Picker -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اختر الأيقونة الرمزية (Avatar):
              </span>
              <div class="flex flex-wrap gap-2">
                @for (av of avatarOptions; track av) {
                  <button
                    type="button"
                    (click)="selectedAvatar.set(av)"
                    class="w-9 h-9 rounded-xl border text-xl flex items-center justify-center transition cursor-pointer"
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

            @if (feedbackMessage()) {
              <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <mat-icon class="!text-sm !w-4 !h-4">check_circle</mat-icon>
                <span>{{ feedbackMessage() }}</span>
              </div>
            }

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                (click)="currentTab.set('list')"
                class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                [disabled]="createUserForm.invalid"
                class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5"
              >
                <mat-icon class="!text-sm !w-4 !h-4">person_add</mat-icon>
                <span>إنشاء المستخدم وحفظه</span>
              </button>
            </div>
          </form>
        }

      </div>
    </div>
  `,
})
export class AuthModalComponent {
  i18n = inject(I18nService);
  auth = inject(AuthService);

  closeModal = output<void>();

  currentTab = signal<'list' | 'create'>('list');
  selectedAvatar = signal<string>('👨‍💼');
  avatarOptions = AVATARS;
  feedbackMessage = signal<string>('');
  confirmDeleteId = signal<string | null>(null);

  createUserForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    nameEn: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl<UserRole>('editor', [Validators.required]),
    department: new FormControl(''),
  });

  onSwitchUser(user: UserProfile) {
    this.auth.loginAs(user);
    this.feedbackMessage.set(`تم التبديل بنجاح إلى حساب: ${user.name}`);
    setTimeout(() => this.feedbackMessage.set(''), 3000);
  }

  onChangeRole(userId: string, event: Event) {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.auth.updateUserRole(userId, role);
    this.feedbackMessage.set('تم تحديث الصلاحية بنجاح.');
    setTimeout(() => this.feedbackMessage.set(''), 2500);
  }

  confirmDelete(user: UserProfile) {
    const ok = this.auth.deleteUser(user.id);
    this.confirmDeleteId.set(null);
    if (ok) {
      this.feedbackMessage.set(`تم حذف المستخدم "${user.name}" بنجاح وتحديث القائمة.`);
    } else {
      this.feedbackMessage.set('لا يمكن حذف المستخدم الوحيد المتبقي في النظام.');
    }
    setTimeout(() => this.feedbackMessage.set(''), 3500);
  }

  onCreateUser() {
    if (this.createUserForm.invalid) return;
    const v = this.createUserForm.value;
    const newUser = this.auth.createUser({
      name: v.name || '',
      nameEn: v.nameEn || v.name || '',
      email: v.email || '',
      role: (v.role as UserRole) || 'editor',
      department: v.department || '',
      avatar: this.selectedAvatar(),
    });

    // Automatically switch to the new user so they have their own separated data space immediately
    this.auth.loginAs(newUser);

    this.feedbackMessage.set(`تم إنشاء حساب "${newUser.name}" بنجاح وتفعيله! مساحة بياناتك الخاصة جاهزة.`);
    this.createUserForm.reset({ role: 'editor' });
    setTimeout(() => {
      this.currentTab.set('list');
      this.feedbackMessage.set('');
    }, 2000);
  }
}

