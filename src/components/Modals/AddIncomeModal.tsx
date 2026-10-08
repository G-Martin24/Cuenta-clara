import React, { useState } from 'react';
import { X, DollarSign, Briefcase, Plus, AlertCircle, Calendar, Tag } from 'lucide-react';
import { CurrencyCode, Income, IncomeFrequency, DEFAULT_INCOME_CATEGORIES } from '../../types';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  incomeToEdit?: Income | null;
  defaultCurrency: CurrencyCode;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  incomeToEdit,
  defaultCurrency,
}) => {
  const [source, setSource] = useState(incomeToEdit?.source || '');
  const [category, setCategory] = useState(incomeToEdit?.category || 'Sueldo / Salario');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(
    incomeToEdit?.category && !DEFAULT_INCOME_CATEGORIES.includes(incomeToEdit.category as any)
      ? true
      : false
  );
  const [amount, setAmount] = useState<number | ''>(incomeToEdit?.amount || '');
  const [currency, setCurrency] = useState<CurrencyCode>(incomeToEdit?.currency || defaultCurrency);
  const [frequency, setFrequency] = useState<IncomeFrequency>(incomeToEdit?.frequency || 'monthly');
  const [payDay, setPayDay] = useState<number | ''>(incomeToEdit?.payDay || 10);
  const [notes, setNotes] = useState(incomeToEdit?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      setError('Por favor ingresá la fuente o concepto del ingreso.');
      return;
    }
    if (typeof amount !== 'number' || amount <= 0) {
      setError('Por favor ingresá un importe válido mayor a 0.');
      return;
    }

    const finalCategory = (isCustomCategory ? customCategory.trim() : category.trim()) || 'Sueldo / Salario';

    setSaving(true);
    setError(null);
    try {
      await onSave({
        source: source.trim(),
        category: finalCategory,
        amount,
        currency,
        frequency,
        payDay: typeof payDay === 'number' && payDay >= 1 && payDay <= 31 ? payDay : 10,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el ingreso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {incomeToEdit ? 'Editar ingreso' : 'Registrar ingreso'}
              </h3>
              <p className="text-xs text-slate-500">Para tu presupuesto mensual y regla 50/30/20</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fuente o concepto de ingreso *
            </label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ej. Sueldo en mano, Clientes freelance, Renta de cochera"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Sueldo principal', 'Trabajos freelance', 'Renta / Alquiler', 'Comisiones'].map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => {
                    setSource(sug);
                    if (sug.includes('Sueldo')) {
                      setIsCustomCategory(false);
                      setCategory('Sueldo / Salario');
                    } else if (sug.includes('freelance')) {
                      setIsCustomCategory(false);
                      setCategory('Freelance / Honorarios');
                    } else if (sug.includes('Renta')) {
                      setIsCustomCategory(false);
                      setCategory('Rentas e Inversiones');
                    } else if (sug.includes('Comisiones')) {
                      setIsCustomCategory(false);
                      setCategory('Comercio / Ventas');
                    }
                  }}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría del ingreso */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoría de ingreso *
              </label>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Flujo de fondos
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={isCustomCategory ? '__custom__' : category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                {DEFAULT_INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">✏️ Otra categoría personalizada...</option>
              </select>

              {isCustomCategory && (
                <div>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ej. Beca, Regalías, Bonificación anual..."
                    className="w-full px-3 py-2 rounded-lg border border-teal-500 dark:border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Categorías sugeridas en píldoras */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DEFAULT_INCOME_CATEGORIES.map((cat) => {
                  const isSelected = !isCustomCategory && category === cat;
                  return (
                    <button
                      type="button"
                      key={`chip-cat-${cat}`}
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCategory(cat);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white font-semibold shadow-xs scale-102'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/40'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Importe *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">
                  {currency}
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
                  className="w-full pl-14 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500"
              >
                <option value="ARS">ARS (Pesos)</option>
                <option value="USD">USD (Dólares)</option>
                <option value="EUR">EUR (Euros)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Frecuencia de cobro *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="monthly">Mensual (1 vez por mes)</option>
              <option value="biweekly">Quincenal (cada 15 días)</option>
              <option value="occasional">Ocasional / Variable</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Día habitual de cobro del mes (1 al 31)
              </label>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                Para detectar desfasajes de pago
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="31"
                value={payDay}
                onChange={(e) =>
                  setPayDay(e.target.value === '' ? '' : Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))
                }
                placeholder="Ej. 10"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[1, 5, 10, 15, 20, 30].map((d) => (
                <button
                  type="button"
                  key={`day-${d}`}
                  onClick={() => setPayDay(d)}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    payDay === d
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/40'
                  }`}
                >
                  {d === 30 ? 'Fin de mes (30)' : `Día ${d}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cobro los primeros días de cada mes"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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
              {saving ? 'Guardando...' : incomeToEdit ? 'Guardar cambios' : 'Registrar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
