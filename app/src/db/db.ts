import Dexie, { type Table } from 'dexie';

export type Lang = 'en' | 'vi' | 'both';

export type Repeat =
  | { kind: 'none' }
  | { kind: 'daily'; every: number }
  | { kind: 'weekly'; days: number[] } // 0 = Sunday … 6 = Saturday
  | { kind: 'monthly'; day: number } // 1..31
  | { kind: 'yearly' } // birthdays
  | { kind: 'afterClass'; days: number[]; hour: number; minute: number }; // reminder the day after each class

export interface Category {
  id: string;
  name: string; // English
  nameVi: string;
  color: string; // base pastel hex
  colorDark: string; // accent hex
  sticker: 'bunny' | 'fox' | 'carrot' | 'rainbow' | 'flower' | 'sparkle' | 'cake';
  order: number;
}

export interface Step {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string; // English (or whatever she typed)
  titleVi?: string; // Vietnamese line
  note?: string;
  categoryId: string;
  dueAt: number | null; // epoch ms of the next occurrence; null = no reminder
  allDay: boolean;
  repeat: Repeat;
  nag: boolean; // keep reminding until done
  nagEveryMin: number;
  nagMax: number;
  remindBeforeDays: number; // birthdays: also notify N days before
  steps: Step[];
  done: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  snoozedUntil: number | null;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Completion {
  id?: number;
  taskId: string;
  day: string; // YYYY-MM-DD local
  at: number;
}

export interface Settings {
  key: 'main';
  name: string;
  city: string;
  message: string;
  lang: Lang;
  theme: 'light' | 'dark' | 'auto';
  avatar: 'fox' | 'bunny' | 'carrot' | 'flower';
  morningSummary: boolean;
  morningHour: number;
  morningMinute: number;
  timeZone: string;
  deviceToken: string;
  apiUrl: string;
  apiSecret: string;
  pushEnabled: boolean;
  unlocked: string[]; // sticker names unlocked by streaks
  onboarded: boolean;
}

export class LittleNotesDB extends Dexie {
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  categories!: Table<Category, string>;
  completions!: Table<Completion, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super('little-notes');
    this.version(1).stores({
      tasks: 'id, categoryId, dueAt, done, updatedAt',
      notes: 'id, pinned, updatedAt',
      categories: 'id, order',
      completions: '++id, taskId, day',
      settings: 'key',
    });
  }
}

export const db = new LittleNotesDB();

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', nameVi: 'Công việc', color: '#D9C8F5', colorDark: '#9B86C4', sticker: 'fox', order: 0 },
  { id: 'personal', name: 'Personal', nameVi: 'Cá nhân', color: '#FFC9DE', colorDark: '#E88AB0', sticker: 'bunny', order: 1 },
  { id: 'birthdays', name: 'Birthdays', nameVi: 'Sinh nhật', color: '#BFE0FA', colorDark: '#6FB4E8', sticker: 'cake', order: 2 },
  { id: 'health', name: 'Health', nameVi: 'Sức khỏe', color: '#C9EFC9', colorDark: '#7FC27F', sticker: 'carrot', order: 3 },
];

export const DEFAULT_SETTINGS: Settings = {
  key: 'main',
  name: 'Trang',
  city: '',
  message: 'Future you will thank you for this',
  lang: 'both',
  theme: 'light',
  avatar: 'fox',
  morningSummary: true,
  morningHour: 7,
  morningMinute: 30,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
  deviceToken: uid(),
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  apiSecret: '',
  pushEnabled: false,
  unlocked: ['bunny', 'fox', 'carrot', 'rainbow'],
  onboarded: false,
};

export async function ensureDefaults() {
  const count = await db.categories.count();
  if (count === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  const s = await db.settings.get('main');
  if (!s) await db.settings.add(DEFAULT_SETTINGS);
}
