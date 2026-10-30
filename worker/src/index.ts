// Little Notes — notification worker.
// Runs on Cloudflare Workers (free plan): D1 for state, a cron every minute to fire due reminders,
// Web Push (VAPID) to the device. The app works fully offline; this only sends notifications.
import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';

export interface Env {
  DB: D1Database;
  APP_SECRET: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGIN: string;
}

interface DeviceRow {
  token: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  tz: string;
  lang: string;
  morning_enabled: number;
  morning_hour: number;
  morning_minute: number;
  morning_count: number;
  morning_last_day: string | null;
}

interface ReminderRow {
  id: string;
  token: string;
  title: string;
  body: string;
  url: string;
  fire_at: number;
  nag: number;
  nag_every_min: number;
  nag_max: number;
  attempts: number;
  done: number;
}

const json = (data: unknown, status = 200, env?: Env) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...cors(env) } });

const cors = (env?: Env) => ({
  'access-control-allow-origin': env?.ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-device',
});

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (path === '/' || path === '/health') return json({ ok: true, app: 'little-notes' }, 200, env);

    // auth: Bearer APP_SECRET + x-device token
    const auth = req.headers.get('authorization') ?? '';
    const secret = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!env.APP_SECRET || !timingSafeEqual(secret, env.APP_SECRET)) return json({ error: 'unauthorized' }, 401, env);
    const token = req.headers.get('x-device') ?? '';
    if (!token) return json({ error: 'missing device' }, 400, env);

    try {
      if (path === '/vapid' && req.method === 'GET') return json({ publicKey: env.VAPID_PUBLIC_KEY }, 200, env);

      if (path === '/subscribe' && req.method === 'POST') {
        const { subscription, tz, lang } = (await req.json()) as { subscription: PushSubscription; tz?: string; lang?: string };
        if (!subscription?.endpoint?.startsWith('https://')) return json({ error: 'bad subscription' }, 400, env);
        await env.DB.prepare(
          `INSERT INTO devices (token, endpoint, p256dh, auth, tz, lang, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7)
           ON CONFLICT(token) DO UPDATE SET endpoint=excluded.endpoint, p256dh=excluded.p256dh, auth=excluded.auth, tz=excluded.tz, lang=excluded.lang, updated_at=excluded.updated_at`,
        )
          .bind(token, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, tz ?? 'Asia/Ho_Chi_Minh', lang ?? 'both', Date.now())
          .run();
        return json({ ok: true }, 200, env);
      }

      if (path === '/reminders' && req.method === 'POST') {
        const r = (await req.json()) as {
          id: string; title: string; body: string; fireAt: number; nag: boolean; nagEveryMin: number; nagMax: number; url?: string;
          extra?: { fireAt: number; title: string; body: string }[];
        };
        if (!r.id || !r.title || !r.fireAt) return json({ error: 'bad reminder' }, 400, env);
        const stmts = [
          env.DB.prepare(`DELETE FROM reminders WHERE token=?1 AND (id=?2 OR id LIKE ?3)`).bind(token, r.id, `${r.id}:%`),
          env.DB.prepare(
            `INSERT INTO reminders (id, token, title, body, url, fire_at, nag, nag_every_min, nag_max) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
          ).bind(r.id, token, r.title, r.body ?? '', r.url ?? '/', r.fireAt, r.nag ? 1 : 0, Math.max(1, r.nagEveryMin || 10), Math.max(1, r.nagMax || 5)),
        ];
        for (const [i, e] of (r.extra ?? []).entries()) {
          stmts.push(
            env.DB.prepare(`INSERT INTO reminders (id, token, title, body, url, fire_at) VALUES (?1,?2,?3,?4,?5,?6)`).bind(
              `${r.id}:${i}`, token, e.title, e.body ?? '', r.url ?? '/', e.fireAt,
            ),
          );
        }
        await env.DB.batch(stmts);
        return json({ ok: true }, 200, env);
      }

      const del = path.match(/^\/reminders\/([^/]+)$/);
      if (del && req.method === 'DELETE') {
        const id = decodeURIComponent(del[1]);
        await env.DB.prepare(`DELETE FROM reminders WHERE token=?1 AND (id=?2 OR id LIKE ?3)`).bind(token, id, `${id}:%`).run();
        return json({ ok: true }, 200, env);
      }

      if (path === '/morning' && req.method === 'POST') {
        const m = (await req.json()) as { enabled: boolean; hour: number; minute: number; count: number };
        await env.DB.prepare(`UPDATE devices SET morning_enabled=?1, morning_hour=?2, morning_minute=?3, morning_count=?4 WHERE token=?5`)
          .bind(m.enabled ? 1 : 0, m.hour ?? 7, m.minute ?? 30, m.count ?? 0, token)
          .run();
        return json({ ok: true }, 200, env);
      }

      if (path === '/test' && req.method === 'POST') {
        const dev = await env.DB.prepare(`SELECT * FROM devices WHERE token=?1`).bind(token).first<DeviceRow>();
        if (!dev) return json({ error: 'no device' }, 404, env);
        const ok = await sendPush(env, dev, { title: 'Little Notes 🐰', body: 'Future you will thank you for this ✨', url: '/' });
        return json({ ok }, ok ? 200 : 502, env);
      }

      if (path === '/ideas' && req.method === 'POST') {
        const { text } = (await req.json()) as { text: string };
        if (!text?.trim()) return json({ error: 'empty' }, 400, env);
        await env.DB.prepare(`INSERT INTO ideas (token, text, created_at) VALUES (?1,?2,?3)`).bind(token, text.trim().slice(0, 2000), Date.now()).run();
        return json({ ok: true }, 200, env);
      }

      if (path === '/ideas' && req.method === 'GET') {
        // For Luis: read the idea box (same secret).  curl -H "authorization: Bearer $APP_SECRET" -H "x-device: luis" https://…/ideas
        const rows = await env.DB.prepare(`SELECT id, text, created_at FROM ideas ORDER BY id DESC LIMIT 100`).all();
        return json(rows.results, 200, env);
      }

      return json({ error: 'not found' }, 404, env);
    } catch (e) {
      console.error(e);
      return json({ error: 'server error' }, 500, env);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(tick(env));
  },
};

async function tick(env: Env) {
  const now = Date.now();

  // 1) due reminders
  const due = await env.DB.prepare(`SELECT * FROM reminders WHERE done=0 AND fire_at<=?1 ORDER BY fire_at LIMIT 50`).bind(now).all<ReminderRow>();
  for (const r of due.results) {
    const dev = await env.DB.prepare(`SELECT * FROM devices WHERE token=?1`).bind(r.token).first<DeviceRow>();
    if (!dev) {
      await env.DB.prepare(`DELETE FROM reminders WHERE id=?1 AND token=?2`).bind(r.id, r.token).run();
      continue;
    }
    const attempt = r.attempts + 1;
    const prefix = r.nag && attempt > 1 ? `🔔 (${attempt}) ` : '';
    await sendPush(env, dev, { title: `${prefix}${r.title}`, body: r.body, url: r.url, tag: r.id });

    if (r.nag && attempt < r.nag_max) {
      await env.DB.prepare(`UPDATE reminders SET attempts=?1, fire_at=?2 WHERE id=?3 AND token=?4`)
        .bind(attempt, now + r.nag_every_min * 60_000, r.id, r.token)
        .run();
    } else {
      // Fired for good. The app re-schedules repeats when the task is completed or opened.
      await env.DB.prepare(`UPDATE reminders SET attempts=?1, done=1 WHERE id=?2 AND token=?3`).bind(attempt, r.id, r.token).run();
    }
  }

  // 2) morning summary
  const devices = await env.DB.prepare(`SELECT * FROM devices WHERE morning_enabled=1`).all<DeviceRow>();
  for (const dev of devices.results) {
    const local = localTime(now, dev.tz);
    if (local.hour !== dev.morning_hour || local.minute !== dev.morning_minute) continue;
    if (dev.morning_last_day === local.day) continue;
    const today = await env.DB.prepare(`SELECT COUNT(*) AS n FROM reminders WHERE token=?1 AND done=0 AND fire_at BETWEEN ?2 AND ?3`)
      .bind(dev.token, now, now + 86_400_000)
      .first<{ n: number }>();
    const n = today?.n ?? dev.morning_count;
    const body =
      dev.lang === 'vi'
        ? n ? `Hôm nay bạn có ${n} việc. Từng bước nhỏ thôi 🌸` : 'Hôm nay rảnh rỗi. Tận hưởng nhé! 🐰'
        : n ? `You have ${n} thing${n === 1 ? '' : 's'} today. Small steps 🌸` : 'Nothing planned today. Enjoy! 🐰';
    await sendPush(env, dev, { title: `Good morning ☀️`, body, url: '/', tag: 'morning' });
    await env.DB.prepare(`UPDATE devices SET morning_last_day=?1 WHERE token=?2`).bind(local.day, dev.token).run();
  }

  // 3) cleanup old fired reminders
  await env.DB.prepare(`DELETE FROM reminders WHERE done=1 AND fire_at < ?1`).bind(now - 7 * 86_400_000).run();
}

function localTime(ts: number, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ts));
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return { hour: Number(g('hour')) % 24, minute: Number(g('minute')), day: `${g('year')}-${g('month')}-${g('day')}` };
  } catch {
    const d = new Date(ts);
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes(), day: d.toISOString().slice(0, 10) };
  }
}

async function sendPush(env: Env, dev: DeviceRow, msg: { title: string; body?: string; url?: string; tag?: string }): Promise<boolean> {
  const sub: PushSubscription = { endpoint: dev.endpoint, expirationTime: null, keys: { p256dh: dev.p256dh, auth: dev.auth } };
  try {
    const payload = await buildPushPayload(
      { data: JSON.stringify(msg), options: { ttl: 60 * 60 * 6, urgency: 'high' } },
      sub,
      { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY },
    );
    const res = await fetch(dev.endpoint, payload);
    if (res.status === 404 || res.status === 410) {
      // subscription gone (iOS rotates them): drop it; the app re-registers on next launch
      await env.DB.prepare(`DELETE FROM devices WHERE token=?1`).bind(dev.token).run();
      return false;
    }
    return res.ok;
  } catch (e) {
    console.error('push failed', e);
    return false;
  }
}
