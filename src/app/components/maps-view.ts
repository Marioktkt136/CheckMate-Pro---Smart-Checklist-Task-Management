import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { ChecklistItem, MapLocation } from '../core/checklist-rules';
import { StorageService } from '../services/storage.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-maps-view',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Category Filter Controls -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <mat-icon>map</mat-icon>
            </div>
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                {{ lang() === 'ar' ? 'الخرائط والمواقع المحفوظة (Google Maps)' : 'Maps & Saved Locations (Google Maps)' }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ lang() === 'ar'
                  ? 'استعرض وأضف أي موقع، متجر، معرض أثاث، تشطيبات، أو موقع مشروع واربطه بأصناف قائمتك'
                  : 'Explore and save any store, showroom, furniture hub, contractor, or custom location and link it to your items' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Add Custom Map Location Button + Category Filter Chips -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="showAddLocationForm.set(!showAddLocationForm())"
            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <mat-icon class="!text-sm !w-4 !h-4">{{ showAddLocationForm() ? 'close' : 'add_location_alt' }}</mat-icon>
            <span>{{ lang() === 'ar' ? 'إضافة موقع جديد للخريطة' : 'Add Custom Location' }}</span>
          </button>

          <button
            type="button"
            (click)="selectCategory('ALL')"
            [class.bg-blue-600]="selectedCategory() === 'ALL'"
            [class.text-white]="selectedCategory() === 'ALL'"
            [class.bg-slate-100]="selectedCategory() !== 'ALL'"
            [class.dark:bg-slate-800]="selectedCategory() !== 'ALL'"
            [class.text-slate-700]="selectedCategory() !== 'ALL'"
            [class.dark:text-slate-300]="selectedCategory() !== 'ALL'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            {{ lang() === 'ar' ? 'جميع المواقع' : 'All Locations' }} ({{ storage.mapLocations().length }})
          </button>

          @for (cat of locationCategories; track cat.id) {
            <button
              type="button"
              (click)="selectCategory(cat.id)"
              [class.bg-blue-600]="selectedCategory() === cat.id"
              [class.text-white]="selectedCategory() === cat.id"
              [class.bg-slate-100]="selectedCategory() !== cat.id"
              [class.dark:bg-slate-800]="selectedCategory() !== cat.id"
              [class.text-slate-700]="selectedCategory() !== cat.id"
              [class.dark:text-slate-300]="selectedCategory() !== cat.id"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              {{ lang() === 'ar' ? cat.labelAr : cat.labelEn }}
            </button>
          }
        </div>
      </div>

      <!-- Add New Custom Location Form -->
      @if (showAddLocationForm()) {
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/70 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <mat-icon class="text-emerald-600 text-lg">add_location_alt</mat-icon>
              <span>{{ lang() === 'ar' ? 'إضافة موقع أو مكان جديد إلى خرائط حسابك' : 'Save a New Place / Location to Your Maps' }}</span>
            </h3>
          </div>

          <form [formGroup]="newLocationForm" (ngSubmit)="onAddLocation()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label for="loc-name" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ lang() === 'ar' ? 'اسم المكان / الموقع *' : 'Location / Place Name *' }}
              </label>
              <input
                id="loc-name"
                type="text"
                formControlName="name"
                [placeholder]="lang() === 'ar' ? 'مثال: معرض أثاث، ورشة، موقع شقة، مول...' : 'e.g. Furniture Showroom, Project Site, Mall...'"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="loc-cat" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ lang() === 'ar' ? 'تصنيف الموقع' : 'Location Category' }}
              </label>
              <select
                id="loc-cat"
                formControlName="category"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                @for (cat of locationCategories; track cat.id) {
                  <option [value]="cat.id">{{ lang() === 'ar' ? cat.labelAr : cat.labelEn }}</option>
                }
              </select>
            </div>

            <div>
              <label for="loc-address" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ lang() === 'ar' ? 'العنوان أو المنطقة *' : 'Address or Area *' }}
              </label>
              <input
                id="loc-address"
                type="text"
                formControlName="address"
                [placeholder]="lang() === 'ar' ? 'مثال: التجمع الخامس، القاهرة الجديدة' : 'e.g. New Cairo, 5th Settlement'"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="loc-phone" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ lang() === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)' }}
              </label>
              <input
                id="loc-phone"
                type="text"
                formControlName="phone"
                placeholder="010xxxxxxxx / 19xxx"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="loc-notes" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ lang() === 'ar' ? 'ملاحظات / عروض / تفاصيل المكان' : 'Notes / Deals / Details' }}
              </label>
              <input
                id="loc-notes"
                type="text"
                formControlName="notes"
                [placeholder]="lang() === 'ar' ? 'مثال: خصم نقدي أو مواعيد العمل' : 'e.g. Special discount, contact person, hours'"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div class="flex items-end gap-2">
              <button
                type="submit"
                [disabled]="newLocationForm.invalid"
                class="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <mat-icon class="!text-sm !w-4 !h-4">save</mat-icon>
                <span>{{ lang() === 'ar' ? 'حفظ الموقع في الخريطة' : 'Save Location to Map' }}</span>
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Main Layout: Map & Locations Directory -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Interactive Google Map View -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-sm overflow-hidden flex flex-col space-y-2.5">
          
          <!-- Free-text Map Search Bar -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                type="text"
                [value]="customSearchQuery()"
                (input)="onMapSearchInput($event)"
                (keydown.enter)="searchOnMap()"
                [placeholder]="lang() === 'ar' ? 'ابحث عن أي مكان أو عنوان على خرائط Google...' : 'Search any place, address, or city on Google Maps...'"
                class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              (click)="searchOnMap()"
              class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <mat-icon class="!text-sm !w-4 !h-4">search</mat-icon>
              <span>{{ lang() === 'ar' ? 'بحث في الخريطة' : 'Search Map' }}</span>
            </button>
          </div>

          <!-- Quick Pin Selector Bar -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 px-1">
            @for (loc of filteredLocations(); track loc.id) {
              <button
                type="button"
                (click)="focusOnLocation(loc)"
                [class.bg-blue-600]="activeLocation().id === loc.id"
                [class.text-white]="activeLocation().id === loc.id"
                [class.border-blue-600]="activeLocation().id === loc.id"
                [class.bg-slate-50]="activeLocation().id !== loc.id"
                [class.dark:bg-slate-800]="activeLocation().id !== loc.id"
                [class.text-slate-700]="activeLocation().id !== loc.id"
                [class.dark:text-slate-300]="activeLocation().id !== loc.id"
                [class.border-slate-200]="activeLocation().id !== loc.id"
                [class.dark:border-slate-700]="activeLocation().id !== loc.id"
                class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer"
              >
                <mat-icon class="!text-sm !w-4 !h-4">location_on</mat-icon>
                <span>{{ lang() === 'ar' ? loc.nameAr : loc.nameEn }}</span>
              </button>
            }
          </div>

          <div class="relative w-full h-[460px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <iframe
              [src]="safeMapUrl()"
              title="Google Maps Location Viewer"
              class="w-full h-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
            ></iframe>

            <!-- Floating Selected Location Info Card -->
            @if (activeLocation(); as loc) {
              <div class="absolute bottom-3 inset-x-3 md:inset-x-auto md:end-3 md:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 shadow-lg">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h4 class="font-bold text-xs md:text-sm text-blue-600 dark:text-blue-400">
                    {{ lang() === 'ar' ? loc.nameAr : loc.nameEn }}
                  </h4>
                  <span class="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded shrink-0">
                    ★ {{ loc.rating }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 mb-1">
                  📍 {{ lang() === 'ar' ? loc.addressAr : loc.addressEn }}
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  ⏰ {{ loc.openHours }} | 📞 {{ loc.phone }}
                </p>
                @if (loc.specialDealsAr || loc.specialDealsEn) {
                  <div class="bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 p-2 rounded-lg text-[11px] mb-2.5">
                    💡 {{ lang() === 'ar' ? loc.specialDealsAr : loc.specialDealsEn }}
                  </div>
                }
                <div class="flex items-center gap-2">
                  <a
                    [href]="'https://www.google.com/maps/search/?api=1&query=' + encodeQuery((lang() === 'ar' ? loc.nameAr : loc.nameEn) + ' ' + (lang() === 'ar' ? loc.addressAr : loc.addressEn))"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 inline-flex items-center justify-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    <mat-icon class="!text-sm !w-4 !h-4">directions</mat-icon>
                    {{ lang() === 'ar' ? 'فتح في Google Maps' : 'Open in Google Maps' }}
                  </a>
                  <button
                    type="button"
                    (click)="assignLocationId.set(loc.id)"
                    class="inline-flex items-center justify-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    <mat-icon class="!text-sm !w-4 !h-4">check_circle</mat-icon>
                    {{ lang() === 'ar' ? 'اختيار' : 'Select' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Locations Directory & Link to Item Sidebar -->
        <div class="space-y-4">
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-1.5">
              <mat-icon class="text-blue-500 !text-base !w-4 !h-4">add_location_alt</mat-icon>
              {{ lang() === 'ar' ? 'ربط الصنف بموقع على الخريطة' : 'Link Item to Map Location' }}
            </h3>

            <div class="space-y-3">
              <div>
                <label for="select-item" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {{ lang() === 'ar' ? 'اختر الصنف من القائمة:' : 'Select Checklist Item:' }}
                </label>
                <select
                  id="select-item"
                  [value]="selectedItemId()"
                  (change)="onSelectItem($event)"
                  class="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">{{ lang() === 'ar' ? '-- اختر صنفاً --' : '-- Choose Item --' }}</option>
                  @for (item of items(); track item.id) {
                    <option [value]="item.id">
                      {{ lang() === 'ar' ? item.titleAr : item.titleEn }} ({{ item.storeLocation || item.storeName || (lang() === 'ar' ? 'بدون موقع' : 'No location') }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label for="select-store" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {{ lang() === 'ar' ? 'اختر الموقع / المتجر:' : 'Select Saved Location:' }}
                </label>
                <select
                  id="select-store"
                  [value]="assignLocationId()"
                  (change)="onSelectLocation($event)"
                  class="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">{{ lang() === 'ar' ? '-- اختر موقعاً --' : '-- Choose Location --' }}</option>
                  @for (loc of storage.mapLocations(); track loc.id) {
                    <option [value]="loc.id">
                      {{ lang() === 'ar' ? loc.nameAr : loc.nameEn }}
                    </option>
                  }
                </select>
              </div>

              <button
                type="button"
                (click)="applyLocationToItem()"
                [disabled]="!selectedItemId() || !assignLocationId()"
                class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <mat-icon class="!text-sm !w-4 !h-4">pin_drop</mat-icon>
                {{ lang() === 'ar' ? 'حفظ الموقع في تفاصيل الصنف' : 'Assign Location to Item' }}
              </button>
            </div>
          </div>

          <!-- Saved Locations Cards List -->
          <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            @for (loc of filteredLocations(); track loc.id) {
              <div
                [class.border-blue-500]="activeLocation().id === loc.id"
                [class.ring-2]="activeLocation().id === loc.id"
                [class.ring-blue-500/20]="activeLocation().id === loc.id"
                class="w-full text-start p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs"
              >
                <div class="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    (click)="focusOnLocation(loc)"
                    class="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug text-start hover:text-blue-600 cursor-pointer flex-1"
                  >
                    {{ lang() === 'ar' ? loc.nameAr : loc.nameEn }}
                  </button>
                  <div class="flex items-center gap-1">
                    <span class="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                      ★ {{ loc.rating }}
                    </span>
                    @if (loc.category === 'custom') {
                      <button
                        type="button"
                        (click)="storage.deleteMapLocation(loc.id)"
                        class="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-0.5 rounded cursor-pointer"
                        [title]="lang() === 'ar' ? 'حذف الموقع' : 'Delete Location'"
                      >
                        <mat-icon class="!text-xs !w-3.5 !h-3.5">delete_outline</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {{ lang() === 'ar' ? loc.addressAr : loc.addressEn }}
                </p>

                @if (loc.specialDealsAr || loc.specialDealsEn) {
                  <div class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                    💡 {{ lang() === 'ar' ? loc.specialDealsAr : loc.specialDealsEn }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class MapsView {
  private readonly sanitizer = inject(DomSanitizer);
  readonly storage = inject(StorageService);

  readonly items = input.required<ChecklistItem[]>();
  readonly lang = input<'ar' | 'en'>('ar');
  readonly itemUpdated = output<ChecklistItem>();

  readonly locationCategories = [
    { id: 'appliances', labelAr: 'الأجهزة والإلكترونيات', labelEn: 'Appliances & Tech' },
    { id: 'furniture', labelAr: 'الأثاث والمفروشات', labelEn: 'Furniture & Decor' },
    { id: 'finishing', labelAr: 'التشطيبات والسيراميك', labelEn: 'Finishing & Materials' },
    { id: 'shopping', labelAr: 'المراكز التجارية', labelEn: 'Shopping Centers' },
    { id: 'custom', labelAr: 'مواقعي المخصصة', labelEn: 'My Custom Places' },
  ];

  readonly selectedCategory = signal<string>('ALL');
  readonly showAddLocationForm = signal<boolean>(false);
  readonly customSearchQuery = signal<string>('');
  readonly activeMapQuery = signal<string>('');

  readonly selectedLocation = signal<MapLocation | null>(null);

  readonly activeLocation = computed<MapLocation>(() => {
    const sel = this.selectedLocation();
    const all = this.storage.mapLocations();
    if (sel && all.some(l => l.id === sel.id)) {
      return sel;
    }
    return all[0];
  });

  readonly selectedItemId = signal<string>('');
  readonly assignLocationId = signal<string>('loc-1');

  readonly mapZoom = signal<number>(15);

  newLocationForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    category: new FormControl('custom', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    phone: new FormControl(''),
    notes: new FormControl(''),
  });

  readonly safeMapUrl = computed<SafeResourceUrl>(() => {
    const queryOverride = this.activeMapQuery();
    const language = this.lang();
    const zoom = this.mapZoom();

    if (queryOverride) {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(queryOverride)}&hl=${language}&z=${zoom}&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    const loc = this.activeLocation();
    if (!loc) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=30.0444,31.2357&hl=${language}&z=12&output=embed`
      );
    }

    if (loc.category === 'custom') {
      const q = `${loc.nameAr} ${loc.addressAr}`;
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=${language}&z=${zoom}&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    const url = `https://maps.google.com/maps?q=${loc.position.lat},${loc.position.lng}&hl=${language}&z=${zoom}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  filteredLocations(): MapLocation[] {
    const cat = this.selectedCategory();
    const all = this.storage.mapLocations();
    if (cat === 'ALL') {
      return all;
    }
    return all.filter(s => s.category === cat);
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    const list = this.filteredLocations();
    if (list.length > 0) {
      this.focusOnLocation(list[0]);
    }
  }

  focusOnLocation(loc: MapLocation): void {
    this.activeMapQuery.set('');
    this.selectedLocation.set(loc);
    this.assignLocationId.set(loc.id);
    this.mapZoom.set(15);
  }

  onMapSearchInput(event: Event): void {
    this.customSearchQuery.set((event.target as HTMLInputElement).value);
  }

  searchOnMap(): void {
    const q = this.customSearchQuery().trim();
    if (q) {
      this.activeMapQuery.set(q);
    }
  }

  encodeQuery(q: string): string {
    return encodeURIComponent(q);
  }

  onAddLocation(): void {
    if (this.newLocationForm.invalid) return;
    const v = this.newLocationForm.value;
    const name = (v.name || '').trim();
    const address = (v.address || '').trim();
    if (!name || !address) return;

    const created = this.storage.addMapLocation({
      nameAr: name,
      nameEn: name,
      category: v.category || 'custom',
      brand: 'Custom',
      addressAr: address,
      addressEn: address,
      phone: (v.phone || '-').trim(),
      rating: 5.0,
      openHours: '09:00 AM - 10:00 PM',
      specialDealsAr: (v.notes || '').trim(),
      specialDealsEn: (v.notes || '').trim(),
      position: { lat: 30.0444, lng: 31.2357 },
    });

    this.newLocationForm.reset({ category: 'custom' });
    this.showAddLocationForm.set(false);
    this.focusOnLocation(created);
  }

  onSelectItem(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedItemId.set(val);
  }

  onSelectLocation(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.assignLocationId.set(val);
    const loc = this.storage.mapLocations().find(s => s.id === val);
    if (loc) {
      this.focusOnLocation(loc);
    }
  }

  applyLocationToItem(): void {
    const itemId = this.selectedItemId();
    const locId = this.assignLocationId();
    if (!itemId || !locId) return;

    const item = this.items().find(i => i.id === itemId);
    const loc = this.storage.mapLocations().find(s => s.id === locId);
    if (!item || !loc) return;

    const locTitle = this.lang() === 'ar' ? loc.nameAr : loc.nameEn;
    const updated: ChecklistItem = {
      ...item,
      storeLocation: locTitle,
      storeName: locTitle,
      storeAddress: this.lang() === 'ar' ? loc.addressAr : loc.addressEn,
      updatedAt: new Date().toISOString(),
    };

    this.itemUpdated.emit(updated);
  }
}
