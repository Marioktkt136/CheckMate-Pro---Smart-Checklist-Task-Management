export type ItemStatus = 'pending' | 'comparing' | 'purchased' | 'delivered';
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface ChecklistItem {
  id: string;
  itemNumber: number;
  folderId: string;
  category: string;
  titleAr: string;
  titleEn: string;
  notes: string;
  myNotes: string;
  status: ItemStatus;
  priority: ItemPriority;
  tags: string[];
  estimatedCost: number;
  actualCost: number;
  currency: string;
  targetDate?: string;
  storeName?: string;
  storeAddress?: string;
  assignee?: {
    name: string;
    avatar: string;
    email: string;
    role: UserRole;
  };
  attachments?: {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'doc';
    url?: string;
    date: string;
  }[];
  comments?: {
    id: string;
    userName: string;
    text: string;
    timestamp: string;
    avatar?: string;
  }[];
  reminderSet?: boolean;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFolder {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  budget: number;
}

export interface ChecklistStats {
  total: number;
  completed: number;
  pending: number;
  comparing: number;
  delivered: number;
  percent: number;
  totalEstimated: number;
  totalActual: number;
  budgetRemaining: number;
  byCategory: Record<string, { total: number; completed: number; cost: number }>;
  byPriority: Record<ItemPriority, number>;
}

export function calculateChecklistStats(items: ChecklistItem[], folderBudget = 0): ChecklistStats {
  const total = items.length;
  let completed = 0;
  let pending = 0;
  let comparing = 0;
  let delivered = 0;
  let totalEstimated = 0;
  let totalActual = 0;

  const byCategory: Record<string, { total: number; completed: number; cost: number }> = {};
  const byPriority: Record<ItemPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const item of items) {
    if (item.status === 'purchased') {
      completed++;
    } else if (item.status === 'delivered') {
      completed++;
      delivered++;
    } else if (item.status === 'comparing') {
      comparing++;
    } else {
      pending++;
    }

    totalEstimated += item.estimatedCost || 0;
    totalActual += item.actualCost || 0;

    // Category breakdown
    const cat = item.category || 'عام';
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, completed: 0, cost: 0 };
    }
    byCategory[cat].total++;
    if (item.status === 'purchased' || item.status === 'delivered') {
      byCategory[cat].completed++;
    }
    byCategory[cat].cost += item.actualCost || item.estimatedCost || 0;

    // Priority breakdown
    if (item.priority && byPriority[item.priority] !== undefined) {
      byPriority[item.priority]++;
    }
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const budgetRemaining = folderBudget > 0 ? folderBudget - totalActual : 0;

  return {
    total,
    completed,
    pending,
    comparing,
    delivered,
    percent,
    totalEstimated,
    totalActual,
    budgetRemaining,
    byCategory,
    byPriority,
  };
}

export interface FilterOptions {
  searchQuery?: string;
  folderId?: string;
  category?: string;
  status?: string;
  priority?: string;
  tag?: string;
  sortBy?: 'number' | 'title' | 'priority' | 'cost' | 'status' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export function filterAndSortItems(
  items: ChecklistItem[],
  filters: FilterOptions,
  lang: 'ar' | 'en' = 'ar'
): ChecklistItem[] {
  let result = items.slice();

  if (filters.folderId && filters.folderId !== 'all') {
    result = result.filter(item => item.folderId === filters.folderId);
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter(item => item.category === filters.category);
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter(item => item.status === filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    result = result.filter(item => item.priority === filters.priority);
  }

  if (filters.tag && filters.tag !== 'all') {
    result = result.filter(item => item.tags && item.tags.includes(filters.tag!));
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.trim().toLowerCase();
    result = result.filter(item =>
      (item.titleAr && item.titleAr.toLowerCase().includes(q)) ||
      (item.titleEn && item.titleEn.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.myNotes && item.myNotes.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  const priorityWeight: Record<ItemPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortOrderFactor = filters.sortOrder === 'desc' ? -1 : 1;

  result.sort((a, b) => {
    switch (filters.sortBy) {
      case 'title': {
        const titleA = lang === 'ar' ? a.titleAr : a.titleEn;
        const titleB = lang === 'ar' ? b.titleAr : b.titleEn;
        return titleA.localeCompare(titleB) * sortOrderFactor;
      }
      case 'priority': {
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        return (weightA - weightB) * sortOrderFactor;
      }
      case 'cost': {
        const costA = a.actualCost || a.estimatedCost || 0;
        const costB = b.actualCost || b.estimatedCost || 0;
        return (costA - costB) * sortOrderFactor;
      }
      case 'status': {
        return a.status.localeCompare(b.status) * sortOrderFactor;
      }
      case 'date': {
        const dateA = a.targetDate || '';
        const dateB = b.targetDate || '';
        return dateA.localeCompare(dateB) * sortOrderFactor;
      }
      case 'number':
      default: {
        return (a.itemNumber - b.itemNumber) * sortOrderFactor;
      }
    }
  });

  return result;
}

export function generateCsvExport(items: ChecklistItem[], lang: 'ar' | 'en' = 'ar'): string {
  const isAr = lang === 'ar';
  const headers = isAr
    ? ['م', 'المجموعة', 'الصنف', 'الملاحظات', 'الحالة', 'ملاحظاتي', 'الأولوية', 'التكلفة المقدرة', 'التكلفة الفعلية', 'تاريخ الشراء المستهدف']
    : ['No.', 'Category', 'Item', 'Notes', 'Status', 'My Notes', 'Priority', 'Estimated Cost', 'Actual Cost', 'Target Date'];

  const statusMapAr: Record<ItemStatus, string> = {
    pending: '⬜ لسه',
    comparing: '⏳ قيد المقارنة',
    purchased: '✅ تم الشراء',
    delivered: '🚚 تم التوصيل',
  };

  const statusMapEn: Record<ItemStatus, string> = {
    pending: 'Pending',
    comparing: 'Comparing',
    purchased: 'Purchased',
    delivered: 'Delivered',
  };

  const rows = items.map(item => {
    const statusText = isAr ? statusMapAr[item.status] : statusMapEn[item.status];
    const title = isAr ? item.titleAr : item.titleEn;
    const cols = [
      item.itemNumber,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${title.replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${statusText}"`,
      `"${(item.myNotes || '').replace(/"/g, '""')}"`,
      `"${item.priority}"`,
      item.estimatedCost || 0,
      item.actualCost || 0,
      item.targetDate || '',
    ];
    return cols.join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel displays Arabic text properly
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

export function createGoogleCalendarUrl(item: ChecklistItem, lang: 'ar' | 'en' = 'ar'): string {
  const isAr = lang === 'ar';
  const title = encodeURIComponent(
    isAr ? `شراء/استلام: ${item.titleAr} (${item.category})` : `Purchase/Delivery: ${item.titleEn} (${item.category})`
  );
  const details = encodeURIComponent(
    isAr
      ? `ملاحظات: ${item.notes || '-'}\nملاحظاتي: ${item.myNotes || '-'}\nالتكلفة: ${item.estimatedCost || 0} ${item.currency}`
      : `Notes: ${item.notes || '-'}\nMy Notes: ${item.myNotes || '-'}\nCost: ${item.estimatedCost || 0} ${item.currency}`
  );

  let dateParam = '';
  if (item.targetDate) {
    const cleanDate = item.targetDate.replace(/-/g, '');
    dateParam = `&dates=${cleanDate}T090000Z/${cleanDate}T100000Z`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dateParam}`;
}
