import React, { useState, useEffect } from 'react';
import { X, Target, DollarSign, Calendar, AlertCircle, Link2 } from 'lucide-react';
import { CurrencyCode, SavingsGoal, Account } from '../../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  accounts: Account[];
  defaultCurrency: CurrencyCode;
}

const PRESET_GOAL_NAMES = [
  'Patente automotor anual',
  'Seguro total anual',
  'Impuesto inmobiliario / ABL anual',
  'Mantenimiento de vehículo / Service',
  'Vacaciones y viajes',
  'Fondo de emergencia (3 meses)',
  'Renovación de tecnología / Electrodomésticos',
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  defaultCurrency,
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>(0);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [deadline, setDeadline] = useState('');
  const [relatedAccountId, setRelatedAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default currency when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrency(defaultCurrency);
      setError(null);
    }
  }, [isOpen, defaultCurrency]);

  if (!isOpen) return null;

  // Calculate recommended monthly contribution
  let monthlyRec = 0;
  if (typeof targetAmount === 'number' && targetAmount > 0 && deadline) {
    const today = new Date();
    const [y, m] = deadline.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      const monthsDiff = (y - today.getFullYear()) * 12 + (m - (today.getMonth() + 1));
      const curr = typeof currentAmount === 'number' ? currentAmount : 0;
      const remainingToSave = Math.max(0, targetAmount - curr);
      const validMonths = Math.max(1, monthsDiff);
      monthlyRec = Math.round(remainingToSave / validMonths);
    }
  }

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount(0);
    setDeadline('');
    setRelatedAccountId('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Por favor ingresá un nombre para el objetivo.');
      return;
    }

    const target = typeof targetAmount === 'number' ? targetAmount : parseFloat(String(targetAmount));
    if (isNaN(target) || target <= 0) {
      setError('El importe objetivo debe ser un número mayor a 0.');
      return;
    }

    const initialSaved =
      typeof currentAmount === 'number'
        ? currentAmount
        : currentAmount === ''
        ? 0
        : parseFloat(String(currentAmount)) || 0;

    setSaving(true);
    setError(null);

    // Build payload without any undefined fields (Firestore strictly forbids undefined values)
    const goalPayload: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: trimmedName,
      targetAmount: target,
      currentAmount: Math.max(0, initialSaved),
      currency,
      status: 'active',
    };

    if (deadline && deadline.trim()) {
      goalPayload.deadline = deadline.trim();
    }
    if (relatedAccountId && relatedAccountId.trim()) {
      goalPayload.relatedAccountId = relatedAccountId.trim();
    }
    if (monthlyRec > 0) {
      goalPayload.monthlyContribution = monthlyRec;
    }

    try {
      await onSave(goalPayload);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar objetivo:', err);
      let errorMsg = 'Error al guardar el objetivo.';
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || errorMsg;
        } catch {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nuevo objetivo de ahorro o reserva
            </h3>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del objetivo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Patente anual, Vacaciones, Seguro anual"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_GOAL_NAMES.slice(0, 4).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setName(p)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 hover:text-teal-800 dark:hover:bg-teal-900/40 dark:hover:text-teal-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Importe objetivo *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) =>
                  setTargetAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ARS">ARS (Pesos)</option>
                <option value="USD">USD (Dólares)</option>
                <option value="EUR">EUR (Euros)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ahorro acumulado inicial
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(e) =>
                  setCurrentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha límite (opcional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Optional account linking */}
          {accounts && accounts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vincular a servicio o cuenta recurrente (opcional)
              </label>
              <select
                value={relatedAccountId}
                onChange={(e) => setRelatedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Ninguno (meta independiente)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.category ? `(${acc.category})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Podés asociar este ahorro al pago previsto de un servicio o impuesto específico.
              </p>
            </div>
          )}

          {deadline && monthlyRec > 0 && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-lg text-xs text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
              💡 <strong>Aporte sugerido:</strong> Para alcanzar tu meta a tiempo, deberías reservar
              aproximadamente <strong>{currency} {monthlyRec.toLocaleString('es-AR')}</strong> por mes.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-60 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {saving ? 'Guardando...' : 'Crear objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
