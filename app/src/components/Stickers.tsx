// Original Little Notes stickers — one family: soft lines, pink cheeks, same proportions.
// All drawn by hand as SVG; no third-party art.
import type { ComponentChildren } from 'preact';

type P = { size?: number; class?: string; label?: string };

function Box({ size = 40, label, children, class: cls, vb = '0 0 56 56' }: P & { children: ComponentChildren; vb?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={vb}
      class={cls}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

const INK = '#3E3150';

export function Bunny(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Bunny'}>
      <ellipse cx="20" cy="14" rx="5" ry="13" fill="#fff" stroke={INK} stroke-width="2" />
      <ellipse cx="36" cy="14" rx="5" ry="13" fill="#fff" stroke={INK} stroke-width="2" />
      <ellipse cx="20" cy="14" rx="2.5" ry="9" fill="#FFC9DE" />
      <ellipse cx="36" cy="14" rx="2.5" ry="9" fill="#FFC9DE" />
      <circle cx="28" cy="34" r="18" fill="#fff" stroke={INK} stroke-width="2" />
      <circle cx="21" cy="32" r="2" fill={INK} />
      <circle cx="35" cy="32" r="2" fill={INK} />
      <circle cx="16" cy="38" r="3.5" fill="#FFC9DE" />
      <circle cx="40" cy="38" r="3.5" fill="#FFC9DE" />
      <path d="M25 38 q3 3 6 0" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" />
    </Box>
  );
}

export function BunnyHappy(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Happy bunny'}>
      <ellipse cx="20" cy="14" rx="5" ry="13" fill="#fff" stroke={INK} stroke-width="2" />
      <ellipse cx="36" cy="14" rx="5" ry="13" fill="#fff" stroke={INK} stroke-width="2" />
      <ellipse cx="20" cy="14" rx="2.5" ry="9" fill="#FFC9DE" />
      <ellipse cx="36" cy="14" rx="2.5" ry="9" fill="#FFC9DE" />
      <circle cx="28" cy="34" r="18" fill="#fff" stroke={INK} stroke-width="2" />
      <path d="M18 31 q3 -3 6 0" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M32 31 q3 -3 6 0" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" />
      <circle cx="16" cy="38" r="3.5" fill="#FFC9DE" />
      <circle cx="40" cy="38" r="3.5" fill="#FFC9DE" />
      <path d="M24 39 q4 4 8 0" stroke={INK} stroke-width="2" fill="none" stroke-linecap="round" />
    </Box>
  );
}

/** Fox — with proper pointy ears this time. */
export function Fox(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Fox'}>
      {/* ears */}
      <path d="M12 8 L18 26 L8 24 Z" fill="#F9B07A" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      <path d="M44 8 L38 26 L48 24 Z" fill="#F9B07A" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      <path d="M14 13 L17 22 L12 21 Z" fill="#FFC9DE" />
      <path d="M42 13 L39 22 L44 21 Z" fill="#FFC9DE" />
      {/* head */}
      <path d="M10 24 Q10 14 28 14 Q46 14 46 24 Q46 42 28 48 Q10 42 10 24 Z" fill="#F9B07A" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      {/* white muzzle */}
      <path d="M16 34 Q28 28 40 34 Q38 44 28 48 Q18 44 16 34 Z" fill="#fff" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      {/* eyes & nose */}
      <circle cx="22" cy="29" r="2" fill={INK} />
      <circle cx="34" cy="29" r="2" fill={INK} />
      <circle cx="28" cy="38" r="2.2" fill={INK} />
      <path d="M25 42 q3 2 6 0" stroke={INK} stroke-width="1.8" fill="none" stroke-linecap="round" />
      {/* cheeks */}
      <circle cx="16" cy="33" r="3" fill="#FFC9DE" />
      <circle cx="40" cy="33" r="3" fill="#FFC9DE" />
    </Box>
  );
}

