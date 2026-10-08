import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  ArrowRight,
  Wallet,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Info,
  Sliders,
  X,
} from 'lucide-react';
import { BillInstance, CurrencyCode } from '../types';
import { CashFlowCrunchSummary, CashFlowCrunchItem } from '../utils/cashFlowAnalysis';
import { formatCurrency, formatDateAr } from '../utils/formatters';

interface CashFlowCrunchWarningProps {
  crunchSummary: CashFlowCrunchSummary;
  onOpenPostponeModal: (bill: BillInstance) => void;
  onQuickPostpone?: (bill: BillInstance, suggestedDate: string) => Promise<void>;
  onNavigateToIncomes?: () => void;
}

export const CashFlowCrunchWarning: React.FC<CashFlowCrunchWarningProps> = ({
  crunchSummary,
  onOpenPostponeModal,
  onQuickPostpone,
  onNavigateToIncomes,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null);

  if (!crunchSummary.hasCrunch || dismissed) return null;

  const { crunchBills, totalCrunchAmount, currency, nextIncome } = crunchSummary;

  const handleQuickPostponeClick = async (billItem: CashFlowCrunchItem) => {
    if (!onQuickPostpone) {
      onOpenPostponeModal(billItem.bill);
      return;
    }
    setQuickLoadingId(billItem.bill.id);
    try {
      await onQuickPostpone(billItem.bill, billItem.suggestedPostponeDate);
    } finally {
      setQuickLoadingId(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 p-4 sm:p-5 shadow-xs transition-all animate-fadeIn">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                Alerta de Flujo de Caja
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Facturas por vencer antes de tu próximo cobro
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Detectamos un desfasaje de liquidez: tenés{' '}
              <strong className="text-amber-700 dark:text-amber-300 font-bold">
                {crunchBills.length} {crunchBills.length === 1 ? 'cuenta' : 'cuentas'}
              </strong>{' '}
              ({formatCurrency(totalCrunchAmount, currency)}) con vencimiento previo a la acreditación de tu{' '}
              <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                {nextIncome?.source || 'ingreso'}
              </strong>
              {nextIncome?.category && (
                <span className="mx-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-full inline-block">
                  {nextIncome.category}
                </span>
              )}{' '}
              el <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{nextIncome ? formatDateAr(nextIncome.date) : ''}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
          title="Ocultar alerta por ahora"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Affected Bills Cards Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
        {crunchBills.map((item) => {
          const billAmount = item.bill.isShared
            ? (item.bill.myShareAmount ?? item.bill.estimatedAmount)
            : item.bill.estimatedAmount;
          const isLoading = quickLoadingId === item.bill.id;

          return (
            <div
              key={item.bill.id}
              className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/90 dark:border-amber-900/60 shadow-xs hover:border-amber-400 dark:hover:border-amber-700 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.bill.accountName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.bill.category || 'Servicios'}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(billAmount, item.bill.currency)}
                  </span>
                </div>

                {/* Timeline badge: Vence vs Cobrás */}
                <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-500" />
                      Vence:
                    </span>
                    <strong className="text-red-600 dark:text-red-400 font-semibold">
                      {formatDateAr(item.dueDate)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-500" />
                      Cobro estimado:
                    </span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      {formatDateAr(item.nextIncomeDate)}
                    </strong>
                  </div>
                  <div className="text-[10px] text-amber-800 dark:text-amber-200 font-semibold pt-0.5 border-t border-amber-200/40 dark:border-amber-900/40">
                    ⚡ Desfasaje: Cobrás {item.daysDifference} {item.daysDifference === 1 ? 'día' : 'días'} después
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleQuickPostponeClick(item)}
                  disabled={isLoading}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center gap-1"
                  title={`Postergar pago al ${formatDateAr(item.suggestedPostponeDate)}`}
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>
                    {isLoading ? 'Postergando...' : `Postergar al ${formatDateAr(item.suggestedPostponeDate)}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPostponeModal(item.bill)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[11px] font-semibold"
                  title="Ver más fechas y opciones de prórroga"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Income Timing link */}
      <div className="mt-3.5 pt-3 border-t border-amber-200/50 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 relative z-10">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Prorrogar actualiza la fecha límite para ayudarte a planificar tu efectivo sin sorpresas.
          </span>
        </div>

        {onNavigateToIncomes && (
          <button
            type="button"
            onClick={onNavigateToIncomes}
            className="text-amber-700 dark:text-amber-300 hover:underline font-semibold text-[11px] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ajustar fecha habitual de cobro</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
