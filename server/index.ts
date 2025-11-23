// server/index.ts
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());

const FRONTEND_URL = process.env.BASE_URL || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Utilities
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

/**
 * DB / fallback store
 */
const DATABASE_URL = process.env.DATABASE_URL;
let pool: Pool | null = null;
let useInMemory = false;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // If your provider requires SSL (e.g. some Postgres providers), you may need:
    // ssl: { rejectUnauthorized: false }
  });
} else {
  console.warn('DATABASE_URL not provided — falling back to in-memory store (not persistent).');
  useInMemory = true;
}

// In-memory store structure for fallback
type Link = {
  id: number;
  code: string;
  target_url: string;
  created_at: string;
  clicks: number;
  last_clicked?: string | null;
};

const memoryStore = {
  links: new Map<string, Link>(),
  nextId: 1
};

async function ensureTable() {
  if (!pool) return;
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      target_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      clicks INTEGER NOT NULL DEFAULT 0,
      last_clicked TIMESTAMPTZ
    );
  `;
  await pool.query(createTableSQL);
}

(async () => {
  try {
    if (pool) {
      await ensureTable();
      console.log('Postgres connected and table ensured.');
    } else {
      console.log('Running with in-memory store.');
    }
  } catch (err) {
    console.error('Error ensuring DB:', err);
  }
})();

/**
 * Routes
 */
app.get('/healthz', (_req, res) => {
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

      // Check duplicate
      if (useInMemory) {
        if (memoryStore.links.has(code)) {
          return res.status(409).json({ error: 'Code already exists' });
        }
      } else {
        const { rows } = await pool!.query('SELECT code FROM links WHERE code = $1 LIMIT 1', [code]);
        if (rows.length > 0) {
          return res.status(409).json({ error: 'Code already exists' });
        }
      }
    } else {
      let attempts = 0;
      const maxAttempts = 20;
      do {
        code = generateRandomCode();
        if (useInMemory) {
          if (!memoryStore.links.has(code)) break;
        } else {
          const { rows } = await pool!.query('SELECT code FROM links WHERE code = $1 LIMIT 1', [code]);
          if (rows.length === 0) break;
        }
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts === maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    if (useInMemory) {
      const id = memoryStore.nextId++;
      const now = new Date().toISOString();
      const newLink: Link = {
        id,
        code: code!,
        target_url,
        created_at: now,
        clicks: 0,
        last_clicked: null
      };
      memoryStore.links.set(code!, newLink);

      return res.status(201).json({
        id: newLink.id,
        code: newLink.code,
        target_url: newLink.target_url,
        short_url: `${req.protocol}://${req.get('host')}/${newLink.code}`,
      });
    } else {
      const insertSQL = `
        INSERT INTO links (code, target_url)
        VALUES ($1, $2)
        RETURNING id, code, target_url, created_at, clicks, last_clicked;
      `;
      const { rows } = await pool!.query(insertSQL, [code, target_url]);
      const link = rows[0];

      return res.status(201).json({
        id: link.id,
        code: link.code,
        target_url: link.target_url,
        short_url: `${req.protocol}://${req.get('host')}/${link.code}`,
      });
    }
  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links', async (_req, res) => {
  try {
    if (useInMemory) {
      const all = Array.from(memoryStore.links.values()).sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      return res.json(all);
    } else {
      const { rows } = await pool!.query('SELECT id, code, target_url, created_at, clicks, last_clicked FROM links ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (useInMemory) {
      const link = memoryStore.links.get(code);
      if (!link) return res.status(404).json({ error: 'Link not found' });
      return res.json(link);
    } else {
      const { rows } = await pool!.query('SELECT id, code, target_url, created_at, clicks, last_clicked FROM links WHERE code = $1 LIMIT 1', [code]);
      if (rows.length === 0) return res.status(404).json({ error: 'Link not found' });
      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error fetching link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (useInMemory) {
      const existed = memoryStore.links.delete(code);
      if (!existed) return res.status(404).json({ error: 'Link not found' });
      return res.status(204).send();
    } else {
      const { rowCount } = await pool!.query('DELETE FROM links WHERE code = $1', [code]);
      if (rowCount === 0) return res.status(404).json({ error: 'Link not found' });
      return res.status(204).send();
    }
  } catch (error) {
    console.error('Error deleting link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect route: GET /:code
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (useInMemory) {
      const link = memoryStore.links.get(code);
      if (!link) return res.status(404).send('Not found');

      // increment clicks
      link.clicks = (link.clicks || 0) + 1;
      link.last_clicked = new Date().toISOString();
      memoryStore.links.set(code, link);

      return res.redirect(302, link.target_url);
    } else {
      // Use a transaction to increment clicks and return target_url atomically
      const client = await pool!.connect();
      try {
        await client.query('BEGIN');
        const selectRes = await client.query('SELECT id, target_url, clicks FROM links WHERE code = $1 FOR UPDATE', [code]);
        if (selectRes.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).send('Not found');
        }
        const link = selectRes.rows[0];
        const newClicks = (link.clicks || 0) + 1;
        await client.query('UPDATE links SET clicks = $1, last_clicked = NOW() WHERE id = $2', [newClicks, link.id]);
        await client.query('COMMIT');

        return res.redirect(302, link.target_url);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during redirect transaction:', err);
        return res.status(500).send('Internal server error');
      } finally {
        client.release();
      }
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
    return res.status(500).send('Internal server error');
  }
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    if (pool) await pool.end();
  } catch (err) {
    console.error('Error closing DB pool', err);
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
