import { json } from '../../_db'

export async function onRequest(context: any) {
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id' } })
  if (context.request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const DB = context.env.DB
  const id = Number(context.params.id)
  const dream = await DB.prepare('SELECT * FROM dreams WHERE id = ?').bind(id).first()
  if (!dream) return json({ error: '梦想不存在' }, 404)

  await DB.prepare('UPDATE dreams SET likes = likes + 1 WHERE id = ?').bind(id).run()
  return json({ ...dream, likes: dream.likes + 1 })
}
