import { json, initDB } from '../_db'

export async function onRequest(context: any) {
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id' } })
  if (context.request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await context.request.json()
  if (!body.content?.trim()) return json({ error: '梦想内容不能为空' }, 400)

  const DB = context.env.DB
  const sessionId = context.request.headers.get('X-Session-Id') || ''
  await initDB(DB)
  const r = await DB.prepare('INSERT INTO dreams (content, nickname, session_id) VALUES (?, ?, ?)').bind(body.content.trim().slice(0, 500), body.nickname?.trim() || '匿名', sessionId).run()
  await DB.prepare('UPDATE stats SET dreams_total = dreams_total + 1 WHERE id = 1').run()
  const dream = await DB.prepare('SELECT * FROM dreams WHERE id = ?').bind(r.meta.last_row_id).first()
  return json(dream, 201)
}
