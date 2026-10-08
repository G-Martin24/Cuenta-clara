import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Layers,
  Building,
  CreditCard,
  Link,
  FileText,
  AlertCircle,
  Eye,
  Check,
  Users,
  Trash2,
} from 'lucide-react';
import {
  Account,
  AccountFrequency,
  AmountType,
  CurrencyCode,
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
} from '../../types';
import {
  formatCurrency,
  calculateMonthlyEquivalent,
  calculateAnnualCost,
  formatDateAr,
} from '../../utils/formatters';
import { generateNextDates } from '../../utils/recurrence';

interface AddEditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    accountData: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    updateFutureBills?: boolean
  ) => Promise<void>;
  accountToEdit?: Account | null;
  defaultCurrency: CurrencyCode;
  onDeleteAccount?: (account: Account) => void;
}

export const AddEditAccountModal: React.FC<AddEditAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
  defaultCurrency,
  onDeleteAccount,
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [amountType, setAmountType] = useState<AmountType>('fixed');
  const [frequency, setFrequency] = useState<AccountFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [dueDay, setDueDay] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [autopay, setAutopay] = useState(false);
  const [noticeDays, setNoticeDays] = useState(3);
  const [providerUrl, setProviderUrl] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [splitTotalPeople, setSplitTotalPeople] = useState<number>(2);
  const [mySharePercentage, setMySharePercentage] = useState<number>(50);
  const [splitNotes, setSplitNotes] = useState('');
  const [updateFutureBills, setUpdateFutureBills] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setProvider(accountToEdit.provider || '');
      setCategory(accountToEdit.category);
      setAmount(accountToEdit.amount);
      setCurrency(accountToEdit.currency);
      setAmountType(accountToEdit.amountType);
      setFrequency(accountToEdit.frequency);
      setNextDueDate(accountToEdit.nextDueDate || '');
      setDueDay(accountToEdit.dueDay || 10);
      setPaymentMethod(accountToEdit.paymentMethod || PAYMENT_METHODS[0]);
      setAutopay(!!accountToEdit.autopay);
      setNoticeDays(accountToEdit.noticeDays ?? 3);
      setProviderUrl(accountToEdit.providerUrl || '');
      setClientNumber(accountToEdit.clientNumber || '');
      setNotes(accountToEdit.notes || '');
      setIsShared(!!accountToEdit.isShared);
      setSplitTotalPeople(accountToEdit.splitTotalPeople || 2);
      setMySharePercentage(accountToEdit.mySharePercentage !== undefined ? accountToEdit.mySharePercentage : 50);
      setSplitNotes(accountToEdit.splitNotes || '');
    } else {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const defaultDate = `${currentYear}-${currentMonth}-10`;

      setName('');
      setProvider('');
      setCategory(DEFAULT_CATEGORIES[0].name);
      setAmount('');
      setCurrency(defaultCurrency);
      setAmountType('fixed');
      setFrequency('monthly');
      setNextDueDate(defaultDate);
      setDueDay(10);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setAutopay(false);
      setNoticeDays(3);
      setProviderUrl('');
      setClientNumber('');
      setNotes('');
      setIsShared(false);
      setSplitTotalPeople(2);
      setMySharePercentage(50);
      setSplitNotes('');
    }
    setError(null);
  }, [accountToEdit, defaultCurrency, isOpen]);

  // Keep dueDay synced if nextDueDate changes
  const handleDateChange = (dateVal: string) => {
    setNextDueDate(dateVal);
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      const dayNum = parseInt(parts[2], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        setDueDay(dayNum);
      }
    }
  };

  // Preview calculations
  const numAmount = typeof amount === 'number' ? amount : 0;
  const myPortionAmount = isShared ? (numAmount * mySharePercentage) / 100 : numAmount;
  const otherPortionAmount = isShared ? numAmount - myPortionAmount : 0;

  const monthlyCost = calculateMonthlyEquivalent(myPortionAmount, frequency);
  const annualCost = calculateAnnualCost(myPortionAmount, frequency);
  const previewDates = nextDueDate
    ? generateNextDates(nextDueDate, frequency, 4, dueDay)
    : [];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor ingresá el nombre de la cuenta o servicio.');
      return;
    }

    if (typeof amount !== 'number' || amount < 0) {
      setError('Por favor ingresá un importe válido (mayor o igual a cero).');
      return;
    }

    if (!nextDueDate) {
      setError('Por favor seleccioná la próxima fecha de vencimiento.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          provider: provider.trim(),
          category,
          amount,
          currency,
          amountType,
          frequency,
          nextDueDate,
          dueDay,
          paymentMethod,
          autopay,
          noticeDays,
          providerUrl: providerUrl.trim(),
          clientNumber: clientNumber.trim(),
          notes: notes.trim(),
          status: accountToEdit?.status || 'active',
          color: '#0f766e',
          icon: 'Receipt',
          isShared,
          splitTotalPeople: isShared ? splitTotalPeople : 1,
          mySharePercentage: isShared ? mySharePercentage : 100,
          splitNotes: isShared ? splitNotes.trim() : '',
        },
        updateFutureBills
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la cuenta. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl lg:max-w-6xl max-h-[92dvh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header (fixed at top with direct Save/Create button so user never has to zoom out) */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {accountToEdit ? 'Editar cuenta o servicio' : 'Agregar cuenta o servicio'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registrá suscripciones, servicios públicos, seguros o gastos compartidos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {accountToEdit && (
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount?.(accountToEdit);
                  onClose();
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-colors"
                title="Eliminar este servicio permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}

            {/* BOTÓN RÁPIDO EN CABECERA: Permite guardar de inmediato sin tener que bajar ni achicar zoom */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              title={accountToEdit ? 'Guardar cambios' : 'Crear cuenta'}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Guardando...' : accountToEdit ? 'Guardar' : 'Crear cuenta'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable form body with visible scrollbar */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-teal-500/30 hover:scrollbar-thumb-teal-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* Columna Izquierda: Datos principales del servicio */}
              <div className="space-y-3">
                {/* Nombre y Proveedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre de la cuenta *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Edenor, Fibertel, Alquiler"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Proveedor / Empresa
                    </label>
                    <input
                      type="text"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder="Ej. Telecom, Edesur, Propietario"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Categoría y Tipo de importe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de importe *
                    </label>
                    <select
                      value={amountType}
                      onChange={(e) => setAmountType(e.target.value as AmountType)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="fixed">Fijo (ej. abono mensual)</option>
                      <option value="variable">Variable (ej. luz, gas, agua)</option>
                      <option value="estimated">Estimado</option>
                    </select>
                  </div>
                </div>

                {/* Importe y Moneda */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {amountType === 'variable' ? 'Importe estimado actual *' : 'Importe *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-slate-400 font-semibold text-sm">
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
                        className="w-full pl-14 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="ARS">ARS ($)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Frecuencia y Próximo Vencimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Frecuencia de pago *
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as AccountFrequency)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="bimonthly">Bimestral (cada 2 meses)</option>
                      <option value="quarterly">Trimestral (cada 3 meses)</option>
                      <option value="semiannual">Semestral (cada 6 meses)</option>
                      <option value="annual">Anual</option>
                      <option value="weekly">Semanal</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Próximo vencimiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={nextDueDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Pago, Anticipación y Notas */}
              <div className="space-y-3">
                {/* Método de Pago y Autopago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Método de pago habitual
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autopay}
                        onChange={(e) => setAutopay(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Débito automático
                        </span>
                        <p className="text-[10px] text-slate-500">Se debita solo de tu cuenta bancaria</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Días de anticipación y Nº de cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Avisar antes del vencimiento
                    </label>
                    <select
                      value={noticeDays}
                      onChange={(e) => setNoticeDays(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={1}>1 día antes</option>
                      <option value={2}>2 días antes</option>
                      <option value={3}>3 días antes</option>
                      <option value={5}>5 días antes</option>
                      <option value={7}>7 días antes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nº de cliente / cuenta (opcional)
                    </label>
                    <input
                      type="text"
                      value={clientNumber}
                      onChange={(e) => setClientNumber(e.target.value)}
                      placeholder="Ej. 1029384756"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Notas y URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sitio web para pagar (URL)
                    </label>
                    <input
                      type="url"
                      value={providerUrl}
                      onChange={(e) => setProviderUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notas y comentarios
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Titular, clave autogestión"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DIVIDIR CUENTAS / COMPARTIR PAGO (Diseño Horizontal Ancho) */}
            <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Dividir cuenta con otra persona
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5 hidden sm:inline">
                      (alquileres, luz, gas o expensas compartidas)
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                />
              </label>

              {isShared && (
                <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/40 space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Dividir entre
                      </label>
                      <div className="flex items-center gap-1">
                        {[2, 3, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              setSplitTotalPeople(count);
                              setMySharePercentage(Math.round(100 / count));
                            }}
                            className={`flex-1 py-1 text-xs font-bold rounded border transition-colors ${
                              splitTotalPeople === count
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {count} pers.
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Tu parte (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={mySharePercentage}
                          onChange={(e) => setMySharePercentage(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                        <span className="absolute right-2.5 top-1 text-[11px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        ¿Con quién dividís?
                      </label>
                      <input
                        type="text"
                        value={splitNotes}
                        onChange={(e) => setSplitNotes(e.target.value)}
                        placeholder="Ej. Pareja, Roommate"
                        className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Compact calculated tag */}
                  <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900 text-xs">
                    <span className="text-slate-500">
                      Total servicio: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(numAmount, currency)}</strong>
                    </span>
                    <span className="text-teal-700 dark:text-teal-300 font-bold">
                      Tu pago ({mySharePercentage}%): {formatCurrency(myPortionAmount, currency)}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      A cobrar a otros ({100 - mySharePercentage}%): <strong>{formatCurrency(otherPortionAmount, currency)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* If editing, option to update future bills */}
            {accountToEdit && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateFutureBills}
                    onChange={(e) => setUpdateFutureBills(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Actualizar también el importe y nombre en los vencimientos futuros pendientes
                  </span>
                </label>
              </div>
            )}

            {/* LIVE PREVIEW (Diseño horizontal y compacto) */}
            <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista previa de impacto</span>
                </div>
                {isShared && (
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                    Dividido ({mySharePercentage}% propio / {100 - mySharePercentage}% otros)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">1er Vencimiento</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {formatDateAr(nextDueDate) || '-'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Próximas fechas</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 text-[11px] truncate">
                    {previewDates.slice(1, 4).map(formatDateAr).join(', ') || '-'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Mensual equiv.</p>
                  <p className="font-bold text-teal-700 dark:text-teal-400 truncate">
                    {formatCurrency(monthlyCost, currency)}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Anual estimado</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {formatCurrency(annualCost, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer buttons (ALWAYS VISIBLE AT BOTTOM) */}
          <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 pb-safe">
            {accountToEdit ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount?.(accountToEdit);
                  onClose();
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar este servicio</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 rounded-lg shadow-sm transition-all"
              >
                {saving ? 'Guardando...' : accountToEdit ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
