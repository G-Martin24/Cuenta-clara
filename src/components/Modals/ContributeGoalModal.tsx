import React, { useState } from 'react';
import { X, DollarSign, Target, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ContributeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onContribute: (goalId: string, addedAmount: number) => Promise<void>;
}

export const ContributeGoalModal: React.FC<ContributeGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onContribute,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount !== 'number' || amount <= 0) {
      setError('Por favor ingresá un monto mayor a cero.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onContribute(goal.id, amount);
      if (goal.currentAmount + amount >= goal.targetAmount) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el aporte.');
    } finally {
      setSaving(false);
    }
  };

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Aportar a meta: {goal.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg flex justify-between text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Acumulado</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Meta</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>
            <div>
              <span className="text-teal-600 uppercase font-semibold text-[10px]">Resta</span>
              <p className="font-bold text-teal-700 dark:text-teal-400">
                {formatCurrency(remaining, goal.currency)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Importe a aportar *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                {goal.currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="0.00"
                className="w-full pl-14 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm"
            >
              {saving ? 'Guardando...' : 'Confirmar aporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
