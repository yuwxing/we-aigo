import { json, corsHeaders, initDB } from '../_db'

export async function onRequest(context: any) {
  const { request, env } = context
  const DB = env.DB

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const sessionId = request.headers.get('X-Session-Id') || ''
  if (!sessionId) return json({ error: 'session required' }, 400)

  if (request.method === 'GET') {
    const { results } = await DB.prepare(
      'SELECT * FROM notes WHERE session_id = ? ORDER BY created_at DESC'
    ).bind(sessionId).all()
    return json(results)
  }

  if (request.method === 'POST') {
    const body = await request.json()
    if (!body.text?.trim()) return json({ error: '内容不能为空' }, 400)
    await initDB(DB)
    const r = await DB.prepare('INSERT INTO notes (session_id, text, cat) VALUES (?, ?, ?)').bind(
      sessionId, body.text.trim().slice(0, 1000), body.cat?.trim() || '其他'
    ).run()
    const note = await DB.prepare('SELECT * FROM notes WHERE id = ?').bind(r.meta.last_row_id).first()
    return json(note, 201)
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    if (!id) return json({ error: 'id required' }, 400)
    const note = await DB.prepare('SELECT * FROM notes WHERE id = ? AND session_id = ?').bind(id, sessionId).first()
    if (!note) return json({ error: '笔记不存在' }, 404)
    await DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run()
    return json({ success: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}
