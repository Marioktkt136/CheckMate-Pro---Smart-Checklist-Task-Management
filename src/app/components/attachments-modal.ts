import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../services/i18n.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { AttachmentTag, ChecklistItem, ItemAttachment } from '../core/checklist-rules';

@Component({
  selector: 'app-attachments-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <mat-icon class="text-xl">attach_file</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">
                  {{ i18n.t().attachments }} - {{ i18n.isRtl() ? liveItem().titleAr : (liveItem().titleEn || liveItem().titleAr) }}
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {{ attachments().length }}
                </span>
              </div>
              <p class="text-xs text-slate-400">
                {{ i18n.isRtl() ? 'صور الجهاز، الفواتير، شهادات الضمان، والكتالوجات مع معاينة مباشرة' : 'Appliance photos, invoices, warranty certificates & manuals with live preview' }}
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

        <div class="flex-1 overflow-y-auto space-y-4 py-4 pr-0.5">
          
          <!-- Upload & Optional Features Control Panel -->
          <div
            class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed transition space-y-3"
            [class.border-emerald-500]="isDragging()"
            [class.bg-emerald-50/40]="isDragging()"
            [class.border-slate-200]="!isDragging()"
            [class.dark:border-slate-700]="!isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <!-- Optional Upload Metadata (Tag & Caption) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label for="att-upload-tag" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {{ i18n.isRtl() ? 'تصنيف المرفق (اختياري):' : 'Attachment Category Tag:' }}
                </label>
                <select
                  id="att-upload-tag"
                  [formControl]="uploadTagControl"
                  class="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="photo">📷 {{ i18n.isRtl() ? 'صورة الجهاز / المعاينة' : 'Appliance / Showroom Photo' }}</option>
                  <option value="invoice">🧾 {{ i18n.isRtl() ? 'فاتورة شراء / إيصال' : 'Purchase Invoice / Receipt' }}</option>
                  <option value="warranty">🛡️ {{ i18n.isRtl() ? 'شهادة ضمان الوكيل' : 'Warranty Certificate' }}</option>
                  <option value="manual">📘 {{ i18n.isRtl() ? 'كتالوج / مواصفات فنية' : 'User Manual / Specs' }}</option>
                  <option value="other">📎 {{ i18n.isRtl() ? 'ملف آخر' : 'Other Attachment' }}</option>
                </select>
              </div>
              <div>
                <label for="att-upload-caption" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {{ i18n.isRtl() ? 'وصف أو ملاحظة على المرفق (اختياري):' : 'Caption / Note (Optional):' }}
                </label>
                <input
                  id="att-upload-caption"
                  type="text"
                  [formControl]="uploadCaptionControl"
                  [placeholder]="i18n.isRtl() ? 'مثال: صورة الموديل من معرض العربي - ضمان 10 سنوات' : 'e.g., Model photo at showroom - 10yr warranty'"
                  class="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <!-- Upload Image / File from Device -->
              <label class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition cursor-pointer inline-flex items-center gap-1.5">
                <mat-icon class="!text-base !w-4 !h-4">add_photo_alternate</mat-icon>
                <span>{{ i18n.isRtl() ? 'رفع صورة أو ملف من الجهاز' : 'Upload Image or File' }}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  (change)="onCustomFileUpload($event)"
                  class="hidden"
                />
              </label>

              <!-- Toggle Attach by URL -->
              <button
                type="button"
                (click)="showUrlInput.set(!showUrlInput())"
                class="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer inline-flex items-center gap-1"
              >
                <mat-icon class="!text-sm !w-4 !h-4 text-blue-500">link</mat-icon>
                <span>{{ i18n.isRtl() ? 'إرفاق رابط صورة / ملف' : 'Attach Image / File URL' }}</span>
              </button>
            </div>

            <!-- Attach by URL Expandable Input -->
            @if (showUrlInput()) {
              <div class="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  [formControl]="urlNameControl"
                  [placeholder]="i18n.isRtl() ? 'اسم الصورة أو المستند' : 'Image or file title'"
                  class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="url"
                  [formControl]="urlLinkControl"
                  [placeholder]="i18n.isRtl() ? 'رابط الصورة المباشر (https://...)' : 'Direct Image/File URL (https://...)'"
                  class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  (click)="attachFromUrl()"
                  class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <mat-icon class="!text-sm !w-4 !h-4">add_link</mat-icon>
                  <span>{{ i18n.isRtl() ? 'إرفاق وعرض الصورة' : 'Attach & Show' }}</span>
                </button>
              </div>
            }
          </div>

          <!-- Status Banner -->
          @if (previewBanner()) {
            <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <mat-icon class="text-emerald-600 !text-base !w-4 !h-4">check_circle</mat-icon>
                <span>{{ previewBanner() }}</span>
              </div>
              <button type="button" (click)="previewBanner.set('')" class="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                <mat-icon class="!text-sm !w-3.5 !h-3.5">close</mat-icon>
              </button>
            </div>
          }

          <!-- Live Image & Document Viewer Panel (Automatically shown when an image/file is uploaded or selected) -->
          @if (activePreviewAttachment(); as activeAtt) {
            <div class="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div class="flex items-center gap-2 min-w-0">
                  <mat-icon class="text-emerald-400 !text-lg !w-5 !h-5">
                    {{ activeAtt.type === 'image' ? 'photo_camera' : activeAtt.type === 'pdf' ? 'picture_as_pdf' : 'description' }}
                  </mat-icon>
                  <div class="truncate">
                    <div class="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      <span class="truncate">{{ activeAtt.name }}</span>
                      @if (activeAtt.isPrimary) {
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                          ★ {{ i18n.isRtl() ? 'الصورة الرئيسية' : 'Primary Image' }}
                        </span>
                      }
                    </div>
                    <div class="text-[10px] text-slate-400">
                      {{ getTagLabel(activeAtt.tag) }} • {{ activeAtt.size }} • {{ activeAtt.date }}
                    </div>
                  </div>
                </div>

                <!-- Optional Image Controls: Zoom, Rotate, Primary, Download -->
                <div class="flex items-center gap-1">
                  @if (activeAtt.type === 'image') {
                    <button
                      type="button"
                      (click)="zoomOut()"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تصغير' : 'Zoom Out'"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">zoom_out</mat-icon>
                    </button>
                    <span class="text-[10px] font-mono px-1 text-slate-300">{{ Math.round(imageZoom() * 100) }}%</span>
                    <button
                      type="button"
                      (click)="zoomIn()"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تكبير' : 'Zoom In'"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">zoom_in</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="rotateImage()"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تدوير 90 درجة' : 'Rotate 90°'"
                    >
                      <mat-icon class="!text-sm !w-4 !h-4">rotate_right</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="setAsPrimary(activeAtt)"
                      class="px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                      [class.bg-amber-500]="activeAtt.isPrimary"
                      [class.text-slate-950]="activeAtt.isPrimary"
                      [class.bg-slate-800]="!activeAtt.isPrimary"
                      [class.text-amber-300]="!activeAtt.isPrimary"
                      [title]="i18n.isRtl() ? 'تعيين كصورة رئيسية للصنف' : 'Set as Primary Item Image'"
                    >
                      <mat-icon class="!text-xs !w-3.5 !h-3.5">star</mat-icon>
                      <span>{{ i18n.isRtl() ? 'رئيسية' : 'Primary' }}</span>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="downloadAttachment(activeAtt)"
                    class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <mat-icon class="!text-xs !w-3.5 !h-3.5">download</mat-icon>
                    <span>{{ i18n.isRtl() ? 'تحميل' : 'Download' }}</span>
                  </button>
                </div>
              </div>

              <!-- Image Canvas / Document Preview Box -->
              @if (activeAtt.type === 'image' && activeAtt.url) {
                <div class="relative bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[220px] max-h-[340px] p-2 border border-slate-800">
                  <img
                    [src]="activeAtt.url"
                    [alt]="activeAtt.name"
                    referrerpolicy="no-referrer"
                    class="max-h-[310px] w-auto object-contain rounded-lg transition-transform duration-200"
                    [style.transform]="'scale(' + imageZoom() + ') rotate(' + imageRotation() + 'deg)'"
                  />
                </div>
              } @else {
                <div class="bg-slate-950 rounded-xl p-6 text-center border border-slate-800 space-y-2">
                  <mat-icon class="text-4xl text-emerald-400">
                    {{ activeAtt.type === 'pdf' ? 'picture_as_pdf' : 'verified' }}
                  </mat-icon>
                  <p class="text-xs font-semibold text-slate-200">{{ activeAtt.name }}</p>
                  <p class="text-[11px] text-slate-400">
                    {{ activeAtt.caption || (i18n.isRtl() ? 'مستند معتمد محفوظ ومرتبط بهذا الصنف في قاعدة البيانات.' : 'Verified document saved and linked to this item.') }}
                  </p>
                </div>
              }

              @if (activeAtt.caption) {
                <div class="text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <mat-icon class="!text-sm !w-4 !h-4 text-amber-400">notes</mat-icon>
                  <span>{{ activeAtt.caption }}</span>
                </div>
              }
            </div>
          }

          <!-- Filter Tabs for Attachments -->
          @if (attachments().length > 0) {
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
              @for (tab of filterTabs; track tab.id) {
                <button
                  type="button"
                  (click)="selectedFilterTag.set(tab.id)"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                  [class.bg-emerald-600]="selectedFilterTag() === tab.id"
                  [class.text-white]="selectedFilterTag() === tab.id"
                  [class.bg-slate-100]="selectedFilterTag() !== tab.id"
                  [class.dark:bg-slate-800]="selectedFilterTag() !== tab.id"
                  [class.text-slate-600]="selectedFilterTag() !== tab.id"
                  [class.dark:text-slate-300]="selectedFilterTag() !== tab.id"
                >
                  {{ i18n.isRtl() ? tab.labelAr : tab.labelEn }}
                </button>
              }
            </div>
          }

          <!-- Attachments List with Inline Image Thumbnails & Full Edit/Delete Actions -->
          <div class="space-y-2.5 min-h-[120px]">
            @for (att of filteredAttachments(); track att.id) {
              <div
                class="p-3 rounded-xl border transition"
                [class.bg-emerald-50/50]="activePreviewAttachment()?.id === att.id"
                [class.dark:bg-emerald-950/20]="activePreviewAttachment()?.id === att.id"
                [class.border-emerald-400]="activePreviewAttachment()?.id === att.id"
                [class.bg-slate-50]="activePreviewAttachment()?.id !== att.id"
                [class.dark:bg-slate-800/60]="activePreviewAttachment()?.id !== att.id"
                [class.border-slate-200]="activePreviewAttachment()?.id !== att.id"
                [class.dark:border-slate-800]="activePreviewAttachment()?.id !== att.id"
              >
                <div class="flex items-center justify-between gap-3">
                  <div
                    role="button"
                    tabindex="0"
                    (click)="selectForPreview(att)"
                    (keydown.enter)="selectForPreview(att)"
                    class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer focus:outline-none"
                  >
                    <!-- Thumbnail if image URL exists, otherwise icon -->
                    @if (att.type === 'image' && att.url) {
                      <img
                        [src]="att.url"
                        [alt]="att.name"
                        referrerpolicy="no-referrer"
                        class="w-14 h-14 rounded-xl object-cover border border-emerald-300 dark:border-emerald-700 shrink-0 shadow-2xs"
                      />
                    } @else {
                      <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        [class.bg-rose-100]="att.type === 'pdf'"
                        [class.text-rose-600]="att.type === 'pdf'"
                        [class.bg-emerald-100]="att.type === 'image'"
                        [class.text-emerald-600]="att.type === 'image'"
                        [class.bg-blue-100]="att.type === 'doc'"
                        [class.text-blue-600]="att.type === 'doc'"
                      >
                        <mat-icon class="text-xl">
                          {{ att.type === 'pdf' ? 'picture_as_pdf' : att.type === 'image' ? 'photo' : 'description' }}
                        </mat-icon>
                      </div>
                    }

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {{ att.name }}
                        </span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          {{ getTagLabel(att.tag) }}
                        </span>
                        @if (att.isPrimary) {
                          <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                            ★ {{ i18n.isRtl() ? 'رئيسية' : 'Primary' }}
                          </span>
                        }
                      </div>
                      @if (att.caption) {
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {{ att.caption }}
                        </p>
                      }
                      <div class="text-[10px] text-slate-400 mt-0.5">
                        {{ att.size }} • {{ att.date }}
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons for Each Attachment -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      (click)="selectForPreview(att)"
                      class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'عرض ومعاينة' : 'View & Preview'"
                    >
                      <mat-icon class="text-base">visibility</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="startEditAttachment(att)"
                      class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تعديل الاسم والوصف' : 'Edit name & caption'"
                    >
                      <mat-icon class="text-base">edit</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="downloadAttachment(att)"
                      class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'تحميل' : 'Download'"
                    >
                      <mat-icon class="text-base">download</mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="deleteAttachment(att.id)"
                      class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      [title]="i18n.isRtl() ? 'حذف المرفق' : 'Delete attachment'"
                    >
                      <mat-icon class="text-base">delete_outline</mat-icon>
                    </button>
                  </div>
                </div>

                <!-- Inline Edit Row for Attachment -->
                @if (editingAttachmentId() === att.id) {
                  <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      [formControl]="editNameControl"
                      [placeholder]="i18n.isRtl() ? 'اسم الملف' : 'File name'"
                      class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      [formControl]="editCaptionControl"
                      [placeholder]="i18n.isRtl() ? 'الوصف / الملاحظة' : 'Caption / note'"
                      class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <div class="flex items-center gap-1.5">
                      <select
                        [formControl]="editTagControl"
                        class="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="photo">{{ i18n.isRtl() ? 'صورة' : 'Photo' }}</option>
                        <option value="invoice">{{ i18n.isRtl() ? 'فاتورة' : 'Invoice' }}</option>
                        <option value="warranty">{{ i18n.isRtl() ? 'ضمان' : 'Warranty' }}</option>
                        <option value="manual">{{ i18n.isRtl() ? 'كتالوج' : 'Manual' }}</option>
                        <option value="other">{{ i18n.isRtl() ? 'أخرى' : 'Other' }}</option>
                      </select>
                      <button
                        type="button"
                        (click)="saveAttachmentEdit(att.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        {{ i18n.t().save }}
                      </button>
                      <button
                        type="button"
                        (click)="editingAttachmentId.set(null)"
                        class="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
                      >
                        {{ i18n.t().cancel }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @empty {
              <div class="py-10 text-center text-xs text-slate-400">
                <mat-icon class="text-3xl text-slate-300 dark:text-slate-600">attachment</mat-icon>
                <p class="mt-1">
                  {{ i18n.isRtl() ? 'لا توجد مرفقات مرفوعة لهذا الصنف حالياً. ارفع صورة أو ملفاً من الأعلى!' : 'No attachments uploaded for this item yet. Upload an image or file above!' }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            (click)="closeModal.emit()"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {{ i18n.isRtl() ? 'إغلاق' : 'Close' }}
          </button>
        </div>

      </div>
    </div>
  `,
})
export class AttachmentsModalComponent {
  i18n = inject(I18nService);
  storage = inject(StorageService);
  auth = inject(AuthService);

  Math = Math;

  item = input.required<ChecklistItem>();
  closeModal = output<void>();

  previewBanner = signal<string>('');
  selectedAttachmentId = signal<string | null>(null);
  selectedFilterTag = signal<'all' | AttachmentTag>('all');
  isDragging = signal<boolean>(false);
  showUrlInput = signal<boolean>(false);

  imageZoom = signal<number>(1);
  imageRotation = signal<number>(0);

  uploadTagControl = new FormControl<AttachmentTag>('photo', { nonNullable: true });
  uploadCaptionControl = new FormControl<string>('', { nonNullable: true });

  urlNameControl = new FormControl<string>('', { nonNullable: true });
  urlLinkControl = new FormControl<string>('', { nonNullable: true });

  editingAttachmentId = signal<string | null>(null);
  editNameControl = new FormControl<string>('', { nonNullable: true });
  editCaptionControl = new FormControl<string>('', { nonNullable: true });
  editTagControl = new FormControl<AttachmentTag>('photo', { nonNullable: true });

  filterTabs: { id: 'all' | AttachmentTag; labelAr: string; labelEn: string }[] = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    { id: 'photo', labelAr: '📷 الصور', labelEn: '📷 Photos' },
    { id: 'invoice', labelAr: '🧾 الفواتير', labelEn: '🧾 Invoices' },
    { id: 'warranty', labelAr: '🛡️ الضمان', labelEn: '🛡️ Warranty' },
    { id: 'manual', labelAr: '📘 الكتالوجات', labelEn: '📘 Manuals' },
  ];

  // Live reactive item lookup from StorageService so screen refreshes immediately after attaching files
  liveItem = computed<ChecklistItem>(() => {
    const currentId = this.item().id;
    return this.storage.items().find(i => i.id === currentId) || this.item();
  });

  attachments = computed<ItemAttachment[]>(() => {
    return this.liveItem().attachments || [];
  });

  filteredAttachments = computed<ItemAttachment[]>(() => {
    const tag = this.selectedFilterTag();
    const list = this.attachments();
    if (tag === 'all') return list;
    return list.filter(a => (a.tag || (a.type === 'image' ? 'photo' : 'other')) === tag);
  });

  activePreviewAttachment = computed<ItemAttachment | null>(() => {
    const list = this.attachments();
    if (list.length === 0) return null;
    const selectedId = this.selectedAttachmentId();
    if (selectedId) {
      const found = list.find(a => a.id === selectedId);
      if (found) return found;
    }
    // Automatically show the latest uploaded image (or latest attachment)
    const primaryImg = list.find(a => a.type === 'image' && a.isPrimary && a.url);
    if (primaryImg) return primaryImg;
    const latestImg = [...list].reverse().find(a => a.type === 'image' && a.url);
    if (latestImg) return latestImg;
    return list[list.length - 1] || null;
  });

  getTagLabel(tag?: AttachmentTag): string {
    const isAr = this.i18n.isRtl();
    switch (tag) {
      case 'photo':
        return isAr ? 'صورة معاينة' : 'Photo';
      case 'invoice':
        return isAr ? 'فاتورة شراء' : 'Invoice';
      case 'warranty':
        return isAr ? 'شهادة ضمان' : 'Warranty';
      case 'manual':
        return isAr ? 'كتالوج' : 'Manual';
      default:
        return isAr ? 'مرفق' : 'File';
    }
  }

  attachFromUrl() {
    const link = this.urlLinkControl.value.trim();
    if (!link) return;
    const name = this.urlNameControl.value.trim() || (this.i18n.isRtl() ? 'صورة مرفقة عبر الرابط' : 'Attached Image Link');
    const caption = this.uploadCaptionControl.value.trim();
    const tag = this.uploadTagControl.value;
    const isPdf = link.toLowerCase().endsWith('.pdf');
    const type: 'pdf' | 'image' | 'doc' = isPdf ? 'pdf' : 'image';

    const created = this.storage.addAttachment(this.liveItem().id, {
      name,
      type,
      size: 'External URL',
      url: link,
      tag,
      caption: caption || undefined,
      isPrimary: type === 'image',
    });
    this.urlNameControl.setValue('');
    this.urlLinkControl.setValue('');
    this.uploadCaptionControl.setValue('');
    this.showUrlInput.set(false);
    this.selectedAttachmentId.set(created.id);
    this.resetViewerTransform();
    this.previewBanner.set(
      this.i18n.isRtl()
        ? `تم إرفاق وعرض الصورة "${name}" بنجاح.`
        : `Attached and displayed "${name}" successfully.`
    );
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  onCustomFileUpload(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.processFiles(Array.from(inputEl.files));
      inputEl.value = '';
    }
  }

  private async processFiles(files: File[]) {
    const selectedTag = this.uploadTagControl.value;
    const caption = this.uploadCaptionControl.value.trim();

    for (const file of files) {
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
      const isPdf = file.type.includes('pdf') || /\.pdf$/i.test(file.name);
      const type: 'pdf' | 'image' | 'doc' = isImage ? 'image' : isPdf ? 'pdf' : 'doc';
      const sizeStr = file.size >= 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        : Math.max(1, Math.round(file.size / 1024)) + ' KB';

      let dataUrl: string | undefined;
      if (isImage) {
        dataUrl = await this.readAndOptimizeImage(file);
      } else if (file.size <= 350 * 1024) {
        dataUrl = await this.readFileAsDataUrl(file);
      }

      const created = this.storage.addAttachment(this.liveItem().id, {
        name: file.name,
        type,
        size: sizeStr,
        url: dataUrl,
        mimeType: file.type || undefined,
        tag: isImage && selectedTag === 'other' ? 'photo' : selectedTag,
        caption: caption || undefined,
        isPrimary: isImage,
      });

      this.selectedAttachmentId.set(created.id);
      this.resetViewerTransform();
      this.previewBanner.set(
        this.i18n.isRtl()
          ? `تم رفع وإرفاق "${file.name}" وعرضه على الشاشة فوراً.`
          : `Uploaded & attached "${file.name}" and displayed on screen.`
      );
    }

    this.uploadCaptionControl.setValue('');
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  private async readAndOptimizeImage(file: File): Promise<string> {
    const rawDataUrl = await this.readFileAsDataUrl(file);
    if (!rawDataUrl || file.type === 'image/svg+xml') return rawDataUrl;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outputType, 0.85);
          resolve(compressed || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
  }

  selectForPreview(att: ItemAttachment) {
    this.selectedAttachmentId.set(att.id);
    this.resetViewerTransform();
  }

  zoomIn() {
    this.imageZoom.update(z => Math.min(2.5, +(z + 0.25).toFixed(2)));
  }

  zoomOut() {
    this.imageZoom.update(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
  }

  rotateImage() {
    this.imageRotation.update(r => (r + 90) % 360);
  }

  resetViewerTransform() {
    this.imageZoom.set(1);
    this.imageRotation.set(0);
  }

  setAsPrimary(att: ItemAttachment) {
    this.storage.updateAttachment(this.liveItem().id, att.id, { isPrimary: true });
    this.previewBanner.set(
      this.i18n.isRtl()
        ? `تم تعيين "${att.name}" كصورة رئيسية للصنف.`
        : `Set "${att.name}" as primary item image.`
    );
  }

  startEditAttachment(att: ItemAttachment) {
    this.editingAttachmentId.set(att.id);
    this.editNameControl.setValue(att.name);
    this.editCaptionControl.setValue(att.caption || '');
    this.editTagControl.setValue(att.tag || (att.type === 'image' ? 'photo' : 'other'));
  }

  saveAttachmentEdit(attachmentId: string) {
    const newName = this.editNameControl.value.trim();
    if (!newName) return;
    this.storage.updateAttachment(this.liveItem().id, attachmentId, {
      name: newName,
      caption: this.editCaptionControl.value.trim() || undefined,
      tag: this.editTagControl.value,
    });
    this.editingAttachmentId.set(null);
    this.previewBanner.set(
      this.i18n.isRtl() ? 'تم حفظ تعديلات المرفق بنجاح.' : 'Attachment details updated.'
    );
  }

  deleteAttachment(attachmentId: string) {
    this.storage.deleteAttachment(this.liveItem().id, attachmentId);
    if (this.selectedAttachmentId() === attachmentId) {
      this.selectedAttachmentId.set(null);
    }
    this.previewBanner.set(
      this.i18n.isRtl() ? 'تم حذف المرفق وتحديث الشاشة.' : 'Attachment removed and screen updated.'
    );
  }

  downloadAttachment(att: ItemAttachment) {
    const a = document.createElement('a');
    if (att.url) {
      a.href = att.url;
      a.download = att.name;
    } else {
      const content = `CheckMate Pro Attachment\nItem: ${this.liveItem().titleAr} / ${this.liveItem().titleEn}\nFile: ${att.name}\nCategory: ${att.tag || att.type}\nCaption: ${att.caption || '-'}\nDate: ${att.date}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      a.href = URL.createObjectURL(blob);
      a.download = `${att.name}.txt`;
    }
    a.click();
  }
}
