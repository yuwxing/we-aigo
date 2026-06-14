import { json, initDB } from '../_db'

export async function onRequest(context: any) {
  try {
    const DB = context.env.DB
    if (!DB) return json({ error: 'DB not found' }, 500)
    await initDB(DB)
    const row = await DB.prepare('SELECT * FROM stats WHERE id = 1').first()
    const total = await DB.prepare('SELECT COUNT(*) as count FROM dreams').first()
    return json({ ...row, dreams_actual: total?.count ?? 0 })
  } catch (e: any) {
    return json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5).join('\n') }, 500)
  }
}
