import { json } from '../../_db'

export async function onRequest(context: any) {
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id' } })

  const DB = context.env.DB
  const dreamId = Number(context.params.id)

  if (context.request.method === 'GET') {
    const { results } = await DB.prepare('SELECT * FROM co_creates WHERE dream_id = ? ORDER BY created_at DESC').bind(dreamId).all()
    return json(results)
  }

  if (context.request.method === 'POST') {
    const body = await context.request.json()
    if (!body.type || !['value', 'problem', 'solution'].includes(body.type)) return json({ error: '类型无效' }, 400)
    if (!body.content?.trim()) return json({ error: '内容不能为空' }, 400)
    const r = await DB.prepare('INSERT INTO co_creates (dream_id, type, content, author) VALUES (?, ?, ?, ?)').bind(dreamId, body.type, body.content.trim(), body.author?.trim() || '匿名').run()
    const item = await DB.prepare('SELECT * FROM co_creates WHERE id = ?').bind(r.meta.last_row_id).first()
    return json(item, 201)
  }

  return json({ error: 'Method not allowed' }, 405)
}
