// src/lib/supabase.ts
// Guarded supabase client for frontend builds.
// If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present, dynamically import and create the client.
// Otherwise export a safe noop client with the minimal api shape used by the app.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type AnyObj = Record<string, any>;

function noopResponse() {
  return Promise.resolve({ data: null, error: null });
}

const noopFrom = (_table: string) => ({
  select: async (_cols?: string) => noopResponse(),
  insert: async (_payload?: AnyObj) => noopResponse(),
  update: async (_payload?: AnyObj) => noopResponse(),
  delete: async (_filter?: AnyObj) => noopResponse(),
  maybeSingle: async () => noopResponse(),
  single: async () => noopResponse(),
  eq: function () { return this; },
  order: function () { return this; }
});

let supabaseClient: any = {
  from: noopFrom
};

if (SUPABASE_URL && SUPABASE_KEY) {
  // dynamic import so Vite will only include @supabase/supabase-js if env vars are present at build time
  // Top-level await is supported by Vite
  (async () => {
    try {
      const mod = await import('@supabase/supabase-js');
      supabaseClient = mod.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('Supabase client initialized (frontend).');
    } catch (err) {
      console.warn('Failed to initialize supabase client:', err);
      // keep noop client
    }
  })();
} else {
  console.info('Supabase not configured for frontend — using noop client.');
}

export default supabaseClient;
