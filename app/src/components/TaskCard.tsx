import type { Category, Task } from '../db/db';
import { daysUntil, fmtTime, isToday } from '../lib/dates';
import { effectiveDue } from '../lib/store';
import { makeT } from '../i18n';
import type { Lang } from '../db/db';
import { Sticker } from './Stickers';
import { catVars } from './ui';
import { go } from '../lib/router';

export function describeWhen(t: Task, lang: Lang): string {
  const { t: tr, primary } = makeT(lang);
  const due = effectiveDue(t);
  if (!due) return tr('noReminder');
  const d = daysUntil(due);
  const time = t.allDay ? '' : fmtTime(due, primary);
  let when: string;
  if (isToday(due)) when = time || tr('today');
  else if (d === 1) when = `${tr('tomorrow')} ${time}`;
  else if (d > 1 && d < 8) when = `${tr('inDays', { n: d })} ${time}`.trim();
  else when = new Date(due).toLocaleDateString(primary === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' }) + (time ? ' ' + time : '');
  const rep =
    t.repeat.kind === 'none'
      ? ''
      : t.repeat.kind === 'daily'
        ? tr('daily')
        : t.repeat.kind === 'weekly'
          ? tr('weekly')
          : t.repeat.kind === 'monthly'
            ? tr('monthly')
            : t.repeat.kind === 'yearly'
              ? tr('everyYear')
              : tr('dayAfterClass');
  const parts = [when, rep, t.nag ? tr('repeatsUntilDone') : ''].filter(Boolean);
  return parts.join(' · ');
}

export function TaskCard({ task, cat, lang, onToggle }: { task: Task; cat?: Category; lang: Lang; onToggle: (t: Task) => void }) {
  const due = effectiveDue(task);
  const overdue = !task.done && due !== null && due < Date.now() - 60_000;
  const showVi = lang !== 'en' && task.titleVi;
  const main = lang === 'vi' && task.titleVi ? task.titleVi : task.title;
  const second = lang === 'both' && task.titleVi ? task.titleVi : lang === 'vi' && task.titleVi ? task.title : '';
  const stepsDone = task.steps.filter((s) => s.done).length;
  const emoji = task.repeat.kind === 'yearly' ? '🎂' : overdue ? '⚠️' : '⏰';

  return (
    <div class={`card cat row ${task.done ? 'done' : ''}`} style={catVars(cat)}>
      <button
        class={`check ${task.done ? 'on' : ''}`}
        aria-label={task.done ? 'Undo' : 'Mark done'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <a href={`#/task/${task.id}`} class="col grow" onClick={(e) => { e.preventDefault(); go(`/task/${task.id}`); }}>
        <span class="task-title">{main || '…'}</span>
        {second && showVi ? <span class="task-sub">{second}</span> : null}
        <span class="task-meta" style={overdue ? 'color:#c0392b' : ''}>
          {emoji} {describeWhen(task, lang)}
          {task.steps.length ? ` · ${stepsDone}/${task.steps.length}` : ''}
        </span>
      </a>
      {cat ? <Sticker name={cat.sticker} size={34} /> : null}
    </div>
  );
}
