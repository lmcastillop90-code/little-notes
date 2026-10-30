-- Little Notes — D1 schema
CREATE TABLE IF NOT EXISTS devices (
  token TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  lang TEXT NOT NULL DEFAULT 'both',
  morning_enabled INTEGER NOT NULL DEFAULT 1,
  morning_hour INTEGER NOT NULL DEFAULT 7,
  morning_minute INTEGER NOT NULL DEFAULT 30,
  morning_count INTEGER NOT NULL DEFAULT 0,
  morning_last_day TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT NOT NULL,            -- task id (or task id + suffix for "before" alerts)
  token TEXT NOT NULL,         -- device token
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '/',
  fire_at INTEGER NOT NULL,    -- epoch ms
  nag INTEGER NOT NULL DEFAULT 0,
  nag_every_min INTEGER NOT NULL DEFAULT 10,
  nag_max INTEGER NOT NULL DEFAULT 5,
  attempts INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, token)
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (done, fire_at);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
