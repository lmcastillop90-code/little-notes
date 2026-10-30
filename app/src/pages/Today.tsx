import { useMemo, useState } from 'preact/hooks';
import { useCategories, useSettings, useTasks, completeTask, uncompleteTask, saveSettings, effectiveDue } from '../lib/store';
import { makeT, DAILY_MESSAGES } from '../i18n';
import { Sticker } from '../components/Stickers';
import { Chip, LangToggle } from '../components/ui';
import { TaskCard } from '../components/TaskCard';
import { Celebration } from '../components/Celebration';
import { daysUntil, isToday, startOfDay, DAY, dayKey } from '../lib/dates';
import type { Task } from '../db/db';

export function Today({ onToast }: { onToast: (m: string) => void }) {
  const s = useSettings();
  const cats = useCategories();
  const tasks = useTasks();
  const [filter, setFilter] = useState<string>('all');
  const [party, setParty] = useState<{ title: string; streak: number; unlocked?: string } | null>(null);
  const { t, primary } = makeT(s.lang);

  const now = new Date();
  const dateLine = now.toLocaleDateString(primary === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const dayIndex = Math.floor(startOfDay().getTime() / DAY);
  const message = s.message === 'Future you will thank you for this' ? DAILY_MESSAGES[dayIndex % DAILY_MESSAGES.length] : s.message;

  const groups = useMemo(() => {
    const open = tasks.filter((x) => !x.done && (filter === 'all' || x.categoryId === filter));
    const sort = (a: Task, b: Task) => (effectiveDue(a) ?? Infinity) - (effectiveDue(b) ?? Infinity);
    const overdue = open.filter((x) => { const d = effectiveDue(x); return d !== null && d < Date.now() - 60_000 && !isToday(d); }).sort(sort);
    const today = open.filter((x) => { const d = effectiveDue(x); return d !== null && isToday(d); }).sort(sort);
    const upcoming = open.filter((x) => { const d = effectiveDue(x); return d !== null && daysUntil(d) > 0 && daysUntil(d) <= 7; }).sort(sort);
    const later = open.filter((x) => { const d = effectiveDue(x); return d === null || daysUntil(d) > 7; }).sort(sort);
    const doneToday = tasks.filter((x) => x.done && x.completedAt && dayKey(x.completedAt) === dayKey() && (filter === 'all' || x.categoryId === filter));
    return { overdue, today, upcoming, later, doneToday };
  }, [tasks, filter]);

  const totalToday = groups.today.length + groups.doneToday.length + groups.overdue.length;
  const doneCount = groups.doneToday.length;

  const toggle = async (task: Task) => {
    if (task.done) {
      await uncompleteTask(task);
      onToast(t('undo'));
      return;
    }
    const r = await completeTask(task);
    setParty({ title: task.title, streak: r.streak, unlocked: r.unlocked });
  };

  const catOf = (id: string) => cats.find((c) => c.id === id);

  return (
    <div class="page">
      <div class="between" style="align-items:flex-start">
        <div class="col">
          <span class="eyebrow">{dateLine}</span>
          <h1 class="title">{t('hi')} {s.name || 'Trang'}! 🌼</h1>
          <p class="quote">“{message}”</p>
        </div>
        <Sticker name={s.avatar} size={60} />
      </div>

      <div class="between">
        <LangToggle lang={s.lang} onChange={(lang) => saveSettings({ lang })} />
        <span class="sub" style="color: var(--ink-2)">
          {doneCount} {t('ofDone')} {totalToday} {t('done')} ✨
        </span>
      </div>

      <div class="row wrap" style="gap: 8px">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>{t('all')}</Chip>
        {cats.map((c) => (
          <Chip key={c.id} cat={c} on={filter === c.id} onClick={() => setFilter(filter === c.id ? 'all' : c.id)}>
            {s.lang === 'vi' ? c.nameVi || c.name : c.name}
          </Chip>
        ))}
      </div>

      {groups.overdue.length ? <Section label={t('overdue')} /> : null}
      {groups.overdue.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)}

      {groups.today.length ? <Section label={t('today')} /> : null}
      {groups.today.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)}

      {!groups.today.length && !groups.overdue.length ? (
        <div class="empty">
          <Sticker name="bunny" size={90} />
          <span>{t('nothingToday')}</span>
        </div>
      ) : null}

      {groups.upcoming.length ? <Section label={t('upcoming')} /> : null}
      {groups.upcoming.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)}

      {groups.later.length ? <Section label={t('later')} /> : null}
      {groups.later.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)}

      {groups.doneToday.length ? <Section label={t('completed')} /> : null}
      {groups.doneToday.map((x) => <TaskCard key={x.id} task={x} cat={catOf(x.categoryId)} lang={s.lang} onToggle={toggle} />)}

      {party ? (
        <Celebration title={party.title} message={s.message} streak={party.streak} unlocked={party.unlocked} lang={s.lang} onClose={() => setParty(null)} />
      ) : null}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return <span class="eyebrow" style="margin-top: 6px">{label}</span>;
}
