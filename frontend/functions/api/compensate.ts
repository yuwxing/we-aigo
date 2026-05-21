// Cloudflare Pages Function - 赔付API代理
// GET /api/compensate?user_id=18&amount=6000&admin_key=xxx

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const adminKey = url.searchParams.get('admin_key');
  const userId = parseInt(url.searchParams.get('user_id') || '0');
  const amount = parseInt(url.searchParams.get('amount') || '0');
  const description = url.searchParams.get('description') || 'platform_compensation';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain; charset=utf-8',
  };

  if (adminKey !== 'huaxianzi_compensate_2026') {
    return new Response('AUTH_FAILED', { status: 403, headers });
  }

  if (!userId || !amount || amount <= 0) {
    return new Response(`INVALID_PARAMS userId=${userId} amount=${amount}`, { status: 400, headers });
  }

  try {
    const workerUrl = `https://ai-wego-worker.ai-wego-api.workers.dev/api/compensate-now?user_id=${userId}&amount=${amount}&description=${encodeURIComponent(description)}&admin_key=huaxianzi_compensate_2026`;
    const resp = await fetch(workerUrl);
    const text = await resp.text();
    return new Response(text, { status: resp.status, headers });
  } catch (e) {
    return new Response(`PROXY_ERROR: ${String(e)}`, { status: 502, headers });
  }
};
