import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Volume2,
  Calendar,
  AlertTriangle,
  Info,
  Smartphone,
} from 'lucide-react';
import { NotificationSettings } from '../types';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

interface NotificationSettingsCardProps {
  onSave?: (settings: NotificationSettings) => void;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({ onSave }) => {
  const { userProfile, updateUserPreferences } = useAuth();

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const initialSettings: NotificationSettings =
    userProfile?.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;

  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      await savePreferences(updated);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings.enabled && permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    await savePreferences(updated);
  };

  const handleToggleNoticeDay = async (day: number) => {
    let newDays = [...settings.noticeDays];
    if (newDays.includes(day)) {
      newDays = newDays.filter((d) => d !== day);
    } else {
      newDays.push(day);
      newDays.sort((a, b) => a - b);
    }
    const updated = { ...settings, noticeDays: newDays };
    setSettings(updated);
    await savePreferences(updated);
  };

  const savePreferences = async (newSettings: NotificationSettings) => {
    try {
      await updateUserPreferences({
        notificationSettings: newSettings,
      });
      if (onSave) onSave(newSettings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Error saving notification settings:', e);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestSuccess(null);
    try {
      const ok = await sendTestNotification();
      setTestSuccess(ok);
      setPermission(getNotificationPermission());
    } finally {
      setTesting(false);
      setTimeout(() => setTestSuccess(null), 3500);
    }
  };

  const noticeOptions = [
    { day: 0, label: 'El mismo día (Hoy)' },
    { day: 1, label: '1 día antes (Mañana)' },
    { day: 2, label: '2 días antes' },
    { day: 3, label: '3 días antes' },
    { day: 5, label: '5 días antes' },
    { day: 7, label: '1 semana antes' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Recordatorios y Notificaciones Push
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Avisos automáticos de vencimiento en tu celular o PC, aun con la app cerrada.
            </p>
          </div>
        </div>

        {/* Permission status badge */}
        <div className="shrink-0 text-right">
          {permission === 'granted' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3 stroke-[3]" />
              Permitidas
            </span>
          )}
          {permission === 'default' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3" />
              Por autorizar
            </span>
          )}
          {permission === 'denied' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-3 h-3" />
              Bloqueadas
            </span>
          )}
          {permission === 'unsupported' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Smartphone className="w-3 h-3" />
              Requiere PWA
            </span>
          )}
        </div>
      </div>

      {/* Permission Request Prompt if not granted */}
      {permission !== 'granted' && (
        <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Habilitá los avisos en este dispositivo
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              El navegador te enviará un recordatorio sonoro y visual antes de que venza cualquier servicio o factura.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 text-center"
          >
            Permitir notificaciones
          </button>
        </div>
      )}

      {/* If permission is denied, show helpful instructions */}
      {permission === 'denied' && (
        <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Las notificaciones están bloqueadas en tu navegador.</p>
            <p className="text-[11px] opacity-90">
              Para desbloquearlas: tocá el ícono del candado o ajustes al lado de la barra de direcciones, buscá &quot;Notificaciones&quot; y elegí &quot;Permitir&quot;. Luego recargá la página.
            </p>
          </div>
        </div>
      )}

      {/* Main Switch */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-white block">
            Servicio proactivo de recordatorios
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Comprueba automáticamente tus vencimientos y activa notificaciones del sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            settings.enabled && permission === 'granted'
              ? 'bg-teal-600'
              : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled && permission === 'granted' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Anticipation Days */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          ¿Con cuánta anticipación querés recibir los avisos?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {noticeOptions.map((opt) => {
            const isSelected = settings.noticeDays.includes(opt.day);
            return (
              <button
                key={opt.day}
                type="button"
                onClick={() => handleToggleNoticeDay(opt.day)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3 pt-2">
        {/* Overdue alert */}
        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
          <input
            type="checkbox"
            checked={settings.notifyOverdue}
            onChange={async (e) => {
              const updated = { ...settings, notifyOverdue: e.target.checked };
              setSettings(updated);
              await savePreferences(updated);
            }}
            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Alerta por cuentas vencidas o impagas
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Te avisa de inmediato si un vencimiento ya pasó y aún no registraste su pago, para evitar cortes o moras.
            </span>
          </div>
        </label>

        {/* Sound chime */}
        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={async (e) => {
              const updated = { ...settings, soundEnabled: e.target.checked };
              setSettings(updated);
              await savePreferences(updated);
            }}
            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Campana de sonido suave (chime armónico)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Reproduce un aviso acústico nítido de dos tonos al disparar la notificación.
            </span>
          </div>
        </label>
      </div>

      {/* Testing and Background sync explanation */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Sincronizado con Service Worker para avisos aun con la app cerrada.</span>
        </div>

        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testing}
          className="px-4 py-2 rounded-xl border border-teal-300 dark:border-teal-700/80 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100/60 active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{testing ? 'Enviando...' : 'Probar notificación ahora'}</span>
        </button>
      </div>

      {testSuccess !== null && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            testSuccess
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {testSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ¡Notificación enviada! Verificá la barra de estado de tu celular o la esquina de tu pantalla.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No se pudo mostrar la notificación. Asegurate de haber aceptado los permisos en el navegador.
              </span>
            </>
          )}
        </div>
      )}

      {savedSuccess && (
        <p className="text-right text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
          <Check className="w-3.5 h-3.5" /> Preferencias de alerta guardadas
        </p>
      )}
    </div>
  );
};
