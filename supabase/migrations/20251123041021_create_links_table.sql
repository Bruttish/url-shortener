/*
  # Create URL shortener links table

  1. New Tables
    - `links`
      - `id` (uuid, primary key) - Unique identifier for each link
      - `code` (text, unique) - Short code for the URL (6-8 alphanumeric characters)
      - `target_url` (text) - Original long URL to redirect to
      - `click_count` (integer) - Total number of times link has been clicked
      - `last_clicked_at` (timestamptz, nullable) - Last time the link was accessed
      - `created_at` (timestamptz) - When the link was created
      - `updated_at` (timestamptz) - When the link was last modified

  2. Security
    - Enable RLS on `links` table
    - Add policies for public read access (needed for redirects)
    - Add policies for public write access (no auth required per spec)

  3. Indexes
    - Index on `code` for fast lookups during redirects
*/

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (code ~ '^[A-Za-z0-9]{6,8}$'),
  target_url text NOT NULL,
  click_count integer DEFAULT 0 NOT NULL,
  last_clicked_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view links"
  ON links FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create links"
  ON links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update links"
  ON links FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete links"
  ON links FOR DELETE
  USING (true);