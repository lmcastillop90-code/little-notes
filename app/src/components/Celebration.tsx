import { BunnyHappy, Carrot, Flame, Rainbow, Sticker, type StickerName } from './Stickers';
import { Sparkles } from './ui';
import { makeT } from '../i18n';
import type { Lang } from '../db/db';

export function Celebration({
  title,
  message,
  streak,
  unlocked,
  lang,
  onClose,
}: {
  title: string;
  message: string;
  streak: number;
  unlocked?: string;
  lang: Lang;
  onClose: () => void;
}) {
  const { t, t2 } = makeT(lang);
  return (
    <div class="celebrate" onClick={onClose}>
      <Sparkles />
      <div style="margin-top: 40px"><Rainbow size={300} /></div>
      <div class="bounce" style="margin-top: -40px; position: relative">
        <BunnyHappy size={150} />
        <span style="position:absolute; right:-10px; bottom:6px"><Carrot size={56} /></span>
      </div>
      <h1 class="title" style="margin-top: 18px">{t('yayDone')} 🎉</h1>
      {t2('yayDone') ? <p class="sub">{t2('yayDone')}</p> : null}
      <p style="margin-top: 8px; font-weight: 700; color: var(--muted-2)">{title}</p>
      <p style="margin-top: 14px; font-size: 17px; font-weight: 800; font-style: italic">“{message}”</p>

      {streak > 1 || unlocked ? (
        <div class="card row" style="margin-top: 24px; border-color: var(--pink); box-shadow: 0 4px 0 #fce4ec">
          {unlocked ? <Sticker name={unlocked as StickerName} size={40} /> : <Flame size={40} />}
          <div class="col">
            {streak > 1 ? <span style="font-size: 18px; font-weight: 800">{streak}-{t('streak')}</span> : null}
            {unlocked ? <span class="sub">{t('newSticker')}: {unlocked} ✨</span> : null}
          </div>
        </div>
      ) : null}

      <button class="btn primary" style="margin-top: auto; width: 100%; max-width: 326px" onClick={onClose}>
        {t('backToToday')}
      </button>
    </div>
  );
}
