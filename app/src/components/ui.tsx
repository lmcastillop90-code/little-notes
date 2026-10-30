import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Sparkle } from './Stickers';
import type { Category, Lang } from '../db/db';

const INK = '#3E3150';

export const Icon = {
  home: () => (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M4 13 L13 5 L22 13 V22 H4 Z" fill="var(--yellow)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg>
  ),
  calendar: () => (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="4" y="5" width="18" height="17" rx="3" fill="#fff" stroke="currentColor" stroke-width="2" /><path d="M4 10 H22" stroke="currentColor" stroke-width="2" /></svg>
  ),
  notes: () => (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M6 4 H20 V22 L13 18 L6 22 Z" fill="#fff" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg>
  ),
  me: () => (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="8" fill="#fff" stroke="currentColor" stroke-width="2" /><circle cx="13" cy="13" r="3" fill="currentColor" /></svg>
  ),
  plus: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M14 5 V23 M5 14 H23" stroke={INK} stroke-width="3.5" stroke-linecap="round" /></svg>
  ),
  back: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 L6 10 L12 16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
  ),
  chevron: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3 L11 8 L6 13" stroke="var(--purple-dark)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
  ),
  clock: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke={INK} stroke-width="2" /><path d="M10 6 V10 L13 12" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" /></svg>
  ),
  repeat: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10 A6 6 0 1 1 6 14" fill="none" stroke={INK} stroke-width="2" stroke-linecap="round" /><path d="M3 15 L6 14 L5 11" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
  ),
  bell: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8 A5 5 0 0 1 15 8 V13 L17 15 H3 L5 13 Z" fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" /><path d="M8 17 H12" stroke={INK} stroke-width="2" stroke-linecap="round" /></svg>
  ),
  user: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="7" r="4" fill="none" stroke={INK} stroke-width="2" /><path d="M3 18 a7 7 0 0 1 14 0" fill="none" stroke={INK} stroke-width="2" stroke-linecap="round" /></svg>
  ),
  palette: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 a8 8 0 1 0 0 16 c2 0 2-2 1-3 c-1-1 0-2 2-2 h2 a3 3 0 0 0 3-3 a8 8 0 0 0-8-8 z" fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" /><circle cx="7" cy="8" r="1.3" fill={INK} /><circle cx="11" cy="6" r="1.3" fill={INK} /><circle cx="6" cy="12" r="1.3" fill={INK} /></svg>
  ),
  globe: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke={INK} stroke-width="2" /><path d="M3 10 H17 M10 3 c-3 3 -3 11 0 14 M10 3 c3 3 3 11 0 14" stroke={INK} stroke-width="1.8" fill="none" /></svg>
  ),
  bulb: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 a5 5 0 0 1 3 9 v2 h-6 v-2 a5 5 0 0 1 3-9 z" fill="var(--yellow)" stroke={INK} stroke-width="1.8" stroke-linejoin="round" /><path d="M8 16 H12" stroke={INK} stroke-width="1.8" stroke-linecap="round" /></svg>
  ),
  download: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 V13 M6 9 L10 13 L14 9 M4 16 H16" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
  ),
  moon: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M15 12 A6 6 0 1 1 8 5 A5 5 0 0 0 15 12 Z" fill="var(--purple)" stroke={INK} stroke-width="1.8" stroke-linejoin="round" /></svg>
  ),
  trash: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6 H16 M8 6 V4 H12 V6 M6 6 L7 17 H13 L14 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
  ),
  edit: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2 L14 5 L6 13 L2 14 L3 10 Z" fill="#fff" stroke={INK} stroke-width="1.6" stroke-linejoin="round" /></svg>
  ),
};

export function catVars(c?: Category) {
  if (!c) return {};
  return { '--cat': c.color, '--cat-dark': c.colorDark, '--chip': c.color } as Record<string, string>;
}

export function Chip({ cat, on = true, onClick, children }: { cat?: Category; on?: boolean; onClick?: () => void; children: ComponentChildren }) {
  return (
    <button class={`chip ${on ? '' : 'off'}`} style={on ? catVars(cat) : undefined} onClick={onClick}>
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button class={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div class="seg" role="group" aria-label="Language">
      {(['en', 'vi', 'both'] as Lang[]).map((l) => (
        <button key={l} class={lang === l ? 'on' : ''} onClick={() => onChange(l)}>
          {l === 'both' ? 'EN+VI' : l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    setShown(msg);
    const t = setTimeout(() => setShown(null), 1800);
    return () => clearTimeout(t);
  }, [msg]);
  return shown ? <div class="toast">{shown}</div> : null;
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ComponentChildren }) {
  return (
    <>
      <div class="sheet-backdrop" onClick={onClose} />
      <div class="sheet" role="dialog">
        <div class="handle" />
        {children}
      </div>
    </>
  );
}

export function Sparkles() {
  return (
    <>
      <span class="sparkle" style="top: 14%; left: 12%"><Sparkle size={40} /></span>
      <span class="sparkle" style="top: 24%; right: 14%; animation-delay: .3s"><Sparkle size={26} color="#D9C8F5" /></span>
      <span class="sparkle" style="top: 52%; left: 10%; animation-delay: .6s"><Sparkle size={22} color="#BFE0FA" /></span>
      <span class="sparkle" style="top: 56%; right: 9%; animation-delay: .9s"><Sparkle size={32} color="#FFC9DE" /></span>
    </>
  );
}
