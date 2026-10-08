import { BillInstance, Income, CurrencyCode } from '../types';
import { formatYMD, parseYMD, clampDayToMonth, getDaysUntil } from './recurrence';

export interface UpcomingIncomeEvent {
  incomeId: string;
  source: string;
  category?: string;
  amount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD
  daysUntil: number;
  payDay: number;
  frequency: string;
}

export interface CashFlowCrunchItem {
  bill: BillInstance;
  dueDate: string;
  daysUntilBill: number;
  nextIncomeDate: string;
  daysUntilIncome: number;
  incomeSource: string;
  incomeCategory?: string;
  incomeAmount: number;
  incomeCurrency: CurrencyCode;
  daysDifference: number; // how many days the income arrives AFTER the bill deadline
  suggestedPostponeDate: string; // recommended date (typically incomeDate + 1 day)
  alternativeDates: Array<{
    label: string;
    date: string;
    description: string;
    isRecommended?: boolean;
  }>;
  severity: 'critical' | 'high' | 'medium';
}

export interface CashFlowCrunchSummary {
  hasCrunch: boolean;
  crunchBills: CashFlowCrunchItem[];
  totalCrunchAmount: number;
  currency: CurrencyCode;
  nextIncome: UpcomingIncomeEvent | null;
  earliestCrunchBill: CashFlowCrunchItem | null;
  activeIncomesCount: number;
}

/**
 * Helper to add days to a YYYY-MM-DD string without timezone skew
 */
