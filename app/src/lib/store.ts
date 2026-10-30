// A tiny reactive store over Dexie: hooks for tasks, notes, categories and settings.
import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';
import { db, DEFAULT_SETTINGS, uid, type Category, type Note, type Settings, type Task } from '../db/db';
import { dayKey, nextOccurrence } from './dates';
import { syncReminder, cancelReminder } from './api';

export function useLive<T>(query: () => Promise<T> | T, initial: T, deps: unknown[] = []): T {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setV, error: (e) => console.error(e) });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

export const useSettings = () => useLive(() => db.settings.get('main').then((s) => s ?? DEFAULT_SETTINGS), DEFAULT_SETTINGS);
export const useCategories = () => useLive(() => db.categories.orderBy('order').toArray(), []);
export const useTasks = () => useLive(() => db.tasks.toArray(), []);
export const useNotes = () => useLive(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
export const useCompletionDays = () =>
  useLive(async () => {
    const all = await db.completions.toArray();
    return new Set(all.map((c) => c.day));
  }, new Set<string>());

export async function saveSettings(patch: Partial<Settings>) {
  const cur = (await db.settings.get('main')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...cur, ...patch, key: 'main' });
}

export function newTask(categoryId: string): Task {
  const now = Date.now();
  const due = new Date();
  due.setHours(due.getHours() + 1, 0, 0, 0);
  return {
    id: uid(),
    title: '',
    titleVi: '',
    note: '',
    categoryId,
    dueAt: due.getTime(),
    allDay: false,
    repeat: { kind: 'none' },
    nag: false,
    nagEveryMin: 10,
    nagMax: 5,
    remindBeforeDays: 0,
    steps: [],
    done: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    snoozedUntil: null,
  };
}

export async function saveTask(t: Task) {
  t.updatedAt = Date.now();
  await db.tasks.put(t);
  await syncReminder(t);
}

export async function deleteTask(id: string) {
  await db.tasks.delete(id);
  await cancelReminder(id);
}

/** Mark done. Returns the task's next occurrence if it repeats (a fresh copy is scheduled). */
export async function completeTask(t: Task): Promise<{ streak: number; unlocked?: string }> {
  const now = Date.now();
  await db.completions.add({ taskId: t.id, day: dayKey(now), at: now });

  if (t.repeat.kind !== 'none' && t.dueAt) {
    const next = nextOccurrence(t.dueAt, t.repeat, Math.max(now, t.dueAt));
    const fresh: Task = { ...t, dueAt: next, done: false, completedAt: null, snoozedUntil: null, steps: t.steps.map((s) => ({ ...s, done: false })), updatedAt: now };
    await db.tasks.put(fresh);
    await syncReminder(fresh);
  } else {
    await db.tasks.put({ ...t, done: true, completedAt: now, updatedAt: now });
    await cancelReminder(t.id);
  }
  return updateStreak();
}

export async function uncompleteTask(t: Task) {
  await db.tasks.put({ ...t, done: false, completedAt: null, updatedAt: Date.now() });
  await syncReminder({ ...t, done: false });
}

export async function snoozeTask(t: Task, minutes: number) {
  const until = minutes >= 1440 ? tomorrowAt(t.dueAt ?? Date.now()) : Date.now() + minutes * 60_000;
  const next: Task = { ...t, snoozedUntil: until, updatedAt: Date.now() };
  await db.tasks.put(next);
  await syncReminder(next);
}

function tomorrowAt(t: number) {
  const d = new Date(t);
  const tm = new Date();
  tm.setDate(tm.getDate() + 1);
  tm.setHours(d.getHours(), d.getMinutes(), 0, 0);
  return tm.getTime();
}

/** Streak = consecutive days (ending today or yesterday) with at least one completion. */
export async function computeStreak(): Promise<number> {
  const days = new Set((await db.completions.toArray()).map((c) => c.day));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const STREAK_UNLOCKS: Record<number, string> = { 3: 'flower', 7: 'sparkle', 14: 'cake' };

async function updateStreak() {
  const streak = await computeStreak();
  const s = (await db.settings.get('main')) ?? DEFAULT_SETTINGS;
  let unlocked: string | undefined;
  for (const [n, name] of Object.entries(STREAK_UNLOCKS)) {
    if (streak >= Number(n) && !s.unlocked.includes(name)) {
      unlocked = name;
      await saveSettings({ unlocked: [...s.unlocked, name] });
      break;
    }
  }
  return { streak, unlocked };
}

export async function addCategory(c: Omit<Category, 'id' | 'order'>) {
  const n = await db.categories.count();
  await db.categories.add({ ...c, id: uid(), order: n });
}
export const saveCategory = (c: Category) => db.categories.put(c);

export function newNote(): Note {
  const now = Date.now();
  return { id: uid(), title: '', body: '', color: '#FFE8A3', pinned: false, createdAt: now, updatedAt: now };
}
export const saveNote = (n: Note) => db.notes.put({ ...n, updatedAt: Date.now() });
export const deleteNote = (id: string) => db.notes.delete(id);

/** Effective "fire" time taking snooze into account */
export function effectiveDue(t: Task): number | null {
  if (t.snoozedUntil && t.snoozedUntil > Date.now()) return t.snoozedUntil;
  return t.dueAt;
}
