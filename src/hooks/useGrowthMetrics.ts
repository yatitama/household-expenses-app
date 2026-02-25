import { useMemo } from 'react';
import {
  calculateMonthSummary,
  calculateMonthOverMonthChange,
  calculateTrendData,
  detectAchievements,
  getLastNMonths,
  getPreviousMonth,
  type MonthSummary,
  type GrowthComparison,
  type Achievement,
  type TrendDataPoint,
} from '../utils/growthMetrics';

export interface UseGrowthMetricsReturn {
  currentMonthSummary: MonthSummary;
  previousMonthSummary: MonthSummary;
  comparison: GrowthComparison | null;
  achievements: Achievement[];
  trendData: TrendDataPoint[];
  months: string[];
}

/**
 * Custom hook for calculating growth metrics
 * Provides month-over-month comparison, trend data, and achievements
 */
export const useGrowthMetrics = (
  viewMonth: string,
  trendTimeRange: '3m' | '6m' | '12m' = '6m'
): UseGrowthMetricsReturn => {
  // Determine how many months to include based on time range
  const monthCount = useMemo(() => {
    const map = { '3m': 3, '6m': 6, '12m': 12 };
    return map[trendTimeRange];
  }, [trendTimeRange]);

  // Get list of months for trend
  const months = useMemo(
    () => getLastNMonths(viewMonth, monthCount),
    [viewMonth, monthCount]
  );

  // Calculate summaries for all months
  const summaries = useMemo(
    () => months.map((month) => calculateMonthSummary(month)),
    [months]
  );

  // Get current and previous month summaries
  const currentMonthSummary = useMemo(
    () => summaries[summaries.length - 1] || calculateMonthSummary(viewMonth),
    [summaries, viewMonth]
  );

  const previousMonthSummary = useMemo(
    () => calculateMonthSummary(getPreviousMonth(viewMonth)),
    [viewMonth]
  );

  // Calculate month-over-month comparison
  const comparison = useMemo(() => {
    if (!currentMonthSummary || !previousMonthSummary) return null;
    return calculateMonthOverMonthChange(currentMonthSummary, previousMonthSummary);
  }, [currentMonthSummary, previousMonthSummary]);

  // Calculate trend data for chart
  const trendData = useMemo(() => calculateTrendData(months), [months]);

  // Detect achievements
  const achievements = useMemo(
    () => detectAchievements(viewMonth, summaries),
    [viewMonth, summaries]
  );

  return {
    currentMonthSummary,
    previousMonthSummary,
    comparison,
    achievements,
    trendData,
    months,
  };
};
