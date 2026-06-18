import { json } from '../_db'

export async function onRequest(context: any) {
  const sessionId = context.request.headers.get('X-Session-Id') || 'anon'
  const DB = context.env.DB
  const rows = await DB.prepare(`
    SELECT d.* FROM dreams d
    INNER JOIN favorites f ON d.id = f.dream_id
    WHERE f.session_id = ?
    ORDER BY f.created_at DESC
  `).bind(sessionId).all()
  return json(rows.results)
}
