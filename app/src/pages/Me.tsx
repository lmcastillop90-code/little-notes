import { useEffect, useState } from 'preact/hooks';
import { useCategories, useSettings, useTasks, saveSettings, computeStreak, addCategory, saveCategory } from '../lib/store';
import { makeT } from '../i18n';
import { Sticker, STICKERS, type StickerName } from '../components/Stickers';
import { Icon, Sheet, Toggle } from '../components/ui';
import { enablePush, isIOS, isStandalone } from '../lib/push';
import { sendIdea, sendTest, setMorningSummary } from '../lib/api';
import { exportIcs, exportJson, importJson } from '../lib/export';
import type { Category, Lang } from '../db/db';

const PALETTE: { c: string; d: string }[] = [
  { c: '#FFE8A3', d: '#E8CF80' },
  { c: '#FFC9DE', d: '#E88AB0' },
  { c: '#D9C8F5', d: '#9B86C4' },
  { c: '#BFE0FA', d: '#6FB4E8' },
  { c: '#C9EFC9', d: '#7FC27F' },
  { c: '#FFD9B3', d: '#F0A060' },
  { c: '#FFB3B3', d: '#E07070' },
  { c: '#CFEFEA', d: '#6FC2B5' },
];

type Panel = null | 'profile' | 'cat' | 'lang' | 'notif' | 'idea' | 'pair' | 'backup' | 'stickers';

