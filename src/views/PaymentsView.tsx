import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Calendar,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { Payment, CurrencyCode, DEFAULT_CATEGORIES } from '../types';
import { formatCurrency, formatDateAr } from '../utils/formatters';
import { exportPaymentsToCSV } from '../services/firestoreService';

interface PaymentsViewProps {
  payments: Payment[];
  onDeletePayment: (paymentId: string) => Promise<void>;
  defaultCurrency: CurrencyCode;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  onDeletePayment,
  defaultCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter & sort payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (searchTerm.trim()) {
          const t = searchTerm.toLowerCase();
          const matchName = p.accountName.toLowerCase().includes(t);
          const matchReceipt = (p.receiptNumber || '').toLowerCase().includes(t);
          const matchNotes = (p.notes || '').toLowerCase().includes(t);
          if (!matchName && !matchReceipt && !matchNotes) return false;
        }

        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (selectedCurrency !== 'all' && p.currency !== selectedCurrency) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = a.paymentDate.localeCompare(b.paymentDate);
        } else if (sortBy === 'amount') {
          diff = a.amount - b.amount;
        } else if (sortBy === 'name') {
          diff = a.accountName.localeCompare(b.accountName);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [payments, searchTerm, selectedCategory, selectedCurrency, sortBy, sortOrder]);

  const totalPaidSum = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const handleExport = () => {
    exportPaymentsToCSV(filteredPayments);
  };

  return (
    <div className="space-y-6">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Historial de Pagos Realizados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro contable de todos tus comprobantes y cancelaciones ({filteredPayments.length} pagos).
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredPayments.length === 0}
          className="self-start sm:self-auto px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cuenta, número de comprobante o nota..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todas las categorías</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Moneda
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todas las monedas</option>
              <option value="ARS">ARS (Pesos)</option>
              <option value="USD">USD (Dólares)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Ordenar por
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="date">Fecha de pago</option>
                <option value="amount">Importe</option>
                <option value="name">Nombre</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                title="Invertir orden"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            Total histórico registrado (filtrado)
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-900 dark:text-white mt-0.5">
            {formatCurrency(totalPaidSum, defaultCurrency)}
          </p>
        </div>
        <Receipt className="w-8 h-8 text-teal-600 dark:text-teal-400 opacity-60" />
      </div>

      {/* Payments List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No hay pagos registrados con los criterios seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {p.accountName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.category} • Pagado el {formatDateAr(p.paymentDate)}
                    </p>
                    {p.receiptNumber && (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                        Comprobante: {p.receiptNumber}
                      </p>
                    )}
                    {p.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5 italic">"{p.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-13 sm:pl-0">
                  <div className="text-right">
                    <p className="font-extrabold text-base text-slate-900 dark:text-white">
                      {formatCurrency(p.amount, p.currency)}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {p.paymentMethod || 'Manual'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeletePayment(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Eliminar este comprobante del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
