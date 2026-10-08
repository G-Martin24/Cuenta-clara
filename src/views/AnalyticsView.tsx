import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import { Account, BillInstance, CurrencyCode, Payment, Income, SavingsGoal } from '../types';
import {
  formatCurrency,
  calculateMonthlyEquivalent,
  calculateAnnualCost,
  calculatePriceVariation,
  formatMonthName,
} from '../utils/formatters';
import { exportMonthlyReportToPdf } from '../services/pdfExportService';

interface AnalyticsViewProps {
  accounts: Account[];
  bills: BillInstance[];
  payments: Payment[];
  incomes?: Income[];
  goals?: SavingsGoal[];
  defaultCurrency: CurrencyCode;
  userName?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  accounts,
  bills,
  payments,
  incomes = [],
  goals = [],
  defaultCurrency,
  userName = 'Usuario',
}) => {
  const now = new Date();
  const currentYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYMD);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Bills for selected month
  const monthBills = useMemo(() => {
    return bills.filter((b) => b.dueDate.startsWith(selectedMonth) && b.status !== 'upcoming');
  }, [bills, selectedMonth]);

  // Total projected monthly income
  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => {
      let monthly = inc.amount;
      if (inc.frequency === 'biweekly') monthly = inc.amount * 2;
      else if (inc.frequency === 'occasional') monthly = inc.amount / 3;
      return sum + monthly;
    }, 0);
  }, [incomes]);

  // Total active accounts monthly equivalent
  const totalMonthlyCommitted = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => sum + calculateMonthlyEquivalent(a.amount, a.frequency), 0);
  }, [accounts]);

  // Handle PDF Export
  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      const paidBills: Array<{
        accountName: string;
        category?: string;
        paidDate?: string;
        dueDate?: string;
        paymentMethod?: string;
        receiptNumber?: string;
        amount: number;
      }> = [];

      const pendingBills: Array<{
        accountName: string;
        category?: string;
        dueDate: string;
        status: string;
        amount: number;
      }> = [];

      monthBills.forEach((b) => {
        const amt = b.actualAmount ?? b.estimatedAmount;
        if (b.status === 'paid') {
          totalPaid += amt;
          paidBills.push({
            accountName: b.accountName,
            category: b.category,
            paidDate: b.paidDate,
            dueDate: b.dueDate,
            paymentMethod: b.paymentMethod,
            receiptNumber: b.receiptNumber,
            amount: amt,
          });
        } else {
          if (b.status === 'overdue') {
            totalOverdue += b.estimatedAmount;
          } else {
            totalPending += b.estimatedAmount;
          }
          pendingBills.push({
            accountName: b.accountName,
            category: b.category,
            dueDate: b.dueDate,
            status: b.status,
            amount: b.estimatedAmount,
          });
        }
      });

      const projectedSurplus = totalMonthlyIncome - totalMonthlyCommitted;
      const suggestedSavingsMonthly = projectedSurplus > 0 ? Math.round(projectedSurplus * 0.5) : 0;
      const suggestedSavingsDaily = projectedSurplus > 0 ? Math.round(suggestedSavingsMonthly / 30) : 0;

      exportMonthlyReportToPdf({
        userName,
        monthKey: selectedMonth,
        monthLabel: formatMonthName(selectedMonth),
        currency: defaultCurrency,
        totalIncome: totalMonthlyIncome,
        totalPaid,
        totalPending,
        totalOverdue,
        totalCommitted: totalMonthlyCommitted,
        projectedSurplus,
        suggestedSavingsMonthly,
        suggestedSavingsDaily,
        paidBills,
        pendingBills,
        savingsGoals: goals.map((g) => ({
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          monthlyContribution: g.monthlyContribution,
        })),
      });
    } catch (err) {
      console.error('Error exportando PDF desde Analíticas:', err);
    } finally {
      setTimeout(() => setExportingPdf(false), 600);
    }
  };
  // 1. Fixed vs Variable breakdown
  const { fixedTotal, variableTotal, fixedPct, variablePct } = useMemo(() => {
    let fix = 0;
    let vari = 0;
    accounts.forEach((acc) => {
      if (acc.status === 'active') {
        const m = calculateMonthlyEquivalent(acc.amount, acc.frequency);
        if (acc.amountType === 'fixed') fix += m;
        else vari += m;
      }
    });
    const total = fix + vari;
    return {
      fixedTotal: fix,
      variableTotal: vari,
      fixedPct: total > 0 ? Math.round((fix / total) * 100) : 0,
      variablePct: total > 0 ? Math.round((vari / total) * 100) : 0,
    };
  }, [accounts]);

  // 2. Ranking of most expensive accounts (by monthly equivalent)
  const topExpensiveAccounts = useMemo(() => {
    return [...accounts]
      .filter((a) => a.status === 'active')
      .map((a) => ({
        ...a,
        monthlyEq: calculateMonthlyEquivalent(a.amount, a.frequency),
      }))
      .sort((a, b) => b.monthlyEq - a.monthlyEq)
      .slice(0, 5);
  }, [accounts]);

  // 3. Accounts with major price increases (>15%)
  const priceHikeAccounts = useMemo(() => {
    return accounts
      .map((a) => {
        const v = calculatePriceVariation(a.lastAmount || a.amount, a.previousAmount);
        return { account: a, variation: v };
      })
      .filter((item) => item.variation && item.variation.isIncrease)
      .sort((a, b) => (b.variation?.percentage || 0) - (a.variation?.percentage || 0));
  }, [accounts]);

  // 4. Breakdown by Category (monthly equivalent)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    let totalAll = 0;

    accounts.forEach((acc) => {
      if (acc.status === 'active') {
        const m = calculateMonthlyEquivalent(acc.amount, acc.frequency);
        map[acc.category] = (map[acc.category] || 0) + m;
        totalAll += m;
      }
    });

    return Object.entries(map)
      .map(([name, total]) => ({
        name,
        total,
        pct: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [accounts]);

  // 5. Next 12 months financial projection
  const next12MonthsProjection = useMemo(() => {
    const months: Array<{ monthKey: string; total: number }> = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const sum = bills
        .filter((b) => b.dueDate.startsWith(mKey) && b.status !== 'cancelled' && b.status !== 'skipped')
        .reduce((acc, b) => acc + (b.actualAmount ?? b.estimatedAmount), 0);

      months.push({ monthKey: mKey, total: sum });
    }

    const maxVal = Math.max(...months.map((m) => m.total), 1);
    return { months, maxVal };
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Title & PDF Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Análisis Financiero y Métricas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Conocé a fondo cómo se componen tus gastos fijos, variables y proyecciones a 12 meses.
          </p>
        </div>

        {/* Month Picker Controls & PDF Export */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
              {formatMonthName(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Generar y descargar informe PDF del mes seleccionado"
          >
            <FileDown className="w-4 h-4" />
            <span>{exportingPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
          </button>
        </div>
      </div>

      {/* Fixed vs Variable Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Estructura de Gastos: Fijos vs Variables
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Por mes equivalente</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-teal-600 h-full transition-all"
            style={{ width: `${fixedPct}%` }}
            title={`Gastos Fijos: ${fixedPct}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${variablePct}%` }}
            title={`Gastos Variables: ${variablePct}%`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-start gap-2.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Gastos Fijos: {fixedPct}%
              </p>
              <p className="text-slate-500 mt-0.5">
                {formatCurrency(fixedTotal, defaultCurrency)} / mes (Alquiler, abonos, suscripciones)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Gastos Variables: {variablePct}%
              </p>
              <p className="text-slate-500 mt-0.5">
                {formatCurrency(variableTotal, defaultCurrency)} / mes (Luz, gas, agua, impuestos por consumo)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Top Expensive & Price Hikes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expensive Accounts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Servicios de mayor impacto mensual</span>
          </h2>

          <div className="space-y-3">
            {topExpensiveAccounts.length === 0 ? (
              <p className="text-xs text-slate-400">No hay cuentas registradas aún.</p>
            ) : (
              topExpensiveAccounts.map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{a.name}</p>
                      <p className="text-[11px] text-slate-500">{a.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {formatCurrency(a.monthlyEq, a.currency)}
                    </p>
                    <span className="text-[10px] text-slate-400">mensual equiv.</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Price Hikes / Increases */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Historial de aumentos detectados</span>
          </h2>

          <div className="space-y-3">
            {priceHikeAccounts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No se registraron aumentos significativos en las últimas modificaciones de pagos.
              </div>
            ) : (
              priceHikeAccounts.map(({ account, variation }) => (
                <div
                  key={account.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    variation?.isSignificant
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {account.name}
                      </p>
                      {variation?.isSignificant && (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-200 dark:bg-rose-900/60 px-1.5 py-0.2 rounded">
                          +15% Alerta
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Anterior: {formatCurrency(account.previousAmount, account.currency)} → Actual:{' '}
                      {formatCurrency(account.lastAmount, account.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-rose-600 dark:text-rose-400">
                      +{variation?.percentage}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 12 Months Projection Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Proyección de Compromisos para los Próximos 12 Meses</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Basado en tus recurrencias</span>
        </div>

        {/* Bar chart representation */}
        <div className="pt-4 grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-48 border-b border-slate-200 dark:border-slate-800 pb-2">
          {next12MonthsProjection.months.map((m) => {
            const heightPct = Math.round((m.total / next12MonthsProjection.maxVal) * 100);
            return (
              <div key={m.monthKey} className="flex flex-col items-center h-full justify-end group">
                <div
                  className="w-full max-w-[28px] bg-teal-600 dark:bg-teal-500 rounded-t-md hover:bg-teal-500 transition-all cursor-pointer relative"
                  style={{ height: `${Math.max(6, heightPct)}%` }}
                  title={`${formatMonthName(m.monthKey)}: ${formatCurrency(m.total, defaultCurrency)}`}
                />
                <span className="text-[9px] uppercase font-bold text-slate-400 mt-1.5 truncate">
                  {formatMonthName(m.monthKey).slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
