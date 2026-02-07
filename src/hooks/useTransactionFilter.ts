import { useState, useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { transactionService, categoryService } from '../services/storage';

export interface FilterOptions {
  searchQuery: string;
  dateRange: { start: string; end: string };
  memberIds: string[];
  categoryIds: string[];
  transactionType: 'all' | 'income' | 'expense';
  accountIds: string[];
  paymentMethodIds: string[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

const createDefaultFilters = (): FilterOptions => ({
  searchQuery: '',
  dateRange: { start: '', end: '' },
  memberIds: [],
  categoryIds: [],
  transactionType: 'all',
  accountIds: [],
  paymentMethodIds: [],
  sortBy: 'date',
  sortOrder: 'desc',
});

export const useTransactionFilter = () => {
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters);
  const [refreshKey, setRefreshKey] = useState(0);

  const allTransactions = useMemo(() => transactionService.getAll(), [refreshKey]);
  const categories = useMemo(() => categoryService.getAll(), [refreshKey]);

  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Search query filter (memo and amount)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((t) => {
        if (t.memo && t.memo.toLowerCase().includes(query)) return true;
        if (String(t.amount).includes(query)) return true;
        const cat = categories.find((c) => c.id === t.categoryId);
        if (cat && cat.name.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // Date range filter
    if (filters.dateRange.start) {
      const start = parseISO(filters.dateRange.start);
      result = result.filter((t) => parseISO(t.date) >= start);
    }
    if (filters.dateRange.end) {
      const end = parseISO(filters.dateRange.end);
      result = result.filter((t) => parseISO(t.date) <= end);
    }

    // Member filter (via category membership)
    if (filters.memberIds.length > 0) {
      const memberCategoryIds = categories
        .filter((c) => filters.memberIds.includes(c.memberId))
        .map((c) => c.id);
      result = result.filter((t) => memberCategoryIds.includes(t.categoryId));
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      result = result.filter((t) => filters.categoryIds.includes(t.categoryId));
    }

    // Transaction type filter
    if (filters.transactionType !== 'all') {
      result = result.filter((t) => t.type === filters.transactionType);
    }

    // Account filter
    if (filters.accountIds.length > 0) {
      result = result.filter((t) => filters.accountIds.includes(t.accountId));
    }

    // Payment method filter
    if (filters.paymentMethodIds.length > 0) {
      result = result.filter((t) => t.paymentMethodId && filters.paymentMethodIds.includes(t.paymentMethodId));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category': {
          const catA = categories.find((c) => c.id === a.categoryId)?.name || '';
          const catB = categories.find((c) => c.id === b.categoryId)?.name || '';
          comparison = catA.localeCompare(catB);
          break;
        }
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allTransactions, filters, categories]);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const refreshTransactions = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.memberIds.length > 0) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.accountIds.length > 0) count++;
    if (filters.paymentMethodIds.length > 0) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredTransactions,
    updateFilter,
    resetFilters,
    activeFilterCount,
    refreshTransactions,
  };
};
