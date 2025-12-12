-- Execute this SQL in Supabase SQL Editor
-- Go to: Supabase Dashboard -> SQL Editor -> New Query

-- Create the site_content table
CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY DEFAULT 1,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a constraint to ensure only one row exists
ALTER TABLE site_content ADD CONSTRAINT single_row CHECK (id = 1);

-- Enable Row Level Security
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Allow public read" ON site_content
    FOR SELECT USING (true);

-- Create a policy to allow authenticated updates
CREATE POLICY "Allow authenticated update" ON site_content
    FOR UPDATE USING (true);

-- Create a policy to allow authenticated insert
CREATE POLICY "Allow authenticated insert" ON site_content
    FOR INSERT WITH CHECK (true);

-- Insert default empty content (will be overwritten on first save)
INSERT INTO site_content (id, content)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
