import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Wallet,
  MoreHorizontal,
  Receipt,
  BarChart3,
  Target,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const mainItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cuentas', icon: Layers },
    { id: 'budget', label: 'Presupuesto', icon: Wallet },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
  ];

  const moreItems = [
    { id: 'payments', label: 'Historial de Pagos', description: 'Comprobantes y recibos', icon: Receipt },
    { id: 'analytics', label: 'Análisis y Gastos', description: 'Gráficos y distribución', icon: BarChart3 },
    { id: 'goals', label: 'Objetivos de Ahorro', description: 'Metas y progreso', icon: Target },
    { id: 'settings', label: 'Configuración', description: 'Preferencias y moneda', icon: Settings },
  ];

  const isMoreActive = moreItems.some((item) => item.id === activeTab);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer for More Items */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMoreOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 shadow-2xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] z-10 space-y-3 animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Más Secciones
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pt-1.5 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-lg select-none">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* 5th Button: Más */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
            isMoreActive
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-colors relative ${
              isMoreActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isMoreActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-teal-500 rounded-full" />
            )}
          </div>
          <span className="mt-0.5 tracking-tight">
            {isMoreActive
              ? moreItems.find((i) => i.id === activeTab)?.label.split(' ')[0] || 'Más'
              : 'Más'}
          </span>
        </button>
      </nav>
    </>
  );
};

