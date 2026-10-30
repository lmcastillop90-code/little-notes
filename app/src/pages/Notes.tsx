import { useState } from 'preact/hooks';
import { useNotes, useSettings, newNote, saveNote, deleteNote } from '../lib/store';
import { makeT } from '../i18n';
import { Sheet, Icon } from '../components/ui';
import { Bunny } from '../components/Stickers';
import type { Note } from '../db/db';

const COLORS = ['#FFE8A3', '#FFC9DE', '#D9C8F5', '#BFE0FA', '#C9EFC9', '#FFFFFF'];

export function Notes({ onToast }: { onToast: (m: string) => void }) {
  const s = useSettings();
  const notes = useNotes();
  const { t, t2 } = makeT(s.lang);
  const [edit, setEdit] = useState<Note | null>(null);

  const sorted = notes.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim() && !edit.body.trim()) { setEdit(null); return; }
    await saveNote(edit);
    setEdit(null);
    onToast(t('saved'));
  };

  return (
    <div class="page">
      <div class="col">
        <span class="eyebrow">{t2('notes') || 'Little Notes'}</span>
        <h1 class="title">{t('notes')} 📝</h1>
      </div>

      {sorted.length ? (
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
          {sorted.map((n) => (
            <button
              key={n.id}
              class="card"
              style={`background:${n.color}; text-align:left; border-color: ${n.color === '#FFFFFF' ? 'var(--line)' : n.color}; color: #3E3150; min-height: 120px; display:flex; flex-direction:column; gap: 6px`}
              onClick={() => setEdit(n)}
            >
              <span style="font-weight: 800; font-size: 15px">{n.pinned ? '📌 ' : ''}{n.title || '…'}</span>
              <span style="font-size: 13px; font-weight: 600; opacity: .8; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical">{n.body}</span>
            </button>
          ))}
        </div>
      ) : (
        <div class="empty">
          <Bunny size={90} />
          <span>{t('noNotes')}</span>
        </div>
      )}

      <button class="fab" aria-label={t('newNote')} onClick={() => setEdit(newNote())}><Icon.plus /></button>

      {edit ? (
        <Sheet onClose={save}>
          <input class="input" value={edit.title} placeholder={t('noteTitle')} onInput={(e) => setEdit({ ...edit, title: (e.target as HTMLInputElement).value })} style="font-weight: 800; font-size: 18px" />
          <textarea class="input" value={edit.body} placeholder={t('noteBody')} style="min-height: 180px" onInput={(e) => setEdit({ ...edit, body: (e.target as HTMLTextAreaElement).value })} />
          <div class="row" style="gap: 8px">
            {COLORS.map((c) => (
              <button key={c} class="swatch" style={`--sw:${c}; ${edit.color === c ? '' : 'border-color: var(--line)'}`} aria-label={c} onClick={() => setEdit({ ...edit, color: c })} />
            ))}
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn ghost sm" onClick={() => setEdit({ ...edit, pinned: !edit.pinned })}>{edit.pinned ? t('unpin') : t('pin')} 📌</button>
            {notes.some((n) => n.id === edit.id) ? (
              <button class="btn ghost sm danger" onClick={async () => { await deleteNote(edit.id); setEdit(null); onToast(t('deleted')); }}>{t('delete')}</button>
            ) : null}
            <button class="btn primary sm grow" onClick={save}>{t('save')}</button>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
