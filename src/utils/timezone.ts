/**
 * Official IANA Timezone definitions and timezone-aware date helpers for Cuenta Clara.
 * Automatically respects Daylight Saving Time (DST) changes without hardcoded GMT/UTC offsets.
 */

export interface TimezoneOption {
  id: string; // Official IANA Identifier
  label: string; // User-facing label e.g. "America/Argentina/Buenos_Aires — Argentina"
  country: string;
}

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  { id: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires — Argentina', country: 'Argentina' },
  { id: 'America/Argentina/Cordoba', label: 'America/Argentina/Cordoba — Argentina', country: 'Argentina' },
  { id: 'America/La_Paz', label: 'America/La_Paz — Bolivia', country: 'Bolivia' },
  { id: 'America/Santiago', label: 'America/Santiago — Chile', country: 'Chile' },
  { id: 'America/Bogota', label: 'America/Bogota — Colombia', country: 'Colombia' },
  { id: 'America/Costa_Rica', label: 'America/Costa_Rica — Costa Rica', country: 'Costa Rica' },
  { id: 'America/Guatemala', label: 'America/Guatemala — Guatemala', country: 'Guatemala' },
  { id: 'America/Guayaquil', label: 'America/Guayaquil — Ecuador', country: 'Ecuador' },
  { id: 'America/Asuncion', label: 'America/Asuncion — Paraguay', country: 'Paraguay' },
  { id: 'America/Lima', label: 'America/Lima — Perú', country: 'Perú' },
  { id: 'America/Managua', label: 'America/Managua — Nicaragua', country: 'Nicaragua' },
  { id: 'America/Mexico_City', label: 'America/Mexico_City — México', country: 'México' },
  { id: 'America/Montevideo', label: 'America/Montevideo — Uruguay', country: 'Uruguay' },
  { id: 'America/Caracas', label: 'America/Caracas — Venezuela', country: 'Venezuela' },
  { id: 'America/Panama', label: 'America/Panama — Panamá', country: 'Panamá' },
  { id: 'America/Santo_Domingo', label: 'America/Santo_Domingo — República Dominicana', country: 'República Dominicana' },
  { id: 'America/Havana', label: 'America/Havana — Cuba', country: 'Cuba' },
  { id: 'America/Sao_Paulo', label: 'America/Sao_Paulo — Brasil', country: 'Brasil' },
  { id: 'Europe/Madrid', label: 'Europe/Madrid — España', country: 'España' },
  { id: 'UTC', label: 'UTC — Universal', country: 'Universal' },
];

/**
 * Auto-detects device timezone using Intl.DateTimeFormat().resolvedOptions().timeZone.
 * Falls back to America/Argentina/Buenos_Aires if detection fails or is unavailable.
 */
export function detectUserTimezone(): string {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved && typeof resolved === 'string') {
        // Validate with Intl to ensure it doesn't throw
        new Intl.DateTimeFormat('es-AR', { timeZone: resolved }).format(new Date());
        return resolved;
      }
    }
  } catch (err) {
    console.warn('Could not detect device timezone, falling back to default:', err);
  }
  return DEFAULT_TIMEZONE;
}

const STORAGE_KEY = 'cuentaclara_timezone';

export function getStoredTimezone(): string {
  if (typeof window === 'undefined') return DEFAULT_TIMEZONE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch (_) {}
  return detectUserTimezone();
}

export function setStoredTimezone(timezone: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, timezone);
  } catch (_) {}
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's specific IANA timezone.
 * Automatically handles DST changes and date boundaries across the globe.
 */
export function getTodayYMD(timezone?: string): string {
  const tz = timezone || getStoredTimezone();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns numeric components { year, month, day } for current time in the specified timezone.
 * Month is 1-indexed (1 = January, 12 = December).
 */
export function getNowPartsInTimezone(timezone?: string): { year: number; month: number; day: number } {
  const ymd = getTodayYMD(timezone);
  const [y, m, d] = ymd.split('-').map(Number);
  return { year: y, month: m, day: d };
}
