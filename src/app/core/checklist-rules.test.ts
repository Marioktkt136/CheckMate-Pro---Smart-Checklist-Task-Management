import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateChecklistStats,
  filterAndSortItems,
  generateCsvExport,
  createGoogleCalendarUrl,
  generateSecureRandomPassword,
  createEmptyUserWorkspace,
  normalizeUiOptions,
  ChecklistItem
} from './checklist-rules';

const sampleItems: ChecklistItem[] = [
  {
    id: 'item-1',
    itemNumber: 1,
    folderId: 'home_appliances',
    category: 'الأجهزة الأساسية',
    titleAr: 'الثلاجة',
    titleEn: 'Refrigerator',
    notes: 'نوفروست',
    myNotes: 'شارب 450 لتر - بي تك',
    status: 'purchased',
    priority: 'urgent',
    tags: ['أساسي', 'مطبخ'],
    estimatedCost: 35000,
    actualCost: 34500,
    currency: 'EGP',
    targetDate: '2026-11-15',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-05',
  },
  {
    id: 'item-2',
    itemNumber: 2,
    folderId: 'home_appliances',
    category: 'الأجهزة الأساسية',
    titleAr: 'الغسالة',
    titleEn: 'Washing Machine',
    notes: 'أوتوماتيك',
    myNotes: '',
    status: 'comparing',
    priority: 'high',
    tags: ['أساسي'],
    estimatedCost: 24000,
    actualCost: 0,
    currency: 'EGP',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'item-3',
    itemNumber: 3,
    folderId: 'home_appliances',
    category: 'أجهزة المطبخ',
    titleAr: 'الخلاط',
    titleEn: 'Blender',
    notes: 'قوي',
    myNotes: '',
    status: 'pending',
    priority: 'medium',
    tags: ['مطبخ'],
    estimatedCost: 2500,
    actualCost: 0,
    currency: 'EGP',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  },
];

test('calculateChecklistStats computes correct metrics', () => {
  const stats = calculateChecklistStats(sampleItems, 100000);
  assert.equal(stats.total, 3);
  assert.equal(stats.completed, 1);
  assert.equal(stats.comparing, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.percent, 33);
  assert.equal(stats.totalEstimated, 61500);
  assert.equal(stats.totalActual, 34500);
  assert.equal(stats.budgetRemaining, 65500);
  assert.equal(stats.byCategory['الأجهزة الأساسية'].total, 2);
  assert.equal(stats.byCategory['الأجهزة الأساسية'].completed, 1);
  assert.equal(stats.byPriority['urgent'], 1);
});

test('filterAndSortItems filters by category and search text', () => {
  const filtered = filterAndSortItems(
    sampleItems,
    { category: 'الأجهزة الأساسية', searchQuery: 'شارب' },
    'ar'
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].titleAr, 'الثلاجة');

  const filteredEn = filterAndSortItems(
    sampleItems,
    { searchQuery: 'Blender' },
    'en'
  );
  assert.equal(filteredEn.length, 1);
  assert.equal(filteredEn[0].titleEn, 'Blender');
});

test('generateCsvExport produces UTF-8 BOM with proper columns', () => {
  const csv = generateCsvExport(sampleItems, 'ar');
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('الثلاجة'));
  assert.ok(csv.includes('الأجهزة الأساسية'));
  assert.ok(csv.includes('✅ تم الشراء'));
});

test('createGoogleCalendarUrl formats clean template URL', () => {
  const url = createGoogleCalendarUrl(sampleItems[0], 'ar');
  assert.ok(url.includes('calendar.google.com'));
  assert.ok(url.includes('20261115'));
});

test('generateSecureRandomPassword generates unique strong random passwords instead of password123', () => {
  const p1 = generateSecureRandomPassword(24);
  const p2 = generateSecureRandomPassword(24);
  assert.equal(p1.length, 24);
  assert.equal(p2.length, 24);
  assert.notEqual(p1, 'password123');
  assert.notEqual(p1, p2);
});

test('createEmptyUserWorkspace resets all collections to empty arrays and sets Light Mode, Arabic, and empty Active Project', () => {
  const empty = createEmptyUserWorkspace();
  assert.deepEqual(empty.items, []);
  assert.deepEqual(empty.categories, []);
  assert.deepEqual(empty.projects, []);
  assert.deepEqual(empty.notifications, []);
  assert.deepEqual(empty.mapLocations, []);
  assert.deepEqual(empty.aiChats, []);
  assert.equal(empty.uiOptions.darkMode, false);
  assert.equal(empty.uiOptions.language, 'ar');
  assert.equal(empty.uiOptions.activeProjectId, '');
});

test('normalizeUiOptions normalizes partial or missing UI options safely', () => {
  assert.deepEqual(normalizeUiOptions(null), {
    darkMode: false,
    language: 'ar',
    activeProjectId: '',
  });
  assert.deepEqual(normalizeUiOptions({ darkMode: true, language: 'en', activeProjectId: 'proj-1' }), {
    darkMode: true,
    language: 'en',
    activeProjectId: 'proj-1',
  });
});

