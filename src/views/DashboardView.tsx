import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Info,
  Edit3,
  Trash2,
  Users,
  ArrowRight,
  BellRing,
  X,
  Receipt,
  Check,
  FileDown,
  CalendarClock,
} from 'lucide-react';
import { Account, BillInstance, CurrencyCode, Payment, Income, SavingsGoal } from '../types';
import {
  formatCurrency,
  formatDateAr,
  formatMonthName,
  calculateMonthlyEquivalent,
  calculateAnnualCost,
} from '../utils/formatters';
import { getDaysUntil } from '../utils/recurrence';
import { MonthlySplitModal } from '../components/Modals/MonthlySplitModal';
import { SavingsSuggestionCard } from '../components/SavingsSuggestionCard';
import { exportMonthlyReportToPdf } from '../services/pdfExportService';
import { CashFlowCrunchWarning } from '../components/CashFlowCrunchWarning';
import { PostponeBillModal } from '../components/Modals/PostponeBillModal';
import { analyzeCashFlowCrunch, CashFlowCrunchItem } from '../utils/cashFlowAnalysis';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notificationService';

interface DashboardViewProps {
  accounts: Account[];
  bills: BillInstance[];
  payments: Payment[];
  incomes?: Income[];
  goals?: SavingsGoal[];
  onOpenAddIncome?: () => void;
  onOpenAddGoal?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenAddAccount: () => void;
  onOpenRecordPayment: (bill: BillInstance) => void;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount?: (account: Account) => void;
  onOpenAddBill?: (accountId?: string) => void;
  onEditBill?: (bill: BillInstance) => void;
  onDeleteBill?: (bill: BillInstance) => void;
  onPostponeBill?: (bill: BillInstance, newDueDate: string, updateAccountToo?: boolean, reason?: string) => Promise<void>;
  recentlyPaidBillId?: string | null;
  onSeedStarterData: () => Promise<void>;
  defaultCurrency: CurrencyCode;
  userName: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  bills,
  payments,
  incomes = [],
  goals = [],
  onOpenAddIncome,
  onOpenAddGoal,
  onNavigateToTab,
  onOpenAddAccount,
  onOpenRecordPayment,
  onEditAccount,
  onDeleteAccount,
  onOpenAddBill,
  onEditBill,
  onDeleteBill,
  onPostponeBill,
  recentlyPaidBillId,
  onSeedStarterData,
  defaultCurrency,
  userName,
}) => {
  // Current selected month: YYYY-MM
  const now = new Date();
  const currentYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYMD);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [isMonthlySplitModalOpen, setIsMonthlySplitModalOpen] = useState(false);
  const [billToPostpone, setBillToPostpone] = useState<BillInstance | null>(null);
  const [cardSplitMode, setCardSplitMode] = useState<'configured' | 'split2' | 'split3'>('configured');
  const [notifPermission, setNotifPermission] = useState<string>(() => getNotificationPermission());
  const [dismissNotifBanner, setDismissNotifBanner] = useState<boolean>(() => {
    return localStorage.getItem('cc_dismiss_notif_banner') === 'true';
  });

  // Vencimientos tab: 'pending' (default) or 'paid'
  const [vencimientosTab, setVencimientosTab] = useState<'pending' | 'paid'>('pending');
  // Track recently paid bills to show temporary "✓ Pagado" badge before disappearance
  const [recentlyPaidIds, setRecentlyPaidIds] = useState<Record<string, number>>({});
  const [exportingPdf, setExportingPdf] = useState(false);

  // Cash Flow Crunch Analysis (Detect bills due before next income)
  const cashFlowCrunch = useMemo(() => {
    return analyzeCashFlowCrunch(bills, incomes);
  }, [bills, incomes]);

  const crunchBillsMap = useMemo(() => {
    const map = new Map<string, CashFlowCrunchItem>();
    cashFlowCrunch.crunchBills.forEach((item) => {
      map.set(item.bill.id, item);
    });
    return map;
  }, [cashFlowCrunch]);

  useEffect(() => {
    if (recentlyPaidBillId) {
      setRecentlyPaidIds((prev) => ({
        ...prev,
        [recentlyPaidBillId]: Date.now(),
      }));
      const timer = setTimeout(() => {
        setRecentlyPaidIds((prev) => {
          const next = { ...prev };
          delete next[recentlyPaidBillId];
          return next;
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [recentlyPaidBillId]);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  const handleDismissBanner = () => {
    setDismissNotifBanner(true);
    localStorage.setItem('cc_dismiss_notif_banner', 'true');
  };

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return '¡Buen día';
    if (hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  // Filter bills for the selected month (excluding speculative upcoming ones)
  const monthBills = useMemo(() => {
    return bills.filter((b) => b.dueDate.startsWith(selectedMonth) && b.status !== 'upcoming');
  }, [bills, selectedMonth]);

  // Key totals for selected month
  const { totalEstimated, totalPaid, totalPending, totalOverdue } = useMemo(() => {
    let est = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    monthBills.forEach((b) => {
      // Calculate in bill's currency (primary is defaultCurrency)
      const amt = b.actualAmount ?? b.estimatedAmount;
      est += b.estimatedAmount;

      if (b.status === 'paid') {
        paid += b.actualAmount ?? b.estimatedAmount;
      } else {
        const days = getDaysUntil(b.dueDate);
        if (days < 0 || b.status === 'overdue') {
          overdue += b.estimatedAmount;
        } else {
          pending += b.estimatedAmount;
        }
      }
    });

    return { totalEstimated: est, totalPaid: paid, totalPending: pending, totalOverdue: overdue };
  }, [monthBills]);

  // Overall active accounts monthly and annual projections + per-person portions
  const {
    totalMonthlyEquivalent,
    totalAnnualProjected,
    activeAccountsCount,
    myConfiguredMonthlyPortion,
    othersConfiguredMonthlyPortion,
    sharedAccountsCount,
  } = useMemo(() => {
    let monthly = 0;
    let annual = 0;
    let activeCount = 0;
    let myPortion = 0;
    let othersPortion = 0;
    let sharedCount = 0;

    accounts.forEach((acc) => {
      if (acc.status === 'active') {
        activeCount++;
        const m = calculateMonthlyEquivalent(acc.amount, acc.frequency);
        monthly += m;
        annual += calculateAnnualCost(acc.amount, acc.frequency);

        if (acc.isShared) {
          sharedCount++;
          const myPct = acc.mySharePercentage ?? 50;
          const myShareAmt = (m * myPct) / 100;
          myPortion += myShareAmt;
          othersPortion += (m - myShareAmt);
        } else {
          myPortion += m;
        }
      }
    });

    return {
      totalMonthlyEquivalent: monthly,
      totalAnnualProjected: annual,
      activeAccountsCount: activeCount,
      myConfiguredMonthlyPortion: myPortion,
      othersConfiguredMonthlyPortion: othersPortion,
      sharedAccountsCount: sharedCount,
    };
  }, [accounts]);

  // Dynamic share based on selected mode on the card
  const { displayedMyShare, displayedOtherShare, splitSubtitle } = useMemo(() => {
    if (cardSplitMode === 'split2') {
      const half = totalMonthlyEquivalent * 0.5;
      return {
        displayedMyShare: half,
        displayedOtherShare: half,
        splitSubtitle: 'Dividiendo 50% y 50% entre 2 personas',
      };
    }
    if (cardSplitMode === 'split3') {
      const third = totalMonthlyEquivalent / 3;
      return {
        displayedMyShare: third,
        displayedOtherShare: third,
        splitSubtitle: 'Dividiendo en 3 partes iguales (33.3% c/u)',
      };
    }
    return {
      displayedMyShare: myConfiguredMonthlyPortion,
      displayedOtherShare: othersConfiguredMonthlyPortion,
      splitSubtitle:
        sharedAccountsCount > 0
          ? `${sharedAccountsCount} servicio(s) compartidos según su configuración`
          : 'Según la configuración individual de cada servicio',
    };
  }, [
    cardSplitMode,
    totalMonthlyEquivalent,
    myConfiguredMonthlyPortion,
    othersConfiguredMonthlyPortion,
    sharedAccountsCount,
  ]);

  // Urgent upcoming bills (only real pending & overdue bills that the user added)
  const upcomingBills = useMemo(() => {
    return bills
      .filter((b) => b.status === 'pending' || b.status === 'overdue')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [bills]);

  // Paid bills in the selected month
  const paidBillsThisMonth = useMemo(() => {
    return bills
      .filter((b) => b.status === 'paid' && b.dueDate.startsWith(selectedMonth))
      .sort((a, b) => (b.paidDate || b.dueDate).localeCompare(a.paidDate || a.dueDate));
  }, [bills, selectedMonth]);

  // Overdue bills (any bills past due not paid)
  const overdueBills = useMemo(() => {
    return bills
      .filter((b) => {
        if (b.status === 'paid' || b.status === 'skipped' || b.status === 'cancelled') return false;
        return getDaysUntil(b.dueDate) < 0 || b.status === 'overdue';
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [bills]);

  // Category breakdown for selected month
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    monthBills.forEach((b) => {
      const cat = b.category || 'Otros';
      map[cat] = (map[cat] || 0) + (b.actualAmount ?? b.estimatedAmount);
    });

    const list = Object.entries(map).map(([name, total]) => ({
      name,
      total,
      pct: totalEstimated > 0 ? Math.round((total / totalEstimated) * 100) : 0,
    }));
    return list.sort((a, b) => b.total - a.total);
  }, [monthBills, totalEstimated]);

  // Accounts with significant price hike (>15%)
  const priceHikeAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (!a.previousAmount || !a.lastAmount) return false;
      return a.lastAmount > a.previousAmount * 1.15;
    });
  }, [accounts]);

  // Total projected monthly income
  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => {
      let monthly = inc.amount;
      if (inc.frequency === 'biweekly') monthly = inc.amount * 2;
      else if (inc.frequency === 'occasional') monthly = inc.amount / 3;
      return sum + monthly;
    }, 0);
  }, [incomes]);

  // Handle PDF Export of current selected month
  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const pendingAndOverdueThisMonth = monthBills.filter(
        (b) => b.status === 'pending' || b.status === 'overdue'
      );

      const projectedSurplus = totalMonthlyIncome - totalMonthlyEquivalent;
      const suggestedSavingsMonthly = projectedSurplus > 0 ? Math.round(projectedSurplus * 0.5) : 0;
      const daysInMonth = 30;
      const suggestedSavingsDaily =
        projectedSurplus > 0 ? Math.round(suggestedSavingsMonthly / daysInMonth) : 0;

      exportMonthlyReportToPdf({
        userName,
        monthKey: selectedMonth,
        monthLabel: formatMonthName(selectedMonth),
        currency: defaultCurrency,
        totalIncome: totalMonthlyIncome,
        totalPaid,
        totalPending,
        totalOverdue,
        totalCommitted: totalMonthlyEquivalent,
        projectedSurplus,
        suggestedSavingsMonthly,
        suggestedSavingsDaily,
        paidBills: paidBillsThisMonth.map((b) => ({
          accountName: b.accountName,
          category: b.category,
          paidDate: b.paidDate,
          dueDate: b.dueDate,
          paymentMethod: b.paymentMethod,
          receiptNumber: b.receiptNumber,
          amount: b.actualAmount ?? b.estimatedAmount,
        })),
        pendingBills: pendingAndOverdueThisMonth.map((b) => ({
          accountName: b.accountName,
          category: b.category,
          dueDate: b.dueDate,
          status: b.status,
          amount: b.estimatedAmount,
        })),
        savingsGoals: goals.map((g) => ({
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          monthlyContribution: g.monthlyContribution,
        })),
      });
    } catch (err) {
      console.error('Error al generar el PDF del mes:', err);
    } finally {
      setTimeout(() => setExportingPdf(false), 600);
    }
  };

  // Empty state handling
  if (accounts.length === 0) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting}, {userName}! Te damos la bienvenida a Cuenta Clara.
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Todavía no tenés ningún servicio o cuenta registrada. Podés cargar ejemplos reales de servicios de Argentina con un click o crear tu primera cuenta a mano.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={async () => {
              setLoadingSeed(true);
              try {
                await onSeedStarterData();
              } finally {
                setLoadingSeed(false);
              }
            }}
            disabled={loadingSeed}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loadingSeed ? 'Cargando ejemplos...' : 'Cargar servicios típicos de Argentina'}</span>
          </button>

          <button
            onClick={onOpenAddAccount}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar mi primera cuenta</span>
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Clock className="w-5 h-5 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Avisos a tiempo</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Sabé qué pagos vencen esta semana y evitá recargos o cortes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <TrendingUp className="w-5 h-5 text-teal-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Alertas de aumentos</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Detección automática de subas de más del 15% en tarifas y abonos.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CreditCard className="w-5 h-5 text-blue-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Previsión anual</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculá tus gastos fijos y reservá para pagos anuales y patentes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {greeting}, {userName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de tus compromisos para <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatMonthName(selectedMonth)}</strong>
          </p>
        </div>

        {/* Month Controls & PDF Export */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Month Picker Controls */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-100 min-w-[130px] text-center">
              {formatMonthName(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Exportar a PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="px-3.5 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs shadow-2xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Generar y descargar resumen mensual en PDF con gastos pagados, pendientes y ahorro"
          >
            <FileDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{exportingPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
          </button>
        </div>
      </div>

      {/* Proactive Due Date Notifications Banner */}
      {!dismissNotifBanner && notifPermission !== 'granted' && (
        <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                ¿Querés recibir avisos automáticos de tus vencimientos?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Activá las notificaciones push para que tu celular o navegador te recuerde cuándo pagar, aun con la app cerrada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Activar alertas</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Cerrar sugerencia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Aumento de Precios (>15%) */}
      {priceHikeAccounts.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-purple-900 dark:text-purple-200">
              Aumento significativo detectado (+15%)
            </p>
            <p className="text-purple-700 dark:text-purple-300 mt-0.5">
              Los siguientes servicios registraron incrementos superiores al 15%:{' '}
              {priceHikeAccounts.map((a) => (
                <span key={a.id} className="font-semibold underline ml-1">
                  {a.name} ({formatCurrency(a.lastAmount, a.currency)})
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards: Total este mes, Pagado, Pendiente, Vencido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total este mes */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">A pagar este mes</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 truncate">
            {formatCurrency(totalEstimated, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthBills.length} vencimientos en el mes
          </p>
        </div>

        {/* Total pagado */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ya pagado</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatCurrency(totalPaid, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthBills.filter((b) => b.status === 'paid').length} cuentas canceladas
          </p>
        </div>

        {/* Total pendiente */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendiente</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {formatCurrency(totalPending, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthBills.filter((b) => b.status === 'pending' || b.status === 'upcoming').length} por pagar
          </p>
        </div>

        {/* Total vencido */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/50 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vencido</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {formatCurrency(totalOverdue, defaultCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {overdueBills.length > 0 ? `${overdueBills.length} pagos atrasados` : 'Al día'}
          </p>
        </div>
      </div>

      {/* Overdue Alert Section if any */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>Vencimientos atrasados ({overdueBills.length})</span>
            </div>
            <span className="text-xs text-red-600 font-semibold">¡Evitá cortes y moras!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overdueBills.map((bill) => {
              const daysAgo = Math.abs(getDaysUntil(bill.dueDate));
              return (
                <div
                  key={bill.id}
                  className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between shadow-xs gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {bill.accountName}
                    </p>
                    <p className="text-[11px] text-red-600 font-medium mt-0.5 truncate">
                      Venció el {formatDateAr(bill.dueDate)} ({daysAgo} {daysAgo === 1 ? 'día' : 'días'} atrás)
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {formatCurrency(bill.estimatedAmount, bill.currency)}
                    </span>
                    <button
                      onClick={() => onOpenRecordPayment(bill)}
                      className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] transition-all shadow-xs"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sugerencia Inteligente de Ahorro Diario / Mensual basada en Excedente Proyectado */}
      <SavingsSuggestionCard
        accounts={accounts}
        incomes={incomes}
        goals={goals}
        defaultCurrency={defaultCurrency}
        onOpenAddIncome={onOpenAddIncome}
        onOpenAddGoal={onOpenAddGoal}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Alerta de Desfasaje de Flujo de Caja y Sugerencia de Prórroga */}
      <CashFlowCrunchWarning
        crunchSummary={cashFlowCrunch}
        onOpenPostponeModal={(b) => setBillToPostpone(b)}
        onQuickPostpone={
          onPostponeBill
            ? async (b, date) => onPostponeBill(b, date, false, 'Postergado rápido al cobro')
            : undefined
        }
        onNavigateToIncomes={
          onNavigateToTab ? () => onNavigateToTab('budget') : undefined
        }
      />

      {/* Main Grid: Upcoming Payments & Equivalent Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Próximos Pagos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Próximos vencimientos</span>
              </h2>

              {/* Tabs: Pendientes vs Pagados */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setVencimientosTab('pending')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    vencimientosTab === 'pending'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Pendientes</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                    {upcomingBills.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVencimientosTab('paid')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    vencimientosTab === 'paid'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Pagados ({paidBillsThisMonth.length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddBill && (
                <button
                  onClick={() => onOpenAddBill()}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                  title="Cargar la factura real que te llegó con su importe y vencimiento"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Cargar factura</span>
                </button>
              )}
              <button
                onClick={onOpenAddAccount}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva cuenta</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
            {vencimientosTab === 'pending' ? (
              <>
                {/* Recently Paid Bills Animation banner */}
                {Object.keys(recentlyPaidIds).length > 0 &&
                  bills
                    .filter((b) => recentlyPaidIds[b.id])
                    .map((paidBill) => (
                      <div
                        key={`recently-paid-${paidBill.id}`}
                        className="p-3.5 sm:p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 flex items-center justify-between gap-3 animate-fadeIn transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                          </div>
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                              ¡{paidBill.accountName} pagado!
                            </p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              Pago registrado con éxito • Desapareciendo de pendientes...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                            ✓ Pagado
                          </span>
                        </div>
                      </div>
                    ))}

                {upcomingBills.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        ¡Estás al día! No tenés cuentas pendientes por pagar
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Aparecerán aquí únicamente las facturas o cuentas que vayas cargando.
                      </p>
                    </div>
                    {onOpenAddBill && (
                      <button
                        onClick={() => onOpenAddBill()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Cargar nueva factura</span>
                      </button>
                    )}
                  </div>
                ) : (
                  upcomingBills.map((bill) => {
                    const days = getDaysUntil(bill.dueDate);
                    const acc = accounts.find((a) => a.id === bill.accountId);
                    const crunchItem = crunchBillsMap.get(bill.id);
                    return (
                      <div
                        key={bill.id}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          crunchItem ? 'border-l-4 border-amber-400 bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Fila principal superior / Información de la cuenta */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                                crunchItem
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900'
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold leading-none">
                                {bill.dueDate.split('-')[2]}
                              </span>
                              <span className="text-[9px] uppercase font-semibold text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                                {formatMonthName(bill.dueDate.slice(0, 7)).slice(0, 3)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {bill.accountName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {bill.category || 'General'} • Vence el {formatDateAr(bill.dueDate)}
                              </p>
                              {bill.postponedFrom && (
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5 truncate">
                                  🗓️ Prorrogado (original: {formatDateAr(bill.postponedFrom)})
                                </span>
                              )}
                              {crunchItem && (
                                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>Cobrás después del vencimiento (+{crunchItem.daysDifference}d)</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Importe y estado en celular (a la derecha superior, sin pisar textos) */}
                          <div className="text-right shrink-0 sm:hidden">
                            <p className="font-bold text-xs text-slate-900 dark:text-white">
                              {formatCurrency(bill.estimatedAmount, bill.currency)}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                days < 0
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : days <= 2
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {days < 0
                                ? `Venció hace ${Math.abs(days)}d`
                                : days === 0
                                ? 'Vence hoy'
                                : days === 1
                                ? 'Vence mañana'
                                : `En ${days} días`}
                            </span>
                          </div>
                        </div>

                        {/* Aviso de desfasaje de cobro en móvil (a ancho completo, limpio sin encimarse) */}
                        {crunchItem && (
                          <div className="sm:hidden w-full text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">Cobrás después del vencimiento (+{crunchItem.daysDifference}d)</span>
                          </div>
                        )}

                        {/* Barra de acciones en celular (acciones separadas: editar, eliminar y botón principal Pagar) */}
                        <div className="flex sm:hidden items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
                          <div className="flex items-center gap-1">
                            {onEditBill && (
                              <button
                                onClick={() => onEditBill(bill)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Modificar importe o fecha de este vencimiento"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteBill && (
                              <button
                                onClick={() => onDeleteBill(bill)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Eliminar este vencimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => onOpenRecordPayment(bill)}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                            title="Marcar como pagado e ingresar comprobante"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        </div>

                        {/* Columna derecha en pantallas de escritorio / tablet (pantallas medianas y grandes) */}
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {formatCurrency(bill.estimatedAmount, bill.currency)}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                                days < 0
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : days <= 2
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {days < 0
                                ? `Venció hace ${Math.abs(days)}d`
                                : days === 0
                                ? 'Vence hoy'
                                : days === 1
                                ? 'Vence mañana'
                                : `En ${days} días`}
                            </span>
                          </div>

                          {/* Botón rápido de postergar solo en pantallas grandes si hay espacio suficiente */}
                          {crunchItem && onPostponeBill && (
                            <button
                              onClick={() => setBillToPostpone(bill)}
                              className="hidden md:flex px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold text-xs shadow-xs transition-all active:scale-95 items-center gap-1 border border-amber-300/80 dark:border-amber-800"
                              title={`Postergar pago al ${formatDateAr(crunchItem.suggestedPostponeDate)} para coincidir con tu cobro`}
                            >
                              <CalendarClock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>Postergar</span>
                            </button>
                          )}

                          {/* Botón Pagar en escritorio */}
                          <button
                            onClick={() => onOpenRecordPayment(bill)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1"
                            title="Marcar como pagado e ingresar comprobante"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pagar</span>
                          </button>

                          {/* Acciones de edición y eliminación */}
                          <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                            {onEditBill && (
                              <button
                                onClick={() => onEditBill(bill)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Modificar importe o fecha de este vencimiento"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteBill && (
                              <button
                                onClick={() => onDeleteBill(bill)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Eliminar este vencimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              /* Tab: Pagados este mes */
              <>
                {paidBillsThisMonth.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No registraste pagos para este mes todavía.
                  </div>
                ) : (
                  paidBillsThisMonth.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {bill.accountName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Pagado el {formatDateAr(bill.paidDate || bill.dueDate)} • {bill.paymentMethod || 'Pago registrado'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(bill.actualAmount || bill.estimatedAmount, bill.currency)}
                        </p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-block">
                          Pagado
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Proyecciones globales y Resumen */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Presupuesto y Proyecciones</span>
          </h2>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Coste mensual equivalente
                </span>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/70 px-2 py-0.5 rounded-full">
                  Total del hogar
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
                {formatCurrency(totalMonthlyEquivalent, defaultCurrency)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Suma normalizada de todas tus cuentas activas por mes.
              </p>

              {/* Módulo Interactivo: ¿Cuánto paga cada uno? (2 o 3 personas) */}
              <div className="mt-3 p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>¿Cuánto paga cada uno?</span>
                  </div>

                  {/* Selector rápido: según cuentas, entre 2 o entre 3 */}
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-teal-200/80 dark:border-teal-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCardSplitMode('configured')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        cardSplitMode === 'configured'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Según configuración actual de cuentas"
                    >
                      Cuentas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSplitMode('split2')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        cardSplitMode === 'split2'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Simular dividir 50/50 entre 2 personas"
                    >
                      Entre 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSplitMode('split3')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        cardSplitMode === 'split3'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Simular dividir entre 3 personas (33.3% c/u)"
                    >
                      Entre 3
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900 shadow-2xs">
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold block uppercase">
                      Tu parte (Yo)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate block">
                      {formatCurrency(displayedMyShare, defaultCurrency)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900 shadow-2xs">
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block uppercase">
                      {cardSplitMode === 'split3' ? 'Otros (c/u 33%)' : 'Otros / Pareja'}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate block">
                      {formatCurrency(displayedOtherShare, defaultCurrency)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {splitSubtitle}
                </p>

                {/* BOTÓN SOLICITADO: Ver detalle de cuánto pagar de luz, agua, gas, etc. */}
                <button
                  type="button"
                  onClick={() => setIsMonthlySplitModalOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold text-xs shadow-xs flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Ver detalle: cuánto de luz, agua, gas...</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gasto anual proyectado
              </span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                {formatCurrency(totalAnnualProjected, defaultCurrency)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Proyección a 12 meses ({activeAccountsCount} servicios activos).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Info className="w-3.5 h-3.5 text-teal-600" />
                <span>Consejo financiero</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Reservá cada mes una porción para tus gastos anuales (patente, seguros) creando un objetivo en la sección Ahorro.
              </p>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Distribución por categoría ({formatMonthName(selectedMonth).split(' ')[0]})
            </h3>

            {categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No hay gastos registrados en este mes.</p>
            ) : (
              <div className="space-y-2.5">
                {categoryStats.slice(0, 4).map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="truncate max-w-[170px] text-slate-700 dark:text-slate-300">
                        {c.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, c.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETALLE DE DIVISIÓN MENSUAL (¿Cuánto debe pagar cada uno de luz, agua, etc.?) */}
      <MonthlySplitModal
        isOpen={isMonthlySplitModalOpen}
        onClose={() => setIsMonthlySplitModalOpen(false)}
        accounts={accounts}
        defaultCurrency={defaultCurrency}
      />

      {/* MODAL POSTERGAR VENCIMIENTO DE PAGO (ALERTA DE FLUJO DE CAJA) */}
      <PostponeBillModal
        isOpen={!!billToPostpone}
        onClose={() => setBillToPostpone(null)}
        bill={billToPostpone}
        nextIncome={cashFlowCrunch.nextIncome}
        onConfirmPostpone={async (bill, newDueDate, updateAccountToo, reason) => {
          if (onPostponeBill) {
            await onPostponeBill(bill, newDueDate, updateAccountToo, reason);
          }
        }}
      />
    </div>
  );
};
