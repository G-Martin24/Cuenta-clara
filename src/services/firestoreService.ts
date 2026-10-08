import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Account,
  BillInstance,
  Payment,
  SavingsGoal,
  AppNotification,
  Income,
  CurrencyCode,
} from '../types';
import { generateNextDates } from '../utils/recurrence';

// Helper to create random valid ID
export function generateId(prefix = 'id'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

// Helper to strip undefined values so Firestore setDoc / updateDoc does not throw
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ----------------------------------------------------
// ACCOUNTS
// ----------------------------------------------------

export function subscribeAccounts(
  userId: string,
  onData: (accounts: Account[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/accounts`;
  const q = query(collection(db, path), orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Account[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Account);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for accounts at path:', path, err);
    }
  );
}

export async function createAccountWithBills(
  userId: string,
  accountData: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Account> {
  const accountId = generateId('acc');
  const now = new Date().toISOString();

  const fullAccount: Account = {
    ...accountData,
    id: accountId,
    userId,
    createdAt: now,
    updatedAt: now,
    lastAmount: accountData.amount,
  };

  const accountPath = `users/${userId}/accounts/${accountId}`;
  const batch = writeBatch(db);

  // 1. Account document
  batch.set(doc(db, 'users', userId, 'accounts', accountId), fullAccount);

  // 2. Only create the single initial bill instance that the user is actually adding
  // No auto-generation of future speculative months with outdated/variable amounts
  const startDate = accountData.nextDueDate || accountData.startDate || new Date().toISOString().split('T')[0];
  const isShared = !!accountData.isShared;
  const splitPeople = accountData.splitTotalPeople || (isShared ? 2 : 1);
  const myPct = accountData.mySharePercentage !== undefined ? accountData.mySharePercentage : (isShared ? Math.round(100 / splitPeople) : 100);
  const myShareAmount = isShared ? (accountData.amount * myPct) / 100 : accountData.amount;

  const billId = generateId('bill');
  const bill: BillInstance = {
    id: billId,
    userId,
    accountId,
    accountName: accountData.name,
    category: accountData.category,
    dueDate: startDate,
    estimatedAmount: accountData.amount,
    currency: accountData.currency,
    status: 'pending',
    notes: accountData.notes || '',
    isShared,
    splitTotalPeople: splitPeople,
    mySharePercentage: myPct,
    myShareAmount,
    splitCollected: false,
    splitNotes: accountData.splitNotes || '',
    createdAt: now,
    updatedAt: now,
  };
  batch.set(doc(db, 'users', userId, 'billInstances', billId), bill);

  try {
    await batch.commit();
    return fullAccount;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, accountPath);
  }
}

export async function updateAccount(
  userId: string,
  accountId: string,
  updates: Partial<Account>,
  updateFutureBills = false
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', userId, 'accounts', accountId), {
      ...updates,
      updatedAt: now,
    });

    if (updateFutureBills && (updates.amount !== undefined || updates.name !== undefined || updates.category !== undefined)) {
      // Update pending & upcoming bill instances
      const billsRef = collection(db, 'users', userId, 'billInstances');
      const q = query(billsRef, where('accountId', '==', accountId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);

      snap.forEach((d) => {
        const bill = d.data() as BillInstance;
        if (bill.status === 'upcoming' || bill.status === 'pending') {
          const patch: Partial<BillInstance> = { updatedAt: now };
          if (updates.amount !== undefined) patch.estimatedAmount = updates.amount;
          if (updates.name !== undefined) patch.accountName = updates.name;
          if (updates.category !== undefined) patch.category = updates.category;
          if (updates.currency !== undefined) patch.currency = updates.currency;
          batch.update(d.ref, patch);
        }
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteAccount(
  userId: string,
  accountId: string,
  deleteBillsToo = true
): Promise<void> {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId, 'accounts', accountId));

    if (deleteBillsToo) {
      const billsRef = collection(db, 'users', userId, 'billInstances');
      const q = query(billsRef, where('accountId', '==', accountId));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// BILL INSTANCES
// ----------------------------------------------------

export function subscribeBillInstances(
  userId: string,
  onData: (bills: BillInstance[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/billInstances`;
  const q = query(collection(db, path), orderBy('dueDate', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: BillInstance[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as BillInstance);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for billInstances at path:', path, err);
    }
  );
}

export async function createBillInstance(
  userId: string,
  billData: {
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
  }
): Promise<BillInstance> {
  const billId = generateId('bill');
  const now = new Date().toISOString();
  const path = `users/${userId}/billInstances/${billId}`;

  const isShared = !!billData.isShared;
  const splitPeople = billData.splitTotalPeople || (isShared ? 2 : 1);
  const myPct = billData.mySharePercentage !== undefined ? billData.mySharePercentage : (isShared ? Math.round(100 / splitPeople) : 100);
  const myShareAmount = isShared ? (billData.amount * myPct) / 100 : billData.amount;

  const bill: BillInstance = {
    id: billId,
    userId,
    accountId: billData.accountId,
    accountName: billData.accountName,
    category: billData.category || 'Servicios',
    dueDate: billData.dueDate,
    estimatedAmount: billData.amount,
    currency: billData.currency,
    status: 'pending',
    notes: billData.notes || '',
    isShared,
    splitTotalPeople: splitPeople,
    mySharePercentage: myPct,
    myShareAmount,
    splitCollected: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId, 'billInstances', billId), bill);

    // Also update account's nextDueDate and amount to stay synced with this latest invoice
    if (billData.accountId) {
      const accRef = doc(db, 'users', userId, 'accounts', billData.accountId);
      batch.update(accRef, {
        nextDueDate: billData.dueDate,
        amount: billData.amount,
        updatedAt: now,
      });
    }

    await batch.commit();
    return bill;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBillInstance(
  userId: string,
  billId: string
): Promise<void> {
  const path = `users/${userId}/billInstances/${billId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'billInstances', billId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function cleanupAutoGeneratedFutureBills(userId: string): Promise<number> {
  try {
    const billsRef = collection(db, 'users', userId, 'billInstances');
    const batch = writeBatch(db);
    let count = 0;

    // 1. Delete any speculative occurrences with status 'upcoming'
    const qUpcoming = query(billsRef, where('status', '==', 'upcoming'));
    const snapUpcoming = await getDocs(qUpcoming);
    snapUpcoming.forEach((d) => {
      batch.delete(d.ref);
      count++;
    });

    // 2. Clean up any auto-generated duplicate future bills for the same account
    const allBillsSnap = await getDocs(billsRef);
    const billsByAccount: Record<string, Array<{ id: string; dueDate: string; ref: any; status: string }>> = {};

    allBillsSnap.forEach((d) => {
      const data = d.data() as BillInstance;
      if (data.status === 'pending' || data.status === 'upcoming') {
        if (!billsByAccount[data.accountId]) {
          billsByAccount[data.accountId] = [];
        }
        billsByAccount[data.accountId].push({
          id: d.id,
          dueDate: data.dueDate,
          ref: d.ref,
          status: data.status,
        });
      }
    });

    // For any account with multiple pending occurrences, keep only the earliest active one
    // and remove redundant future auto-generated ones
    Object.values(billsByAccount).forEach((accBills) => {
      if (accBills.length > 1) {
        accBills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        for (let i = 1; i < accBills.length; i++) {
          batch.delete(accBills[i].ref);
          count++;
        }
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (err) {
    console.warn('Error cleaning up upcoming bills:', err);
    return 0;
  }
}

export async function updateBillInstance(
  userId: string,
  billId: string,
  updates: Partial<BillInstance>
): Promise<void> {
  const path = `users/${userId}/billInstances/${billId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'billInstances', billId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function toggleBillSplitCollected(
  userId: string,
  billId: string,
  currentCollected: boolean
): Promise<void> {
  const path = `users/${userId}/billInstances/${billId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'billInstances', billId), {
      splitCollected: !currentCollected,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function markBillAsPaid(
  userId: string,
  bill: BillInstance,
  details: {
    actualAmount: number;
    paymentDate: string;
    paymentMethod: string;
    receiptNumber?: string;
    notes?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const paymentId = generateId('pay');
  const batch = writeBatch(db);

  // 1. Update bill instance
  const billRef = doc(db, 'users', userId, 'billInstances', bill.id);
  batch.update(billRef, {
    status: 'paid',
    actualAmount: details.actualAmount,
    paidDate: details.paymentDate,
    paymentMethod: details.paymentMethod,
    receiptNumber: details.receiptNumber || '',
    notes: details.notes || bill.notes || '',
    updatedAt: now,
  });

  // 2. Create Payment record
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  const paymentRecord: Payment = {
    id: paymentId,
    userId,
    accountId: bill.accountId,
    billInstanceId: bill.id,
    accountName: bill.accountName,
    category: bill.category,
    amount: details.actualAmount,
    currency: bill.currency,
    paymentDate: details.paymentDate,
    paymentMethod: details.paymentMethod,
    receiptNumber: details.receiptNumber || '',
    notes: details.notes || '',
    createdAt: now,
  };
  batch.set(paymentRef, paymentRecord);

  // 3. Update account last amount for price increase comparisons
  const accountRef = doc(db, 'users', userId, 'accounts', bill.accountId);
  batch.update(accountRef, {
    previousAmount: bill.estimatedAmount,
    lastAmount: details.actualAmount,
    updatedAt: now,
  });

  // 4. If price increase > 15%, create notification
  if (bill.estimatedAmount > 0 && details.actualAmount > bill.estimatedAmount * 1.15) {
    const diffPct = Math.round(((details.actualAmount - bill.estimatedAmount) / bill.estimatedAmount) * 100);
    const notifId = generateId('notif_price');
    const notifRef = doc(db, 'users', userId, 'notifications', notifId);
    const notif: AppNotification = {
      id: notifId,
      userId,
      type: 'price_increase',
      title: `Aumento en ${bill.accountName}`,
      message: `El importe pagado aumentó un ${diffPct}% respecto a lo estimado (${bill.currency} ${details.actualAmount} vs ${bill.currency} ${bill.estimatedAmount}).`,
      accountId: bill.accountId,
      billId: bill.id,
      read: false,
      createdAt: now,
    };
    batch.set(notifRef, notif);
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/billInstances/${bill.id}`);
  }
}

// ----------------------------------------------------
// PAYMENTS
// ----------------------------------------------------

export function subscribePayments(
  userId: string,
  onData: (payments: Payment[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/payments`;
  const q = query(collection(db, path), orderBy('paymentDate', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Payment[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Payment);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for payments at path:', path, err);
    }
  );
}

export async function createManualPayment(
  userId: string,
  paymentData: Omit<Payment, 'id' | 'userId' | 'createdAt'>
): Promise<void> {
  const paymentId = generateId('pay');
  const now = new Date().toISOString();
  const payment: Payment = {
    ...paymentData,
    id: paymentId,
    userId,
    createdAt: now,
  };
  const cleanPayment = cleanUndefined(payment);
  try {
    await setDoc(doc(db, 'users', userId, 'payments', paymentId), cleanPayment);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}/payments/${paymentId}`);
  }
}

export async function deletePayment(userId: string, paymentId: string): Promise<void> {
  const path = `users/${userId}/payments/${paymentId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'payments', paymentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// SAVINGS GOALS
// ----------------------------------------------------

export function subscribeGoals(
  userId: string,
  onData: (goals: SavingsGoal[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/goals`;
  const q = query(collection(db, path), orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: SavingsGoal[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as SavingsGoal);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for goals at path:', path, err);
    }
  );
}

export async function createGoal(
  userId: string,
  goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const goalId = generateId('goal');
  const now = new Date().toISOString();
  const goal: SavingsGoal = {
    ...goalData,
    id: goalId,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const cleanGoal = cleanUndefined(goal);
  try {
    await setDoc(doc(db, 'users', userId, 'goals', goalId), cleanGoal);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}/goals/${goalId}`);
  }
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<SavingsGoal>
): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    const cleanUpdates = cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'users', userId, 'goals', goalId), cleanUpdates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------

export function subscribeNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/notifications`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: AppNotification[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as AppNotification);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for notifications at path:', path, err);
    }
  );
}

export async function markNotificationAsRead(userId: string, notifId: string): Promise<void> {
  const path = `users/${userId}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(userId: string, notifs: AppNotification[]): Promise<void> {
  const batch = writeBatch(db);
  notifs.forEach((n) => {
    if (!n.read) {
      batch.update(doc(db, 'users', userId, 'notifications', n.id), { read: true });
    }
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/notifications`);
  }
}

