import React from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SavingsGoal, CurrencyCode } from '../types';
import { formatCurrency, formatDateAr } from '../utils/formatters';

interface GoalsViewProps {
  goals: SavingsGoal[];
  onOpenAddGoal: () => void;
  onOpenContributeGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => Promise<void>;
  defaultCurrency: CurrencyCode;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onOpenAddGoal,
  onOpenContributeGoal,
  onDeleteGoal,
  defaultCurrency,
}) => {
  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Objetivos de Ahorro y Reservas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ahorrá mes a mes para pagos grandes (patente anual, seguros, vacaciones, reparaciones).
          </p>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo objetivo</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No tenés objetivos de ahorro activos
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Creá metas para tus compromisos anuales (como la patente del auto o el seguro) para que no te tomen desprevenido.
          </p>
          <button
            onClick={onOpenAddGoal}
            className="mt-6 px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold text-xs shadow-xs"
          >
            Crear mi primer objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const isFinished = g.currentAmount >= g.targetAmount;

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      {g.deadline && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Límite: {formatDateAr(g.deadline)}</span>
                        </p>
                      )}
                    </div>
                    {isFinished ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ¡Alcanzado!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {pct}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFinished ? 'bg-emerald-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between items-baseline mt-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Acumulado
                      </span>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(g.currentAmount, g.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Meta final
                      </span>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        {formatCurrency(g.targetAmount, g.currency)}
                      </p>
                    </div>
                  </div>

                  {g.monthlyContribution && !isFinished && (
                    <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-600 dark:text-slate-400">
                      💡 Aporte mensual sugerido:{' '}
                      <strong className="text-teal-700 dark:text-teal-400">
                        {formatCurrency(g.monthlyContribution, g.currency)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onDeleteGoal(g.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Eliminar objetivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenContributeGoal(g)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Aportar dinero</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
