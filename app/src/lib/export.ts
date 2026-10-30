import { db, type Task } from '../db/db';
import { pad } from './dates';

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportJson() {
  const data = {
    app: 'little-notes',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: await db.tasks.toArray(),
    notes: await db.notes.toArray(),
    categories: await db.categories.toArray(),
    completions: await db.completions.toArray(),
    settings: await db.settings.toArray(),
  };
  download(`little-notes-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
}

export async function importJson(file: File): Promise<boolean> {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'little-notes') return false;
    await db.transaction('rw', db.tasks, db.notes, db.categories, db.completions, db.settings, async () => {
      if (data.categories?.length) await db.categories.bulkPut(data.categories);
      if (data.tasks?.length) await db.tasks.bulkPut(data.tasks);
      if (data.notes?.length) await db.notes.bulkPut(data.notes);
      if (data.completions?.length) await db.completions.bulkPut(data.completions.map((c: { id?: number }) => ({ ...c, id: undefined })));
      if (data.settings?.length) {
        const cur = await db.settings.get('main');
        const incoming = data.settings[0];
        // keep this device's token and push state
        await db.settings.put({ ...incoming, key: 'main', deviceToken: cur?.deviceToken ?? incoming.deviceToken, pushEnabled: cur?.pushEnabled ?? false });
      }
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/** iCalendar export with VALARM so the iPhone Calendar rings with a real alarm sound. */
function icsDate(t: number) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function rrule(t: Task): string | null {
  const r = t.repeat;
  const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  switch (r.kind) {
    case 'none':
      return null;
    case 'daily':
      return `RRULE:FREQ=DAILY;INTERVAL=${Math.max(1, r.every)}`;
    case 'weekly':
      return `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => DAYS[d]).join(',')}`;
    case 'monthly':
      return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${r.day}`;
    case 'yearly':
      return 'RRULE:FREQ=YEARLY';
    case 'afterClass':
      return `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => DAYS[(d + 1) % 7]).join(',')}`;
  }
}

export async function exportIcs() {
  const tasks = (await db.tasks.toArray()).filter((t) => !t.done && t.dueAt);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Little Notes//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Little Notes'];
  for (const t of tasks) {
    const rr = rrule(t);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@little-notes`,
      `DTSTAMP:${icsDate(Date.now())}`,
      `DTSTART:${icsDate(t.dueAt!)}`,
      `DTEND:${icsDate(t.dueAt! + 15 * 60_000)}`,
      `SUMMARY:${esc(t.title)}${t.titleVi ? ' / ' + esc(t.titleVi) : ''}`,
      ...(t.note ? [`DESCRIPTION:${esc(t.note)}`] : []),
      ...(rr ? [rr] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      `DESCRIPTION:${esc(t.title)}`,
      'END:VALARM',
      ...(t.remindBeforeDays > 0
        ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `TRIGGER:-P${t.remindBeforeDays}D`, `DESCRIPTION:${esc(t.title)}`, 'END:VALARM']
        : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  download('little-notes.ics', lines.join('\r\n'), 'text/calendar');
}
