export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'cuentaclara_theme';

export function getSavedTheme(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch (_) {
    // ignore
  }
  return 'light';
}

export function isDarkActive(theme: ThemePreference): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  // system
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function applyTheme(theme: ThemePreference): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_) {
    // ignore
  }

  const dark = isDarkActive(theme);
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }
  return dark;
}