// ----------------------------------------------------
// CSV EXPORT GENERATOR
// ----------------------------------------------------

export function exportPaymentsToCSV(payments: Payment[]): void {
  const headers = ['Fecha de Pago', 'Servicio / Cuenta', 'Categoría', 'Importe', 'Moneda', 'Método de Pago', 'Comprobante', 'Notas'];
  const rows = payments.map((p) => [
    p.paymentDate,
    `"${p.accountName.replace(/"/g, '""')}"`,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    p.amount.toFixed(2),
    p.currency,
    `"${(p.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(p.receiptNumber || '').replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cuenta-clara-pagos-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ----------------------------------------------------
// INCOMES & BUDGET
// ----------------------------------------------------

export function subscribeIncomes(
  userId: string,
  onData: (incomes: Income[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/incomes`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Income[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Income);
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Subscription error for incomes at path:', path, err);
    }
  );
}

export async function createIncome(
  userId: string,
  incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const incomeId = generateId('inc');
  const now = new Date().toISOString();
  const inc: Income = {
    ...incomeData,
    id: incomeId,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const cleanInc = cleanUndefined(inc);
  try {
    await setDoc(doc(db, 'users', userId, 'incomes', incomeId), cleanInc);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}/incomes/${incomeId}`);
  }
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  updates: Partial<Income>
): Promise<void> {
  const path = `users/${userId}/incomes/${incomeId}`;
  try {
    const cleanUpdates = cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'users', userId, 'incomes', incomeId), cleanUpdates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  const path = `users/${userId}/incomes/${incomeId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'incomes', incomeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// SEED STARTER ACCOUNTS FOR ARGENTINA
// ----------------------------------------------------

export async function seedArgentinaStarterAccounts(userId: string, currency: CurrencyCode = 'ARS'): Promise<void> {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const starterList = [
    {
      name: 'Internet y TV Flow',
      provider: 'Telecom Personal',
      category: 'Internet y Conectividad',
      amount: currency === 'ARS' ? 42500 : 35,
      currency,
      amountType: 'fixed' as const,
      frequency: 'monthly' as const,
      dueDay: 10,
      paymentMethod: 'Débito automático (CBU)',
      autopay: true,
      status: 'active' as const,
      noticeDays: 3,
      notes: 'Plan 300MB Fibra + Flow Box',
    },
    {
      name: 'Electricidad (Edenor/Edesur)',
      provider: 'Edenor S.A.',
      category: 'Servicios Básicos (Luz/Gas/Agua)',
      amount: currency === 'ARS' ? 38700 : 32,
      currency,
      amountType: 'variable' as const,
      frequency: 'monthly' as const,
      dueDay: 15,
      paymentMethod: 'Mercado Pago',
      autopay: false,
      status: 'active' as const,
      noticeDays: 5,
      notes: 'Bimestral fraccionado en 2 cuotas mensuales. Nivel R2.',
    },
    {
      name: 'Gas Natural (Metrogas/Naturgy)',
      provider: 'Metrogas',
      category: 'Servicios Básicos (Luz/Gas/Agua)',
      amount: currency === 'ARS' ? 24500 : 20,
      currency,
      amountType: 'variable' as const,
      frequency: 'monthly' as const,
      dueDay: 18,
      paymentMethod: 'Tarjeta de crédito',
      autopay: false,
      status: 'active' as const,
      noticeDays: 3,
      notes: 'Consumo variable según época invernal.',
    },
    {
      name: 'Netflix Argentina',
      provider: 'Netflix Inc.',
      category: 'Streaming y Suscripciones',
      amount: currency === 'ARS' ? 14900 : 12,
      currency,
      amountType: 'fixed' as const,
      frequency: 'monthly' as const,
      dueDay: 22,
      paymentMethod: 'Tarjeta de crédito',
      autopay: true,
      status: 'active' as const,
      noticeDays: 2,
      notes: 'Plan Estándar HD con impuestos incluidos.',
    },
    {
      name: 'Seguro de Auto / Hogar',
      provider: 'La Caja Seguros',
      category: 'Seguros',
      amount: currency === 'ARS' ? 68000 : 55,
      currency,
      amountType: 'fixed' as const,
      frequency: 'monthly' as const,
      dueDay: 5,
      paymentMethod: 'Tarjeta de crédito',
      autopay: true,
      status: 'active' as const,
      noticeDays: 4,
      notes: 'Póliza todo riesgo con franquicia.',
    },
  ];

  for (const item of starterList) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${currentYear}-${pad(currentMonth)}-${pad(item.dueDay)}`;
    await createAccountWithBills(userId, {
      ...item,
      startDate: startStr,
      nextDueDate: startStr,
      icon: 'Receipt',
      color: '#0f766e',
    });
  }

  // Also seed a default realistic starter income if user has no incomes yet
  try {
    const incomesRef = collection(db, 'users', userId, 'incomes');
    const snapInc = await getDocs(incomesRef);
    if (snapInc.empty) {
      await createIncome(userId, {
        source: 'Sueldo principal',
        category: 'Sueldo / Salario',
        amount: currency === 'ARS' ? 850000 : 750,
        currency,
        frequency: 'monthly',
        payDay: 10,
        notes: 'Cobro habitual el día 10 de cada mes',
      });
    }
  } catch (err) {
    console.warn('Could not seed starter income:', err);
  }
}
