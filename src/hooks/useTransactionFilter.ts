import { useState, useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { transactionService, categoryService, savedFilterService, paymentMethodService } from '../services/storage';
import type { SavedFilter } from '../types';

export interface FilterOptions {
  searchQuery: string;
  dateRange: { start: string; end: string };
  categoryIds: string[];
  transactionType: 'all' | 'income' | 'expense';
  accountIds: string[];
  paymentMethodIds: string[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  unsettled: boolean;
  /** 引落口座IDでOR絞り込み。カード取引はlinkedAccountId、直接取引はaccountIdで判定 */
  settlementAccountIds: string[];
}

const createDefaultFilters = (): FilterOptions => ({
  searchQuery: '',
  dateRange: { start: '', end: '' },
  categoryIds: [],
  transactionType: 'all',
  accountIds: [],
  paymentMethodIds: [],
  sortBy: 'date',
  sortOrder: 'desc',
  unsettled: false,
  settlementAccountIds: [],
});

export const useTransactionFilter = () => {
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => savedFilterService.getAll());
  const allTransactions = transactionService.getAll();
  const categories = categoryService.getAll();

  const allPaymentMethods = paymentMethodService.getAll();

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

    // Unsettled filter (only payment method transactions without settledAt)
    if (filters.unsettled) {
      result = result.filter((t) => t.paymentMethodId && !t.settledAt);
    }

    // Settlement account filter (OR logic: card → linkedAccountId, direct → accountId)
    if (filters.settlementAccountIds.length > 0) {
      result = result.filter((t) => {
        const settlementAccId = t.paymentMethodId
          ? (allPaymentMethods.find((p) => p.id === t.paymentMethodId)?.linkedAccountId ?? t.accountId)
          : t.accountId;
        return filters.settlementAccountIds.includes(settlementAccId);
      });
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
  }, [allTransactions, filters, categories, allPaymentMethods]);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.accountIds.length > 0) count++;
    if (filters.paymentMethodIds.length > 0) count++;
    if (filters.unsettled) count++;
    if (filters.settlementAccountIds.length > 0) count++;
    return count;
  }, [filters]);

  const saveFilter = useCallback((name: string, filterOptions?: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => {
    const opts = filterOptions ?? filters;
    savedFilterService.create({
      name,
      searchQuery: opts.searchQuery,
      dateRange: opts.dateRange,
      categoryIds: opts.categoryIds,
      transactionType: opts.transactionType,
      accountIds: opts.accountIds,
      paymentMethodIds: opts.paymentMethodIds,
      unsettled: opts.unsettled,
    });
    setSavedFilters(savedFilterService.getAll());
  }, [filters]);

  const applySavedFilter = useCallback((filterId: string) => {
    const savedFilter = savedFilterService.getById(filterId);
    if (!savedFilter) return;
    setFilters({
      searchQuery: savedFilter.searchQuery,
      dateRange: savedFilter.dateRange,
      categoryIds: savedFilter.categoryIds,
      transactionType: savedFilter.transactionType,
      accountIds: savedFilter.accountIds,
      paymentMethodIds: savedFilter.paymentMethodIds,
      sortBy: 'date',
      sortOrder: 'desc',
      unsettled: savedFilter.unsettled,
      settlementAccountIds: [],
    });
  }, []);

  const deleteSavedFilter = useCallback((filterId: string) => {
    savedFilterService.delete(filterId);
    setSavedFilters(savedFilterService.getAll());
  }, []);

  const updateSavedFilter = useCallback((filterId: string, name: string, filterOptions?: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => {
    const updateData: Record<string, unknown> = { name };
    if (filterOptions) {
      updateData.searchQuery = filterOptions.searchQuery;
      updateData.dateRange = filterOptions.dateRange;
      updateData.categoryIds = filterOptions.categoryIds;
      updateData.transactionType = filterOptions.transactionType;
      updateData.accountIds = filterOptions.accountIds;
      updateData.paymentMethodIds = filterOptions.paymentMethodIds;
      updateData.unsettled = filterOptions.unsettled;
    }
    savedFilterService.update(filterId, updateData);
    setSavedFilters(savedFilterService.getAll());
  }, []);

  return {
    filters,
    filteredTransactions,
    updateFilter,
    resetFilters,
    activeFilterCount,
    savedFilters,
    saveFilter,
    applySavedFilter,
    deleteSavedFilter,
    updateSavedFilter,
  };
};
