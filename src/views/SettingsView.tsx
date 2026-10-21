import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Globe,
  Clock,
  Moon,
  Sun,
  Monitor,
  ShieldCheck,
  LogOut,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../types';
import { NotificationSettingsCard } from '../components/NotificationSettingsCard';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { DeleteAccountModal } from '../components/Modals/DeleteAccountModal';
import { applyTheme, getSavedTheme, ThemePreference } from '../utils/theme';
import {
  SUPPORTED_TIMEZONES,
  getStoredTimezone,
  setStoredTimezone,
} from '../utils/timezone';

interface SettingsViewProps {
  onOpenPrivacy?: () => void;
  onOpenDeleteAccount?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenPrivacy,
  onOpenDeleteAccount,
}) => {
  const { user, userProfile, updateUserPreferences, logout } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [currency, setCurrency] = useState<CurrencyCode>(userProfile?.defaultCurrency || 'ARS');
  const [timezone, setTimezone] = useState(userProfile?.timezone || getStoredTimezone());
  const [theme, setTheme] = useState<ThemePreference>(userProfile?.theme || getSavedTheme());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Sync state if userProfile updates asynchronously from Firestore
  useEffect(() => {
    if (userProfile?.theme) {
      setTheme(userProfile.theme);
    }
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
    if (userProfile?.defaultCurrency) {
      setCurrency(userProfile.defaultCurrency);
    }
    if (userProfile?.timezone) {
      setTimezone(userProfile.timezone);
    }
  }, [userProfile]);

  const handleThemeChange = async (newTheme: ThemePreference) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    const label = newTheme === 'dark' ? 'Modo oscuro activado' : newTheme === 'light' ? 'Modo claro activado' : 'Tema del sistema sincronizado';
    setThemeFeedback(label);
    setTimeout(() => setThemeFeedback(null), 2500);

    try {
      await updateUserPreferences({
        theme: newTheme,
      });
    } catch (err) {
      console.warn('Auto-save theme error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Re-apply and persist
      applyTheme(theme);
      setStoredTimezone(timezone);
      await updateUserPreferences({
        displayName: displayName.trim(),
        defaultCurrency: currency,
        timezone,
        theme,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Configuración y Perfil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Ajustá tus preferencias de cuenta, moneda de reporte y zona horaria.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
        {/* User identification */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-base">
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {displayName || 'Usuario de Cuenta Clara'}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Datos aislados con Firebase Security Rules
            </span>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nombre para mostrar
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Moneda Principal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Moneda principal predeterminada
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Las cuentas individuales pueden configurarse con cualquier moneda independientemente.
          </p>
        </div>

        {/* Zona Horaria */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Zona horaria
            </label>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Horario oficial IANA
            </span>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
            {!SUPPORTED_TIMEZONES.some((tz) => tz.id === timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Ajusta automáticamente el calendario, los vencimientos del día y las alertas según el huso horario y horario de verano de tu país.
          </p>
        </div>

        {/* Theme preference */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tema de interfaz
            </label>
            {themeFeedback && (
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 animate-fade-in">
                <Check className="w-3 h-3" />
                {themeFeedback}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            El cambio se aplica al instante y se guarda automáticamente en tu perfil.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                theme === 'light'
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Modo Claro</span>
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                theme === 'dark'
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Modo Oscuro</span>
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                theme === 'system'
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className={`w-4 h-4 ${theme === 'system' ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Sistema (Auto)</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              ¡Preferencias guardadas!
            </span>
          )}
          {!saved && <div />}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>

      {/* PWA Install Promo */}
      <PWAInstallButton variant="settings" />

      {/* Push & Due Date Notifications Card */}
      <NotificationSettingsCard />

      {/* Privacy Policy Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Privacidad y Protección de Datos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conocé cómo protegemos tus cuentas, servicios y datos personales.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="self-start sm:self-auto px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors shadow-xs active:scale-98"
        >
          Política de privacidad
        </button>
      </div>

      {/* Account Deletion Card */}
      <div className="bg-red-50/40 dark:bg-red-950/20 rounded-2xl border-2 border-red-200 dark:border-red-900/60 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Eliminar cuenta y datos
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Zona de peligro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Eliminá definitivamente tu cuenta y todos tus datos (perfil, cuentas bancarias, servicios, vencimientos, historial de pagos, ingresos, presupuestos, metas de ahorro y notificaciones). Esta acción es inmediata y no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-red-100 dark:border-red-900/40">
          {onOpenDeleteAccount && (
            <button
              type="button"
              onClick={onOpenDeleteAccount}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Solicitud por correo / Info legal Google Play</span>
            </button>
          )}
          {!onOpenDeleteAccount && <div />}

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar mi cuenta ahora</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={() => {
          setDeleteModalOpen(false);
          // Redirect to home/login
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
      />

      {/* Logout Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cerrar sesión</h3>
          <p className="text-xs text-slate-500">
            Podés volver a ingresar en cualquier momento con tu cuenta de Google.
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};
