import { json } from '../_db'

export async function onRequest(context: any) {
  const sessionId = context.request.headers.get('X-Session-Id') || ''
  if (!sessionId) return json([])
  const { results } = await context.env.DB.prepare(
    'SELECT * FROM dreams WHERE session_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(sessionId).all()
  return json(results)
}
