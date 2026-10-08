import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { applyTheme, getSavedTheme, isDarkActive } from '../utils/theme';

interface NavbarProps {
  onOpenAddAccount: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddAccount,
  onOpenNotifications,
  unreadCount,
  activeTab,
  setActiveTab,
}) => {
  const { user, userProfile, updateUserPreferences, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return isDarkActive(userProfile?.theme || getSavedTheme());
  });

  useEffect(() => {
    setIsDark(isDarkActive(userProfile?.theme || getSavedTheme()));
  }, [userProfile?.theme]);

  const toggleDarkMode = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const darkNow = applyTheme(nextTheme);
    setIsDark(darkNow);
    updateUserPreferences({ theme: nextTheme }).catch(() => {});
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">Cuenta Clara</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                ARG
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Control de servicios y vencimientos</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton variant="nav" />

          <button
            onClick={onOpenAddAccount}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm active:scale-95"
            title="Crear nueva cuenta recurrente"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Agregar cuenta</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Bandeja de notificaciones y alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-300" />
            )}
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-sm"
              title="Opciones de usuario"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-8 h-8 rounded-full border border-teal-500/50 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-200 flex items-center justify-center font-bold text-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="font-medium hidden md:inline truncate max-w-[120px]">
                {user?.displayName?.split(' ')[0] || userProfile?.displayName || 'Usuario'}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-slate-800 dark:text-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold truncate">{user?.displayName || 'Usuario'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                      <span>Moneda: {userProfile?.defaultCurrency || 'ARS'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Mi perfil y ajustes</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-500" />
                      )}
                      <span>{isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {isDark ? 'Oscuro' : 'Claro'}
                    </span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
