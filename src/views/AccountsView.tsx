import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  MoreVertical,
  Edit3,
  Pause,
  Play,
  Copy,
  Archive,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  CreditCard,
  Ban,
  Check,
  LayoutList,
  Table as TableIcon,
  Receipt,
} from 'lucide-react';
import { Account, AccountFrequency, AccountStatus, CurrencyCode, DEFAULT_CATEGORIES } from '../types';
import {
  formatCurrency,
  formatDateAr,
  calculateMonthlyEquivalent,
  calculateAnnualCost,
} from '../utils/formatters';
import { getDaysUntil } from '../utils/recurrence';

interface AccountsViewProps {
  accounts: Account[];
  onOpenAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDuplicateAccount: (account: Account) => Promise<void>;
  onTogglePauseAccount: (account: Account) => Promise<void>;
  onCancelAccount: (account: Account) => Promise<void>;
  onArchiveAccount: (account: Account) => Promise<void>;
  onDeleteAccount: (account: Account) => void;
  onOpenAddBill?: (accountId?: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onOpenAddAccount,
  onEditAccount,
  onDuplicateAccount,
  onTogglePauseAccount,
  onCancelAccount,
  onArchiveAccount,
  onDeleteAccount,
  onOpenAddBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'dueDate' | 'annualCost'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'horizontal' | 'table'>('horizontal');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Filter & sort logic
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesName = acc.name.toLowerCase().includes(term);
          const matchesProvider = (acc.provider || '').toLowerCase().includes(term);
          const matchesNotes = (acc.notes || '').toLowerCase().includes(term);
          if (!matchesName && !matchesProvider && !matchesNotes) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && acc.category !== selectedCategory) return false;

        // Status filter
        if (selectedStatus !== 'all' && acc.status !== selectedStatus) return false;

        // Currency filter
        if (selectedCurrency !== 'all' && acc.currency !== selectedCurrency) return false;

