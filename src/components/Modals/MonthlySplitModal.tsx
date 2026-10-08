import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Check,
  Copy,
  DollarSign,
  Share2,
  Receipt,
  Home,
  Zap,
  Droplets,
  Flame,
  Wifi,
  Smartphone,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Account, CurrencyCode } from '../../types';
import { formatCurrency, calculateMonthlyEquivalent } from '../../utils/formatters';

interface MonthlySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultCurrency: CurrencyCode;
}

type SplitMode = 'configured' | 'split2' | 'split3' | 'split4';

export const MonthlySplitModal: React.FC<MonthlySplitModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultCurrency,
}) => {
  const [splitMode, setSplitMode] = useState<SplitMode>('configured');
  const [copied, setCopied] = useState(false);
  const [person1Name, setPerson1Name] = useState('Yo');
  const [person2Name, setPerson2Name] = useState('Persona 2');
  const [person3Name, setPerson3Name] = useState('Persona 3');
  const [person4Name, setPerson4Name] = useState('Persona 4');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Only consider active accounts
  const activeAccounts = useMemo(() => {
    return accounts.filter((a) => a.status === 'active');
  }, [accounts]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeAccounts.forEach((a) => set.add(a.category || 'Otros'));
    return Array.from(set);
  }, [activeAccounts]);

  const filteredAccounts = useMemo(() => {
    if (filterCategory === 'all') return activeAccounts;
    return activeAccounts.filter((a) => (a.category || 'Otros') === filterCategory);
  }, [activeAccounts, filterCategory]);

  // Calculation per service & per person
  const { totalMonthly, breakdown, perPersonTotals } = useMemo(() => {
    let total = 0;
    let p1Total = 0;
    let p2Total = 0;
    let p3Total = 0;
    let p4Total = 0;

    const items = filteredAccounts.map((acc) => {
      const monthlyAmount = calculateMonthlyEquivalent(acc.amount, acc.frequency);
      total += monthlyAmount;

      let p1 = 0;
      let p2 = 0;
      let p3 = 0;
      let p4 = 0;
      let shareP1Pct = 50;
      let shareP2Pct = 50;
      let shareP3Pct = 0;
      let shareP4Pct = 0;
      let modeNote = '';

      if (splitMode === 'split2') {
        shareP1Pct = 50;
        shareP2Pct = 50;
        p1 = monthlyAmount * 0.5;
        p2 = monthlyAmount * 0.5;
        modeNote = '50% c/u';
      } else if (splitMode === 'split3') {
        shareP1Pct = 33.34;
        shareP2Pct = 33.33;
        shareP3Pct = 33.33;
        p1 = monthlyAmount / 3;
        p2 = monthlyAmount / 3;
        p3 = monthlyAmount / 3;
        modeNote = '1/3 c/u (33.3%)';
      } else if (splitMode === 'split4') {
        shareP1Pct = 25;
        shareP2Pct = 25;
        shareP3Pct = 25;
        shareP4Pct = 25;
        p1 = monthlyAmount * 0.25;
        p2 = monthlyAmount * 0.25;
        p3 = monthlyAmount * 0.25;
        p4 = monthlyAmount * 0.25;
        modeNote = '25% c/u';
      } else {
        // 'configured' mode: respects each account's setup
        if (acc.isShared) {
          const count = acc.splitTotalPeople || 2;
          const myPct = acc.mySharePercentage ?? 50;
          shareP1Pct = myPct;
          p1 = (monthlyAmount * myPct) / 100;

          const othersPct = Math.max(0, 100 - myPct);
          const othersCount = Math.max(1, count - 1);
          const perOtherPct = othersPct / othersCount;
          const perOtherAmt = (monthlyAmount * othersPct) / 100 / othersCount;

          if (count === 2) {
            shareP2Pct = perOtherPct;
            p2 = perOtherAmt;
            modeNote = `Compartida (${myPct}% tú / ${othersPct}% ${acc.splitNotes || person2Name})`;
          } else if (count === 3) {
            shareP2Pct = perOtherPct;
            shareP3Pct = perOtherPct;
            p2 = perOtherAmt;
            p3 = perOtherAmt;
            modeNote = `Dividida entre 3 (${myPct}% tú / ${perOtherPct.toFixed(1)}% c/u otros)`;
          } else {
            shareP2Pct = perOtherPct;
            shareP3Pct = perOtherPct;
            shareP4Pct = perOtherPct;
            p2 = perOtherAmt;
            p3 = perOtherAmt;
            p4 = perOtherAmt;
            modeNote = `Dividida entre 4 (${myPct}% tú / ${perOtherPct.toFixed(1)}% c/u otros)`;
          }
        } else {
          // 100% individual
          shareP1Pct = 100;
          shareP2Pct = 0;
          p1 = monthlyAmount;
          modeNote = '100% individual (sin compartir)';
        }
      }

      p1Total += p1;
      p2Total += p2;
      p3Total += p3;
      p4Total += p4;

      return {
        account: acc,
        monthlyAmount,
        p1,
        p2,
        p3,
        p4,
        shareP1Pct,
        shareP2Pct,
        shareP3Pct,
        shareP4Pct,
        modeNote,
      };
    });

    return {
      totalMonthly: total,
      breakdown: items,
      perPersonTotals: {
        p1: p1Total,
        p2: p2Total,
        p3: p3Total,
        p4: p4Total,
      },
    };
  }, [filteredAccounts, splitMode, person2Name]);

  const activePeopleCount = useMemo(() => {
    if (splitMode === 'split2') return 2;
    if (splitMode === 'split3') return 3;
    if (splitMode === 'split4') return 4;
    // configured: check if any account has 3 or 4 people
    let max = 2;
    activeAccounts.forEach((a) => {
      if (a.isShared && (a.splitTotalPeople || 2) > max) {
        max = a.splitTotalPeople || 2;
      }
    });
    return max;
  }, [splitMode, activeAccounts]);

  const handleCopySummary = () => {
    let text = `🧾 RESUMEN MENSUAL DE SERVICIOS - CUENTA CLARA\n`;
    text += `💰 Coste total mensual: ${formatCurrency(totalMonthly, defaultCurrency)}\n`;
    text += `----------------------------------------\n`;
    text += `👤 ${person1Name} debe pagar: ${formatCurrency(perPersonTotals.p1, defaultCurrency)}\n`;
    text += `👥 ${person2Name} debe pagar: ${formatCurrency(perPersonTotals.p2, defaultCurrency)}\n`;
    if (activePeopleCount >= 3 && perPersonTotals.p3 > 0) {
      text += `👥 ${person3Name} debe pagar: ${formatCurrency(perPersonTotals.p3, defaultCurrency)}\n`;
    }
    if (activePeopleCount >= 4 && perPersonTotals.p4 > 0) {
      text += `👥 ${person4Name} debe pagar: ${formatCurrency(perPersonTotals.p4, defaultCurrency)}\n`;
    }
    text += `----------------------------------------\n`;
    text += `📋 DETALLE POR SERVICIO:\n`;

    breakdown.forEach((item) => {
      text += `• ${item.account.name}: Total ${formatCurrency(item.monthlyAmount, defaultCurrency)}\n`;
      text += `   - ${person1Name}: ${formatCurrency(item.p1, defaultCurrency)}\n`;
      text += `   - ${person2Name}: ${formatCurrency(item.p2, defaultCurrency)}\n`;
      if (activePeopleCount >= 3 && item.p3 > 0) {
        text += `   - ${person3Name}: ${formatCurrency(item.p3, defaultCurrency)}\n`;
      }
      if (activePeopleCount >= 4 && item.p4 > 0) {
        text += `   - ${person4Name}: ${formatCurrency(item.p4, defaultCurrency)}\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (categoryName?: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('luz') || cat.includes('electric') || cat.includes('energ')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (cat.includes('agua') || cat.includes('aysa')) return <Droplets className="w-4 h-4 text-cyan-500" />;
    if (cat.includes('gas')) return <Flame className="w-4 h-4 text-orange-500" />;
    if (cat.includes('internet') || cat.includes('wifi') || cat.includes('telecom')) return <Wifi className="w-4 h-4 text-blue-500" />;
    if (cat.includes('alquiler') || cat.includes('expensas') || cat.includes('vivienda')) return <Home className="w-4 h-4 text-teal-500" />;
    if (cat.includes('móvil') || cat.includes('celular') || cat.includes('telefon')) return <Smartphone className="w-4 h-4 text-indigo-500" />;
    if (cat.includes('seguro')) return <Shield className="w-4 h-4 text-emerald-500" />;
    return <Receipt className="w-4 h-4 text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92dvh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>¿Cuánto debe pagar cada uno?</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                  Coste mensual equivalente
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desglose exacto de servicios compartidos entre 2, 3 o 4 personas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              }`}
              title="Copiar texto listo para enviar por WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado para WhatsApp!' : 'Copiar para WhatsApp'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-teal-500/30 hover:scrollbar-thumb-teal-500">
          {/* Selector de Modo de División */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Modalidad de cálculo para la división:</span>
              </span>

              {/* Botones de modo */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSplitMode('configured')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    splitMode === 'configured'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Según cada cuenta
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('split2')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    splitMode === 'split2'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Dividir entre 2 (50/50)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('split3')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    splitMode === 'split3'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Dividir entre 3 (33% c/u)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('split4')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    splitMode === 'split4'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Entre 4 (25% c/u)
                </button>
              </div>
            </div>

            {/* Custom person names input for clarity */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Nombres para el resumen:</span>
              <input
                type="text"
                value={person1Name}
                onChange={(e) => setPerson1Name(e.target.value)}
                placeholder="Yo"
                className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-teal-700 dark:text-teal-400"
                title="Nombre de la primera persona (tú)"
              />
              <input
                type="text"
                value={person2Name}
                onChange={(e) => setPerson2Name(e.target.value)}
                placeholder="Persona 2"
                className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                title="Nombre de la segunda persona (ej. Pareja / Roommate)"
              />
              {activePeopleCount >= 3 && (
                <input
                  type="text"
                  value={person3Name}
                  onChange={(e) => setPerson3Name(e.target.value)}
                  placeholder="Persona 3"
                  className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  title="Nombre de la tercera persona"
                />
              )}
              {activePeopleCount >= 4 && (
                <input
                  type="text"
                  value={person4Name}
                  onChange={(e) => setPerson4Name(e.target.value)}
                  placeholder="Persona 4"
                  className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  title="Nombre de la cuarta persona"
                />
              )}
            </div>
          </div>

          {/* KPI CARDS: Total y Cuánto le toca a cada uno */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Global */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Servicios</span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                {formatCurrency(totalMonthly, defaultCurrency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {filteredAccounts.length} servicios mensuales
              </p>
            </div>

            {/* Persona 1 (Yo) */}
            <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300 truncate">
                  {person1Name} (Tu parte)
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-0.5 truncate">
                {formatCurrency(perPersonTotals.p1, defaultCurrency)}
              </p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium">
                {totalMonthly > 0 ? `${Math.round((perPersonTotals.p1 / totalMonthly) * 100)}% del total` : '0%'}
              </p>
            </div>

            {/* Persona 2 */}
            <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300 truncate">
                  {person2Name}
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5 truncate">
                {formatCurrency(perPersonTotals.p2, defaultCurrency)}
              </p>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
                {totalMonthly > 0 ? `${Math.round((perPersonTotals.p2 / totalMonthly) * 100)}% del total` : '0%'}
              </p>
            </div>

            {/* Persona 3 o Resumen */}
            {activePeopleCount >= 3 ? (
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 truncate">
                    {person3Name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>
                <p className="text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5 truncate">
                  {formatCurrency(perPersonTotals.p3, defaultCurrency)}
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                  {totalMonthly > 0 ? `${Math.round((perPersonTotals.p3 / totalMonthly) * 100)}% del total` : '0%'}
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total a cobrar/compartir</span>
                <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {formatCurrency(perPersonTotals.p2 + perPersonTotals.p3 + perPersonTotals.p4, defaultCurrency)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Suma que cubren las otras personas
                </p>
              </div>
            )}
          </div>

          {/* Filtro rápido por categoría */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold shrink-0">Filtrar:</span>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos ({activeAccounts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* LISTA DE SERVICIOS Y CUÁNTO CORRESPONDE DE CADA UNO (Luz, Agua, Gas, Alquiler, etc.) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                <span>Desglose por servicio individual (Luz, Agua, Gas, Alquiler, etc.)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                {breakdown.length} servicios mostrados
              </span>
            </div>

            {breakdown.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay servicios activos en esta categoría.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70 bg-white dark:bg-slate-900">
                {breakdown.map((item) => (
                  <div
                    key={item.account.id}
                    className="p-3 sm:px-4 sm:py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
                  >
                    {/* Left: Service name, category, total monthly */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.account.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.account.name}
                          </h4>
                          {item.account.provider && (
                            <span className="text-[11px] text-slate-400">
                              ({item.account.provider})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{item.account.category || 'Otros'}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Total mensual: {formatCurrency(item.monthlyAmount, defaultCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Mode note */}
                    <div className="text-[10px] text-slate-400 italic hidden md:block max-w-[150px] truncate">
                      {item.modeNote}
                    </div>

                    {/* Right: Amounts per person */}
                    <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
                      {/* Persona 1 (Yo) */}
                      <div className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-right min-w-[90px]">
                        <span className="block text-[9px] uppercase font-bold text-teal-700 dark:text-teal-300 truncate">
                          {person1Name}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-teal-800 dark:text-teal-200">
                          {formatCurrency(item.p1, defaultCurrency)}
                        </span>
                      </div>

                      {/* Persona 2 */}
                      <div className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-right min-w-[90px]">
                        <span className="block text-[9px] uppercase font-bold text-sky-700 dark:text-sky-300 truncate">
                          {person2Name}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-sky-800 dark:text-sky-200">
                          {formatCurrency(item.p2, defaultCurrency)}
                        </span>
                      </div>

                      {/* Persona 3 if applicable */}
                      {activePeopleCount >= 3 && (
                        <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-right min-w-[90px]">
                          <span className="block text-[9px] uppercase font-bold text-indigo-700 dark:text-indigo-300 truncate">
                            {person3Name}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-indigo-800 dark:text-indigo-200">
                            {formatCurrency(item.p3, defaultCurrency)}
                          </span>
                        </div>
                      )}

                      {/* Persona 4 if applicable */}
                      {activePeopleCount >= 4 && (
                        <div className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-right min-w-[90px]">
                          <span className="block text-[9px] uppercase font-bold text-purple-700 dark:text-purple-300 truncate">
                            {person4Name}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-purple-800 dark:text-purple-200">
                            {formatCurrency(item.p4, defaultCurrency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0 pb-safe">
          <div className="text-xs text-slate-500 hidden sm:block">
            Podés configurar o ajustar la división de cada servicio individualmente desde la sección <strong>Cuentas</strong>.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Texto copiado!' : 'Copiar desglose completo'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
