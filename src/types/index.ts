export type CurrencyCode = 'ARS' | 'USD' | 'EUR';
export type AmountType = 'fixed' | 'variable' | 'estimated';
export type AccountFrequency =
  | 'weekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'custom';

export type AccountStatus = 'active' | 'paused' | 'cancelled' | 'archived';
export type BillStatus = 'upcoming' | 'pending' | 'paid' | 'overdue' | 'skipped' | 'cancelled';
export type GoalStatus = 'active' | 'achieved' | 'paused';
export type IncomeFrequency = 'monthly' | 'biweekly' | 'occasional';
export type NotificationType =
  | 'due_soon'
  | 'overdue'
  | 'price_increase'
  | 'trial_ending'
  | 'goal_deadline'
  | 'info';

export interface NotificationSettings {
  enabled: boolean;
  noticeDays: number[]; // e.g. [0, 1, 3] (0 = día de vencimiento, 1 = 1 día antes, 3 = 3 días antes)
  reminderTime: string; // e.g. "09:00"
  notifyOverdue: boolean;
  notifyPriceChanges: boolean;
  soundEnabled: boolean;
  lastCheckedDate?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  defaultCurrency: CurrencyCode;
  timezone: string;
  onboarded: boolean;
  theme?: 'light' | 'dark' | 'system';
  notificationSettings?: NotificationSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  provider?: string;
  description?: string;
  category: string;
  color?: string;
  icon?: string;
  providerUrl?: string;
  clientNumber?: string;
  amount: number;
  currency: CurrencyCode;
  amountType: AmountType;
  frequency: AccountFrequency;
  dueDay?: number; // 1-31
  nextDueDate?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  paymentMethod?: string;
  autopay?: boolean;
  status: AccountStatus;
  noticeDays?: number; // Days before due date to alert
  notes?: string;
  lastAmount?: number;
  previousAmount?: number;
  // Split bill fields
  isShared?: boolean;
  splitTotalPeople?: number; // e.g. 2, 3, etc.
  mySharePercentage?: number; // e.g. 50
  splitNotes?: string; // e.g. "Dividido con mi pareja"
  createdAt: string;
  updatedAt: string;
}

export interface BillInstance {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  category?: string;
  dueDate: string; // YYYY-MM-DD
  estimatedAmount: number;
  actualAmount?: number;
  currency: CurrencyCode;
  status: BillStatus;
  paidDate?: string; // YYYY-MM-DD
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  // Split bill fields
  isShared?: boolean;
  splitTotalPeople?: number;
  mySharePercentage?: number;
  myShareAmount?: number;
  splitCollected?: boolean; // If other person's share was already collected
  splitNotes?: string;
  // Postpone / Crunch tracking
  postponedFrom?: string; // Original due date YYYY-MM-DD if postponed
  postponeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_INCOME_CATEGORIES = [
  'Sueldo / Salario',
  'Freelance / Honorarios',
  'Rentas e Inversiones',
  'Comercio / Ventas',
  'Jubilación / Pensión',
  'Cobro a Terceros / Reintegros',
  'Otros ingresos',
] as const;

export type IncomeCategoryName = (typeof DEFAULT_INCOME_CATEGORIES)[number] | string;

export interface Income {
  id: string;
  userId: string;
  source: string; // e.g. "Sueldo principal", "Freelance", "Renta"
  category?: string; // e.g. "Sueldo / Salario", "Freelance / Honorarios"
  amount: number;
  currency: CurrencyCode;
  frequency: IncomeFrequency;
  payDay?: number; // 1-31: day of the month when money is collected
  nextPaymentDate?: string; // YYYY-MM-DD next projected or scheduled payment date
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  accountId: string;
  billInstanceId?: string;
  accountName: string;
  category?: string;
  amount: number;
  currency: CurrencyCode;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline?: string; // YYYY-MM-DD
  relatedAccountId?: string;
  monthlyContribution?: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  accountId?: string;
  billId?: string;
  read: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: 'Servicios Básicos (Luz/Gas/Agua)', icon: 'Zap', color: '#f59e0b' },
  { name: 'Internet y Conectividad', icon: 'Wifi', color: '#0ea5e9' },
  { name: 'Telefonía Móvil', icon: 'Smartphone', color: '#6366f1' },
  { name: 'Vivienda y Alquiler', icon: 'Home', color: '#10b981' },
  { name: 'Seguros', icon: 'ShieldCheck', color: '#8b5cf6' },
  { name: 'Impuestos y Tasas (ABL/ARBA/AFIP)', icon: 'Landmark', color: '#ef4444' },
  { name: 'Streaming y Suscripciones', icon: 'Tv', color: '#ec4899' },
  { name: 'Salud y Prepaga', icon: 'HeartPulse', color: '#14b8a6' },
  { name: 'Educación', icon: 'GraduationCap', color: '#3b82f6' },
  { name: 'Gimnasio y Deporte', icon: 'Dumbbell', color: '#f97316' },
  { name: 'Transporte y Vehículo', icon: 'Car', color: '#64748b' },
  { name: 'Otros Pagos Recurrentes', icon: 'Receipt', color: '#78716c' },
];

export const PAYMENT_METHODS = [
  'Débito automático (CBU)',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'Mercado Pago',
  'Transferencia bancaria',
  'Efectivo / Pago Fácil / Rapipago',
  'Otro',
];
