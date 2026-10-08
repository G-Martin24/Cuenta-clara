import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  Wallet,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { BillInstance, CurrencyCode } from '../../types';
import { formatCurrency, formatDateAr } from '../../utils/formatters';
import { addDaysToYMD } from '../../utils/cashFlowAnalysis';
import { parseYMD } from '../../utils/recurrence';

interface PostponeBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillInstance | null;
  nextIncome?: {
    source: string;
    category?: string;
    amount: number;
    currency: CurrencyCode;
    date: string;
  } | null;
  onConfirmPostpone: (
    bill: BillInstance,
    newDueDate: string,
    updateAccountToo: boolean,
    reason?: string
  ) => Promise<void>;
}

export const PostponeBillModal: React.FC<PostponeBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  nextIncome,
  onConfirmPostpone,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [updateAccountToo, setUpdateAccountToo] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates whenever modal opens or bill/nextIncome changes
  useEffect(() => {
    if (bill) {
      if (nextIncome) {
        // Default recommended: 1 day after next income
        const recommendedDate = addDaysToYMD(nextIncome.date, 1);
        setSelectedDate(recommendedDate);
        setReason(`Postergado para sincronizar con fecha de cobro de ${nextIncome.source}`);
      } else {
        // Default +7 days from current due date if no income detected
        const fallbackDate = addDaysToYMD(bill.dueDate, 7);
        setSelectedDate(fallbackDate);
        setReason('Postergado por desfasaje de flujo de caja');
      }
      setIsCustomMode(false);
      setCustomDate('');
      setError(null);
    }
  }, [bill, nextIncome, isOpen]);

  if (!isOpen || !bill) return null;

  const billAmount = bill.isShared ? (bill.myShareAmount ?? bill.estimatedAmount) : bill.estimatedAmount;
  const incomeDate = nextIncome?.date || bill.dueDate;

  const quickOptions = [
    {
      id: 'opt_plus1',
      date: nextIncome ? addDaysToYMD(nextIncome.date, 1) : addDaysToYMD(bill.dueDate, 7),
      title: '1 día después del cobro (Recomendado)',
      badge: 'Óptimo',
      desc: 'Da tiempo a que la transferencia o sueldo impacte en tu banco.',
    },
    {
      id: 'opt_sameday',
      date: nextIncome ? nextIncome.date : addDaysToYMD(bill.dueDate, 5),
      title: 'El mismo día de cobro',
      badge: 'Día de cobro',
      desc: 'Pagar inmediatamente apenas se acrediten tus fondos.',
    },
    {
      id: 'opt_plus3',
      date: nextIncome ? addDaysToYMD(nextIncome.date, 3) : addDaysToYMD(bill.dueDate, 10),
      title: '+3 días de resguardo',
      badge: 'Margen seguro',
      desc: 'Colchón de seguridad ante fines de semana o feriados bancarios.',
    },
    {
      id: 'opt_plus5',
      date: nextIncome ? addDaysToYMD(nextIncome.date, 5) : addDaysToYMD(bill.dueDate, 15),
      title: '+5 días (Ventana 2° Vencimiento)',
      badge: 'Segundo vencimiento',
      desc: 'Ideal para facturas de servicios públicos con segundo vencimiento.',
    },
  ];

  const effectiveNewDate = isCustomMode ? customDate : selectedDate;

  // Calculate days difference from original dueDate to newDueDate
  let diffDays = 0;
  if (effectiveNewDate && bill.dueDate) {
    const { year: y1, month: m1, day: d1 } = parseYMD(bill.dueDate);
    const { year: y2, month: m2, day: d2 } = parseYMD(effectiveNewDate);
    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);
    diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  }

  const handleSelectOption = (date: string) => {
    setIsCustomMode(false);
    setSelectedDate(date);
    setError(null);
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    if (!customDate) {
      setCustomDate(selectedDate || nextIncome?.date || bill.dueDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveNewDate) {
      setError('Por favor seleccioná una nueva fecha de vencimiento.');
      return;
    }
    if (effectiveNewDate <= bill.dueDate) {
      setError('La nueva fecha debe ser posterior al vencimiento original actual.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirmPostpone(bill, effectiveNewDate, updateAccountToo, reason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al postergar el vencimiento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header with Warm Alert Gradient */}
        <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-teal-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Postergar vencimiento de pago
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Desfasaje de liquidez
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alineá el pago con el momento en que contás con el dinero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Visual Timeline Comparison: Bill vs Next Income */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Desfasaje de fechas detectado</span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vence antes de cobrar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Left: Original Bill Deadline */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60">
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Factura original
                </p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate">
                  {bill.accountName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                  {formatCurrency(billAmount, bill.currency)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-500" />
                  Vence: <strong className="text-slate-800 dark:text-slate-200">{formatDateAr(bill.dueDate)}</strong>
                </p>
              </div>

              {/* Right: Detected Next Income */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Próximo ingreso
                </p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                  <span>{nextIncome ? nextIncome.source : 'Ingreso recurrente'}</span>
                  {nextIncome?.category && (
                    <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 rounded-full">
                      {nextIncome.category}
                    </span>
                  )}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {nextIncome ? formatCurrency(nextIncome.amount, nextIncome.currency) : 'Acreditación'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-emerald-500" />
                  Entra: <strong className="text-slate-800 dark:text-slate-200">{formatDateAr(incomeDate)}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              💡 <strong>¿Por qué postergar?</strong> Al prorrogar este pago a una fecha posterior a tu acreditación, evitás quedar en descubierto bancario o pagar intereses por mora con fondos prestados.
            </p>
          </div>

          {/* Suggested Postpone Options */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Sugerencias de nueva fecha de pago
            </label>

            <div className="space-y-2">
              {quickOptions.map((opt) => {
                const isSelected = !isCustomMode && selectedDate === opt.date;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.date)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-amber-500 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {opt.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                              isSelected
                                ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                        {formatDateAr(opt.date)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Date Option */}
              <div
                onClick={handleCustomMode}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isCustomMode
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isCustomMode
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isCustomMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Elegir otra fecha personalizada
                    </span>
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>

                {isCustomMode && (
                  <div className="mt-3 pl-7" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={bill.dueDate}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prórroga Summary pill */}
          {diffDays > 0 && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl flex items-center justify-between text-xs">
              <span className="text-teal-800 dark:text-teal-200 font-medium">
                Nueva fecha programada: <strong>{formatDateAr(effectiveNewDate)}</strong>
              </span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 text-[11px]">
                +{diffDays} {diffDays === 1 ? 'día' : 'días'} de prórroga
              </span>
            </div>
          )}

          {/* Optional reason / note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nota o motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Postergado para pagar con el sueldo acreditado"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Checkbox: Update parent account due date too */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={updateAccountToo}
              onChange={(e) => setUpdateAccountToo(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Actualizar también la fecha de vencimiento habitual de la cuenta{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                "{bill.accountName}"
              </strong>{' '}
              para los próximos meses.
            </span>
          </label>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !effectiveNewDate}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CalendarClock className="w-4 h-4" />
              <span>{submitting ? 'Guardando...' : `Confirmar prórroga al ${formatDateAr(effectiveNewDate)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
