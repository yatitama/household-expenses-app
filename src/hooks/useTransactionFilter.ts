import { useState, useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { transactionService, categoryService, savedFilterService } from '../services/storage';
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
});

export const useTransactionFilter = () => {
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => savedFilterService.getAll());
  const allTransactions = transactionService.getAll();
  const categories = categoryService.getAll();

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.categoryIds.length > 0) count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.accountIds.length > 0) count++;
    if (filters.paymentMethodIds.length > 0) count++;
    if (filters.unsettled) count++;
    return count;
  }, [filters]);

  const saveFilter = useCallback((name: string) => {
    savedFilterService.create({
      name,
      searchQuery: filters.searchQuery,
      dateRange: filters.dateRange,
      categoryIds: filters.categoryIds,
      transactionType: filters.transactionType,
      accountIds: filters.accountIds,
      paymentMethodIds: filters.paymentMethodIds,
      unsettled: filters.unsettled,
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
    });
  }, []);

  const deleteSavedFilter = useCallback((filterId: string) => {
    savedFilterService.delete(filterId);
    setSavedFilters(savedFilterService.getAll());
  }, []);

  const updateSavedFilter = useCallback((filterId: string, name: string) => {
    savedFilterService.update(filterId, { name });
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
