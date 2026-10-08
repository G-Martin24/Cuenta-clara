import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Globe,
  Clock,
  ArrowRight,
  Layers,
  Check,
} from 'lucide-react';
import { CurrencyCode } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: (currency: CurrencyCode, timezone: string, importStarterData: boolean) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinish }) => {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState<CurrencyCode>('ARS');
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires');
  const [importStarterData, setImportStarterData] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await onFinish(currency, timezone, importStarterData);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Progress indicator */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Bienvenida a Cuenta Clara • Paso {step} de 3
            </span>
            <span className="text-xs text-slate-400 font-semibold">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Currency */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  ¿Cuál es tu moneda principal?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Por defecto configuramos Pesos Argentinos (ARS), pero podrás registrar cuentas en USD y EUR cuando lo necesites.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { code: 'ARS' as CurrencyCode, label: 'Pesos Argentinos (ARS)', desc: 'Para servicios locales, impuestos, prepagas y alquileres.' },
                  { code: 'USD' as CurrencyCode, label: 'Dólares Estadounidenses (USD)', desc: 'Para suscripciones internacionales o servicios en dólares.' },
                  { code: 'EUR' as CurrencyCode, label: 'Euros (EUR)', desc: 'Para pagos en la Unión Europea o remesas.' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setCurrency(item.code)}
                    className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                      currency === item.code
                        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    {currency === item.code && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Timezone */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Zona horaria y vencimientos
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Para que las alertas y el calendario te avisen con la fecha exacta sin desfases.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Zona horaria seleccionada
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
                >
                  <option value="America/Argentina/Buenos_Aires">
                    America/Argentina/Buenos_Aires (GMT-3) - Argentina
                  </option>
                  <option value="America/Argentina/Cordoba">
                    America/Argentina/Cordoba (GMT-3)
                  </option>
                  <option value="America/Montevideo">
                    America/Montevideo (GMT-3) - Uruguay
                  </option>
                  <option value="America/Santiago">
                    America/Santiago (GMT-4/GMT-3) - Chile
                  </option>
                  <option value="UTC">UTC (Universal)</option>
                </select>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  🇦🇷 Formato de fecha estándar argentino: <strong>DD/MM/YYYY</strong>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Starter accounts */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tus primeros servicios
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  ¿Querés inicializar tu cuenta con los servicios más comunes de Argentina para editarlos rápidamente, o preferís empezar en blanco?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setImportStarterData(true)}
                  className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                    importStarterData
                      ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">Cargar ejemplos típicos de Argentina</span>
                      <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Crea servicios esenciales (Internet Flow, Edenor/Edesur, Metrogas, Netflix y Seguro) con sus vencimientos iniciales. Podrás cargar las nuevas facturas mensuales con sus montos reales a medida que te lleguen.
                    </p>
                  </div>
                  {importStarterData && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setImportStarterData(false)}
                  className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                    !importStarterData
                      ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm">Empezar de cero</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      El panel iniciará completamente vacío para que cargues tus cuentas manualmente una a una.
                    </p>
                  </div>
                  {!importStarterData && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Atrás
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Configurando...</span>
              ) : step === 3 ? (
                <>
                  <span>Comenzar a usar</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
