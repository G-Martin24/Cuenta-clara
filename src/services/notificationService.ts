import { BillInstance, AppNotification, NotificationSettings } from '../types';
import { db } from '../firebase/config';
import { generateId } from './firestoreService';
import { collection, doc, setDoc } from 'firebase/firestore';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  noticeDays: [0, 1, 3], // Día del vencimiento (0), 1 día antes, 3 días antes
  reminderTime: '09:00',
  notifyOverdue: true,
  notifyPriceChanges: true,
  soundEnabled: true,
};

// Check if browser/device supports Web Notifications
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Check current notification permission
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission from the user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();

    // If granted, try to register Periodic Background Sync if available
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          // Periodic sync runs in background even when closed (Chromium/Android)
          await (reg as any).periodicSync.register('check-due-bills', {
            minInterval: 12 * 60 * 60 * 1000, // 12 hours
          });
        }
      } catch (err) {
        // Periodic sync registration can fail silently if not supported or not installed
      }
    }

    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return 'default';
  }
}

// Play pleasant chime audio using Web Audio API synthesis
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Audio might be blocked by autoplay policies
  }
}

// Show native push/system notification via Service Worker or Notification API
export async function showSystemNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    url?: string;
    icon?: string;
    playSound?: boolean;
  }
): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') return false;

  if (options.playSound !== false) {
    playNotificationChime();
  }

  const notifIcon = options.icon || '/pwa-192x192.png';
  const tag = options.tag || 'cuenta-clara-notif';
  const data = { url: options.url || '/' };

  // 1. Try via Service Worker registration (native push style on mobile & desktop)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body: options.body,
          icon: notifIcon,
          badge: '/icon.svg',
          tag,
          data,
          vibrate: [200, 100, 200],
        } as any);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. Direct Notification API fallback
  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: notifIcon,
      tag,
      data,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Direct notification failed:', err);
    return false;
  }
}

// Sync upcoming reminders with Service Worker memory & localStorage for background triggers
export async function syncRemindersToServiceWorker(bills: BillInstance[]) {
  const pendingBills = bills
    .filter((b) => b.status === 'pending' || b.status === 'upcoming')
    .map((b) => ({
      id: b.id,
      accountId: b.accountId,
      accountName: b.accountName,
      amount: b.actualAmount || b.estimatedAmount,
      currency: b.currency,
      dueDate: b.dueDate,
    }));

  try {
    localStorage.setItem('cuenta_clara_cached_reminders', JSON.stringify(pendingBills));
  } catch (e) {
    // localStorage may fail in quota exceeded
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_REMINDERS',
      reminders: pendingBills,
    });
  }
}

// Main background checker: scans pending bills against due dates and notice settings
export async function checkAndTriggerDueNotifications(
  userId: string,
  bills: BillInstance[],
  settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS
): Promise<{ triggeredCount: number }> {
  if (!settings.enabled) return { triggeredCount: 0 };

  const permission = getNotificationPermission();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let triggeredCount = 0;

  // Filter bills to check
  const activeBills = bills.filter(
    (b) => b.status === 'pending' || b.status === 'upcoming' || b.status === 'overdue'
  );

  for (const bill of activeBills) {
    const dueTime = new Date(`${bill.dueDate}T00:00:00`).getTime();
    const todayTime = new Date(`${todayStr}T00:00:00`).getTime();
    const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

    let shouldAlert = false;
    let notifTitle = '';
    let notifBody = '';
    let notifType: AppNotification['type'] = 'due_soon';

    const formattedAmount = `${bill.currency} ${Number(bill.actualAmount || bill.estimatedAmount).toLocaleString('es-AR')}`;

    if (diffDays === 0 && settings.noticeDays.includes(0)) {
      // Due TODAY!
      shouldAlert = true;
      notifType = 'due_soon';
      notifTitle = `¡Vence HOY: ${bill.accountName}!`;
      notifBody = `Monto a pagar: ${formattedAmount}. No te olvides de registrar o realizar el pago hoy.`;
    } else if (diffDays === 1 && settings.noticeDays.includes(1)) {
      // Due TOMORROW
      shouldAlert = true;
      notifType = 'due_soon';
      notifTitle = `Vence mañana: ${bill.accountName}`;
      notifBody = `Monto estimado: ${formattedAmount}. Tu vencimiento opera mañana ${bill.dueDate}.`;
    } else if (diffDays > 1 && settings.noticeDays.includes(diffDays)) {
      // Due in X days
      shouldAlert = true;
      notifType = 'due_soon';
      notifTitle = `Próximo vencimiento: ${bill.accountName}`;
      notifBody = `Vence en ${diffDays} días (${bill.dueDate}). Monto estimado: ${formattedAmount}.`;
    } else if (diffDays < 0 && settings.notifyOverdue) {
      // Overdue
      shouldAlert = true;
      notifType = 'overdue';
      const daysOverdue = Math.abs(diffDays);
      notifTitle = `⚠️ Cuenta Vencida: ${bill.accountName}`;
      notifBody = `Venció hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''} (${bill.dueDate}). Pago pendiente: ${formattedAmount}.`;
    }

    if (shouldAlert) {
      // Deduplicate: avoid triggering multiple times on the same date for the exact same diff
      const dedupeKey = `cc_notif_sent_${userId}_${todayStr}_${bill.id}_${diffDays}`;
      if (localStorage.getItem(dedupeKey)) {
        continue;
      }

      // Mark as triggered in storage
      localStorage.setItem(dedupeKey, 'true');
      triggeredCount++;

      // 1. Show native device notification if permitted
      if (permission === 'granted') {
        await showSystemNotification(notifTitle, {
          body: notifBody,
          tag: `due-${bill.id}-${diffDays}`,
          url: '/',
          playSound: settings.soundEnabled,
        });
      }

      // 2. Also register in-app notification in Firestore if logged in
      try {
        const notifId = generateId('notif_due');
        const notif: AppNotification = {
          id: notifId,
          userId,
          type: notifType,
          title: notifTitle,
          message: notifBody,
          accountId: bill.accountId,
          billId: bill.id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userId, 'notifications', notifId), notif);
      } catch (err) {
        console.warn('Could not save in-app notification to Firestore:', err);
      }
    }
  }

  // Update last checked date in settings
  settings.lastCheckedDate = todayStr;

  // Also sync to Service Worker
  await syncRemindersToServiceWorker(bills);

  return { triggeredCount };
}

// Send test notification to verify mobile/desktop delivery
export async function sendTestNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const res = await requestNotificationPermission();
    if (res !== 'granted') return false;
  }

  return showSystemNotification('🔔 Notificación de prueba - Cuenta Clara', {
    body: '¡Excelente! Los recordatorios de vencimiento están activos y listos en tu celular o dispositivo.',
    playSound: true,
  });
}
