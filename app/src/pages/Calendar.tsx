import { useMemo, useState } from 'preact/hooks';
import { useCategories, useSettings, useTasks, useCompletionDays, completeTask, uncompleteTask, effectiveDue } from '../lib/store';
import { makeT } from '../i18n';
import { dayKey, MONTHS_EN, MONTHS_VI, WEEKDAYS_EN, WEEKDAYS_VI, nextOccurrence, DAY, startOfDay } from '../lib/dates';
import { TaskCard } from '../components/TaskCard';
import { Icon } from '../components/ui';
import { go } from '../lib/router';
import type { Task } from '../db/db';
import { Flower } from '../components/Stickers';

export function Calendar({ onToast }: { onToast: (m: string) => void }) {
  const s = useSettings();
  const cats = useCategories();
  const tasks = useTasks();
  const doneDays = useCompletionDays();
  const { t, primary } = makeT(s.lang);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [sel, setSel] = useState(dayKey());

  const MONTHS = primary === 'vi' ? MONTHS_VI : MONTHS_EN;
  const WD = primary === 'vi' ? WEEKDAYS_VI : WEEKDAYS_EN;

  // Map day -> tasks (expanding repeats within the visible month)
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    const from = startOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), 1)).getTime() - 7 * DAY;
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 7).getTime();
    for (const task of tasks) {
      if (task.done && task.completedAt) {
        push(map, dayKey(task.completedAt), task);
        continue;
      }
      const due = effectiveDue(task);
      if (!due) continue;
      if (task.repeat.kind === 'none') {
        push(map, dayKey(due), task);
        continue;
      }
      let cur: number | null = due;
      let guard = 0;
      while (cur && cur <= to && guard++ < 120) {
        if (cur >= from) push(map, dayKey(cur), task);
        cur = nextOccurrence(due, task.repeat, cur);
      }
    }
    return map;
  }, [tasks, cursor]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    return cells;
  }, [cursor]);

  const selected = (byDay.get(sel) ?? []).slice().sort((a, b) => (effectiveDue(a) ?? 0) - (effectiveDue(b) ?? 0));
  const catOf = (id: string) => cats.find((c) => c.id === id);

  const toggle = async (task: Task) => {
    if (task.done) { await uncompleteTask(task); onToast(t('undo')); }
    else { await completeTask(task); onToast(t('yayDone')); }
  };

  return (
    <div class="page">
      <div class="between">
        <button class="icon-btn" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Icon.back /></button>
        <h1 class="title" style="font-size: 22px">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h1>
        <button class="icon-btn" aria-label="Next month" style="transform: scaleX(-1)" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Icon.back /></button>
      </div>

      <div class="card" style="padding: 12px">
        <div class="cal-grid" style="margin-bottom: 6px">
          {WD.map((d) => <span key={d} class="eyebrow" style="text-align:center">{d}</span>)}
        </div>
        <div class="cal-grid">
          {grid.map((d) => {
            const k = dayKey(d);
            const items = byDay.get(k) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <button
                key={k}
                class={`cal-day ${k === dayKey() ? 'today' : ''} ${k === sel ? 'sel' : ''} ${inMonth ? '' : 'dim'}`}
                onClick={() => setSel(k)}
                aria-label={k}
              >
                <span>{d.getDate()}</span>
                <span class="dots">
                  {items.slice(0, 3).map((x, i) => <i key={i} style={`background:${catOf(x.categoryId)?.colorDark ?? 'var(--purple-dark)'}`} />)}
                  {doneDays.has(k) && !items.length ? <i style="background: var(--green-dark)" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div class="between">
        <span class="eyebrow">{new Date(sel).toLocaleDateString(primary === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <button class="btn ghost sm" onClick={() => go(`/new?date=${sel}`)}>+ {t('addReminder')}</button>
      </div>

      {selected.length ? (
        selected.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)
      ) : (
        <div class="empty">
          <Flower size={70} />
          <span>{t('nothingToday')}</span>
        </div>
      )}
    </div>
  );
}

function push(map: Map<string, Task[]>, k: string, t: Task) {
  const arr = map.get(k) ?? [];
  if (!arr.some((x) => x.id === t.id)) arr.push(t);
  map.set(k, arr);
}
