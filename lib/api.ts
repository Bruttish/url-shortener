import { supabase, Link } from './supabase';

export type { Link };

export interface CreateLinkRequest {
  target_url: string;
  code?: string;
}

export interface CreateLinkResponse {
  id: string;
  code: string;
  target_url: string;
  short_url: string;
}

export interface LinkStatsResponse {
  id: string;
  code: string;
  target_url: string;
  click_count: number;
  last_clicked_at: string | null;
  created_at: string;
}

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

export async function createLink(data: CreateLinkRequest): Promise<CreateLinkResponse> {
  if (!validateUrl(data.target_url)) {
    throw new Error('Invalid URL format');
  }

  let code = data.code;

  if (code) {
    if (!validateCode(code)) {
      throw new Error('Code must be 6-8 alphanumeric characters');
    }

    const { data: existing } = await supabase
      .from('links')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      const error = new Error('Code already exists');
      (error as any).status = 409;
      throw error;
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
      throw new Error('Failed to generate unique code');
    }
  }

  const { data: link, error } = await supabase
    .from('links')
    .insert({
      code,
      target_url: data.target_url,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: link.id,
    code: link.code,
    target_url: link.target_url,
    short_url: `${window.location.origin}/${link.code}`,
  };
}

export async function getAllLinks(): Promise<Link[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLinkByCode(code: string): Promise<LinkStatsResponse | null> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteLink(code: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('code', code);

  if (error) throw error;
}

export async function incrementClickCount(code: string): Promise<string | null> {
  const { data: link } = await supabase
    .from('links')
    .select('target_url, click_count')
    .eq('code', code)
    .maybeSingle();

  if (!link) return null;

  await supabase
    .from('links')
    .update({
      click_count: link.click_count + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq('code', code);

  return link.target_url;
}
