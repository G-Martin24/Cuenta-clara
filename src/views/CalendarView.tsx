import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListFilter,
  DollarSign,
  Receipt,
  Plus,
} from 'lucide-react';
import { BillInstance, CurrencyCode } from '../types';
import { formatCurrency, formatDateAr, formatMonthName } from '../utils/formatters';
import { getDaysUntil, getDaysInMonth, formatYMD } from '../utils/recurrence';

interface CalendarViewProps {
  bills: BillInstance[];
  onOpenRecordPayment: (bill: BillInstance) => void;
  onOpenAddBill?: () => void;
  defaultCurrency: CurrencyCode;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bills,
  onOpenRecordPayment,
  onOpenAddBill,
  defaultCurrency,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDayBills, setSelectedDayBills] = useState<{ day: number; bills: BillInstance[] } | null>(null);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDayBills(null);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDayBills(null);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const monthKey = `${currentYear}-${pad(currentMonth)}`;

  // Bills in current month
  const monthBills = useMemo(() => {
    return bills.filter((b) => b.dueDate.startsWith(monthKey));
  }, [bills, monthKey]);

  // Total for current month
  const monthTotal = useMemo(() => {
    return monthBills.reduce(
      (acc, b) => acc + (b.actualAmount ?? b.estimatedAmount),
      0
    );
  }, [monthBills]);

  // Map bills by day
  const billsByDay = useMemo(() => {
    const map: Record<number, BillInstance[]> = {};
    monthBills.forEach((b) => {
      const day = parseInt(b.dueDate.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(b);
    });
    return map;
  }, [monthBills]);

  // Calendar matrix
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  // Day of week for 1st day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  // Let's use Monday as first column (European / Latin American standard)
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Mon=0, Tue=1, ..., Sun=6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const getBillColorStatus = (b: BillInstance) => {
    if (b.status === 'paid') return 'green';
    const days = getDaysUntil(b.dueDate);
    if (days < 0 || b.status === 'overdue') return 'red';
    return 'yellow';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-36 sm:pb-12 w-full max-w-full">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            Calendario de Vencimientos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total previsto para <span className="capitalize">{formatMonthName(monthKey)}</span>:{' '}
            <strong className="text-teal-700 dark:text-teal-400 font-bold">
              {formatCurrency(monthTotal, defaultCurrency)}
            </strong>
          </p>
        </div>

        {/* Controls: Stacked on mobile, adaptive row on tablet/desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Row 1: Mode Switcher (Mes completo / Agenda) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Mes completo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Row 2: Month Stepper */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-200 text-center capitalize min-w-[120px] truncate">
              {formatMonthName(monthKey)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Row 3 (or inline on sm+): Cargar Factura */}
          {onOpenAddBill && (
            <button
              type="button"
              onClick={onOpenAddBill}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
              title="Cargar nueva factura"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Cargar factura</span>
            </button>
          )}
        </div>
      </div>

      {/* Legend / Referencias: Adaptable wrap on mobile, inline on desktop */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider shrink-0">
            Referencias:
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                Pagado
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-2 ring-amber-500/20" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                Próximo vencimiento
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-500/20" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                Atrasado / Vencido
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {/* Blank leading days */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[66px] sm:min-h-[110px] bg-slate-50/40 dark:bg-slate-900/40 p-1 sm:p-1.5 opacity-40"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayBills = billsByDay[day] || [];
              const dayTotal = dayBills.reduce(
                (sum, b) => sum + (b.actualAmount ?? b.estimatedAmount),
                0
              );
              const isToday =
                today.getFullYear() === currentYear &&
                today.getMonth() + 1 === currentMonth &&
                today.getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    if (dayBills.length > 0) {
                      setSelectedDayBills({ day, bills: dayBills });
                    }
                  }}
                  className={`min-h-[66px] sm:min-h-[110px] p-1 sm:p-2 flex flex-col justify-between transition-colors ${
                    dayBills.length > 0 ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800/60' : ''
                  } ${isToday ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isToday
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTotal > 0 && (
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 hidden sm:inline">
                        {formatCurrency(dayTotal, defaultCurrency)}
                      </span>
                    )}
                  </div>

                  {/* Day bills chips */}
                  <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
                    {/* Desktop chips (visible on sm+) */}
                    <div className="hidden sm:block space-y-1">
                      {dayBills.slice(0, 3).map((b) => {
                        const color = getBillColorStatus(b);
                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRecordPayment(b);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border transition-all ${
                              color === 'green'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : color === 'red'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                            title={`${b.accountName}: ${formatCurrency(b.estimatedAmount, b.currency)}`}
                          >
                            {b.accountName}
                          </div>
                        );
                      })}
                      {dayBills.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1 block">
                          +{dayBills.length - 3} más
                        </span>
                      )}
                    </div>

                    {/* Mobile chips (compact on < sm) */}
                    <div className="sm:hidden space-y-0.5">
                      {dayBills.slice(0, 2).map((b) => {
                        const color = getBillColorStatus(b);
                        return (
                          <div
                            key={b.id}
                            className={`px-1 py-0.5 rounded text-[9px] font-semibold truncate border ${
                              color === 'green'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : color === 'red'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            <span className="truncate block leading-tight">{b.accountName}</span>
                          </div>
                        );
                      })}
                      {dayBills.length > 2 && (
                        <div className="text-[8px] font-bold text-slate-400 pl-0.5 leading-none">
                          +{dayBills.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
          {monthBills.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay vencimientos programados para este mes.
            </div>
          ) : (
            monthBills
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((b) => {
                const color = getBillColorStatus(b);
                const days = getDaysUntil(b.dueDate);
                return (
                  <div
                    key={b.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-3 h-10 rounded-full shrink-0 ${
                          color === 'green'
                            ? 'bg-emerald-500'
                            : color === 'red'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {b.accountName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {b.category} • Vence el {formatDateAr(b.dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-6 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(b.actualAmount ?? b.estimatedAmount, b.currency)}
                        </p>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full inline-block ${
                            color === 'green'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : color === 'red'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status === 'paid' ? 'Pagado' : days < 0 ? 'Vencido' : 'Pendiente'}
                        </span>
                      </div>

                      {b.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => onOpenRecordPayment(b)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                          Registrar pago
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Selected Day Bills Drawer/Popup */}
      {selectedDayBills && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Vencimientos del día {selectedDayBills.day} de {formatMonthName(monthKey)}
              </h3>
              <button
                onClick={() => setSelectedDayBills(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayBills.bills.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{b.accountName}</p>
                    <p className="text-[11px] text-slate-500">{formatCurrency(b.estimatedAmount, b.currency)}</p>
                  </div>
                  {b.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setSelectedDayBills(null);
                        onOpenRecordPayment(b);
                      }}
                      className="px-2.5 py-1 rounded-md bg-teal-600 text-white text-xs font-semibold"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
