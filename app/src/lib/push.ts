import { getVapidKey, registerPush } from './api';
import { saveSettings } from './store';

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Ask permission, subscribe and register with the worker. Returns an error message key or null. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-install';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  const key = await getVapidKey();
  if (!key) return 'no-server';
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  }
  const ok = await registerPush(sub);
  if (!ok) return 'no-server';
  await saveSettings({ pushEnabled: true });
  return null;
}

/** Re-register the existing subscription on every launch (iOS may rotate it). */
export async function refreshPush() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await registerPush(sub);
  } catch (e) {
    console.warn('refreshPush', e);
  }
}
