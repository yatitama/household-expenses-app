import { addDays, parseISO, isAfter, format } from 'date-fns';
import { calculateNextRecurringDate } from './billingUtils';
import type { RecurringPayment } from '../types';

export interface RecurringOccurrence {
  payment: RecurringPayment;
  date: string; // 'yyyy-MM-dd'
}

/**
 * 指定期間内に発生する定期取引の全発生日を計算して返す
 */
export function getRecurringOccurrencesInRange(
  payments: RecurringPayment[],
  rangeStart: string,
  rangeEnd: string
): RecurringOccurrence[] {
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  const results: RecurringOccurrence[] = [];

  for (const payment of payments) {
    if (!payment.isActive) continue;

    // rangeStart も含めるため1日前から検索開始
    let from = addDays(start, -1);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = calculateNextRecurringDate(payment, from);
      if (!next || isAfter(next, end)) break;
      results.push({ payment, date: format(next, 'yyyy-MM-dd') });
      from = next;
    }
  }

  return results;
}
