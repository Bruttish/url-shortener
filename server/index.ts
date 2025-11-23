import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateCode(code: string): boolean {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, version: '1.0' });
});

app.post('/api/links', async (req, res) => {
  try {
    const { target_url, code: customCode } = req.body;

    if (!target_url) {
      return res.status(400).json({ error: 'target_url is required' });
    }

    if (!validateUrl(target_url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let code = customCode;

    if (code) {
      if (!validateCode(code)) {
        return res.status(400).json({ error: 'Code must be 6-8 alphanumeric characters' });
      }

      const { data: existing } = await supabase
        .from('links')
        .select('code')
        .eq('code', code)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        code = generateRandomCode();
        const { data: existing } = await supabase
          .from('links')
          .select('code')
          .eq('code', code)
          .maybeSingle();

        if (!existing) break;
        attempts++;
      }

      if (attempts === maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    const { data: link, error } = await supabase
      .from('links')
      .insert({
        code,
        target_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create link' });
    }

    res.status(201).json({
      id: link.id,
      code: link.code,
      target_url: link.target_url,
      short_url: `${req.protocol}://${req.get('host')}/${link.code}`,
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch links' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch link' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('code', code);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete link' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
