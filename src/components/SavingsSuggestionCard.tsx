import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Coins,
  TrendingUp,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Target,
  Wallet,
} from 'lucide-react';
import { Account, CurrencyCode, Income, SavingsGoal } from '../types';
import { calculateMonthlyEquivalent, formatCurrency } from '../utils/formatters';

interface SavingsSuggestionCardProps {
  accounts: Account[];
  incomes?: Income[];
  goals?: SavingsGoal[];
  defaultCurrency: CurrencyCode;
  onOpenAddIncome?: () => void;
  onOpenAddGoal?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SavingsSuggestionCard: React.FC<SavingsSuggestionCardProps> = ({
  accounts,
  incomes = [],
  goals = [],
  defaultCurrency,
  onOpenAddIncome,
  onOpenAddGoal,
  onNavigateToTab,
}) => {
  // View mode: 'daily' (ahorro diario) vs 'monthly' (ahorro mensual)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');

  // Savings intensity percentage of projected surplus: 30% (conservador), 50% (recomendado), 70% (acelerado)
  const [savingsIntensity, setSavingsIntensity] = useState<number>(50);

  // 1. Calculate Total Projected Monthly Income
  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => {
      let monthly = inc.amount;
      if (inc.frequency === 'biweekly') monthly = inc.amount * 2;
      else if (inc.frequency === 'occasional') monthly = inc.amount / 3; // prorrateado
      return sum + monthly;
    }, 0);
  }, [incomes]);

  // 2. Calculate User's Real Monthly Recurring Expenses Commitment
  const totalMonthlyExpenses = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => {
        const fullMonthly = calculateMonthlyEquivalent(a.amount, a.frequency);
        const myPortion = a.isShared
          ? (fullMonthly * (a.mySharePercentage ?? 50)) / 100
          : fullMonthly;
        return sum + myPortion;
      }, 0);
  }, [accounts]);

  // 3. Projected Surplus (Excedente proyectado)
  const projectedSurplus = totalMonthlyIncome - totalMonthlyExpenses;

  // 4. Calendar calculations: Days in current month and remaining days
  const calendarMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);
    return {
      totalDaysInMonth,
      currentDay,
      remainingDays,
      monthName: now.toLocaleDateString('es-AR', { month: 'long' }),
    };
  }, []);

  // 5. Calculations for Suggested Savings
  const savingsCalculation = useMemo(() => {
    if (projectedSurplus <= 0) {
      return {
        monthlySuggested: 0,
        dailyRemainingSuggested: 0,
        dailyStandardSuggested: 0,
        remainingForWants: 0,
      };
    }

    const ratio = savingsIntensity / 100;
    const monthlySuggested = Math.round(projectedSurplus * ratio);
    const dailyRemainingSuggested = Math.round(monthlySuggested / calendarMetrics.remainingDays);
    const dailyStandardSuggested = Math.round(monthlySuggested / calendarMetrics.totalDaysInMonth);
    const remainingForWants = Math.max(0, projectedSurplus - monthlySuggested);

    return {
      monthlySuggested,
      dailyRemainingSuggested,
      dailyStandardSuggested,
      remainingForWants,
    };
  }, [projectedSurplus, savingsIntensity, calendarMetrics]);

  // Financial commitment ratios
  const commitmentPct =
    totalMonthlyIncome > 0
      ? Math.min(100, Math.round((totalMonthlyExpenses / totalMonthlyIncome) * 100))
      : 0;

  const savingsOfIncomePct =
    totalMonthlyIncome > 0
      ? Math.min(100, Math.round((savingsCalculation.monthlySuggested / totalMonthlyIncome) * 100))
      : 0;

  const freeForLifePct = Math.max(0, 100 - commitmentPct - savingsOfIncomePct);

  // Has registered incomes?
  const hasIncomes = incomes.length > 0 && totalMonthlyIncome > 0;

  return (
    <div className="bg-gradient-to-br from-white via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 shadow-sm p-4 sm:p-6 space-y-5 transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Sugerencia Inteligente de Ahorro
              </h2>
              {hasIncomes && projectedSurplus > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3" />
                  Superávit Proyectado
                </span>
              )}
              {hasIncomes && projectedSurplus <= 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-3 h-3" />
                  Margen Ajustado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análisis dinámico de tus ingresos vs. gastos recurrentes para proyectar tu excedente libre.
            </p>
          </div>
        </div>

        {/* Toggle Diario vs Mensual */}
        {hasIncomes && projectedSurplus > 0 && (
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Ahorro Diario</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'monthly'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ahorro Mensual</span>
            </button>
          </div>
        )}
      </div>

      {/* Case 1: No incomes registered yet */}
      {!hasIncomes && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-teal-300 dark:border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-teal-600" />
              Cargá tus ingresos para calcular tu excedente y meta de ahorro
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Actualmente tenés <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatCurrency(totalMonthlyExpenses, defaultCurrency)}</strong> en compromisos de gastos recurrentes. Registrá tu sueldo o ingresos habituales para que el sistema calcule exactamente cuánto podés apartar por día o por mes sin descuidar tus cuentas.
            </p>
          </div>
          {onOpenAddIncome && (
            <button
              onClick={onOpenAddIncome}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar ingreso mensual</span>
            </button>
          )}
        </div>
      )}

      {/* Case 2: Incomes exist and Surplus is Positive */}
      {hasIncomes && projectedSurplus > 0 && (
        <div className="space-y-4">
          {/* Main Hero Amount Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-teal-100 dark:border-teal-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {viewMode === 'daily'
                  ? 'Monto sugerido a apartar por día'
                  : 'Monto sugerido a apartar este mes'}
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-4xl font-extrabold text-teal-700 dark:text-teal-300 tracking-tight">
                  {viewMode === 'daily'
                    ? formatCurrency(savingsCalculation.dailyRemainingSuggested, defaultCurrency)
                    : formatCurrency(savingsCalculation.monthlySuggested, defaultCurrency)}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  {viewMode === 'daily' ? '/ día' : '/ mes'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                {viewMode === 'daily' ? (
                  <>
                    Apartando este monto diario durante los{' '}
                    <strong className="text-teal-700 dark:text-teal-300 font-bold">
                      {calendarMetrics.remainingDays} días restantes
                    </strong>{' '}
                    de {calendarMetrics.monthName}, alcanzarás un ahorro de{' '}
                    <strong className="text-teal-700 dark:text-teal-300 font-bold">
                      {formatCurrency(savingsCalculation.monthlySuggested, defaultCurrency)}
                    </strong>{' '}
                    este mes ({savingsIntensity}% de tu excedente).
                  </>
                ) : (
                  <>
                    Destinando el{' '}
                    <strong className="text-teal-700 dark:text-teal-300 font-bold">
                      {savingsIntensity}%
                    </strong>{' '}
                    de tu excedente neto ({formatCurrency(projectedSurplus, defaultCurrency)}), te quedarán{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                      {formatCurrency(savingsCalculation.remainingForWants, defaultCurrency)}
                    </strong>{' '}
                    totalmente libres para gastos personales y ocio.
                  </>
                )}
              </p>
            </div>

            {/* Intensity / Strategy Picker */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 space-y-2.5 min-w-[240px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Perfil de ahorro
                </span>
                <span className="font-extrabold text-teal-700 dark:text-teal-300">
                  {savingsIntensity}% del excedente
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSavingsIntensity(30)}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    savingsIntensity === 30
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Conservador: 30% del excedente, dejando más margen para gastos variables"
                >
                  30% Suave
                </button>
                <button
                  type="button"
                  onClick={() => setSavingsIntensity(50)}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    savingsIntensity === 50
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Recomendado: 50% del excedente para equilibrio óptimo"
                >
                  50% Ideal
                </button>
                <button
                  type="button"
                  onClick={() => setSavingsIntensity(70)}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                    savingsIntensity === 70
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Acelerado: 70% del excedente para maximizar metas"
                >
                  70% Máximo
                </button>
              </div>

              {viewMode === 'daily' && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Ritmo diario estándar (30d):</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(savingsCalculation.dailyStandardSuggested, defaultCurrency)}/d
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transparent Breakdown Grid: Incomes vs Recurring Expenses vs Surplus */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Ingresos */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ingresos proyectados
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalMonthlyIncome, defaultCurrency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {incomes.length} {incomes.length === 1 ? 'fuente' : 'fuentes'} registradas
              </p>
            </div>

            {/* 2. Gastos Recurrentes */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gastos recurrentes
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              </div>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                -{formatCurrency(totalMonthlyExpenses, defaultCurrency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Representa el {commitmentPct}% de tus ingresos
              </p>
            </div>

            {/* 3. Excedente Libre */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Excedente proyectado
                </span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                +{formatCurrency(projectedSurplus, defaultCurrency)}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Margen libre mensual
              </p>
            </div>
          </div>

          {/* Visual Distribution Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Distribución proyectada de tus ingresos
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Gastos fijos: {commitmentPct}% • Ahorro: {savingsOfIncomePct}% • Libre: {freeForLifePct}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
              <div
                className="bg-slate-400 dark:bg-slate-500 h-full rounded-l-full transition-all"
                style={{ width: `${commitmentPct}%` }}
                title={`Gastos recurrentes: ${commitmentPct}%`}
              />
              <div
                className="bg-teal-600 h-full transition-all"
                style={{ width: `${savingsOfIncomePct}%` }}
                title={`Ahorro sugerido: ${savingsOfIncomePct}%`}
              />
              <div
                className="bg-emerald-400 dark:bg-emerald-500 h-full rounded-r-full transition-all"
                style={{ width: `${freeForLifePct}%` }}
                title={`Gastos variables y disfrute: ${freeForLifePct}%`}
              />
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              {goals.length > 0 ? (
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-teal-600" />
                  Tenés <strong className="text-slate-800 dark:text-slate-200">{goals.length}</strong> {goals.length === 1 ? 'meta de ahorro activa' : 'metas de ahorro activas'}.
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  Fijá objetivos de ahorro para asignar este excedente a tus metas personales.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddGoal && (
                <button
                  type="button"
                  onClick={onOpenAddGoal}
                  className="px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{goals.length > 0 ? 'Nueva meta' : 'Crear meta de ahorro'}</span>
                </button>
              )}

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('budget')}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold transition-all flex items-center gap-1 group"
                >
                  <span>Ver detalle en Presupuesto</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Case 3: Expenses exceed Income (Deficit or tight) */}
      {hasIncomes && projectedSurplus <= 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Compromisos recurrentes al límite de tus ingresos proyectados
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Tus gastos recurrentes suman{' '}
                <strong className="font-bold">{formatCurrency(totalMonthlyExpenses, defaultCurrency)}</strong>, mientras que tus ingresos proyectados son{' '}
                <strong className="font-bold">{formatCurrency(totalMonthlyIncome, defaultCurrency)}</strong> (diferencia de{' '}
                {formatCurrency(Math.abs(projectedSurplus), defaultCurrency)}). Te sugerimos auditar servicios y suscripciones antes de fijar metas de ahorro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
            {onOpenAddIncome && (
              <button
                onClick={onOpenAddIncome}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-all shadow-2xs"
              >
                Actualizar o agregar ingresos
              </button>
            )}
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('accounts')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold text-[11px] transition-all"
              >
                Revisar suscripciones activas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