export function Me({ onToast }: { onToast: (m: string) => void }) {
  const s = useSettings();
  const cats = useCategories();
  const tasks = useTasks();
  const { t, t2 } = makeT(s.lang);
  const [panel, setPanel] = useState<Panel>(null);
  const [cat, setCat] = useState<Category | null>(null);
  const [streak, setStreak] = useState(0);
  const [idea, setIdea] = useState('');
  const [code, setCode] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => { computeStreak().then(setStreak); }, [tasks.length]);
  useEffect(() => { setApiUrl(s.apiUrl); }, [s.apiUrl]);

  const doneCount = tasks.filter((x) => x.done).length;
  const allStickers = Object.keys(STICKERS) as StickerName[];

  const onEnablePush = async () => {
    if (!s.apiSecret) { setPanel('pair'); return; }
    const err = await enablePush();
    if (!err) { onToast('✓ ' + t('notifications')); return; }
    const msgs: Record<string, string> = {
      unsupported: 'This browser cannot receive notifications.',
      'ios-install': t('installHint'),
      denied: 'Notifications were blocked. Enable them in Settings.',
      'no-server': 'Could not reach the notification server.',
    };
    alert(msgs[err] ?? err);
  };

  const submitIdea = async () => {
    if (!idea.trim()) return;
    const r = await sendIdea(idea.trim());
    if (r) { onToast(t('sent')); setIdea(''); setPanel(null); }
    else alert('Could not send right now. It will work once notifications are connected.');
  };

  const pair = async () => {
    await saveSettings({ apiSecret: code.trim(), apiUrl: apiUrl.trim() });
    setPanel(null);
    const err = await enablePush();
    if (!err) onToast('✓ ' + t('notifications'));
    else if (err === 'ios-install') alert(t('installHint'));
    else alert(err);
  };

  const setMorning = async (on: boolean) => {
    await saveSettings({ morningSummary: on });
    const count = tasks.filter((x) => !x.done).length;
    await setMorningSummary(on, s.morningHour, s.morningMinute, count);
  };

  return (
    <div class="page" style="padding-top: 0">
      <div style="margin: 0 -20px; padding: calc(44px + var(--safe-top)) 20px 20px; background: var(--yellow); border-radius: 0 0 36px 36px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #3E3150">
        <button class="icon-btn" style="width: 112px; height: 112px; border: 3px solid #3E3150; position: relative" aria-label={t('avatar')} onClick={() => setPanel('profile')}>
          <Sticker name={s.avatar} size={84} />
          <span class="icon-btn" style="position:absolute; right:-6px; bottom:-6px; width:36px; height:36px; background: var(--pink); border-color:#3E3150"><Icon.edit /></span>
        </button>
        <h1 class="title" style="font-size: 26px">{s.name || 'Trang'}</h1>
        {s.city ? <span class="sub" style="color: var(--yellow-ink)">{s.city}</span> : null}
        <div class="row" style="gap: 22px; margin-top: 4px">
          <Stat n={doneCount} l={t('tasksDone')} />
          <Stat n={`${streak} 🔥`} l={t('streak').replace('!', '')} />
          <Stat n={s.unlocked.length} l={t('stickers')} />
        </div>
      </div>

      <p class="quote" style="text-align:center">“{s.message}”</p>

      <Row ico="var(--purple)" icon={<Icon.user />} lbl={t('editProfile')} dsc={t2('editProfile') || t('editProfileDsc')} onClick={() => setPanel('profile')} />

      <div class="card col" style="gap: 10px">
        <Row plain ico="var(--pink)" icon={<Icon.palette />} lbl={t('myColors')} dsc={t2('myColors') || t('myColorsDsc')} />
        <div class="row wrap" style="gap: 10px; padding-left: 48px">
          {cats.map((c) => (
            <button key={c.id} class="swatch" style={`--sw:${c.color}`} aria-label={c.name} onClick={() => { setCat(c); setPanel('cat'); }} />
          ))}
          <button class="swatch add" aria-label={t('newCategory')} onClick={() => { setCat({ id: '', name: '', nameVi: '', color: PALETTE[5].c, colorDark: PALETTE[5].d, sticker: 'flower', order: cats.length }); setPanel('cat'); }}>+</button>
        </div>
      </div>

      <Row ico="var(--blue)" icon={<Sticker name="sparkle" size={20} />} lbl={t('myStickers')} dsc={`${s.unlocked.length}/${allStickers.length} · ${allStickers.length - s.unlocked.length} ${t('toUnlock')}`} onClick={() => setPanel('stickers')} />
      <Row ico="var(--yellow)" icon={<Icon.globe />} lbl={t('language')} dsc={s.lang === 'both' ? t('langBoth') : s.lang === 'vi' ? t('langVi') : t('langEn')} onClick={() => setPanel('lang')} />
      <Row ico="var(--purple)" icon={<Icon.bell />} lbl={t('notifications')} dsc={s.pushEnabled ? t('notifOn') : t('notifOff')} onClick={() => setPanel('notif')} />

      <div class="card setting" style="--ico: var(--purple)">
        <span class="ico"><Icon.moon /></span>
        <div class="col grow"><span class="lbl">{t('theme')}</span><span class="dsc">{s.theme === 'dark' ? t('dark') : t('light')}</span></div>
        <Toggle on={s.theme === 'dark'} onChange={(v) => saveSettings({ theme: v ? 'dark' : 'light' })} label={t('theme')} />
      </div>

      <Row ico="var(--green)" icon={<Icon.download />} lbl={t('backup')} dsc={t2('backup') || 'JSON · iPhone Calendar'} onClick={() => setPanel('backup')} />

      <button class="note-box row" style="text-align:left; cursor:pointer" onClick={() => setPanel('idea')}>
        <span class="ico" style="width:36px;height:36px;border-radius:12px;background:#fff;display:grid;place-items:center"><Icon.bulb /></span>
        <div class="col grow">
          <span style="font-size: 15px; font-weight: 800">{t('haveIdea')}</span>
          <span style="font-size: 12px">{t('haveIdeaDsc')}</span>
        </div>
      </button>

      {panel === 'profile' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('editProfile')}</h2>
          <div class="field"><label>{t('name')}</label><input class="input" value={s.name} onInput={(e) => saveSettings({ name: (e.target as HTMLInputElement).value })} /></div>
          <div class="field"><label>{t('city')}</label><input class="input" value={s.city} placeholder="Buôn Ma Thuột" onInput={(e) => saveSettings({ city: (e.target as HTMLInputElement).value })} /></div>
          <div class="field"><label>{t('message')}</label><input class="input" value={s.message} onInput={(e) => saveSettings({ message: (e.target as HTMLInputElement).value })} /></div>
          <div class="field">
            <label>{t('avatar')}</label>
            <div class="row" style="gap: 10px">
              {(['fox', 'bunny', 'carrot', 'flower'] as const).map((a) => (
                <button key={a} class="icon-btn" style={`width:64px;height:64px; ${s.avatar === a ? 'border-color: var(--ink)' : ''}`} aria-label={a} onClick={() => saveSettings({ avatar: a })}><Sticker name={a} size={46} /></button>
              ))}
            </div>
          </div>
          <button class="btn primary" onClick={() => setPanel(null)}>{t('save')}</button>
        </Sheet>
      ) : null}

      {panel === 'cat' && cat ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{cat.id ? t('category') : t('newCategory')}</h2>
          <div class="field"><label>{t('categoryName')}</label><input class="input" value={cat.name} onInput={(e) => setCat({ ...cat, name: (e.target as HTMLInputElement).value })} /></div>
          <div class="field"><label>{t('categoryNameVi')}</label><input class="input" value={cat.nameVi} onInput={(e) => setCat({ ...cat, nameVi: (e.target as HTMLInputElement).value })} /></div>
          <div class="field">
            <label>{t('color')}</label>
            <div class="row wrap" style="gap: 10px">
              {PALETTE.map((p) => (
                <button key={p.c} class="swatch" style={`--sw:${p.c}; ${cat.color === p.c ? '' : 'border-color: var(--line)'}`} aria-label={p.c} onClick={() => setCat({ ...cat, color: p.c, colorDark: p.d })} />
              ))}
            </div>
          </div>
          <div class="field">
            <label>{t('sticker')}</label>
            <div class="row wrap" style="gap: 8px">
              {allStickers.map((n) => (
                <button key={n} class="icon-btn" style={`width:56px;height:56px; ${cat.sticker === n ? 'border-color: var(--ink)' : ''}`} aria-label={n} onClick={() => setCat({ ...cat, sticker: n })}><Sticker name={n} size={38} /></button>
              ))}
            </div>
          </div>
          <button class="btn primary" onClick={async () => {
            if (!cat.name.trim()) return;
            if (cat.id) await saveCategory(cat);
            else await addCategory({ name: cat.name, nameVi: cat.nameVi, color: cat.color, colorDark: cat.colorDark, sticker: cat.sticker });
            setPanel(null); onToast(t('saved'));
          }}>{t('save')}</button>
        </Sheet>
      ) : null}

      {panel === 'lang' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('language')}</h2>
          {(['en', 'vi', 'both'] as Lang[]).map((l) => (
            <button key={l} class={`btn ${s.lang === l ? 'primary' : 'ghost'}`} onClick={() => { saveSettings({ lang: l }); setPanel(null); }}>
              {l === 'en' ? t('langEn') : l === 'vi' ? t('langVi') : t('langBoth')}
            </button>
          ))}
        </Sheet>
      ) : null}

      {panel === 'notif' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('notifications')}</h2>
          {isIOS() && !isStandalone() ? <p class="note-box">{t('installHint')}</p> : null}
          <div class="card setting" style="--ico: var(--purple)">
            <span class="ico"><Icon.bell /></span>
            <div class="col grow"><span class="lbl">{t('notifications')}</span><span class="dsc">{s.pushEnabled ? t('notifOn') : t('notifOff')}</span></div>
            <Toggle on={s.pushEnabled} onChange={(v) => (v ? onEnablePush() : saveSettings({ pushEnabled: false }))} label={t('notifications')} />
          </div>
          <div class="card setting" style="--ico: var(--yellow)">
            <span class="ico"><Icon.clock /></span>
            <div class="col grow">
              <span class="lbl">{t('morningSummary')}</span>
              <input class="input" type="time" style="max-width: 130px; margin-top: 4px" value={`${String(s.morningHour).padStart(2, '0')}:${String(s.morningMinute).padStart(2, '0')}`} onChange={async (e) => {
                const [h, m] = (e.target as HTMLInputElement).value.split(':').map(Number);
                await saveSettings({ morningHour: h, morningMinute: m });
                await setMorningSummary(s.morningSummary, h, m, tasks.filter((x) => !x.done).length);
              }} />
            </div>
            <Toggle on={s.morningSummary} onChange={setMorning} label={t('morningSummary')} />
          </div>
          <button class="btn ghost sm" onClick={async () => { const r = await sendTest(); onToast(r ? '✓' : '✕'); }}>{t('testNotif')}</button>
          <button class="btn ghost sm" onClick={() => setPanel('pair')}>{t('pairTitle')}</button>
        </Sheet>
      ) : null}

      {panel === 'pair' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('pairTitle')}</h2>
          <p class="sub">{t('pairDsc')}</p>
          <div class="field"><label>Server</label><input class="input" value={apiUrl} placeholder="https://little-notes-api.xxx.workers.dev" onInput={(e) => setApiUrl((e.target as HTMLInputElement).value)} /></div>
          <div class="field"><label>{t('code')}</label><input class="input" value={code} type="password" onInput={(e) => setCode((e.target as HTMLInputElement).value)} /></div>
          <button class="btn primary" onClick={pair}>{t('connect')}</button>
        </Sheet>
      ) : null}

      {panel === 'stickers' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('myStickers')}</h2>
          <div class="row wrap" style="gap: 12px; justify-content: center">
            {allStickers.map((n) => (
              <div key={n} class="card col" style={`align-items:center; width: 96px; ${s.unlocked.includes(n) ? '' : 'opacity: .35; filter: grayscale(1)'}`}>
                <Sticker name={n} size={52} />
                <span class="sub">{n}</span>
              </div>
            ))}
          </div>
          <p class="sub" style="text-align:center">3 days 🔥 → flower · 7 days → sparkle · 14 days → cake</p>
        </Sheet>
      ) : null}

      {panel === 'backup' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('backup')}</h2>
          <button class="btn" onClick={() => exportJson()}>{t('exportJson')}</button>
          <button class="btn" onClick={() => exportIcs()}>{t('exportIcs')}</button>
          <label class="btn ghost" style="cursor:pointer">
            {t('importJson')}
            <input type="file" accept="application/json" style="display:none" onChange={async (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (!f) return;
              const ok = await importJson(f);
              onToast(ok ? t('saved') : '✕');
              setPanel(null);
            }} />
          </label>
        </Sheet>
      ) : null}

      {panel === 'idea' ? (
        <Sheet onClose={() => setPanel(null)}>
          <h2 class="title" style="font-size: 20px">{t('haveIdea')}</h2>
          <textarea class="input" style="min-height: 140px" value={idea} placeholder={t('ideaPlaceholder')} onInput={(e) => setIdea((e.target as HTMLTextAreaElement).value)} />
          <button class="btn primary" onClick={submitIdea}>{t('send')} 💛</button>
        </Sheet>
      ) : null}
    </div>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div class="col" style="align-items:center; gap: 0">
      <span style="font-size: 18px; font-weight: 800">{n}</span>
      <span style="font-size: 11px; font-weight: 700; color: var(--yellow-ink)">{l}</span>
    </div>
  );
}

function Row({ ico, icon, lbl, dsc, onClick, plain }: { ico: string; icon: preact.ComponentChildren; lbl: string; dsc: string; onClick?: () => void; plain?: boolean }) {
  const inner = (
    <>
      <span class="ico"><>{icon}</></span>
      <div class="col grow"><span class="lbl">{lbl}</span><span class="dsc">{dsc}</span></div>
      {onClick ? <Icon.chevron /> : null}
    </>
  );
  if (plain) return <div class="setting" style={`--ico:${ico}`}>{inner}</div>;
  return (
    <button class="card setting" style={`--ico:${ico}; text-align:left; width:100%`} onClick={onClick}>
      {inner}
    </button>
  );
}
