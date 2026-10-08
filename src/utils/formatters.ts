import { AccountFrequency, CurrencyCode } from '../types';

/**
 * Formats monetary amounts strictly as:
 * ARS 125.000,00
 * USD 25,00
 * EUR 25,00
 */
export function formatCurrency(amount: number | undefined | null, currency: CurrencyCode = 'ARS'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0,00`;
  }

  // Format with Argentine number notation (dots for thousands, comma for decimals)
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency} ${formatted}`;
}

export function formatDateAr(dateString?: string): string {
  if (!dateString) return '-';
  // If YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatMonthName(yearMonth: string): string {
  // input: "YYYY-MM"
  const [year, month] = yearMonth.split('-');
  if (!year || !month) return yearMonth;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const name = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function calculateMonthlyEquivalent(amount: number, frequency: AccountFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'bimonthly':
      return amount / 2;
    case 'quarterly':
      return amount / 3;
    case 'semiannual':
      return amount / 6;
    case 'annual':
      return amount / 12;
    case 'custom':
    default:
      return amount;
  }
}

export function calculateAnnualCost(amount: number, frequency: AccountFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'bimonthly':
      return amount * 6;
    case 'quarterly':
      return amount * 4;
    case 'semiannual':
      return amount * 2;
    case 'annual':
      return amount;
    case 'custom':
    default:
      return amount * 12;
  }
}

export function calculatePriceVariation(currentAmount: number, previousAmount?: number): {
  diff: number;
  percentage: number;
  isIncrease: boolean;
  isSignificant: boolean; // > 15%
} | null {
  if (!previousAmount || previousAmount <= 0) return null;
  const diff = currentAmount - previousAmount;
  const percentage = (diff / previousAmount) * 100;
  return {
    diff,
    percentage: Math.round(percentage * 10) / 10,
    isIncrease: diff > 0,
    isSignificant: percentage >= 15,
  };
}
