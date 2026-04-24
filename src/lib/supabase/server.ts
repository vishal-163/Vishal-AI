import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieItem = { name: string; value: string; options?: Record<string, unknown> };

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
}

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    getUrl(),
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // The `setAll` method is called from a Server Component
            // where cookies can't be set. This can be safely ignored
            // if middleware is refreshing sessions.
          }
        },
      },
    }
  );
}

export function createServiceClient() {
  const cookieStore = cookies();

  return createServerClient(
    getUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // Safe to ignore in server components
          }
        },
      },
    }
  );
}
