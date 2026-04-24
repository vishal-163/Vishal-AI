import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/utils';

// POST /api/v1/keys — Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || 'Default Key';

    // Generate key
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    // Store hashed key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select()
      .single();

    if (error) {
      console.error('Key creation error:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return full key ONCE — it will never be shown again
    return NextResponse.json({
      id: data.id,
      name: data.name,
      key: rawKey,
      key_prefix: keyPrefix,
      created_at: data.created_at,
    });
  } catch (err) {
    console.error('Key creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/keys — List all API keys for the authenticated user
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, is_revoked, usage_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    return NextResponse.json({ keys: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
