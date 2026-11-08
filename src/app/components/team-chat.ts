import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-team-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
      
      <!-- Chat Header -->
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
            <mat-icon class="text-xl">forum</mat-icon>
          </div>
          <div>
            <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{{ i18n.t().teamChat }}</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              محادثة الفريق ومستشار المشتريات الذكي (Gemini AI Consultant)
            </p>
          </div>
        </div>

        <!-- Quick AI Consultant Trigger -->
        <button
          type="button"
          (click)="askAiAssistant('ما هي أهم النصائح لمراجعة أسعار وضمان الأجهزة الكهربائية؟')"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 transition cursor-pointer"
        >
          <mat-icon class="text-sm text-purple-600">smart_toy</mat-icon>
          <span>استشارة سريعة</span>
        </button>
      </div>

      <!-- Quick Prompt Suggestions Chips -->
      <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center gap-2 overflow-x-auto text-xs">
        <span class="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <mat-icon class="text-xs">lightbulb</mat-icon> مقترحات:
        </span>
        <button
          type="button"
          (click)="askAiAssistant('قارن بين أفضل ماركات الغسالات الفوق أوتوماتيك والأوتوماتيك الكامل')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          مقارنة الغسالات
        </button>
        <button
          type="button"
          (click)="askAiAssistant('ما الفرق بين البوتاجاز الـ 5 شعلة أمان كامل والشعلة العادية؟')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          أمان البوتاجاز
        </button>
        <button
          type="button"
          (click)="askAiAssistant('كيف أحصل على أفضل خصم مجمع عند شراء ثلاجة وغسالة وبوتاجاز معاً؟')"
          class="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          نصائح الخصم المجمع
        </button>
      </div>

      <!-- Messages Thread -->
      <div class="flex-1 p-4 overflow-y-auto space-y-4">
        @for (msg of storage.chatMessages(); track msg.id) {
          <div class="flex items-start gap-3" [class.flex-row-reverse]="msg.sender === auth.currentUser().name">
            <span class="text-2xl shrink-0 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">{{ msg.avatar }}</span>
            <div class="max-w-[85%] space-y-1">
              <div class="flex items-center gap-2 text-xs" [class.justify-end]="msg.sender === auth.currentUser().name">
                <span class="font-bold text-slate-900 dark:text-slate-100">{{ msg.sender }}</span>
                @if (msg.senderRole) {
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {{ msg.senderRole }}
                  </span>
                }
                <span class="text-[10px] text-slate-400">{{ msg.timestamp }}</span>
              </div>
              <div class="p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                   [class.bg-blue-600]="msg.sender === auth.currentUser().name"
                   [class.text-white]="msg.sender === auth.currentUser().name"
                   [class.rounded-tr-none]="msg.sender === auth.currentUser().name && i18n.isRtl()"
                   [class.rounded-tl-none]="msg.sender === auth.currentUser().name && !i18n.isRtl()"
                   [class.bg-slate-100]="msg.sender !== auth.currentUser().name && !msg.isAi"
                   [class.dark:bg-slate-800]="msg.sender !== auth.currentUser().name && !msg.isAi"
                   [class.text-slate-800]="msg.sender !== auth.currentUser().name && !msg.isAi"
                   [class.dark:text-slate-200]="msg.sender !== auth.currentUser().name && !msg.isAi"
                   [class.bg-purple-50]="msg.isAi"
                   [class.dark:bg-purple-950/40]="msg.isAi"
                   [class.border]="msg.isAi"
                   [class.border-purple-200]="msg.isAi"
                   [class.dark:border-purple-800]="msg.isAi"
                   [class.text-purple-950]="msg.isAi"
                   [class.dark:text-purple-100]="msg.isAi">
                {{ msg.text }}
              </div>
            </div>
          </div>
        }

        @if (isAiThinking()) {
          <div class="flex items-center gap-3">
            <span class="text-2xl p-1 rounded-xl bg-purple-100 dark:bg-purple-950">🤖</span>
            <div class="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <mat-icon class="text-sm animate-spin">sync</mat-icon>
              <span>المستشار الذكي يحلل المواصفات والأسعار...</span>
            </div>
          </div>
        }
      </div>

      <!-- Chat Input Field -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
        <form (ngSubmit)="sendMessage()" class="flex items-center gap-2">
          <input
            type="text"
            [(ngModel)]="inputText"
            name="chatInput"
            placeholder="اكتب رسالة للفريق أو اسأل المستشار الذكي للأجهزة..."
            class="flex-1 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            [disabled]="!inputText.trim()"
            class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition cursor-pointer shrink-0"
            title="إرسال"
          >
            <mat-icon class="text-lg">send</mat-icon>
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

  inputText = '';
  isAiThinking = signal<boolean>(false);

  sendMessage() {
    if (!this.inputText.trim()) return;
    const text = this.inputText.trim();
    this.inputText = '';

    const user = this.auth.currentUser();
    this.storage.postChatMessage(text, user.name, user.role, user.avatar);

    // If message contains questions or AI keywords, trigger AI response
    if (text.includes('?') || text.includes('؟') || text.includes('ماركة') || text.includes('سعر') || text.includes('أفضل') || text.includes('ضمان')) {
      this.askAiAssistant(text);
    }
  }

  async askAiAssistant(query: string) {
    this.isAiThinking.set(true);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          allItems: this.storage.currentProjectItems(),
          actionType: 'general_query',
          lang: this.i18n.currentLang(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const reply = json.result || 'تم تحليل طلبك بنجاح.';
        this.storage.chatMessages.update(prev => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'المستشار الذكي للأجهزة',
            senderRole: 'AI Consultant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: '🤖',
            isAi: true,
          }
        ]);
      }
    } catch (e) {
      console.warn('AI call failed', e);
    } finally {
      this.isAiThinking.set(false);
    }
  }
}
