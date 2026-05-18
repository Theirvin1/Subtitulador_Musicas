export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  audio_path TEXT,
  video_path TEXT,
  background_path TEXT,
  cover_path TEXT,
  export_base_path TEXT,
  video_format TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  fps INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subtitle_blocks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  start_time_ms INTEGER NOT NULL DEFAULT 0,
  end_time_ms INTEGER NOT NULL DEFAULT 0,
  original_text TEXT NOT NULL DEFAULT '',
  translated_text TEXT NOT NULL DEFAULT '',
  position_index INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subtitle_styles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  font_family TEXT NOT NULL DEFAULT 'Inter',
  font_size INTEGER NOT NULL DEFAULT 42,
  primary_color TEXT NOT NULL DEFAULT '#ffffff',
  secondary_color TEXT NOT NULL DEFAULT '#d3f7f2',
  background_color TEXT NOT NULL DEFAULT 'rgba(5, 9, 14, 0.68)',
  font_translation TEXT NOT NULL DEFAULT 'Inter',
  size_translation INTEGER NOT NULL DEFAULT 40,
  border_size INTEGER NOT NULL DEFAULT 2,
  shadow INTEGER NOT NULL DEFAULT 1,
  x_original REAL NOT NULL DEFAULT 960,
  y_original REAL NOT NULL DEFAULT 860,
  x_translation REAL NOT NULL DEFAULT 960,
  y_translation REAL NOT NULL DEFAULT 930,
  move_together INTEGER NOT NULL DEFAULT 1,
  fade_in INTEGER NOT NULL DEFAULT 0,
  fade_out INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_fonts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
`;

export const DATABASE_MIGRATIONS = [
  "ALTER TABLE subtitle_styles ADD COLUMN font_translation TEXT NOT NULL DEFAULT 'Inter'",
  'ALTER TABLE subtitle_styles ADD COLUMN size_translation INTEGER NOT NULL DEFAULT 40',
  'ALTER TABLE subtitle_styles ADD COLUMN border_size INTEGER NOT NULL DEFAULT 2',
  'ALTER TABLE subtitle_styles ADD COLUMN shadow INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE subtitle_styles ADD COLUMN x_original REAL NOT NULL DEFAULT 960',
  'ALTER TABLE subtitle_styles ADD COLUMN y_original REAL NOT NULL DEFAULT 860',
  'ALTER TABLE subtitle_styles ADD COLUMN x_translation REAL NOT NULL DEFAULT 960',
  'ALTER TABLE subtitle_styles ADD COLUMN y_translation REAL NOT NULL DEFAULT 930',
  'ALTER TABLE subtitle_styles ADD COLUMN move_together INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE subtitle_styles ADD COLUMN fade_in INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE subtitle_styles ADD COLUMN fade_out INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE subtitle_blocks ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1'
];
