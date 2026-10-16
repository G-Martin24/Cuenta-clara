import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Mail,
  AlertTriangle,
  ShieldAlert,
  Database,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DeleteAccountViewProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
}

export const DeleteAccountView: React.FC<DeleteAccountViewProps> = ({
  onBack,
  onNavigateToPrivacy,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const contactEmail = 'galbanmartin01@gmail.com';
  const emailSubject = 'Solicitud de eliminación de cuenta';
  const emailBody = `Hola,\n\nSolicito la eliminación definitiva de mi cuenta en Cuenta Clara y el borrado total de todos mis datos asociados en Firebase Authentication y Cloud Firestore.\n\nCorreo electrónico de la cuenta: ${
    user?.email || '[Indica aquí tu correo registrado]'
  }\nNombre en la app: ${user?.displayName || '[Indica aquí tu nombre si aplica]'}\n\nEntiendo que esta acción es permanente, total e irreversible.\n\nMuchas gracias.`;

  const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onBack}>
              <img
                src="/icon.svg"
                alt="Cuenta Clara"
                className="w-8 h-8 rounded-lg object-contain shadow-sm ring-1 ring-white/10"
              />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Cuenta Clara
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ARG
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            {user ? 'Ir al Panel' : 'Iniciar Sesión'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero header */}
        <div className="mb-8 sm:mb-10 border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold mb-3">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Gestión y Cancelación de Cuenta</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Solicitud de Eliminación de Cuenta y Datos
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            En cumplimiento de las normativas de privacidad y el derecho al olvido, podés solicitar la baja definitiva y la eliminación permanente e irreversible de tu cuenta de Cuenta Clara y de toda tu información asociada.
          </p>
        </div>

        {/* Action Card: Direct Mailto */}
        <div className="mb-8 bg-gradient-to-br from-red-500/10 via-slate-900/5 to-transparent dark:from-red-950/40 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-8 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-900/40">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Cómo enviar tu solicitud por correo
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Para validar la titularidad y prevenir eliminaciones no autorizadas, debes enviar un correo electrónico <strong>desde la misma dirección asociada a tu cuenta</strong> a nuestro responsable de soporte:
              </p>

              {/* Email details box */}
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Destinatario:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white select-all">
                      {contactEmail}
                    </span>
                    <button
                      onClick={handleCopyEmail}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Copiar correo"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Asunto exacto:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white select-all">
                    {emailSubject}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Dirección remitente:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {user?.email ? (
                      <span className="text-teal-600 dark:text-teal-400 font-bold">{user.email} (tu cuenta activa)</span>
                    ) : (
                      'La misma dirección de correo con la que te diste de alta en la aplicación'
                    )}
                  </span>
                </div>
              </div>

              {/* Mailto Action Button */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar solicitud por correo</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar dirección de correo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          {/* 1. Qué se eliminará */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                1. ¿Qué datos se eliminarán?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Al procesar tu solicitud, se destruirán permanentemente tanto tus credenciales en el sistema de autenticación como todos los registros almacenados en la base de datos:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <p className="font-bold text-slate-900 dark:text-white mb-1">
                  En Firebase Authentication:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Tu usuario e identificador único de cuenta (UID).</li>
                  <li>Tu correo electrónico registrado y contraseña cifrada.</li>
                  <li>Vinculaciones con inicio de sesión con Google.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <p className="font-bold text-slate-900 dark:text-white mb-1">
                  En Cloud Firestore:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Perfil de usuario y preferencias de moneda/tema.</li>
                  <li>Todas las cuentas bancarias, billeteras y servicios.</li>
                  <li>Todos los vencimientos y facturas cargadas.</li>
                  <li>Historial de pagos y comprobantes registrados.</li>
                  <li>Ingresos, presupuestos y objetivos de ahorro.</li>
                  <li>Alertas y notificaciones generadas.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Datos que se conservan */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                2. ¿Se conserva algún dato?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>No se conserva ningún dato personal ni financiero del usuario.</strong> Una vez completado el procedimiento, la eliminación en Firebase Authentication y Cloud Firestore es completa y definitiva, sin posibilidad de recuperación ni restauración de respaldos.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Nota técnica: La plataforma Google Cloud Platform mantiene únicamente registros técnicos de conexión (logs de acceso a servidores web de Vercel y Google Cloud) por razones de seguridad de red y prevención de ataques DDoS, los cuales se purgan de manera automática según los ciclos estándar de retención de infraestructura sin vincularse a tu identidad.
            </p>
          </section>

          {/* 3. Plazo de eliminación */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Plazo de cumplimiento
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              El plazo máximo para hacer efectiva la eliminación y responder a tu solicitud es de <strong>30 días corridos</strong> desde la recepción del correo de solicitud. Habitualmente, las solicitudes válidas son procesadas en un lapso de <strong>3 a 7 días hábiles</strong>.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Una vez completada la baja, recibirás un correo de confirmación final indicando que tus datos y tu usuario han sido purgados de los servidores.
            </p>
          </section>

          {/* 4. Borrado manual previo */}
          <section className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-6 sm:p-8 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-amber-950 dark:text-amber-200">
                Borrado inmediato desde la aplicación
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
              Si querés borrar información puntual sin esperar la baja de la cuenta completa, podés hacerlo al instante desde la app: cada cuenta, vencimiento, comprobante o ingreso cuenta con un botón de eliminar con confirmación que suprime el registro de Firestore en tiempo real.
            </p>
          </section>
        </div>

        {/* Navigation Actions */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-center pb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Cuenta Clara</span>
          </button>

          {onNavigateToPrivacy && (
            <button
              onClick={onNavigateToPrivacy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
            >
              <span>Ver Política de Privacidad</span>
            </button>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Cuenta Clara" className="w-5 h-5 rounded" />
            <span>Cuenta Clara © {new Date().getFullYear()} · Control de cuentas y vencimientos</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 transition-colors"
            >
              {user ? 'Panel principal' : 'Acceso a la app'}
            </button>
            <span>•</span>
            {onNavigateToPrivacy && (
              <button
                onClick={onNavigateToPrivacy}
                className="hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 transition-colors"
              >
                Política de privacidad
              </button>
            )}
            <span>•</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">
              Eliminar cuenta
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
