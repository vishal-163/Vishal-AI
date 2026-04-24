import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/v1/usage — Get usage statistics for the authenticated user
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all logs for the user
    const { data: logs } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!logs) {
      return NextResponse.json({
        total_requests: 0,
        requests_today: 0,
        requests_month: 0,
        total_tokens: 0,
        error_rate: 0,
        recent_logs: [],
      });
    }

    const todayLogs = logs.filter(l => new Date(l.created_at) >= todayStart);
    const monthLogs = logs.filter(l => new Date(l.created_at) >= monthStart);
    const errors = logs.filter(l => l.status === 'error');
    const totalTokens = logs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);

    return NextResponse.json({
      total_requests: logs.length,
      requests_today: todayLogs.length,
      requests_month: monthLogs.length,
      total_tokens: totalTokens,
      error_rate: logs.length > 0 ? (errors.length / logs.length) * 100 : 0,
      recent_logs: logs.slice(0, 20),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
