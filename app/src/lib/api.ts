// Talks to the Cloudflare Worker (push notifications + idea box).
// Everything is best-effort: the app works fully offline; the worker only fires notifications.
import { db, DEFAULT_SETTINGS, type Task } from '../db/db';

async function cfg() {
  const s = (await db.settings.get('main')) ?? DEFAULT_SETTINGS;
  return { url: s.apiUrl.replace(/\/$/, ''), secret: s.apiSecret, token: s.deviceToken, enabled: s.pushEnabled, lang: s.lang, tz: s.timeZone };
}

async function call(path: string, body: unknown, method = 'POST') {
  const c = await cfg();
  if (!c.url || !c.secret) return null;
  try {
    const r = await fetch(`${c.url}${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${c.secret}`, 'x-device': c.token },
      body: method === 'GET' ? undefined : JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json().catch(() => ({}));
  } catch (e) {
    console.warn('api', path, e);
    return null;
  }
}

export async function getVapidKey(): Promise<string | null> {
  const r = await call('/vapid', null, 'GET');
  return r?.publicKey ?? null;
}

export async function registerPush(sub: PushSubscription) {
  const c = await cfg();
  return call('/subscribe', { subscription: sub.toJSON(), tz: c.tz, lang: c.lang });
}

export async function syncReminder(t: Task) {
  const c = await cfg();
  if (!c.enabled) return;
  const fireAt = t.snoozedUntil && t.snoozedUntil > Date.now() ? t.snoozedUntil : t.dueAt;
  if (t.done || !fireAt) return cancelReminder(t.id);
  const body = t.titleVi && c.lang !== 'en' ? (c.lang === 'both' ? `${t.title}\n${t.titleVi}` : t.titleVi) : t.title;
  const extra: { fireAt: number; title: string; body: string }[] = [];
  if (t.remindBeforeDays > 0) {
    const before = fireAt - t.remindBeforeDays * 86_400_000;
    if (before > Date.now()) extra.push({ fireAt: before, title: `🎁 In ${t.remindBeforeDays} days`, body });
  }
  return call('/reminders', {
    id: t.id,
    title: t.title,
    body,
    fireAt,
    nag: t.nag,
    nagEveryMin: t.nagEveryMin,
    nagMax: t.nagMax,
    extra,
    url: `/#/task/${t.id}`,
  });
}

export async function cancelReminder(id: string) {
  return call(`/reminders/${id}`, null, 'DELETE');
}

export async function sendTest() {
  return call('/test', {});
}

export async function sendIdea(text: string) {
  return call('/ideas', { text, at: Date.now() });
}

export async function setMorningSummary(enabled: boolean, hour: number, minute: number, count: number) {
  return call('/morning', { enabled, hour, minute, count });
}
