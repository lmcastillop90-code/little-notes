import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'today' }
  | { name: 'calendar' }
  | { name: 'notes' }
  | { name: 'me' }
  | { name: 'task'; id: string }
  | { name: 'new'; categoryId?: string; date?: string };

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const q = new URLSearchParams(qs ?? '');
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'calendar':
      return { name: 'calendar' };
    case 'notes':
      return { name: 'notes' };
    case 'me':
      return { name: 'me' };
    case 'task':
      return parts[1] ? { name: 'task', id: parts[1] } : { name: 'today' };
    case 'new':
      return { name: 'new', categoryId: q.get('cat') ?? undefined, date: q.get('date') ?? undefined };
    default:
      return { name: 'today' };
  }
}

export function useRoute(): Route {
  const [r, setR] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const on = () => setR(parse(location.hash));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return r;
}

export const go = (path: string) => {
  location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
};
export const back = () => (history.length > 1 ? history.back() : go('/'));