export function addDaysToYMD(dateStr: string, daysToAdd: number): string {
  const { year, month, day } = parseYMD(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return formatYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Calculates upcoming income dates for all active user income sources.
 */
export function calculateUpcomingIncomes(
  incomes: Income[],
  referenceDate: Date = new Date()
): UpcomingIncomeEvent[] {
  if (!incomes || incomes.length === 0) return [];

  const todayStr = formatYMD(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    referenceDate.getDate()
  );
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;

  const events: UpcomingIncomeEvent[] = [];

  for (const inc of incomes) {
    if (inc.amount <= 0) continue;

    // Determine payDay default if not specified
    let payDay = inc.payDay;
    if (!payDay || payDay < 1 || payDay > 31) {
      if (inc.frequency === 'biweekly') {
        payDay = 15;
      } else {
        // Standard salary default in Argentina / LatAm: 10th of month
        payDay = 10;
      }
    }

    if (inc.frequency === 'biweekly') {
      // Biweekly has two paydays per month: typically 15th and end of month (e.g. 30th)
      const payDays = [15, 30];
      for (const pd of payDays) {
        // This month
        const validDayThis = clampDayToMonth(refYear, refMonth, pd);
        const dateThis = formatYMD(refYear, refMonth, validDayThis);
        if (dateThis >= todayStr) {
          events.push({
            incomeId: inc.id,
            source: `${inc.source} (Quincena ${pd === 15 ? '1' : '2'})`,
            category: inc.category,
            amount: inc.amount / 2,
            currency: inc.currency,
            date: dateThis,
            daysUntil: getDaysUntil(dateThis),
            payDay: pd,
            frequency: inc.frequency,
          });
        }

        // Next month
        let nextY = refYear;
        let nextM = refMonth + 1;
        if (nextM > 12) {
          nextM = 1;
          nextY += 1;
        }
        const validDayNext = clampDayToMonth(nextY, nextM, pd);
        const dateNext = formatYMD(nextY, nextM, validDayNext);
        events.push({
          incomeId: inc.id,
          source: `${inc.source} (Quincena ${pd === 15 ? '1' : '2'})`,
          category: inc.category,
          amount: inc.amount / 2,
          currency: inc.currency,
          date: dateNext,
          daysUntil: getDaysUntil(dateNext),
          payDay: pd,
          frequency: inc.frequency,
        });
      }
    } else {
      // Monthly or occasional
      const validDayThis = clampDayToMonth(refYear, refMonth, payDay);
      const dateThis = formatYMD(refYear, refMonth, validDayThis);

      if (dateThis >= todayStr) {
        events.push({
          incomeId: inc.id,
          source: inc.source,
          category: inc.category,
          amount: inc.amount,
          currency: inc.currency,
          date: dateThis,
          daysUntil: getDaysUntil(dateThis),
          payDay,
          frequency: inc.frequency,
        });
      }

      // Next month occurrence
      let nextY = refYear;
      let nextM = refMonth + 1;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      const validDayNext = clampDayToMonth(nextY, nextM, payDay);
      const dateNext = formatYMD(nextY, nextM, validDayNext);
      events.push({
        incomeId: inc.id,
        source: inc.source,
        category: inc.category,
        amount: inc.amount,
        currency: inc.currency,
        date: dateNext,
        daysUntil: getDaysUntil(dateNext),
        payDay,
        frequency: inc.frequency,
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/**
 * Detects cash flow crunches: bills that fall due BEFORE the user's next income deposit.
 */
export function analyzeCashFlowCrunch(
  bills: BillInstance[],
  incomes: Income[],
  referenceDate: Date = new Date()
): CashFlowCrunchSummary {
  const todayStr = formatYMD(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    referenceDate.getDate()
  );

  const upcomingIncomes = calculateUpcomingIncomes(incomes, referenceDate);
  const nextIncome = upcomingIncomes.length > 0 ? upcomingIncomes[0] : null;

  if (!nextIncome) {
    return {
      hasCrunch: false,
      crunchBills: [],
      totalCrunchAmount: 0,
      currency: 'ARS',
      nextIncome: null,
      earliestCrunchBill: null,
      activeIncomesCount: incomes.length,
    };
  }

  // Filter pending / upcoming bills
  const pendingBills = bills.filter(
    (b) => b.status === 'pending' || b.status === 'upcoming'
  );

  const crunchBills: CashFlowCrunchItem[] = [];
  let totalCrunchAmount = 0;
  let detectedCurrency = nextIncome.currency;

  for (const bill of pendingBills) {
    // Only check bills that are due BEFORE the next income date
    // (i.e. bill.dueDate < nextIncome.date)
    // AND either due today/future OR overdue recently (within last 30 days)
    const daysUntilBill = getDaysUntil(bill.dueDate);
    const daysUntilIncome = nextIncome.daysUntil;

    // If bill deadline is before next income date
    if (bill.dueDate < nextIncome.date) {
      // Days difference: how many days income is after the bill deadline
      const { year: by, month: bm, day: bd } = parseYMD(bill.dueDate);
      const { year: iy, month: im, day: id } = parseYMD(nextIncome.date);
      const billUtc = Date.UTC(by, bm - 1, bd);
      const incUtc = Date.UTC(iy, im - 1, id);
      const daysDiff = Math.max(1, Math.round((incUtc - billUtc) / (1000 * 60 * 60 * 24)));

      // Suggested postponement dates
      // Option 1: 1 day after income (Recommended - allows funds clearing)
      const datePlus1 = addDaysToYMD(nextIncome.date, 1);
      // Option 2: Same day as income
      const dateSameDay = nextIncome.date;
      // Option 3: +3 days after income (generous safety margin)
      const datePlus3 = addDaysToYMD(nextIncome.date, 3);
      // Option 4: +5 days (2do vencimiento window)
      const datePlus5 = addDaysToYMD(nextIncome.date, 5);

      const alternativeDates = [
        {
          label: '1 día después del cobro (Recomendado)',
          date: datePlus1,
          description: 'Margen ideal para esperar la acreditación bancaria.',
          isRecommended: true,
        },
        {
          label: 'El mismo día de cobro',
          date: dateSameDay,
          description: 'Pagar apenas se acredite tu ingreso.',
          isRecommended: false,
        },
        {
          label: '+3 días de resguardo',
          date: datePlus3,
          description: 'Buffer adicional para evitar demoras de transferencia.',
          isRecommended: false,
        },
        {
          label: '+5 días (2° vencimiento)',
          date: datePlus5,
          description: 'Prórroga habitual antes de cualquier suspensión de servicio.',
          isRecommended: false,
        },
      ];

      // Severity calculation
      let severity: 'critical' | 'high' | 'medium' = 'medium';
      if (daysUntilBill <= 0) {
        severity = 'critical'; // Already overdue or due today!
      } else if (daysUntilBill <= 3) {
        severity = 'high'; // Due in next 72 hours
      }

      const billAmount = bill.isShared ? (bill.myShareAmount ?? bill.estimatedAmount) : bill.estimatedAmount;

      crunchBills.push({
        bill,
        dueDate: bill.dueDate,
        daysUntilBill,
        nextIncomeDate: nextIncome.date,
        daysUntilIncome,
        incomeSource: nextIncome.source,
        incomeCategory: nextIncome.category,
        incomeAmount: nextIncome.amount,
        incomeCurrency: nextIncome.currency,
        daysDifference: daysDiff,
        suggestedPostponeDate: datePlus1,
        alternativeDates,
        severity,
      });

      totalCrunchAmount += billAmount;
      detectedCurrency = bill.currency || nextIncome.currency;
    }
  }

  // Sort by urgency: earliest due date first
  crunchBills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    hasCrunch: crunchBills.length > 0,
    crunchBills,
    totalCrunchAmount,
    currency: detectedCurrency,
    nextIncome,
    earliestCrunchBill: crunchBills.length > 0 ? crunchBills[0] : null,
    activeIncomesCount: incomes.length,
  };
}
