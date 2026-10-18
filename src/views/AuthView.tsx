import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

interface AuthViewProps {
  onOpenPrivacy?: () => void;
  onOpenDeleteAccount?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onOpenPrivacy,
  onOpenDeleteAccount,
}) => {
  const { signInWithGoogle, loginWithEmail, registerWithEmail, signInGuest } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
        setError('El navegador móvil cerró o bloqueó la ventana de Google. Podés usar "Modo Invitado" o ingresar con correo.');
      } else {
        setError('No pudimos iniciar sesión con Google en este navegador móvil. Probá con Modo Invitado o correo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInGuest();
    } catch (err: any) {
      console.error(err);
      setError('No se pudo ingresar como invitado. Podés intentar con correo o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        await registerWithEmail(email, password, name);
      }
    } catch (err: any) {
      let msg = 'Ocurrió un error. Intentá de nuevo.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'El correo o la contraseña ingresada no son correctos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Ya existe una cuenta con este correo electrónico.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'El inicio de sesión por email no está habilitado en este proyecto. Te recomendamos ingresar con Google en 1 click.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos. Por favor, intentá nuevamente en unos minutos.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Error de conexión. Verificá tu conexión a internet e intentá nuevamente.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Por favor, ingresá tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Por favor, ingresá una dirección de correo electrónico válida.');
      return;
    }

    setLoading(true);
    try {
      // Requisito 10: Configurar idioma en español antes de enviar
      auth.languageCode = 'es';
      // Requisito 4 y 5: Usar función oficial y modular de Firebase Authentication
      await sendPasswordResetEmail(auth, trimmedEmail);
      // Requisito 6: Mensaje claro en español
      setSuccessMessage(
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.'
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      const code = err?.code || '';
      // Requisito 7: No descubrir si el correo existe por seguridad (anti-enumeración)
      if (code === 'auth/user-not-found') {
        setSuccessMessage(
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.'
        );
      } else if (code === 'auth/invalid-email') {
        setError('Ingresá un correo electrónico válido.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiadas solicitudes. Por favor, intentá nuevamente en unos minutos.');
      } else if (code === 'auth/network-request-failed') {
        setError('Error de conexión. Verificá tu conexión a internet e intentá nuevamente.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('El servicio de recuperación no está disponible temporalmente. Por favor, intentá más tarde.');
      } else {
        setError('No se pudo procesar la solicitud. Por favor, verificá los datos e intentá más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setError(null);
    setSuccessMessage(null);
    setMode('login');
  };

  const switchToRegister = () => {
    setError(null);
    setSuccessMessage(null);
    setMode('register');
  };

  const switchToForgot = () => {
    setError(null);
    setSuccessMessage(null);
    setMode('forgot');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center bg-slate-950 border-b border-slate-800">
          <img
            src="/icon.svg"
            alt="Cuenta Clara Logo"
            className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-xl shadow-teal-950/60 ring-1 ring-white/10 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Cuenta Clara</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Gestión de servicios, suscripciones y vencimientos en pesos argentinos y divisas.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900">
          {/* VISTA RECUPERACIÓN DE CONTRASEÑA */}
          {mode === 'forgot' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a iniciar sesión</span>
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recuperar contraseña
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingresá el correo asociado a tu cuenta para restablecer tu contraseña.
                </p>
              </div>

              {/* Indicación para usuarios con cuenta de Google (Requisito 12) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Si usás Google para iniciar sesión, recuperá tu cuenta desde Google, ya que no tiene una contraseña independiente en Cuenta Clara.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          ) : (
            /* VISTAS DE LOGIN Y REGISTRO */
            <>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* GOOGLE SIGN IN (1-Click Primary) */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continuar con Google</span>
              </button>

              {/* 1-Click Guest Access for Mobile Testing */}
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-teal-500/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/60 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                title="Ingresar sin cuenta para probar la aplicación"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Explorar app en 1 click (Modo Invitado / Demo)</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  o con correo electrónico
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tu nombre
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Martín Galván"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={switchToForgot}
                        className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Procesando...'
                      : mode === 'login'
                      ? 'Iniciar sesión'
                      : 'Crear cuenta'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle mode */}
              <div className="pt-2 text-center text-xs text-slate-500">
                {mode === 'login' && (
                  <p>
                    ¿No tenés cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={switchToRegister}
                      className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Registrate gratis
                    </button>
                  </p>
                )}

                {mode === 'register' && (
                  <p>
                    ¿Ya tenés una cuenta?{' '}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Iniciá sesión
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {/* Legal / Privacy Links */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center flex-wrap gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-slate-400 hover:text-teal-400 dark:text-slate-500 dark:hover:text-teal-300 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 transition-colors cursor-pointer"
              >
                Política de privacidad
              </button>
              <span className="text-slate-400 dark:text-slate-600 select-none">·</span>
              <button
                type="button"
                onClick={onOpenDeleteAccount}
                className="text-slate-400 hover:text-red-400 dark:text-slate-500 dark:hover:text-red-300 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 transition-colors cursor-pointer"
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
