import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { calculateChecklistStats } from '../core/checklist-rules';

@Component({
  selector: 'app-team-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px]">
      
      <!-- Gemini Chat Header -->
      <div class="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <mat-icon class="text-xl">auto_awesome</mat-icon>
          </div>
          <div>
            <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{{ i18n.t().teamChat }}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Gemini 3.8 Flash
              </span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ i18n.isRtl()
                ? 'محادثة ذكية وتحليل فوري للمشتريات، الأولويات، المواصفات الفنية، والميزانية'
                : 'Intelligent AI chat & real-time analysis for your checklist, priorities, specs, and budget' }}
            </p>
          </div>
        </div>

        <!-- Actions: Full Audit & Clear History -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="runSmartAnalysis('full_analysis')"
            [disabled]="isAiThinking()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <mat-icon class="text-sm">analytics</mat-icon>
            <span>{{ i18n.isRtl() ? 'تحليل شامل للقائمة والميزانية' : 'Full Checklist & Budget Analysis' }}</span>
          </button>

          <button
            type="button"
            (click)="storage.clearAiChats()"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition cursor-pointer"
            [title]="i18n.isRtl() ? 'مسح المحادثة' : 'Clear Chat'"
          >
            <mat-icon class="text-sm">delete_sweep</mat-icon>
            <span>{{ i18n.isRtl() ? 'مسح' : 'Clear' }}</span>
          </button>
        </div>
      </div>

      <!-- Live Project & Financial Context Strip -->
      <div class="px-4 py-2.5 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <span class="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
            <mat-icon class="!text-sm !w-4 !h-4 text-blue-600 dark:text-blue-400">folder</mat-icon>
            <span>{{ i18n.isRtl() ? storage.activeProject().nameAr : storage.activeProject().nameEn }}</span>
          </span>
          <span class="text-slate-300 dark:text-slate-700">|</span>
          <span class="text-slate-600 dark:text-slate-300">
            {{ i18n.isRtl() ? 'الإنجاز:' : 'Progress:' }}
            <strong class="text-emerald-600 dark:text-emerald-400">{{ liveStats().completed }}/{{ liveStats().total }} ({{ liveStats().percent }}%)</strong>
          </span>
          <span class="text-slate-300 dark:text-slate-700">|</span>
          <span class="text-slate-600 dark:text-slate-300">
            {{ i18n.isRtl() ? 'عاجل متبقي:' : 'Urgent Pending:' }}
            <strong class="text-rose-600 dark:text-rose-400">{{ urgentPendingCount() }}</strong>
          </span>
          <span class="text-slate-300 dark:text-slate-700">|</span>
          <span class="text-slate-600 dark:text-slate-300">
            {{ i18n.isRtl() ? 'التقديري:' : 'Est. Total:' }}
            <strong class="text-indigo-600 dark:text-indigo-400">{{ liveStats().totalEstimated.toLocaleString() }} {{ i18n.t().currencyEgp }}</strong>
          </span>
        </div>

        <!-- 3 Specialized Analysis Modes -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            (click)="runSmartAnalysis('priority_plan')"
            [disabled]="isAiThinking()"
            class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
          >
            <mat-icon class="!text-xs !w-3.5 !h-3.5">priority_high</mat-icon>
            <span>{{ i18n.isRtl() ? 'خطة الأولويات' : 'Priority Plan' }}</span>
          </button>

          <button
            type="button"
            (click)="runSmartAnalysis('budget_tips')"
            [disabled]="isAiThinking()"
            class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
          >
            <mat-icon class="!text-xs !w-3.5 !h-3.5">savings</mat-icon>
            <span>{{ i18n.isRtl() ? 'تحليل التوفير والميزانية' : 'Budget & Savings' }}</span>
          </button>

          <button
            type="button"
            (click)="askGemini(i18n.isRtl() ? 'قارن بين أفضل الماركات المتاحة في السوق للأجهزة الأساسية في قائمتي من حيث العمر الافتراضي والضمان والسعر' : 'Compare top brands in the market for my checklist items by durability, warranty, and price')"
            [disabled]="isAiThinking()"
            class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/70 text-blue-700 dark:text-blue-300 hover:bg-blue-50 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
          >
            <mat-icon class="!text-xs !w-3.5 !h-3.5">compare_arrows</mat-icon>
            <span>{{ i18n.isRtl() ? 'مقارنة الماركات' : 'Brand Matrix' }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Prompt Suggestions Chips -->
      <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center gap-2 overflow-x-auto text-xs">
        <span class="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <mat-icon class="text-xs">lightbulb</mat-icon>
          <span>{{ i18n.isRtl() ? 'استشارات سريعة:' : 'Quick Prompts:' }}</span>
        </span>
        <button
          type="button"
          (click)="askGemini(i18n.isRtl() ? 'قارن بين أفضل ماركات الغسالات الأوتوماتيك (LG vs Tornado vs Beko) من حيث الموتور والضمان' : 'Compare top automatic washing machine brands (LG vs Tornado vs Beko) by motor and warranty')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          {{ i18n.isRtl() ? 'مقارنة الغسالات' : 'Compare Washers' }}
        </button>
        <button
          type="button"
          (click)="askGemini(i18n.isRtl() ? 'ما هي أهم المواصفات الفنية التي يجب فحصها عند شراء الثلاجة النوفروست الانفرتر؟' : 'What are the key technical specs to check when buying an Inverter No-Frost refrigerator?')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          {{ i18n.isRtl() ? 'دليل شراء الثلاجة' : 'Fridge Buying Guide' }}
        </button>
        <button
          type="button"
          (click)="askGemini(i18n.isRtl() ? 'اقترح خطة شراء على 3 مراحل لتوزيع التكلفة التقديرية بدون ضغط مالي' : 'Suggest a 3-phase buying schedule to spread out my estimated cost smoothly')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          {{ i18n.isRtl() ? 'جدولة الشراء على 3 مراحل' : '3-Phase Buying Plan' }}
        </button>
      </div>

      <!-- Messages Thread -->
      <div class="flex-1 p-4 overflow-y-auto space-y-4">
        @for (msg of storage.chatMessages(); track msg.id) {
          <div class="flex items-start gap-3" [class.flex-row-reverse]="!msg.isAi">
            <span class="text-2xl shrink-0 p-1.5 rounded-xl"
                  [class.bg-purple-100]="msg.isAi"
                  [class.dark:bg-purple-950]="msg.isAi"
                  [class.bg-blue-100]="!msg.isAi"
                  [class.dark:bg-blue-950]="!msg.isAi">
              {{ msg.isAi ? '✨' : msg.avatar }}
            </span>
            <div class="max-w-[86%] space-y-1">
              <div class="flex items-center gap-2 text-xs" [class.justify-end]="!msg.isAi">
                <span class="font-bold text-slate-900 dark:text-slate-100">{{ msg.sender }}</span>
                @if (msg.senderRole) {
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {{ msg.senderRole }}
                  </span>
                }
                <span class="text-[10px] text-slate-400">{{ msg.timestamp }}</span>
                @if (msg.isAi) {
                  <button
                    type="button"
                    (click)="copyMessage(msg.id, msg.text)"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900 text-slate-500 dark:text-slate-300 transition cursor-pointer inline-flex items-center gap-0.5"
                    [title]="i18n.isRtl() ? 'نسخ التحليل' : 'Copy Response'"
                  >
                    <mat-icon class="!text-[11px] !w-3 !h-3">{{ copiedMsgId() === msg.id ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copiedMsgId() === msg.id ? (i18n.isRtl() ? 'تم النسخ' : 'Copied') : (i18n.isRtl() ? 'نسخ' : 'Copy') }}</span>
                  </button>
                }
              </div>
              <div class="p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs"
                   [class.bg-blue-600]="!msg.isAi"
                   [class.text-white]="!msg.isAi"
                   [class.bg-purple-50/90]="msg.isAi"
                   [class.dark:bg-purple-950/40]="msg.isAi"
                   [class.border]="msg.isAi"
                   [class.border-purple-200]="msg.isAi"
                   [class.dark:border-purple-800]="msg.isAi"
                   [class.text-slate-900]="msg.isAi"
                   [class.dark:text-slate-100]="msg.isAi">
                {{ msg.text }}
              </div>
            </div>
          </div>
        } @empty {
          <!-- Empty Chat State (e.g., New User Account or Cleared History) -->
          <div class="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <mat-icon class="text-3xl">auto_awesome</mat-icon>
            </div>
            <div>
              <h4 class="font-bold text-base text-slate-900 dark:text-slate-100">
                {{ i18n.isRtl() ? 'مرحباً بك في محادثة ومحلل Gemini الذكي' : 'Welcome to Gemini Smart Chat & Analyst' }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {{ i18n.isRtl()
                  ? 'احصل على تحليل مالي وفني شامل لقائمة مشترياتك، خطة أولويات الشراء، ومقارنة تفصيلية للماركات والأسعار بالجنيه المصري.'
                  : 'Get a complete financial & technical audit of your checklist, urgent priority action plans, and detailed brand comparisons in EGP.' }}
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs">
              <button
                type="button"
                (click)="runSmartAnalysis('full_analysis')"
                class="p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-800 dark:text-purple-200 font-bold flex items-center gap-2 text-start transition cursor-pointer"
              >
                <mat-icon class="text-purple-600 shrink-0">analytics</mat-icon>
                <span>{{ i18n.isRtl() ? 'تحليل شامل للقائمة والميزانية' : 'Full Checklist & Budget Audit' }}</span>
              </button>
              <button
                type="button"
                (click)="runSmartAnalysis('priority_plan')"
                class="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2 text-start transition cursor-pointer"
              >
                <mat-icon class="text-rose-600 shrink-0">priority_high</mat-icon>
                <span>{{ i18n.isRtl() ? 'خطة الأولويات العاجلة' : 'Urgent Priorities Plan' }}</span>
              </button>
            </div>
          </div>
        }

        @if (isAiThinking()) {
          <div class="flex items-center gap-3">
            <span class="text-2xl p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950">✨</span>
            <div class="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <mat-icon class="text-sm animate-spin">sync</mat-icon>
              <span>
                {{ i18n.isRtl() ? 'جاري تحليل البيانات وإعداد رد Gemini الذكي...' : 'Gemini is analyzing your project data...' }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Chat Input Field -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
        <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="flex items-center gap-2">
          <input
            type="text"
            formControlName="message"
            [placeholder]="i18n.isRtl() ? 'اسأل Gemini عن أي صنف، مواصفات، مقارنة أسعار، أو تحليل الميزانية...' : 'Ask Gemini anything about your items, specs, prices, or budget analysis...'"
            class="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            [disabled]="chatForm.invalid || isAiThinking()"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold"
            [title]="i18n.t().send"
          >
            <mat-icon class="text-base">send</mat-icon>
            <span>{{ i18n.t().send }}</span>
          </button>
        </form>
      </div>

    </div>
  `,
})
export class TeamChatComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  isAiThinking = signal<boolean>(false);
  copiedMsgId = signal<string | null>(null);

  liveStats = computed(() =>
    calculateChecklistStats(this.storage.currentProjectItems(), this.storage.activeProject().budget)
  );

  urgentPendingCount = computed(() =>
    this.storage
      .currentProjectItems()
      .filter(
        i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'purchased' && i.status !== 'delivered'
      ).length
  );

  chatForm = new FormGroup({
    message: new FormControl('', [Validators.required]),
  });

  copyMessage(id: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      this.copiedMsgId.set(id);
      setTimeout(() => {
        if (this.copiedMsgId() === id) {
          this.copiedMsgId.set(null);
        }
      }, 2000);
    }
  }

  sendMessage() {
    if (this.chatForm.invalid || this.isAiThinking()) return;
    const text = (this.chatForm.controls.message.value || '').trim();
    if (!text) return;

    this.chatForm.reset({ message: '' });
    void this.askGemini(text, 'gemini_chat');
  }

  runSmartAnalysis(mode: 'full_analysis' | 'priority_plan' | 'budget_tips') {
    const isAr = this.i18n.isRtl();
    const prompts: Record<'full_analysis' | 'priority_plan' | 'budget_tips', string> = {
      full_analysis: isAr
        ? 'قم بإجراء تحليل شامل لقائمة مشترياتي الحالية وميزانية المشروع، مع عرض نسبة الإنجاز، توزيع التكاليف حسب المجموعات، وأهم التوصيات.'
        : 'Run a comprehensive analysis of my current checklist items and project budget, including completion rate, category spend breakdown, and top recommendations.',
      priority_plan: isAr
        ? 'اعرض خطة الأولويات العاجلة والمرتفعة للأصناف غير المشتراة في مشروعي، وكيفية جدولتها زمنياً ومالياً.'
        : 'Show an urgent priorities action plan for my unpurchased items and how to schedule them financially.',
      budget_tips: isAr
        ? 'حلل الميزانية المخصصة مقارنة بالتكلفة التقديرية والمدفوع الفعلي، واقترح خطة عملية للتوفير والشراء المجمع.'
        : 'Analyze my allocated budget vs. estimated and actual costs, and suggest a smart savings and bundle buying strategy.',
    };
    void this.askGemini(prompts[mode], mode);
  }

  async askGemini(query: string, actionType = 'gemini_chat') {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || this.isAiThinking()) return;

    const user = this.auth.currentUser();
    const senderName = this.i18n.isRtl() ? user.name : user.nameEn;
    this.storage.postChatMessage(cleanQuery, senderName, user.role, user.avatar, false);

    this.isAiThinking.set(true);
    try {
      const recentHistory = this.storage
        .chatMessages()
        .slice(-8)
        .map(m => ({ role: m.isAi ? 'model' : 'user', text: m.text }));

      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanQuery,
          allItems: this.storage.currentProjectItems(),
          project: this.storage.activeProject(),
          categories: this.storage.categories(),
          history: recentHistory,
          actionType,
          lang: this.i18n.currentLang(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const reply =
          json.result ||
          (this.i18n.isRtl()
            ? 'تم تحليل طلبك بنجاح.'
            : 'Your request has been analyzed.');
        this.storage.postChatMessage(
          reply,
          'Gemini AI',
          'Gemini 3.8 Flash',
          '✨',
          true
        );
      }
    } catch (e) {
      console.warn('Gemini Chat call failed', e);
      this.storage.postChatMessage(
        this.i18n.isRtl()
          ? 'عذراً، تعذر الاتصال بخدمة Gemini حالياً. يرجى المحاولة مرة أخرى.'
          : 'Sorry, could not reach Gemini right now. Please try again.',
        'Gemini AI',
        'Gemini 3.8 Flash',
        '✨',
        true
      );
    } finally {
      this.isAiThinking.set(false);
    }
  }
}
