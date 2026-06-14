import { json } from '../_db'

export async function onRequest(context: any) {
  const { results } = await context.env.DB.prepare('SELECT * FROM dreams ORDER BY RANDOM() LIMIT 20').all()
  return json(results)
}
