import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'card' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, do not display install buttons
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Aplicación instalada en tu dispositivo (Modo PWA Autónomo)!</span>
        </div>
      );
    }
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'settings') {
      return (
        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/80 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instalar app en tu pantalla de inicio</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Accedé más rápido y recibí avisos sin abrir el navegador.</p>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      );
    }

    if (variant === 'card') {
      return (
        <button
          onClick={install}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-medium transition active:scale-95 shadow-xs"
        title="Instalar Cuenta Clara en este dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar app</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'settings' ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instalar en iPhone o iPad</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Permite habilitar notificaciones push y uso como app nativa.</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-600/40 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 text-xs font-semibold hover:bg-teal-100/50 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ver cómo</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-800 transition"
            title="Instalar en iPhone o iPad"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar en iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Instalar Cuenta Clara en iPhone / iPad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Seguí estos 2 pasos para añadir la app y recibir avisos de vencimiento:
              </p>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <p>Tocá el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba en la barra de Safari).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <p>Deslizá hacia abajo y seleccioná <strong>&quot;Agregar a pantalla de inicio&quot;</strong> (Add to Home Screen).</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-teal-600 hover:bg-teal-500 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
