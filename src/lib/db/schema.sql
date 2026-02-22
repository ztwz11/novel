-- NovelForge Database Schema

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  system_prompt TEXT DEFAULT '',
  writing_style_json TEXT DEFAULT '{}',
  rules_json TEXT DEFAULT '[]',
  constraints_json TEXT DEFAULT '[]',
  example_excerpts_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  target_volumes INTEGER DEFAULT 1,
  persona_id TEXT,
  settings_json TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS story_bible_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT DEFAULT '',
  metadata_json TEXT DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volumes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  volume_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  synopsis TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  target_chapters INTEGER DEFAULT 25,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  detailed_summary TEXT DEFAULT '',
  condensed_summary TEXT DEFAULT '',
  key_events_summary TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  generation_direction TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model TEXT DEFAULT '',
  duration_ms INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_bible_project ON story_bible_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_story_bible_category ON story_bible_entries(project_id, category);
CREATE INDEX IF NOT EXISTS idx_volumes_project ON volumes(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_volume ON chapters(volume_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_chapter ON generation_logs(chapter_id);

-- 탈고 이력
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  original_content TEXT DEFAULT '',
  revised_content TEXT DEFAULT '',
  options_json TEXT DEFAULT '{}',
  intensity TEXT DEFAULT 'normal',
  diff_summary TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_revisions_chapter ON revisions(chapter_id);

-- 삽화/일러스트
CREATE TABLE IF NOT EXISTS illustrations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  chapter_id TEXT,
  type TEXT DEFAULT 'scene',
  provider TEXT DEFAULT 'gemini',
  prompt TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_data TEXT DEFAULT '',
  style TEXT DEFAULT '',
  metadata_json TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_illustrations_project ON illustrations(project_id);
CREATE INDEX IF NOT EXISTS idx_illustrations_chapter ON illustrations(chapter_id);

-- 페르소나 지식 파일 (Gems 스타일)
CREATE TABLE IF NOT EXISTS persona_knowledge_files (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  filename TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  file_type TEXT DEFAULT 'md',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  char_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_persona ON persona_knowledge_files(persona_id);
