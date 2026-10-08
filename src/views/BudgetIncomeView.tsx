import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  Percent,
  Smile,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  Tag,
  BarChart3,
} from 'lucide-react';
import { Account, BillInstance, CurrencyCode, Income, SavingsGoal } from '../types';
import { formatCurrency, calculateMonthlyEquivalent, formatDateAr } from '../utils/formatters';

interface BudgetIncomeViewProps {
  incomes: Income[];
  accounts: Account[];
  bills: BillInstance[];
  goals: SavingsGoal[];
  onOpenAddIncome: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (incomeId: string) => Promise<void>;
  onToggleBillSplitCollected: (bill: BillInstance) => Promise<void>;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount?: (account: Account) => void;
  defaultCurrency: CurrencyCode;
}

export const BudgetIncomeView: React.FC<BudgetIncomeViewProps> = ({
  incomes,
  accounts,
  bills,
  goals,
  onOpenAddIncome,
  onEditIncome,
  onDeleteIncome,
  onToggleBillSplitCollected,
  onEditAccount,
  onDeleteAccount,
  defaultCurrency,
}) => {
  // 1. Calculate Total Monthly Income
  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => {
      let monthly = inc.amount;
      if (inc.frequency === 'biweekly') monthly = inc.amount * 2;
      else if (inc.frequency === 'occasional') monthly = inc.amount / 3; // spread
      return sum + monthly;
    }, 0);
  }, [incomes]);

  // 2. Calculate User's Real Monthly Accounts Share
  const myMonthlyBillsCommitment = useMemo(() => {
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

  // 3. Recommended 50/30/20 Budgeting Rule calculations
  const budgetRule = useMemo(() => {
    const idealNeeds50 = totalMonthlyIncome * 0.5; // 50%
    const idealWants30 = totalMonthlyIncome * 0.3; // 30% ("Gastar en mí")
    const idealSavings20 = totalMonthlyIncome * 0.2; // 20% ("Cuánto ahorrar")

    const commitmentPct =
      totalMonthlyIncome > 0 ? Math.round((myMonthlyBillsCommitment / totalMonthlyIncome) * 100) : 0;

    // Remaining real disposable money for user after paying all active bills
    const realRemainingAfterBills = Math.max(0, totalMonthlyIncome - myMonthlyBillsCommitment);

    // Dynamic suggested spend in personal leisure & savings based on real commitment
    let suggestedSpendOnMe = idealWants30;
    let suggestedSavings = idealSavings20;

    if (commitmentPct > 50) {
      // If bills take >50%, allocate 60% of what is left to personal spend and 40% to savings
      suggestedSpendOnMe = realRemainingAfterBills * 0.6;
      suggestedSavings = realRemainingAfterBills * 0.4;
    }

    return {
      idealNeeds50,
      idealWants30,
      idealSavings20,
      commitmentPct,
      realRemainingAfterBills,
      suggestedSpendOnMe,
      suggestedSavings,
      weeklySpendOnMe: Math.round(suggestedSpendOnMe / 4.33),
    };
  }, [totalMonthlyIncome, myMonthlyBillsCommitment]);

  // 4. Shared accounts and split bills
  const sharedAccounts = useMemo(() => {
    return accounts.filter((a) => a.isShared);
  }, [accounts]);

  // Current month's split bills
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sharedMonthBills = useMemo(() => {
    return bills.filter((b) => b.isShared && b.dueDate.startsWith(currentMonthKey));
  }, [bills, currentMonthKey]);

  // Group incomes by category for detailed cash flow analysis
  const incomesByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number; items: Income[] }>();
    for (const inc of incomes) {
      const cat = inc.category?.trim() || 'Sueldo / Salario';
      const existing = map.get(cat) || { total: 0, count: 0, items: [] };
      existing.total += inc.amount;
      existing.count += 1;
      existing.items.push(inc);
      map.set(cat, existing);
    }
    return Array.from(map.entries())
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        count: data.count,
        percentage: totalMonthlyIncome > 0 ? (data.total / totalMonthlyIncome) * 100 : 0,
        items: data.items,
      }))
      .sort((a, b) => b.total - a.total);
  }, [incomes, totalMonthlyIncome]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Ingresos, Presupuesto y Cuentas Compartidas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Analizá tu capacidad de ahorro, cuánto dinero podés destinar a tus gustos y dividí gastos con otras personas.
          </p>
        </div>

        <button
          onClick={onOpenAddIncome}
          className="self-start sm:self-auto px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar ingreso</span>
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingreso mensual */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ingreso mensual neto</span>
            <Briefcase className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 truncate">
            {formatCurrency(totalMonthlyIncome, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {incomes.length} {incomes.length === 1 ? 'fuente registrada' : 'fuentes registradas'}
          </p>
        </div>

        {/* Cuentas fijas (Tu parte) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tus cuentas fijas</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {budgetRule.commitmentPct}%
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {formatCurrency(myMonthlyBillsCommitment, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {budgetRule.commitmentPct <= 50 ? 'Nivel óptimo (≤ 50%)' : 'Supera el 50% sugerido'}
          </p>
        </div>

        {/* Para gastar en mí */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Para gastar en vos</span>
            <Smile className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatCurrency(budgetRule.suggestedSpendOnMe, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatCurrency(budgetRule.weeklySpendOnMe, defaultCurrency)} / semana libre
          </p>
        </div>

        {/* Para ahorrar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-950/60 shadow-xs">
          <div className="flex items-center justify-between text-teal-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ahorro sugerido</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2 truncate">
            {formatCurrency(budgetRule.suggestedSavings, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Meta del 20% para tranquilidad
          </p>
        </div>
      </div>

      {/* DIAGNÓSTICO INTELIGENTE Y REGLA 50/30/20 (Diseño compacto y horizontal) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Diagnóstico Financiero: Regla 50 / 30 / 20
            </h2>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              (Distribución recomendada de tus ingresos)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                budgetRule.commitmentPct <= 50
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : budgetRule.commitmentPct <= 70
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {budgetRule.commitmentPct <= 50
                ? '🟢 Finanzas Equilibradas'
                : budgetRule.commitmentPct <= 70
                ? '🟡 Atención en Fijos'
                : '🔴 Cuentas Fijas Altas'}
            </span>
          </div>
        </div>

        {totalMonthlyIncome === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <Briefcase className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Cargá tus ingresos para calcular tu margen libre y capacidad de ahorro.
            </p>
            <button
              onClick={onOpenAddIncome}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs shadow-xs hover:bg-teal-500"
            >
              Registrar mi primer ingreso
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Barra horizontal comparativa 50 / 30 / 20 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span className="text-amber-700 dark:text-amber-400">
                  Cuentas ({budgetRule.commitmentPct}%)
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  Gastar en Vos (30%)
                </span>
                <span className="text-teal-700 dark:text-teal-400">
                  Ahorro (20%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${Math.min(70, Math.max(15, budgetRule.commitmentPct))}%` }}
                  title={`Cuentas: ${budgetRule.commitmentPct}%`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: '30%' }}
                  title="Para gastar en vos: 30%"
                />
                <div
                  className="bg-teal-600 h-full transition-all flex-1"
                  title="Ahorro: 20%"
                />
              </div>
            </div>

            {/* 3 Tarjetas Horizontales Compactas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 50% Gastos Esenciales */}
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      50% Esenciales
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      {budgetRule.commitmentPct}% real
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(myMonthlyBillsCommitment, defaultCurrency)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tope ideal: {formatCurrency(budgetRule.idealNeeds50, defaultCurrency)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 border-t border-amber-200/60 dark:border-amber-900/40 pt-1.5">
                  {budgetRule.commitmentPct <= 50
                    ? '✅ En margen saludable.'
                    : '⚠️ Supera el 50% sugerido.'}
                </p>
              </div>

              {/* 30% Gastar en Mí */}
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                      30% Para Vos
                    </span>
                    <Smile className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(budgetRule.suggestedSpendOnMe, defaultCurrency)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ~{formatCurrency(budgetRule.weeklySpendOnMe, defaultCurrency)} / semana libre
                  </p>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 pt-1.5">
                  🎉 Ocio, salidas y gustos personales sin culpa.
                </p>
              </div>

              {/* 20% Ahorro e Inversión */}
              <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">
                      20% Ahorro
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-teal-700 dark:text-teal-400 mt-0.5">
                    {formatCurrency(budgetRule.suggestedSavings, defaultCurrency)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {goals.length > 0 ? `${goals.length} metas activas` : 'Colchón de tranquilidad'}
                  </p>
                </div>
                <p className="text-[10px] text-teal-800 dark:text-teal-300 mt-2 border-t border-teal-200/60 dark:border-teal-900/40 pt-1.5">
                  🛡️ Fondo de emergencia, patentes y viajes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN CUENTAS COMPARTIDAS / DIVIDIDAS (Split bills) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cuentas Compartidas y Cobros de Terceros
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {sharedAccounts.length} {sharedAccounts.length === 1 ? 'cuenta dividida' : 'cuentas divididas'}
          </span>
        </div>

        {sharedAccounts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <p>No tenés ninguna cuenta configurada como compartida.</p>
            <p className="mt-1 text-slate-500">
              Al agregar o editar una cuenta (ej. Alquiler, Luz, Internet), activá la casilla <strong>"Dividir cuenta con otra persona"</strong> para que calcule tu parte exacta y lo que te deben.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedMonthBills.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {sharedMonthBills.map((b) => {
                  const totalAmt = b.actualAmount ?? b.estimatedAmount;
                  const myPct = b.mySharePercentage ?? 50;
                  const myPart = (totalAmt * myPct) / 100;
                  const othersPart = totalAmt - myPart;

                  return (
                    <div
                      key={b.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {b.accountName}
                          </h4>
                          <span className="text-[10px] font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                            Dividido ({myPct}% tuyo / {100 - myPct}% de otros)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Vencimiento: {formatDateAr(b.dueDate)}{' '}
                          {b.splitNotes && `• ${b.splitNotes}`}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span className="text-slate-500">
                            Total factura:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {formatCurrency(totalAmt, b.currency)}
                            </strong>
                          </span>
                          <span className="text-teal-700 dark:text-teal-400 font-semibold">
                            Tu parte: {formatCurrency(myPart, b.currency)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            A cobrar de otros: {formatCurrency(othersPart, b.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onToggleBillSplitCollected(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            b.splitCollected
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-teal-100 hover:text-teal-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {b.splitCollected ? 'Parte cobrada' : 'Marcar cobrada'}
                          </span>
                        </button>

                        {(() => {
                          const acc = accounts.find((a) => a.id === b.accountId);
                          if (!acc) return null;
                          return (
                            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                              <button
                                onClick={() => onEditAccount?.(acc)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar cuenta dividida"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteAccount?.(acc)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Eliminar servicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                Las cuentas compartidas están activas. Los vencimientos de este mes ya fueron regularizados.
              </div>
            )}
          </div>
        )}
      </div>

      {/* LISTA DE FUENTES DE INGRESOS Y ANÁLISIS DE FLUJO DE FONDOS POR CATEGORÍA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" />
              <span>Mis Fuentes de Ingresos Registradas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá tus fuentes y categorizalas para un análisis preciso del flujo de fondos.
            </p>
          </div>
          <button
            onClick={onOpenAddIncome}
            className="self-start sm:self-auto text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar ingreso</span>
          </button>
        </div>

        {/* Desglose de Flujo de Fondos por Categoría */}
        {incomesByCategory.length > 0 && totalMonthlyIncome > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Flujo de fondos por categoría de ingreso
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {incomesByCategory.length} {incomesByCategory.length === 1 ? 'categoría activa' : 'categorías activas'}
              </span>
            </div>

            {/* Inflow distribution segmented bar */}
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              {incomesByCategory.map((cat, idx) => {
                const palette = [
                  'bg-teal-500',
                  'bg-emerald-500',
                  'bg-sky-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-purple-500',
                  'bg-rose-500',
                ];
                const color = palette[idx % palette.length];
                return (
                  <div
                    key={`bar-${cat.category}`}
                    className={`${color} h-full transition-all`}
                    style={{ width: `${Math.max(2, cat.percentage)}%` }}
                    title={`${cat.category}: ${cat.percentage.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Badges per category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {incomesByCategory.map((cat, idx) => {
                const dotColors = [
                  'bg-teal-500',
                  'bg-emerald-500',
                  'bg-sky-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-purple-500',
                  'bg-rose-500',
                ];
                const dot = dotColors[idx % dotColors.length];
                return (
                  <div
                    key={`cat-stat-${cat.category}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.category}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {formatCurrency(cat.total, defaultCurrency)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {cat.percentage.toFixed(0)}% del total
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {incomes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No registraste ningún ingreso aún.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {incomes.map((inc) => (
              <div
                key={inc.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {inc.source}
                    </h4>
                    <span className="text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {inc.category || 'Sueldo / Salario'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {inc.frequency === 'monthly'
                      ? 'Mensual'
                      : inc.frequency === 'biweekly'
                      ? 'Quincenal'
                      : 'Ocasional'}{' '}
                    • Cobro habitual: Día {inc.payDay || 10}{' '}
                    {inc.notes && `• ${inc.notes}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-sm text-teal-700 dark:text-teal-400">
                    {formatCurrency(inc.amount, inc.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditIncome(inc)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Editar ingreso"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteIncome(inc.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                      title="Eliminar ingreso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