        // Frequency filter
        if (selectedFrequency !== 'all' && acc.frequency !== selectedFrequency) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortBy === 'amount') {
          diff = a.amount - b.amount;
        } else if (sortBy === 'dueDate') {
          diff = (a.nextDueDate || '').localeCompare(b.nextDueDate || '');
        } else if (sortBy === 'annualCost') {
          const costA = calculateAnnualCost(a.amount, a.frequency);
          const costB = calculateAnnualCost(b.amount, b.frequency);
          diff = costA - costB;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    accounts,
    searchTerm,
    selectedCategory,
    selectedStatus,
    selectedCurrency,
    selectedFrequency,
    sortBy,
    sortOrder,
  ]);

  const toggleSort = (field: 'name' | 'amount' | 'dueDate' | 'annualCost') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Activa
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            Pausada
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            Cancelada
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Archivada
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Cuentas y Servicios Recurrentes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administrá todos tus servicios, suscripciones y vencimientos ({filteredAccounts.length} de {accounts.length}).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'horizontal'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en tarjetas horizontales compactas"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Filas compactas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabla</span>
            </button>
          </div>

          <button
            onClick={onOpenAddAccount}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de cuenta, proveedor o notas..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Categoría */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todas las categorías</option>
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="paused">Pausadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="archived">Archivadas</option>
            </select>
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Moneda
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todas las monedas</option>
              <option value="ARS">ARS (Pesos)</option>
              <option value="USD">USD (Dólares)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Frecuencia
            </label>
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todas las frecuencias</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimestral</option>
              <option value="quarterly">Trimestral</option>
              <option value="semiannual">Semestral</option>
              <option value="annual">Anual</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'horizontal' ? (
        /* HORIZONTAL COMPACT CARDS VIEW */
        <div className="space-y-2.5">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              No se encontraron cuentas con los filtros seleccionados.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const monthlyEq = calculateMonthlyEquivalent(acc.amount, acc.frequency);
              const annualEst = calculateAnnualCost(acc.amount, acc.frequency);
              const daysUntil = acc.nextDueDate ? getDaysUntil(acc.nextDueDate) : null;

              return (
                <div
                  key={acc.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Identity & Badges */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-extrabold text-xs shrink-0 border border-teal-100 dark:border-teal-900 uppercase">
                      {acc.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </h3>
                        {getStatusBadge(acc.status)}
                        {acc.amountType === 'variable' && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800"
                            title="Importe variable corregible al pagar"
                          >
                            Variable
                          </span>
                        )}
                        {acc.autopay && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800"
                            title="Débito automático activado"
                          >
                            Débito
                          </span>
                        )}
                        {acc.isShared && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800"
                            title={`Dividida (${acc.mySharePercentage || 50}% tuyo)`}
                          >
                            Dividida {acc.mySharePercentage || 50}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {acc.provider ? `${acc.provider} • ` : ''}
                        <span className="text-slate-500 font-medium">{acc.category}</span>
                      </p>
                    </div>
                  </div>

                  {/* Center: Vencimiento + Importe + Coste mensual */}
                  <div className="flex items-center gap-3 sm:gap-6 bg-slate-50 dark:bg-slate-800/40 p-2 sm:p-2.5 rounded-lg shrink-0 justify-between sm:justify-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Próx. Vencimiento
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatDateAr(acc.nextDueDate)}
                      </span>
                      {daysUntil !== null && (
                        <span
                          className={`text-[10px] font-semibold ml-1.5 ${
                            daysUntil < 0
                              ? 'text-red-600'
                              : daysUntil <= (acc.noticeDays || 3)
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          ({daysUntil < 0 ? `Vencida ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Hoy' : `${daysUntil}d`})
                        </span>
                      )}
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-700 pl-3 sm:pl-5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {acc.frequency === 'monthly' ? 'Mensual' : acc.frequency}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(acc.amount, acc.currency)}
                      </span>
                      {acc.isShared && (
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                          Tu parte: {formatCurrency((acc.amount * (acc.mySharePercentage || 50)) / 100, acc.currency)}
                        </p>
                      )}
                    </div>

                    <div className="hidden lg:block border-l border-slate-200 dark:border-slate-700 pl-3 sm:pl-5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Coste anual
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {formatCurrency(annualEst, acc.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions with prominent ELIMINAR */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {onOpenAddBill && (
                      <button
                        onClick={() => onOpenAddBill(acc.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center gap-1 transition-colors border border-teal-200/60 dark:border-teal-800/60"
                        title={`Cargar factura / nuevo vencimiento para "${acc.name}"`}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cargar factura</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditAccount(acc)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                      title="Editar cuenta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => onTogglePauseAccount(acc)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      title={acc.status === 'paused' ? 'Reactivar cuenta' : 'Pausar cuenta'}
                    >
                      {acc.status === 'paused' ? (
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onDuplicateAccount(acc)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Duplicar cuenta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* BOTÓN ELIMINAR DESTACADO */}
                    <button
                      onClick={() => onDeleteAccount(acc)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-semibold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-colors"
                      title="Eliminar este servicio definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW (Overflow-x auto + compact cells) */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th
                    onClick={() => toggleSort('name')}
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Cuenta / Proveedor</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Categoría</th>
                  <th
                    onClick={() => toggleSort('dueDate')}
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Próx. Vencimiento</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('amount')}
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Importe</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Coste Mensual</th>
                  <th
                    onClick={() => toggleSort('annualCost')}
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Coste Anual</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Estado</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No se encontraron cuentas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const monthlyEq = calculateMonthlyEquivalent(acc.amount, acc.frequency);
                    const annualEst = calculateAnnualCost(acc.amount, acc.frequency);
                    const daysUntil = acc.nextDueDate ? getDaysUntil(acc.nextDueDate) : null;

                    return (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {acc.name}
                            </span>
                            {acc.amountType === 'variable' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                                Variable
                              </span>
                            )}
                            {acc.autopay && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
                                Débito
                              </span>
                            )}
                            {acc.isShared && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                                Dividida {acc.mySharePercentage || 50}%
                              </span>
                            )}
                          </div>
                          {acc.provider && (
                            <p className="text-[11px] text-slate-400">{acc.provider}</p>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {acc.category}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatDateAr(acc.nextDueDate)}
                          </span>
                          {daysUntil !== null && (
                            <span
                              className={`text-[10px] font-semibold ml-1.5 ${
                                daysUntil < 0
                                  ? 'text-red-600'
                                  : daysUntil <= (acc.noticeDays || 3)
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              ({daysUntil < 0 ? `Venció hace ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Hoy' : `En ${daysUntil}d`})
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(acc.amount, acc.currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-semibold uppercase">
                            ({acc.frequency})
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5 font-semibold text-teal-700 dark:text-teal-400">
                          {formatCurrency(monthlyEq, acc.currency)}
                        </td>

                        <td className="py-2.5 px-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(annualEst, acc.currency)}
                        </td>

                        <td className="py-2.5 px-3.5">{getStatusBadge(acc.status)}</td>

                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditAccount(acc)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Editar cuenta"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => onTogglePauseAccount(acc)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title={acc.status === 'paused' ? 'Reactivar' : 'Pausar'}
                            >
                              {acc.status === 'paused' ? (
                                <Play className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => onDuplicateAccount(acc)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Duplicar cuenta"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteAccount(acc)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-200 dark:border-rose-900 transition-colors"
                              title="Eliminar cuenta"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
