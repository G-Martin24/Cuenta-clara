import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCheck,
  CheckCircle,
  ExternalLink,
  Settings as SettingsIcon,
} from 'lucide-react';
import { AppNotification } from '../../types';
import { formatDateAr } from '../../utils/formatters';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onActionClick?: (notif: AppNotification) => void;
  onOpenSettings?: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onActionClick,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const unreadList = notifications.filter((n) => !n.read);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'due_soon':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'price_increase':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Notificaciones y Alertas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadList.length} sin leer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Historial interno</span>
            {unreadList.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas leídas
              </button>
            )}
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-teal-500/40" />
              <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                ¡Todo al día!
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                No tenés avisos pendientes de vencimiento ni aumentos detectados.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                    : 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/80 text-slate-900 dark:text-white shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-slate-900 dark:text-white">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>{formatDateAr(notif.createdAt)}</span>
                      {!notif.read && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & settings button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-1.5 text-center">
          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full py-2 px-3 rounded-lg border border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Configurar recordatorios y push</span>
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">
            Avisos automáticos de vencimientos con anticipación.
          </p>
        </div>
      </div>
    </div>
  );
};
