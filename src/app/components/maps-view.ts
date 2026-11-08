import { ChangeDetectionStrategy, Component, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { MatIconModule } from '@angular/material/icon';
import { ChecklistItem } from '../core/checklist-rules';

export interface ApplianceStore {
  id: string;
  nameAr: string;
  nameEn: string;
  brand: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  rating: number;
  openHours: string;
  specialDealsAr: string;
  specialDealsEn: string;
  position: google.maps.LatLngLiteral;
}

const APPLIANCE_STORES: ApplianceStore[] = [
  {
    id: 'store-1',
    nameAr: 'بي تك - فرع عباس العقاد، مدينة نصر',
    nameEn: 'B.Tech - Abbas El Akkad, Nasr City',
    brand: 'B.Tech',
    addressAr: 'شارع عباس العقاد، أمام الحديقة الدولية، مدينة نصر، القاهرة',
    addressEn: 'Abbas El Akkad St, Nasr City, Cairo',
    phone: '19966',
    rating: 4.6,
    openHours: '10:00 AM - 11:00 PM',
    specialDealsAr: 'تقسيط حتى 24 شهر بدون فوائد على الثلاجات والغسالات',
    specialDealsEn: '0% interest installment up to 24 months on fridges & washers',
    position: { lat: 30.0561, lng: 31.3412 }
  },
  {
    id: 'store-2',
    nameAr: 'العربي سنتر - مصر الجديدة',
    nameEn: 'Elaraby Center - Heliopolis',
    brand: 'Elaraby',
    addressAr: 'ميدان روكسي، مصر الجديدة، القاهرة',
    addressEn: 'Roxy Square, Heliopolis, Cairo',
    phone: '19319',
    rating: 4.8,
    openHours: '09:30 AM - 10:30 PM',
    specialDealsAr: 'ضمان العربي الشامل 10 سنوات على ثلاجات ومكانس توشيبا وشارب وتورنيدو',
    specialDealsEn: '10-year official Elaraby warranty on Sharp & Tornado appliances',
    position: { lat: 30.0934, lng: 31.3182 }
  },
  {
    id: 'store-3',
    nameAr: 'كارفور سيتي سنتر ألماظة',
    nameEn: 'Carrefour - City Centre Almaza',
    brand: 'Carrefour',
    addressAr: 'طريق السويس، مصر الجديدة، القاهرة',
    addressEn: 'Suez Road, Almaza, Cairo',
    phone: '16061',
    rating: 4.7,
    openHours: '09:00 AM - 12:00 AM',
    specialDealsAr: 'خصم 10% نقاط كاش باك على الخلاطات والقلايات الهوائية',
    specialDealsEn: '10% MyClub cashback points on blenders & air fryers',
    position: { lat: 30.0886, lng: 31.3654 }
  },
  {
    id: 'store-4',
    nameAr: 'معرض فريش الرئيسي - التجمع الخامس',
    nameEn: 'Fresh Showroom - 5th Settlement',
    brand: 'Fresh',
    addressAr: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
    addressEn: 'North 90th St, New Cairo',
    phone: '19059',
    rating: 4.5,
    openHours: '10:00 AM - 10:00 PM',
    specialDealsAr: 'عرض خاص على بوتاجازات فريش 5 شعلة أمان كامل',
    specialDealsEn: 'Special package discount on 5-burner gas cookers with full safety',
    position: { lat: 30.0278, lng: 31.4721 }
  },
  {
    id: 'store-5',
    nameAr: 'إل جي براند شوب - المهندسين',
    nameEn: 'LG Brand Shop - Mohandessin',
    brand: 'LG',
    addressAr: 'شارع جامعة الدول العربية، المهندسين، الجيزة',
    addressEn: 'Gamat El Dowal Al Arabiya St, Mohandessin, Giza',
    phone: '19960',
    rating: 4.9,
    openHours: '10:00 AM - 11:00 PM',
    specialDealsAr: 'ضمان 10 سنوات على موتور Direct Drive للغسالات الأوتوماتيك',
    specialDealsEn: '10-year direct drive motor warranty on front-load washing machines',
    position: { lat: 30.0524, lng: 31.2001 }
  },
  {
    id: 'store-6',
    nameAr: 'رنين - فرع الهرم',
    nameEn: 'Raneen - Haram Branch',
    brand: 'Raneen',
    addressAr: 'شارع الهرم الرئيسي، بجوار محطة نصر الدين، الجيزة',
    addressEn: 'Al Haram Main St, Giza',
    phone: '16113',
    rating: 4.3,
    openHours: '10:00 AM - 11:30 PM',
    specialDealsAr: 'عروض مستلزمات جهاز العروسة والأجهزة الصغيرة ومكواة البخار',
    specialDealsEn: 'Special bridal bundles for small kitchen appliances & irons',
    position: { lat: 29.9984, lng: 31.1892 }
  }
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-maps-view',
  imports: [CommonModule, GoogleMap, MapMarker, MapInfoWindow, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Demo Key In-App Quota Defense Banner (As required by Google Maps Platform guidelines) -->
      @if (quotaExceeded()) {
        <div class="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs md:text-sm text-center rounded-xl shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              class="underline font-semibold text-amber-950 dark:text-amber-100 hover:text-amber-800"
            >
              maps developer site
            </a>
            for instructions to update your account.
          </span>
        </div>
      }

      <!-- Header & Store Filter Controls -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <mat-icon>storefront</mat-icon>
            </div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
              {{ lang() === 'ar' ? 'خريطة معارض ومتاجر الأجهزة الكهربائية' : 'Appliance Stores & Showrooms Map' }}
            </h2>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {{ lang() === 'ar' ? 'حدد معارض الشراء لمقارنة الأسعار والعروض الترويجية وربطها بأصناف قائمتك' : 'Browse appliance stores, compare exclusive showroom offers, and link stores to your items' }}
          </p>
        </div>

        <!-- Filter Chips -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="selectedBrand.set('ALL')"
            [class.bg-blue-600]="selectedBrand() === 'ALL'"
            [class.text-white]="selectedBrand() === 'ALL'"
            [class.bg-slate-100]="selectedBrand() !== 'ALL'"
            [class.dark:bg-slate-800]="selectedBrand() !== 'ALL'"
            [class.text-slate-700]="selectedBrand() !== 'ALL'"
            [class.dark:text-slate-300]="selectedBrand() !== 'ALL'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            {{ lang() === 'ar' ? 'جميع المعارض' : 'All Stores' }}
          </button>
          @for (brand of brands; track brand) {
            <button
              type="button"
              (click)="selectedBrand.set(brand)"
              [class.bg-blue-600]="selectedBrand() === brand"
              [class.text-white]="selectedBrand() === brand"
              [class.bg-slate-100]="selectedBrand() !== brand"
              [class.dark:bg-slate-800]="selectedBrand() !== brand"
              [class.text-slate-700]="selectedBrand() !== brand"
              [class.dark:text-slate-300]="selectedBrand() !== brand"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              {{ brand }}
            </button>
          }
        </div>
      </div>

      <!-- Main Layout: Map & Store Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Interactive Google Map View -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm overflow-hidden flex flex-col">
          <div class="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <google-map
              height="100%"
              width="100%"
              [center]="mapCenter"
              [zoom]="mapZoom"
              [options]="mapOptions"
            >
              @for (store of filteredStores(); track store.id) {
                <map-marker
                  #marker="mapMarker"
                  [position]="store.position"
                  [title]="lang() === 'ar' ? store.nameAr : store.nameEn"
                  (mapClick)="openInfoWindow(marker, store)"
                />
              }

              <map-info-window #infoWindow>
                @if (activeStore()) {
                  <div class="p-2 max-w-xs text-slate-800 font-sans" dir="rtl">
                    <h4 class="font-bold text-sm text-blue-600 mb-1">
                      {{ lang() === 'ar' ? activeStore()?.nameAr : activeStore()?.nameEn }}
                    </h4>
                    <p class="text-xs text-slate-600 mb-1">
                      📍 {{ lang() === 'ar' ? activeStore()?.addressAr : activeStore()?.addressEn }}
                    </p>
                    <p class="text-xs text-slate-500 mb-2">
                      ⏰ {{ activeStore()?.openHours }} | 📞 {{ activeStore()?.phone }}
                    </p>
                    <div class="bg-amber-50 text-amber-900 p-1.5 rounded text-xs mb-2">
                      🎁 {{ lang() === 'ar' ? activeStore()?.specialDealsAr : activeStore()?.specialDealsEn }}
                    </div>
                    <a
                      [href]="'https://www.google.com/maps/dir/?api=1&destination=' + activeStore()?.position?.lat + ',' + activeStore()?.position?.lng"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700"
                    >
                      <mat-icon class="!text-xs !w-3 !h-3">directions</mat-icon>
                      {{ lang() === 'ar' ? 'الاتجاهات عبر Google Maps' : 'Directions in Google Maps' }}
                    </a>
                  </div>
                }
              </map-info-window>
            </google-map>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-b-xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span class="flex items-center gap-1">
              <mat-icon class="!text-sm !w-4 !h-4 text-emerald-500">verified</mat-icon>
              {{ lang() === 'ar' ? 'معارض معتمدة وموزعون رسميون للأجهزة' : 'Verified official distributors & retail showrooms' }}
            </span>
            <span class="text-[11px] opacity-75">
              Powered by Google Maps Platform (gmp_mcp_codeassist_v1_aistudio)
            </span>
          </div>
        </div>

        <!-- Store Directory & Assign to Item Sidebar -->
        <div class="space-y-4">
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-1.5">
              <mat-icon class="text-blue-500 !text-base !w-4 !h-4">checklist</mat-icon>
              {{ lang() === 'ar' ? 'ربط الصنف بمعرض الشراء' : 'Link Item to Showroom' }}
            </h3>

            <div class="space-y-3">
              <div>
                <label for="select-item" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {{ lang() === 'ar' ? 'اختر الجهاز من القائمة:' : 'Select Appliance:' }}
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
                      {{ lang() === 'ar' ? item.titleAr : item.titleEn }} ({{ item.storeName || (lang() === 'ar' ? 'غير محدد' : 'Not set') }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label for="select-store" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {{ lang() === 'ar' ? 'اختر المعرض المفضل:' : 'Select Preferred Store:' }}
                </label>
                <select
                  id="select-store"
                  [value]="assignStoreId()"
                  (change)="onSelectStore($event)"
                  class="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">{{ lang() === 'ar' ? '-- اختر معرضاً --' : '-- Choose Store --' }}</option>
                  @for (store of stores; track store.id) {
                    <option [value]="store.id">
                      {{ lang() === 'ar' ? store.nameAr : store.nameEn }}
                    </option>
                  }
                </select>
              </div>

              <button
                type="button"
                (click)="applyStoreToItem()"
                [disabled]="!selectedItemId() || !assignStoreId()"
                class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <mat-icon class="!text-sm !w-4 !h-4">add_location_alt</mat-icon>
                {{ lang() === 'ar' ? 'تثبيت المعرض في تفاصيل الصنف' : 'Assign Store to Item' }}
              </button>
            </div>
          </div>

          <!-- Store Cards List -->
          <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            @for (store of filteredStores(); track store.id) {
              <button
                type="button"
                (click)="focusOnStore(store)"
                class="w-full text-start p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs block"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    {{ lang() === 'ar' ? store.nameAr : store.nameEn }}
                  </h4>
                  <span class="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                    ★ {{ store.rating }}
                  </span>
                </div>

                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {{ lang() === 'ar' ? store.addressAr : store.addressEn }}
                </p>

                <div class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                  🎁 {{ lang() === 'ar' ? store.specialDealsAr : store.specialDealsEn }}
                </div>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class MapsView implements OnInit, OnDestroy {
  readonly items = input.required<ChecklistItem[]>();
  readonly lang = input<'ar' | 'en'>('ar');
  readonly itemUpdated = output<ChecklistItem>();

  readonly stores = APPLIANCE_STORES;
  readonly brands = ['B.Tech', 'Elaraby', 'Carrefour', 'Fresh', 'LG', 'Raneen'];
  readonly selectedBrand = signal<string>('ALL');

  readonly quotaExceeded = signal<boolean>(false);
  readonly activeStore = signal<ApplianceStore | null>(null);

  readonly selectedItemId = signal<string>('');
  readonly assignStoreId = signal<string>('');

  mapCenter: google.maps.LatLngLiteral = { lat: 30.0444, lng: 31.2357 }; // Cairo
  mapZoom = 11;
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  };

  private quotaListener = () => {
    this.quotaExceeded.set(true);
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('gmp-quota-exceeded', this.quotaListener);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('gmp-quota-exceeded', this.quotaListener);
    }
  }

  filteredStores(): ApplianceStore[] {
    const brand = this.selectedBrand();
    if (brand === 'ALL') {
      return this.stores;
    }
    return this.stores.filter(s => s.brand === brand);
  }

  openInfoWindow(marker: MapMarker, store: ApplianceStore): void {
    this.activeStore.set(store);
  }

  focusOnStore(store: ApplianceStore): void {
    this.mapCenter = store.position;
    this.mapZoom = 14;
    this.activeStore.set(store);
  }

  onSelectItem(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedItemId.set(val);
  }

  onSelectStore(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.assignStoreId.set(val);
  }

  applyStoreToItem(): void {
    const itemId = this.selectedItemId();
    const storeId = this.assignStoreId();
    if (!itemId || !storeId) return;

    const item = this.items().find(i => i.id === itemId);
    const store = this.stores.find(s => s.id === storeId);
    if (!item || !store) return;

    const updated: ChecklistItem = {
      ...item,
      storeName: this.lang() === 'ar' ? store.nameAr : store.nameEn,
      myNotes: item.myNotes ? `${item.myNotes} [المعرض: ${store.nameAr}]` : `[المعرض المختار: ${store.nameAr} - ${store.addressAr}]`,
      updatedAt: new Date().toISOString()
    };

    this.itemUpdated.emit(updated);
  }
}
