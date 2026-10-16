import React from 'react';
import {
  ArrowLeft,
  Shield,
  Lock,
  Database,
  EyeOff,
  Cookie,
  UserCheck,
  Trash2,
  Mail,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
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
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">Cuenta Clara</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero header */}
        <div className="mb-8 sm:mb-12 border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Transparencia y Seguridad</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            En Cuenta Clara valoramos tu privacidad y la confidencialidad de tu información financiera. Esta política describe con total claridad qué datos recopilamos, cómo los protegemos y cuáles son tus derechos.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 font-medium">
            <span>Última actualización: 16 de octubre de 2026</span>
            <span>•</span>
            <span>Versión 1.2</span>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* 1. Datos que puede proporcionar el usuario */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                1. Datos que recopilamos
              </h2>
            </div>
            <p className="mb-3 text-slate-600 dark:text-slate-400">
              Cuenta Clara recopila exclusivamente la información que vos ingresás voluntariamente para gestionar tus finanzas personales:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-900 dark:text-white">Datos de cuenta y perfil:</strong> Dirección de correo electrónico y nombre para mostrar, provistos al registrarte mediante Google o mediante correo y contraseña.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Cuentas y servicios:</strong> Nombres de servicios, suscripciones, tarjetas o entidades que cargues (por ejemplo, electricidad, internet, telefonía, streaming o expensas).
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Vencimientos e importes:</strong> Fechas límite de pago, montos estimados o exactos, y moneda de cada cuenta (pesos argentinos - ARS, dólares - USD, o euros - EUR).
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Pagos y comprobantes:</strong> Registros de pagos completados, fechas reales de pago y notas asociadas.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Ingresos y presupuesto:</strong> Fuentes de ingreso mensuales cargadas para el cálculo de flujo de fondos y saldos disponibles.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Metas y objetivos de ahorro:</strong> Nombres, montos objetivo y aportes que decidas registrar.
              </li>
            </ul>
          </section>

          {/* 2 & 3. Infraestructura Firebase */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                2. Autenticación y Almacenamiento en la Nube
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Para brindar un servicio confiable y sincronizado, utilizamos servicios oficiales de <strong>Google Cloud Platform</strong>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    Firebase Authentication
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Gestiona de forma segura tu inicio de sesión (mediante Google Sign-In, correo y contraseña cifrada o acceso demo de invitado). Tus credenciales nunca son accesibles en texto plano por nuestro equipo.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    Google Cloud Firestore
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Base de datos NoSQL donde se guardan tus cuentas, vencimientos, pagos, ingresos y metas de ahorro. Cada registro está vinculado de forma estricta a tu identificador de usuario único (<code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">uid</code>).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Para qué se utilizan los datos */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                3. Finalidad del uso de los datos
              </h2>
            </div>
            <p className="mb-2 text-slate-600 dark:text-slate-300">
              La información que cargás se utiliza única y exclusivamente para ofrecerte las funciones de la aplicación:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Organizar y calendarizar tus cuentas y vencimientos recurrentes.</li>
              <li>Calcular balances mensuales, totales pendientes de pago y gastos ejecutados.</li>
              <li>Realizar el análisis de flujo de fondos (Cash Flow) para advertir riesgos de iliquidez o vencimientos concentrados.</li>
              <li>Enviar notificaciones y recordatorios proactivos de fechas de corte y vencimiento según tus preferencias.</li>
              <li>Permitirte exportar tus reportes y balances en PDF cuando lo solicites.</li>
            </ul>
          </section>

          {/* 5. No venta de datos */}
          <section className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <EyeOff className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-950 dark:text-emerald-200">
                4. Compromiso de no venta de datos
              </h2>
            </div>
            <p className="text-emerald-900 dark:text-emerald-300 font-medium">
              Bajo ninguna circunstancia vendemos, alquilamos, cedemos ni comercializamos tus datos personales, de contacto ni información financiera a terceros, entidades de crédito o empresas de marketing. Tu información te pertenece exclusivamente a vos.
            </p>
          </section>

          {/* 6. Cookies y Almacenamiento Local */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Cookie className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                5. Cookies, Almacenamiento Local y PWA
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Cuenta Clara utiliza tecnologías de almacenamiento web estándar en tu navegador para garantizar una experiencia óptima:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Almacenamiento Local (LocalStorage):</strong> Guarda tus preferencias de interfaz, como la elección de tema claro/oscuro (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">cuentaclara_theme</code>) y estados transitorios para que no tengas que reconfigurarlos en cada visita.
                </li>
                <li>
                  <strong>Tokens de sesión:</strong> Mantenidos por la biblioteca de Firebase en el almacenamiento seguro del cliente para que permanezcas autenticado sin tener que ingresar tus credenciales continuamente.
                </li>
                <li>
                  <strong>Service Worker (PWA):</strong> Permite instalar la aplicación en tu celular o PC y almacenar en caché recursos estáticos para que la app cargue de inmediato incluso con conexión inestable o sin acceso a internet.
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Publicidad y Google AdSense */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                6. Servicios publicitarios (Google AdSense)
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                La aplicación incluye la integración de <strong>Google AdSense</strong> (código de editor ca-pub-3634441280216856) con el fin de mostrar anuncios que contribuyen a financiar los costos de servidor e infraestructura y mantener la herramienta gratuita para los usuarios.
              </p>
              <p>
                Google, como proveedor externo, puede utilizar cookies o identificadores para mostrar anuncios basados en las visitas previas del usuario a este u otros sitios web. Los usuarios pueden consultar y gestionar el uso de cookies para publicidad personalizada a través de la{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 dark:text-teal-400 font-semibold underline hover:text-teal-500"
                >
                  Configuración de anuncios de Google
                </a>.
              </p>
            </div>
          </section>

          {/* 8. Eliminación de cuenta y datos */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                7. Cómo solicitar la eliminación de tu cuenta y datos
              </h2>
            </div>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p>
                Respetamos plenamente tu derecho al olvido y la supresión de datos personales:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Eliminación directa desde la app:</strong> Podés borrar cualquier cuenta, vencimiento, registro de pago, ingreso o meta de ahorro de forma individual en cualquier momento. Al confirmarlo, el documento se elimina inmediatamente de Cloud Firestore.
                </li>
                <li>
                  <strong>Baja definitiva de cuenta y borrado total:</strong> Si deseás eliminar por completo tu cuenta de usuario, tu perfil y la totalidad de tus datos asociados, podés solicitarlo enviando un correo a{' '}
                  <a
                    href="mailto:galbanmartin01@gmail.com?subject=Solicitud%20de%20eliminación%20de%20cuenta%20Cuenta%20Clara"
                    className="font-bold text-teal-600 dark:text-teal-400 underline"
                  >
                    galbanmartin01@gmail.com
                  </a>{' '}
                  indicando la dirección de correo con la que te registraste. Procesaremos tu solicitud borrando tu usuario en Firebase Authentication y todos tus registros de Firestore.
                </li>
              </ol>
            </div>
          </section>

          {/* 9. Medidas de seguridad */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                8. Medidas de seguridad implementadas
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Reglas de Seguridad de Firestore (Security Rules):</strong> Aplicamos reglas estrictas en el servidor que garantizan que únicamente el usuario autenticado tiene permisos de lectura, creación, modificación y eliminación sobre sus propios datos (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">request.auth.uid == userId</code>). Ningún usuario puede ver ni alterar información de otro.
              </li>
              <li>
                <strong>Cifrado en tránsito:</strong> Toda comunicación entre tu navegador o dispositivo y los servidores de Google se realiza exclusivamente a través de canales cifrados HTTPS / TLS.
              </li>
              <li>
                <strong>Infraestructura de nivel empresarial:</strong> Los datos se almacenan en centros de datos seguros de Google Cloud que cumplen con los más altos estándares internacionales de seguridad física y lógica.
              </li>
            </ul>
          </section>

          {/* 10. Contacto del Responsable */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                9. Contacto del Responsable
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Si tenés dudas, consultas, comentarios o deseás ejercer tus derechos de acceso, rectificación o cancelación respecto a esta política de privacidad, podés comunicarte directamente con el responsable del proyecto:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                MG
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Martín Galván</p>
                <a
                  href="mailto:galbanmartin01@gmail.com"
                  className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  galbanmartin01@gmail.com
                </a>
              </div>
            </div>
          </section>

          {/* 11. Menores de edad */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                10. Privacidad de Menores
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Cuenta Clara está diseñada para personas con capacidad legal para contratar y administrar servicios financieros personales en su jurisdicción. No está dirigida a menores de edad ni recopilamos intencionalmente datos de menores. Si tomamos conocimiento de que se han recopilado datos de un menor sin consentimiento válido, procederemos a su eliminación inmediata.
            </p>
          </section>

          {/* 12. Modificaciones de esta política */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                11. Modificaciones a esta Política
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Podemos actualizar esta Política de Privacidad periódicamente para reflejar mejoras técnicas, nuevas funciones o exigencias regulatorias. La versión más reciente estará siempre disponible en esta misma página con su fecha de última actualización. En caso de cambios significativos que afecten tus derechos, te lo comunicaremos a través de la aplicación o la bandeja de avisos.
            </p>
          </section>
        </div>

        {/* Back Button Action */}
        <div className="mt-10 sm:mt-12 text-center pb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Cuenta Clara</span>
          </button>
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
            <span className="text-teal-600 dark:text-teal-400 font-semibold">Política de privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
