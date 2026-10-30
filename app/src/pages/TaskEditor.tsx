import { useEffect, useState } from 'preact/hooks';
import { db, uid, type Repeat, type Task } from '../db/db';
import { useCategories, useSettings, newTask, saveTask, deleteTask, completeTask, snoozeTask } from '../lib/store';
import { makeT } from '../i18n';
import { toDateInput, toTimeInput, toEpoch, WEEKDAYS_EN, WEEKDAYS_VI, nextOccurrence, pad } from '../lib/dates';
import { Sticker } from '../components/Stickers';
import { Icon, Toggle, catVars, Chip } from '../components/ui';
import { Celebration } from '../components/Celebration';
import { back, go } from '../lib/router';

export function TaskEditor({ id, categoryId, date, onToast }: { id?: string; categoryId?: string; date?: string; onToast: (m: string) => void }) {
  const s = useSettings();
  const cats = useCategories();
  const { t, t2, primary } = makeT(s.lang);
  const [task, setTask] = useState<Task | null>(null);
  const [party, setParty] = useState<{ streak: number; unlocked?: string } | null>(null);
  const isNew = !id;

  useEffect(() => {
    (async () => {
      if (id) {
        const x = await db.tasks.get(id);
        if (x) setTask(x);
        else go('/');
      } else {
        const fresh = newTask(categoryId ?? cats[0]?.id ?? 'work');
        if (date) fresh.dueAt = toEpoch(date, '09:00');
        setTask(fresh);
      }
    })();
  }, [id, categoryId, date, cats.length]);

  if (!task) return <div class="page" />;
  const cat = cats.find((c) => c.id === task.categoryId);
  const set = (patch: Partial<Task>) => setTask({ ...task, ...patch });
  const WD = primary === 'vi' ? WEEKDAYS_VI : WEEKDAYS_EN;

  const dateVal = task.dueAt ? toDateInput(task.dueAt) : '';
  const timeVal = task.dueAt ? toTimeInput(task.dueAt) : '09:00';

  const setDate = (d: string) => {
    if (!d) return set({ dueAt: null });
    set({ dueAt: toEpoch(d, task.allDay ? '09:00' : timeVal) });
  };
  const setTime = (tm: string) => set({ dueAt: toEpoch(dateVal || toDateInput(Date.now()), tm) });

  const setRepeat = (kind: Repeat['kind']) => {
    const base = task.dueAt ? new Date(task.dueAt) : new Date();
    let repeat: Repeat;
    switch (kind) {
      case 'none': repeat = { kind: 'none' }; break;
      case 'daily': repeat = { kind: 'daily', every: 1 }; break;
      case 'weekly': repeat = { kind: 'weekly', days: [base.getDay()] }; break;
      case 'monthly': repeat = { kind: 'monthly', day: base.getDate() }; break;
      case 'yearly': repeat = { kind: 'yearly' }; break;
      case 'afterClass': repeat = { kind: 'afterClass', days: [base.getDay()], hour: 20, minute: 0 }; break;
    }
    const patch: Partial<Task> = { repeat };
    if (kind === 'yearly') { patch.allDay = true; patch.remindBeforeDays = task.remindBeforeDays || 7; }
    if (kind === 'afterClass') {
      const n = nextOccurrence(task.dueAt ?? Date.now(), repeat, Date.now());
      patch.dueAt = n;
    }
    set(patch);
  };

  const toggleDay = (d: number) => {
    const r = task.repeat;
    if (r.kind !== 'weekly' && r.kind !== 'afterClass') return;
    const days = r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort();
    const repeat = { ...r, days } as Repeat;
    const patch: Partial<Task> = { repeat };
    if (r.kind === 'afterClass') patch.dueAt = nextOccurrence(task.dueAt ?? Date.now(), repeat, Date.now());
    set(patch);
  };

  const save = async () => {
    if (!task.title.trim()) { onToast(t('title')); return; }
    let next = { ...task };
    // if a repeating task's date is already in the past, move to the next occurrence
    if (next.repeat.kind !== 'none' && next.dueAt && next.dueAt < Date.now()) {
      next.dueAt = nextOccurrence(next.dueAt, next.repeat, Date.now());
    }
    await saveTask(next);
    onToast(t('saved'));
    back();
  };

  const del = async () => {
    if (!confirm(`${t('delete')}?`)) return;
    await deleteTask(task.id);
    onToast(t('deleted'));
    go('/');
  };

  const done = async () => {
    const r = await completeTask(task);
    setParty(r);
  };

  const snooze = async (min: number) => {
    await snoozeTask(task, min);
    onToast(`${t('snooze')} ✓`);
    back();
  };

  return (
    <div class="page" style={catVars(cat)}>
      <div class="between">
        <button class="icon-btn" aria-label="Back" onClick={back}><Icon.back /></button>
        <span class="chip" style={catVars(cat)}>{cat ? (s.lang === 'vi' ? cat.nameVi || cat.name : cat.name) : ''}</span>
        {!isNew ? <button class="icon-btn" aria-label={t('delete')} onClick={del} style="color:#b33"><Icon.trash /></button> : <span style="width:44px" />}
      </div>

      <div class="card" style="position: relative; border-color: var(--cat, var(--line))">
        <div class="field">
          <label>{t('title')}</label>
          <input class="input" value={task.title} placeholder={t('title')} onInput={(e) => set({ title: (e.target as HTMLInputElement).value })} style="padding-right: 64px" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>{t('titleVi')}</label>
          <input class="input" value={task.titleVi ?? ''} placeholder="Tiếng Việt" onInput={(e) => set({ titleVi: (e.target as HTMLInputElement).value })} />
        </div>
        {cat ? <span style="position:absolute; top: 10px; right: 12px"><Sticker name={cat.sticker} size={52} /></span> : null}
      </div>

      <div class="field">
        <label>{t('category')} {t2('category') ? `· ${t2('category')}` : ''}</label>
        <div class="row wrap" style="gap: 8px">
          {cats.map((c) => (
            <Chip key={c.id} cat={c} on={task.categoryId === c.id} onClick={() => set({ categoryId: c.id })}>
              {s.lang === 'vi' ? c.nameVi || c.name : c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div class="card setting" style="--ico: var(--yellow)">
        <span class="ico"><Icon.clock /></span>
        <div class="col grow">
          <span class="lbl">{t('remindMe')}</span>
          <div class="row" style="gap: 8px; margin-top: 6px">
            <input class="input" type="date" value={dateVal} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
            {!task.allDay ? <input class="input" type="time" value={timeVal} style="max-width: 120px" onInput={(e) => setTime((e.target as HTMLInputElement).value)} /> : null}
          </div>
          <label class="row" style="margin-top: 8px; font-size: 13px; font-weight: 700; color: var(--muted)">
            <input type="checkbox" checked={task.allDay} onChange={(e) => set({ allDay: (e.target as HTMLInputElement).checked })} /> {t('allDay')}
          </label>
        </div>
      </div>

      <div class="card setting" style="--ico: var(--blue); align-items:flex-start">
        <span class="ico"><Icon.repeat /></span>
        <div class="col grow">
          <span class="lbl">{t('repeat')}</span>
          <select class="input" value={task.repeat.kind} onChange={(e) => setRepeat((e.target as HTMLSelectElement).value as Repeat['kind'])} style="margin-top: 6px">
            <option value="none">{t('rNone')}</option>
            <option value="daily">{t('rDaily')}</option>
            <option value="weekly">{t('rWeekly')}</option>
            <option value="monthly">{t('rMonthly')}</option>
            <option value="yearly">{t('rYearly')}</option>
            <option value="afterClass">{t('rAfterClass')}</option>
          </select>

          {task.repeat.kind === 'weekly' || task.repeat.kind === 'afterClass' ? (
            <div class="col" style="margin-top: 10px; gap: 8px">
              <span class="dsc">{task.repeat.kind === 'afterClass' ? t('classDays') : t('onDays')}</span>
              <div class="row wrap" style="gap: 6px">
                {WD.map((n, i) => (
                  <Chip key={i} cat={cat} on={(task.repeat as { days: number[] }).days.includes(i)} onClick={() => toggleDay(i)}>{n}</Chip>
                ))}
              </div>
            </div>
          ) : null}

          {task.repeat.kind === 'afterClass' ? (
            <div class="row" style="margin-top: 10px; gap: 8px">
              <span class="dsc">{t('remindAt')}</span>
              <input
                class="input"
                type="time"
                style="max-width: 120px"
                value={`${pad(task.repeat.hour)}:${pad(task.repeat.minute)}`}
                onInput={(e) => {
                  const [h, m] = (e.target as HTMLInputElement).value.split(':').map(Number);
                  const repeat = { ...(task.repeat as Extract<Repeat, { kind: 'afterClass' }>), hour: h, minute: m };
                  set({ repeat, dueAt: nextOccurrence(Date.now(), repeat, Date.now()) });
                }}
              />
            </div>
          ) : null}

          {task.repeat.kind === 'yearly' ? (
            <div class="row" style="margin-top: 10px; gap: 8px">
              <span class="dsc">{t('remindBefore')}</span>
              <input class="input" type="number" min="0" max="30" style="max-width: 80px" value={task.remindBeforeDays} onInput={(e) => set({ remindBeforeDays: Number((e.target as HTMLInputElement).value) })} />
              <span class="dsc">{t('daysBefore')}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div class="card setting" style="--ico: var(--pink); align-items:flex-start">
        <span class="ico"><Icon.bell /></span>
        <div class="col grow">
          <div class="between">
            <span class="lbl">{t('keepReminding')}</span>
            <Toggle on={task.nag} onChange={(nag) => set({ nag })} label={t('keepReminding')} />
          </div>
          {t2('keepReminding') ? <span class="dsc">{t2('keepReminding')}</span> : null}
          {task.nag ? (
            <div class="row" style="margin-top: 8px; gap: 8px; flex-wrap: wrap">
              <span class="dsc">{t('every')}</span>
              <input class="input" type="number" min="1" max="120" style="max-width: 80px" value={task.nagEveryMin} onInput={(e) => set({ nagEveryMin: Math.max(1, Number((e.target as HTMLInputElement).value)) })} />
              <span class="dsc">{t('min')} ·</span>
              <input class="input" type="number" min="1" max="50" style="max-width: 80px" value={task.nagMax} onInput={(e) => set({ nagMax: Math.max(1, Number((e.target as HTMLInputElement).value)) })} />
              <span class="dsc">{t('maxTimes')}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div class="field">
        <label>{t('steps')}</label>
        <div class="steps col" style="gap: 2px">
          {task.steps.map((st, i) => (
            <label key={st.id}>
              <input type="checkbox" checked={st.done} onChange={(e) => {
                const steps = task.steps.slice();
                steps[i] = { ...st, done: (e.target as HTMLInputElement).checked };
                set({ steps });
              }} />
              <input class="input" style={`min-height: 40px; ${st.done ? 'text-decoration: line-through; color: var(--muted)' : ''}`} value={st.text} onInput={(e) => {
                const steps = task.steps.slice();
                steps[i] = { ...st, text: (e.target as HTMLInputElement).value };
                set({ steps });
              }} />
              <button class="icon-btn" style="width:36px;height:36px" aria-label={t('delete')} onClick={() => set({ steps: task.steps.filter((x) => x.id !== st.id) })}>✕</button>
            </label>
          ))}
          <button class="btn ghost sm" onClick={() => set({ steps: [...task.steps, { id: uid(), text: '', done: false }] })}>+ {t('addStep')}</button>
        </div>
      </div>

      <div class="field">
        <label>{t('note')}</label>
        <textarea class="input" value={task.note ?? ''} placeholder={t('notePlaceholder')} onInput={(e) => set({ note: (e.target as HTMLTextAreaElement).value })} />
      </div>

      {!isNew && !task.done ? (
        <div class="row" style="gap: 8px">
          <button class="btn sm grow" onClick={() => snooze(10)}>{t('snooze')} {t('snooze10')}</button>
          <button class="btn sm grow" onClick={() => snooze(60)}>{t('snooze1h')}</button>
          <button class="btn sm grow" onClick={() => snooze(1440)}>{t('snoozeTomorrow')}</button>
        </div>
      ) : null}

      <div class="row" style="gap: 12px; margin-top: 4px">
        <button class="btn primary grow" onClick={save}>{t('save')}</button>
        {!isNew && !task.done ? <button class="btn pink grow" onClick={done}>{t('markDone')}</button> : null}
      </div>

      {party ? <Celebration title={task.title} message={s.message} streak={party.streak} unlocked={party.unlocked} lang={s.lang} onClose={() => go('/')} /> : null}
    </div>
  );
}
