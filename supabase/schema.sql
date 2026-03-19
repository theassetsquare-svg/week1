CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('night','club','lounge','room','yojeong','hoppa')),
  type_name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  region TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  short_desc TEXT NOT NULL,
  description TEXT NOT NULL,
  atmosphere TEXT NOT NULL,
  music TEXT NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  timeline JSONB NOT NULL DEFAULT '[]',
  faq JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  h1_title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_region_slug ON venues(region_slug);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON venues FOR SELECT USING (true);
