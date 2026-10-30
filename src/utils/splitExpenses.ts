import { Account, BillInstance } from '../types';

export interface SplitBreakdown {
  total: number;
  peopleCount: number;
  isEqual: boolean;
  shares: number[]; // Exact monetary share for each participant [user, person 2, person 3, ...]
  percentages: number[]; // Effective percentage for each participant
  myShareAmount: number; // Exact amount the current user pays
  mySharePercentage: number; // Exact percentage for user (e.g. 50, 33.3333..., 25)
  othersShareAmount: number; // Total amount to collect from all other participants
  perOtherShareAmount: number; // Amount each other person pays (for equal split)
}

/**
 * Calculates exact breakdown of a shared expense.
 * Guarantees that:
 * 1. For equal split among N people, every participant pays equal parts (adjusting only cents by rounding).
 *    No artificial differences like 33% vs 33.5% are assigned.
 * 2. The sum of all shares ALWAYS equals the total amount exactly: sum(shares) === total.
 */
export function calculateSplitBreakdown(
  totalAmount: number,
  isShared: boolean = false,
  splitTotalPeople: number = 2,
  splitType: 'equal' | 'custom' = 'equal',
  customMyPercentage?: number
): SplitBreakdown {
  const rawTotal = Number(totalAmount);
  const total = isNaN(rawTotal) || rawTotal < 0 ? 0 : Math.round(rawTotal * 100) / 100;

  if (!isShared || splitTotalPeople <= 1) {
    return {
      total,
      peopleCount: 1,
      isEqual: true,
      shares: [total],
      percentages: [100],
      myShareAmount: total,
      mySharePercentage: 100,
      othersShareAmount: 0,
      perOtherShareAmount: 0,
    };
  }

  const count = Math.max(2, Math.min(10, Math.round(Number(splitTotalPeople) || 2)));
  const totalCents = Math.round(total * 100);

  // Equal division
  if (splitType === 'equal') {
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents % count;

    // Distribute remainder cent-by-cent to ensure the sum equals totalCents exactly
    const shares: number[] = [];
    for (let i = 0; i < count; i++) {
      const cents = baseCents + (i < remainderCents ? 1 : 0);
      shares.push(cents / 100);
    }

    const exactPct = 100 / count;
    const percentages = shares.map((s) => (total > 0 ? (s / total) * 100 : exactPct));
    const myShareAmount = shares[0];
    const othersShareAmount = Math.round((total - myShareAmount) * 100) / 100;
    const perOtherShareAmount = shares.length > 1 ? shares[1] : 0;

    return {
      total,
      peopleCount: count,
      isEqual: true,
      shares,
      percentages,
      myShareAmount,
      mySharePercentage: exactPct,
      othersShareAmount,
      perOtherShareAmount,
    };
  }

  // Custom percentage division
  const rawMyPct = customMyPercentage !== undefined ? Number(customMyPercentage) : 100 / count;
  const myPct = Math.max(0, Math.min(100, isNaN(rawMyPct) ? 100 / count : rawMyPct));

  // Compute user's share in cents
  const myCents = Math.round((totalCents * myPct) / 100);
  const othersCents = Math.max(0, totalCents - myCents);
  const othersCount = count - 1;

  const shares: number[] = [myCents / 100];
  const percentages: number[] = [myPct];

  if (othersCount > 0) {
    const baseOtherCents = Math.floor(othersCents / othersCount);
    const remainderOtherCents = othersCents % othersCount;

    for (let i = 0; i < othersCount; i++) {
      const cents = baseOtherCents + (i < remainderOtherCents ? 1 : 0);
      const amt = cents / 100;
      shares.push(amt);
      percentages.push(total > 0 ? (amt / total) * 100 : (100 - myPct) / othersCount);
    }
  }

  const myShareAmount = shares[0];
  const othersShareAmount = Math.round((total - myShareAmount) * 100) / 100;
  const perOtherShareAmount = shares.length > 1 ? shares[1] : 0;

  return {
    total,
    peopleCount: count,
    isEqual: false,
    shares,
    percentages,
    myShareAmount,
    mySharePercentage: myPct,
    othersShareAmount,
    perOtherShareAmount,
  };
}

/**
 * Cleans and normalizes split parameters when creating or updating an account.
 * Prevents stale data from remaining when switching between shared and individual modes.
 */
export function cleanAccountSplitData<T extends Partial<Account>>(data: T): T {
  const isShared = !!data.isShared;

  if (!isShared) {
    return {
      ...data,
      isShared: false,
      splitType: 'equal',
      splitTotalPeople: 1,
      mySharePercentage: 100,
      splitNotes: '',
      sharedWith: '',
      participants: [],
    };
  }

  const splitTotalPeople = Math.max(2, Math.min(10, Math.round(Number(data.splitTotalPeople) || 2)));
  const splitType = data.splitType || (data.mySharePercentage !== undefined && Math.abs(data.mySharePercentage - (100 / splitTotalPeople)) > 0.5 ? 'custom' : 'equal');

  const mySharePercentage = splitType === 'equal'
    ? Math.round((100 / splitTotalPeople) * 100) / 100
    : Math.max(0, Math.min(100, Number(data.mySharePercentage ?? 50)));

  return {
    ...data,
    isShared: true,
    splitType,
    splitTotalPeople,
    mySharePercentage,
    splitNotes: (data.splitNotes || '').trim(),
    sharedWith: (data.splitNotes || '').trim(),
  };
}

/**
 * Returns a human-friendly string describing the split configuration for UI badges and cards.
 */
export function getSplitBadgeText(
  isShared?: boolean,
  splitTotalPeople?: number,
  mySharePercentage?: number,
  splitType?: 'equal' | 'custom'
): string {
  if (!isShared) return 'Individual';
  const count = Math.max(2, splitTotalPeople || 2);

  if (splitType === 'equal' || mySharePercentage === undefined || Math.abs(mySharePercentage - (100 / count)) < 0.6) {
    if (count === 2) return 'Dividida 50% c/u';
    if (count === 3) return 'Dividida 1/3 c/u (33,3%)';
    if (count === 4) return 'Dividida 1/4 c/u (25%)';
    return `Dividida en partes iguales (${count} pers.)`;
  }

  return `Dividida (${Math.round(mySharePercentage)}% tuyo)`;
}
