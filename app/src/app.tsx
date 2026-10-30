import { useEffect, useState } from 'preact/hooks';
import { useRoute, go } from './lib/router';
import { useSettings } from './lib/store';
import { makeT } from './i18n';
import { Today } from './pages/Today';
import { Calendar } from './pages/Calendar';
import { Notes } from './pages/Notes';
import { Me } from './pages/Me';
import { TaskEditor } from './pages/TaskEditor';
import { Icon, Toast } from './components/ui';
import { refreshPush } from './lib/push';
import { setMorningSummary } from './lib/api';
import { db } from './db/db';

export function App() {
  const route = useRoute();
  const s = useSettings();
  const { t } = makeT(s.lang);
  const [toast, setToast] = useState<string | null>(null);
  const onToast = (m: string) => setToast(m + ' ');

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.lang = s.lang === 'vi' ? 'vi' : 'en';
  }, [s.theme, s.lang]);

  // On every launch: refresh the push subscription and the morning summary count
  useEffect(() => {
    if (!s.pushEnabled) return;
    refreshPush();
    db.tasks.filter((x) => !x.done).count().then((n) => setMorningSummary(s.morningSummary, s.morningHour, s.morningMinute, n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.pushEnabled]);

  const showNav = route.name === 'today' || route.name === 'calendar' || route.name === 'notes' || route.name === 'me';

  return (
    <div class="app">
      {route.name === 'today' ? <Today onToast={onToast} /> : null}
      {route.name === 'calendar' ? <Calendar onToast={onToast} /> : null}
      {route.name === 'notes' ? <Notes onToast={onToast} /> : null}
      {route.name === 'me' ? <Me onToast={onToast} /> : null}
      {route.name === 'task' ? <TaskEditor id={route.id} onToast={onToast} /> : null}
      {route.name === 'new' ? <TaskEditor categoryId={route.categoryId} date={route.date} onToast={onToast} /> : null}

      {route.name === 'today' || route.name === 'calendar' ? (
        <button class="fab" aria-label={t('addReminder')} onClick={() => go('/new')}><Icon.plus /></button>
      ) : null}

      {showNav ? (
        <nav class="nav">
          <a href="#/" class={route.name === 'today' ? 'on' : ''}><Icon.home />{t('today')}</a>
          <a href="#/calendar" class={route.name === 'calendar' ? 'on' : ''}><Icon.calendar />{t('calendar')}</a>
          <a href="#/notes" class={route.name === 'notes' ? 'on' : ''}><Icon.notes />{t('notes')}</a>
          <a href="#/me" class={route.name === 'me' ? 'on' : ''}><Icon.me />{t('me')}</a>
        </nav>
      ) : null}

      <Toast msg={toast} />
    </div>
  );
}
