import { json } from '../_db'

export async function onRequest(context: any) {
  const url = new URL(context.request.url)
  const q = url.searchParams.get('q')?.trim()
  if (!q) return json([])

  const DB = context.env.DB
  const rows = await DB.prepare("SELECT * FROM dreams WHERE content LIKE ? ORDER BY likes DESC LIMIT 30").bind(`%${q}%`).all()
  return json(rows.results)
}
