import type { Repeat } from '../db/db';

export const DAY = 86_400_000;

export const pad = (n: number) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD */
export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function startOfDay(d: Date | number = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date | number, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: number | Date, b: number | Date) {
  return dayKey(a) === dayKey(b);
}

export function isToday(t: number) {
  return sameDay(t, Date.now());
}

export function isPast(t: number) {
  return t < Date.now();
}

export function daysUntil(t: number) {
  return Math.round((startOfDay(t).getTime() - startOfDay().getTime()) / DAY);
}

/** Combine a YYYY-MM-DD and HH:MM (local) into epoch ms */
export function toEpoch(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export function toDateInput(t: number) {
  return dayKey(t);
}

export function toTimeInput(t: number) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Next occurrence strictly after `after` for a repeat rule, keeping the
 * time-of-day of `base`.
 */
export function nextOccurrence(base: number, repeat: Repeat, after: number = Date.now()): number | null {
  const b = new Date(base);
  const h = b.getHours();
  const mi = b.getMinutes();

  const at = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi, 0, 0).getTime();

  switch (repeat.kind) {
    case 'none':
      return base > after ? base : null;

    case 'daily': {
      const every = Math.max(1, repeat.every);
      let d = new Date(base);
      let t = at(d);
      while (t <= after) {
        d = addDays(d, every);
        t = at(d);
      }
      return t;
    }

    case 'weekly': {
      const days = repeat.days.length ? repeat.days : [b.getDay()];
      let d = startOfDay(Math.max(base, after));
      for (let i = 0; i < 8; i++) {
        const t = at(d);
        if (days.includes(d.getDay()) && t > after) return t;
        d = addDays(d, 1);
      }
      return null;
    }

    case 'monthly': {
      const day = repeat.day || b.getDate();
      let d = new Date(Math.max(base, after));
      for (let i = 0; i < 14; i++) {
        const y = d.getFullYear();
        const m = d.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const t = new Date(y, m, Math.min(day, lastDay), h, mi).getTime();
        if (t > after) return t;
        d = new Date(y, m + 1, 1);
      }
      return null;
    }

    case 'yearly': {
      let y = new Date(after).getFullYear();
      for (let i = 0; i < 3; i++) {
        const t = new Date(y, b.getMonth(), b.getDate(), h, mi).getTime();
        if (t > after) return t;
        y++;
      }
      return null;
    }

    case 'afterClass': {
      // Class days → remind the NEXT day at hour:minute
      const classDays = repeat.days.length ? repeat.days : [b.getDay()];
      const remindDays = classDays.map((d) => (d + 1) % 7);
      let d = startOfDay(after);
      for (let i = 0; i < 8; i++) {
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), repeat.hour, repeat.minute).getTime();
        if (remindDays.includes(d.getDay()) && t > after) return t;
        d = addDays(d, 1);
      }
      return null;
    }
  }
}

export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export function fmtTime(t: number, lang: 'en' | 'vi') {
  return new Date(t).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateShort(t: number, lang: 'en' | 'vi') {
  return new Date(t).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}
