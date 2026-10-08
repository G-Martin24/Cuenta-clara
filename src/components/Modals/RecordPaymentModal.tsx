import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  Calendar,
  AlertTriangle,
  Receipt,
  CreditCard,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillInstance, PAYMENT_METHODS } from '../../types';
import { formatCurrency, calculatePriceVariation, formatDateAr } from '../../utils/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillInstance | null;
  onConfirmPayment: (
    bill: BillInstance,
    details: {
      actualAmount: number;
      paymentDate: string;
      paymentMethod: string;
      receiptNumber?: string;
      notes?: string;
    }
  ) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  bill,
  onConfirmPayment,
}) => {
  const [actualAmount, setActualAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setActualAmount(bill.actualAmount || bill.estimatedAmount);
      // Default payment date to today (or bill due date if preferred)
      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);
      setPaymentMethod(bill.paymentMethod || PAYMENT_METHODS[0]);
      setReceiptNumber(bill.receiptNumber || '');
      setNotes(bill.notes || '');
      setError(null);
    }
  }, [bill, isOpen]);

  if (!isOpen || !bill) return null;

  const currentAmountNum = typeof actualAmount === 'number' ? actualAmount : 0;
  const variation = calculatePriceVariation(currentAmountNum, bill.estimatedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof actualAmount !== 'number' || actualAmount < 0) {
      setError('Por favor ingresá un importe pagado válido.');
      return;
    }
    if (!paymentDate) {
      setError('Por favor indicá la fecha de pago.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirmPayment(bill, {
        actualAmount,
        paymentDate,
        paymentMethod,
        receiptNumber: receiptNumber.trim(),
        notes: notes.trim(),
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0f766e', '#14b8a6', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore if canvas not supported
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el pago. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar pago
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bill.accountName} • Vencimiento: {formatDateAr(bill.dueDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Importe estimado vs Real */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Importe estimado
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {formatCurrency(bill.estimatedAmount, bill.currency)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Moneda
              </span>
              <p className="text-base font-bold text-teal-700 dark:text-teal-300 mt-0.5">
                {bill.currency}
              </p>
            </div>
          </div>

          {/* Quick options for shared bills */}
          {bill.isShared && (
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
              <div className="flex justify-between font-semibold text-indigo-900 dark:text-indigo-200">
                <span>Cuenta dividida ({bill.splitTotalPeople || 2} personas)</span>
                <span>Tu parte: {bill.mySharePercentage || 50}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActualAmount(bill.estimatedAmount)}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border border-slate-300 dark:border-slate-700"
                >
                  Abonar factura completa ({formatCurrency(bill.estimatedAmount, bill.currency)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const myAmt = (bill.estimatedAmount * (bill.mySharePercentage || 50)) / 100;
                    setActualAmount(myAmt);
                  }}
                  className="px-2.5 py-1 rounded bg-teal-600 text-white font-semibold text-[11px]"
                >
                  Abonar solo mi parte ({formatCurrency((bill.estimatedAmount * (bill.mySharePercentage || 50)) / 100, bill.currency)})
                </button>
              </div>
            </div>
          )}

          {/* Importe Real Pagado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Importe real abonado *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                {bill.currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={actualAmount}
                onChange={(e) =>
                  setActualAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full pl-14 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Price change / hike alert (> 15% alert requirement) */}
            {variation && Math.abs(variation.percentage) > 0 && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  variation.isSignificant
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {variation.isSignificant && (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {variation.isIncrease ? 'Aumento del ' : 'Reducción del '}
                  <strong>{Math.abs(variation.percentage)}%</strong> respecto a lo estimado
                  {variation.isSignificant && ' (Supera el umbral de alerta del 15%)'}.
                </span>
              </div>
            )}
          </div>

          {/* Fecha de Pago y Método */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del pago *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método de pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Número de comprobante */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Número de comprobante / Operación (opcional)
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Ej. OP-9831726, Transf. 129384"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas adicionales
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Pagado por homebanking, descuento aplicado"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Confirmando...' : 'Confirmar pago'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
