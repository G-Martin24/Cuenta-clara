import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Receipt,
  BarChart3,
  Target,
  Settings,
  Wallet,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAccountsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAccountsCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cuentas y Servicios', icon: Layers, badge: activeAccountsCount },
    { id: 'budget', label: 'Ingresos y Presupuesto', icon: Wallet },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'payments', label: 'Historial de Pagos', icon: Receipt },
    { id: 'analytics', label: 'Análisis y Gastos', icon: BarChart3 },
    { id: 'goals', label: 'Objetivos de Ahorro', icon: Target },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Gestión Personal
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold shadow-xs border-l-4 border-teal-600'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/60">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Tranquilidad financiera
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Tené siempre presente tus vencimientos y proyectá tus gastos mensuales sin sorpresas.
          </p>
        </div>
      </div>
    </aside>
  );
};
