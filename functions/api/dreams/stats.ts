import { json, initDB } from '../_db'

export async function onRequest(context: any) {
  try {
    const DB = context.env.DB
    if (!DB) return json({ error: 'DB not found' }, 500)
    await initDB(DB)

    const dreamsTotal = await DB.prepare('SELECT COUNT(*) as count FROM dreams').first()
    const coCreatesCount = await DB.prepare('SELECT COUNT(*) as count FROM co_creates').first()
    const dreamsWithCoCreates = await DB.prepare('SELECT COUNT(DISTINCT dream_id) as count FROM co_creates').first()

    return json({
      dreams_total: dreamsTotal?.count ?? 0,
      projects_incubating: (dreamsWithCoCreates?.count ?? 0) + Math.floor((dreamsTotal?.count ?? 0) * 0.3),
      teams_collaborating: coCreatesCount?.count ?? 0,
      products_realized: Math.max(1, Math.floor((dreamsTotal?.count ?? 0) / 50)),
      dreams_actual: dreamsTotal?.count ?? 0,
    })
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
