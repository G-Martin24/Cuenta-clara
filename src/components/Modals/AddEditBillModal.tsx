import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';
import { Account, BillInstance, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AddEditBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  billToEdit?: BillInstance | null;
  preselectedAccountId?: string;
  defaultCurrency: CurrencyCode;
  onSave: (billData: {
    accountId: string;
    accountName: string;
    category?: string;
    dueDate: string;
    amount: number;
    currency: CurrencyCode;
    notes?: string;
    isShared?: boolean;
    splitTotalPeople?: number;
    mySharePercentage?: number;
  }) => Promise<void>;
  onOpenAddAccount?: () => void;
}

export const AddEditBillModal: React.FC<AddEditBillModalProps> = ({
  isOpen,
  onClose,
  accounts,
  billToEdit,
  preselectedAccountId,
  defaultCurrency,
  onSave,
  onOpenAddAccount,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [splitPeople, setSplitPeople] = useState<number>(2);
  const [myPct, setMyPct] = useState<number>(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (billToEdit) {
      setSelectedAccountId(billToEdit.accountId);
      setAmount(billToEdit.estimatedAmount);
      setCurrency(billToEdit.currency);
      setDueDate(billToEdit.dueDate);
      setNotes(billToEdit.notes || '');
      setIsShared(!!billToEdit.isShared);
      setSplitPeople(billToEdit.splitTotalPeople || 2);
      setMyPct(billToEdit.mySharePercentage !== undefined ? billToEdit.mySharePercentage : 50);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      const accId = preselectedAccountId || (accounts.length > 0 ? accounts[0].id : '');
      setSelectedAccountId(accId);
      if (accId) {
        const found = accounts.find((a) => a.id === accId);
        if (found) {
          setAmount(found.lastAmount || found.amount || '');
          setCurrency(found.currency || defaultCurrency);
          setIsShared(!!found.isShared);
          setSplitPeople(found.splitTotalPeople || 2);
          setMyPct(found.mySharePercentage !== undefined ? found.mySharePercentage : 50);
          if (found.nextDueDate) {
            setDueDate(found.nextDueDate);
          }
        }
      } else {
        setAmount('');
        setCurrency(defaultCurrency);
        setIsShared(false);
      }
      setNotes('');
    }
    setError(null);
  }, [billToEdit, preselectedAccountId, accounts, defaultCurrency, isOpen]);

  const handleAccountChange = (id: string) => {
    setSelectedAccountId(id);
    const found = accounts.find((a) => a.id === id);
    if (found) {
      setAmount(found.lastAmount || found.amount || '');
      setCurrency(found.currency);
      setIsShared(!!found.isShared);
      setSplitPeople(found.splitTotalPeople || 2);
      setMyPct(found.mySharePercentage !== undefined ? found.mySharePercentage : 50);
      if (found.nextDueDate) {
        setDueDate(found.nextDueDate);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError('Por favor seleccioná el servicio o cuenta.');
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      setError('Por favor ingresá un importe válido mayor a 0.');
      return;
    }

    if (!dueDate) {
      setError('Por favor seleccioná la fecha de vencimiento.');
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId);
    const accountName = account ? account.name : (billToEdit ? billToEdit.accountName : 'Servicio');
    const category = account ? account.category : (billToEdit ? billToEdit.category : 'Servicios');

    setSaving(true);
    try {
      await onSave({
        accountId: selectedAccountId,
        accountName,
        category,
        dueDate,
        amount,
        currency,
        notes: notes.trim(),
        isShared,
        splitTotalPeople: isShared ? splitPeople : 1,
        mySharePercentage: isShared ? myPct : 100,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el vencimiento.');
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {billToEdit ? 'Modificar Vencimiento' : 'Cargar Factura / Vencimiento'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {billToEdit
                  ? 'Ajustá el importe real o la fecha de pago'
                  : 'Registrá la factura que llegó con su monto y fecha exacta'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cuenta o Servicio *
              </label>
              {onOpenAddAccount && !billToEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddAccount();
                  }}
                  className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Crear nueva cuenta</span>
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>No tenés servicios creados todavía.</span>
                {onOpenAddAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddAccount();
                    }}
                    className="font-bold underline ml-2"
                  >
                    Crear uno ahora
                  </button>
                )}
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                disabled={!!billToEdit}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden disabled:opacity-75"
              >
                <option value="">Seleccionar un servicio...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.category || 'General'})
                  </option>
                ))}
              </select>
            )}
            {selectedAccount && (
              <p className="text-[11px] text-slate-400 mt-1">
                Frecuencia: {selectedAccount.frequency} • Proveedor: {selectedAccount.provider || 'No especificado'}
              </p>
            )}
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Importe de la Factura *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (u$s)</option>
                <option value="EUR">EUR (€)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="UYU">UYU ($U)</option>
                <option value="CLP">CLP ($)</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Fecha de Vencimiento *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Solo este vencimiento figurará en tu lista de próximos pagos.
            </p>
          </div>

          {/* Shared expense toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Gasto compartido (dividir con convivientes / pareja)
              </span>
            </label>

            {isShared && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Personas en total
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={splitPeople}
                    onChange={(e) => setSplitPeople(Math.max(2, parseInt(e.target.value, 10) || 2))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mi porcentaje ({myPct}%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={myPct}
                    onChange={(e) => setMyPct(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 50)))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                {typeof amount === 'number' && amount > 0 && (
                  <div className="col-span-2 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2 rounded-md">
                    Tu parte a pagar: <strong>{formatCurrency((amount * myPct) / 100, currency)}</strong> (el resto: {formatCurrency(amount - (amount * myPct) / 100, currency)})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Notas / N° de Factura (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Período Octubre / Factura B-00129"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedAccountId}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Receipt className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : billToEdit ? 'Actualizar vencimiento' : 'Guardar vencimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
