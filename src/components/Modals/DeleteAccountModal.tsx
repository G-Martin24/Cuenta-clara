import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, deleteAccountAndData } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');
  const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');

  const canConfirm =
    confirmText.trim().toUpperCase() === 'ELIMINAR' &&
    (!isPasswordUser || password.length > 0) &&
    !loading;

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    setPassword('');
    setError(null);
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;

    setError(null);
    setLoading(true);

    try {
      await deleteAccountAndData(isPasswordUser ? password : undefined);
      // Success callback
      onSuccess();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      let friendlyMessage = 'No se pudo completar la eliminación. Intentá nuevamente.';

      const code = err?.code || '';
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-password'
      ) {
        friendlyMessage = 'La contraseña actual ingresada es incorrecta. Verificala e intentá de nuevo.';
      } else if (code === 'auth/user-mismatch') {
        friendlyMessage = 'La cuenta de Google seleccionada no coincide con tu usuario actual.';
      } else if (code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Se cerró la ventana de autenticación de Google. Debes completar la verificación para autorizar el borrado.';
      } else if (code === 'auth/requires-recent-login') {
        friendlyMessage = 'Tu sesión es antigua. Por seguridad, volvé a iniciar sesión antes de eliminar tu cuenta.';
      } else if (code === 'auth/missing-password') {
        friendlyMessage = 'Debes ingresar tu contraseña actual para confirmar la eliminación.';
      } else if (err?.message) {
        friendlyMessage = err.message;
      }

      setError(friendlyMessage);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="fixed inset-0 -z-10"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-red-300 dark:border-red-900/60 shadow-2xl p-6 sm:p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-red-100 dark:border-red-950/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Eliminar cuenta y datos
                </h2>
              </div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5">
                Acción permanente, total e irreversible
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          {/* Warning banner */}
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-800 dark:text-red-200 space-y-1.5 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-red-900 dark:text-red-100">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              ¿Estás completamente seguro de continuar?
            </p>
            <p>
              Esta acción <strong>eliminará de inmediato y para siempre</strong> tu usuario en Cuenta Clara y todos los registros asociados en nuestros servidores sin posibilidad de recuperación.
            </p>
          </div>

          {/* List of data that will be destroyed */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Se eliminarán permanentemente los siguientes datos:
            </span>
            <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Perfil de usuario:</strong> nombre, correo, preferencias de moneda, zona horaria y tema.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Cuentas y servicios:</strong> servicios públicos, suscripciones, tarjetas y vencimientos programados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Vencimientos y facturas:</strong> todas las facturas cargadas, montos reales y estimados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Historial de pagos:</strong> recibos, números de comprobante y registros de pagos ejecutados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Presupuesto e ingresos:</strong> fuentes de ingresos, categorías y análisis financiero.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Metas de ahorro:</strong> objetivos, balances acumulados y aportes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Notificaciones y alertas:</strong> recordatorios generados e historial interno.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Credenciales en Firebase:</strong> usuario autenticado y UID en Firebase Authentication.</span>
              </li>
            </ul>
          </div>

          {/* Re-authentication Section */}
          {isPasswordUser && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verificación: Contraseña actual de tu cuenta
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Requerida para comprobar tu identidad antes de borrar los datos.
              </p>
            </div>
          )}

          {isGoogleUser && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                Cuenta vinculada con <strong>Google ({user.email})</strong>. Se solicitará reconfirmar mediante una ventana emergente de Google al pulsar el botón definitivo.
              </span>
            </div>
          )}

          {/* Mandatory Confirmation Word */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Escribí la palabra <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 font-bold">ELIMINAR</span> para habilitar el botón:
              </label>
              {confirmText.trim().toUpperCase() === 'ELIMINAR' && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmado
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Podés escribirla en mayúsculas o minúsculas (ej: <code className="font-mono text-slate-700 dark:text-slate-300">ELIMINAR</code>, <code className="font-mono text-slate-700 dark:text-slate-300">eliminar</code> o <code className="font-mono text-slate-700 dark:text-slate-300">Eliminar</code>).
            </p>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR o eliminar"
              disabled={loading}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">{error}</span>
                <p className="text-[11px] opacity-90">
                  Ningún dato fue eliminado. La cuenta permanece intacta.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer text-center"
            >
              Cancelar y mantener cuenta
            </button>

            <button
              type="submit"
              disabled={!canConfirm}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-bold shadow-md transition-all active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando y eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar mi cuenta definitivamente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
