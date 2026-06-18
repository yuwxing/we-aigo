import { json } from '../../_db'

export async function onRequest(context: any) {
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id' } })

  const DB = context.env.DB
  const dreamId = Number(context.params.id)
  const sessionId = context.request.headers.get('X-Session-Id') || 'anon'

  if (context.request.method === 'POST') {
    const existing = await DB.prepare('SELECT * FROM favorites WHERE dream_id = ? AND session_id = ?').bind(dreamId, sessionId).first()
    if (existing) {
      await DB.prepare('DELETE FROM favorites WHERE dream_id = ? AND session_id = ?').bind(dreamId, sessionId).run()
      return json({ favorited: false })
    }
    await DB.prepare('INSERT INTO favorites (dream_id, session_id) VALUES (?, ?)').bind(dreamId, sessionId).run()
    return json({ favorited: true })
  }

  if (context.request.method === 'GET') {
    const existing = await DB.prepare('SELECT * FROM favorites WHERE dream_id = ? AND session_id = ?').bind(dreamId, sessionId).first()
    return json({ favorited: !!existing })
  }

  return json({ error: 'Method not allowed' }, 405)
}