/** Carrot — orange tapered root with ridges and a leafy top. */
export function Carrot(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Carrot'}>
      {/* leaves */}
      <path d="M30 14 q-2 -10 6 -12 q1 8 -6 12 Z" fill="#8FD18F" stroke={INK} stroke-width="1.8" stroke-linejoin="round" />
      <path d="M28 15 q-8 -6 -4 -13 q6 4 4 13 Z" fill="#8FD18F" stroke={INK} stroke-width="1.8" stroke-linejoin="round" />
      <path d="M31 15 q8 -4 10 2 q-6 4 -10 -2 Z" fill="#A6E0A6" stroke={INK} stroke-width="1.8" stroke-linejoin="round" />
      {/* root */}
      <path d="M22 16 Q29 12 37 16 Q40 24 30 52 Q22 30 22 16 Z" fill="#F9A050" stroke={INK} stroke-width="2" stroke-linejoin="round" />
      {/* ridges */}
      <path d="M24 24 h9 M25 31 h8 M27 38 h6" stroke="#D97B2C" stroke-width="1.8" stroke-linecap="round" />
      {/* face */}
      <circle cx="27" cy="27" r="1.5" fill={INK} />
      <circle cx="33" cy="27" r="1.5" fill={INK} />
      <path d="M28 31 q2 2 4 0" stroke={INK} stroke-width="1.6" fill="none" stroke-linecap="round" />
    </Box>
  );
}

export function Rainbow(p: P) {
  return (
    <Box {...p} vb="0 0 56 32" label={p.label ?? 'Rainbow'}>
      <path d="M4 30 A24 24 0 0 1 52 30" fill="none" stroke="#FFB3B3" stroke-width="6" />
      <path d="M11 30 A17 17 0 0 1 45 30" fill="none" stroke="#FFE8A3" stroke-width="6" />
      <path d="M18 30 A10 10 0 0 1 38 30" fill="none" stroke="#BFE0FA" stroke-width="6" />
      <path d="M25 30 A3 3 0 0 1 31 30" fill="none" stroke="#D9C8F5" stroke-width="6" />
    </Box>
  );
}

export function Flower(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Flower'}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="28" cy="16" rx="7" ry="11" fill="#FFC9DE" stroke={INK} stroke-width="1.8" transform={`rotate(${a} 28 28)`} />
      ))}
      <circle cx="28" cy="28" r="8" fill="#FFE8A3" stroke={INK} stroke-width="1.8" />
      <circle cx="25" cy="27" r="1.3" fill={INK} />
      <circle cx="31" cy="27" r="1.3" fill={INK} />
      <path d="M26 31 q2 1.5 4 0" stroke={INK} stroke-width="1.4" fill="none" stroke-linecap="round" />
    </Box>
  );
}

export function Sparkle(p: P & { color?: string }) {
  return (
    <Box {...p} vb="0 0 40 40" label={p.label}>
      <path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill={p.color ?? '#FFE8A3'} stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
    </Box>
  );
}

export function Flame(p: P) {
  return (
    <Box {...p} vb="0 0 40 40" label={p.label ?? 'Streak'}>
      <circle cx="20" cy="22" r="10" fill="#FFE8A3" stroke={INK} stroke-width="1.6" />
      <path d="M20 12 q-4 -6 0 -10 q4 4 0 10" fill="#FFC9DE" stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
      <path d="M13 17 q-5 -2 -4 -7 q5 1 4 7 M27 17 q5 -2 4 -7 q-5 1 -4 7" fill="#FFC9DE" stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
    </Box>
  );
}

export function Cake(p: P) {
  return (
    <Box {...p} label={p.label ?? 'Cake'}>
      <rect x="10" y="26" width="36" height="22" rx="6" fill="#FFC9DE" stroke={INK} stroke-width="2" />
      <path d="M10 34 q4 4 9 0 q4 4 9 0 q4 4 9 0 q4 4 9 0" fill="none" stroke="#fff" stroke-width="4" />
      <rect x="26" y="12" width="4" height="14" rx="2" fill="#BFE0FA" stroke={INK} stroke-width="1.6" />
      <path d="M28 12 q-3 -4 0 -7 q3 3 0 7" fill="#FFE8A3" stroke={INK} stroke-width="1.6" />
    </Box>
  );
}

export const STICKERS = {
  bunny: Bunny,
  fox: Fox,
  carrot: Carrot,
  rainbow: Rainbow,
  flower: Flower,
  sparkle: Sparkle,
  cake: Cake,
} as const;
export type StickerName = keyof typeof STICKERS;

export function Sticker({ name, ...p }: P & { name: StickerName }) {
  const C = STICKERS[name];
  return <C {...p} />;
}
