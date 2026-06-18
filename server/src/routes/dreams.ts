import { Router, Request, Response } from 'express'
import { getDb, Dream } from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const dreams = db.prepare('SELECT * FROM dreams ORDER BY created_at DESC LIMIT 50').all() as Dream[]
  res.json(dreams)
})

router.get('/hot', (req: Request, res: Response) => {
  const db = getDb()
  const dreams = db.prepare('SELECT * FROM dreams ORDER BY likes DESC, created_at DESC LIMIT 20').all() as Dream[]
  res.json(dreams)
})

router.get('/latest', (req: Request, res: Response) => {
  const db = getDb()
  const dreams = db.prepare('SELECT * FROM dreams ORDER BY created_at DESC LIMIT 20').all() as Dream[]
  res.json(dreams)
})

router.get('/random', (req: Request, res: Response) => {
  const db = getDb()
  const dreams = db.prepare('SELECT * FROM dreams ORDER BY RANDOM() LIMIT 20').all() as Dream[]
  res.json(dreams)
})

router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM stats WHERE id = 1').get() as any
  const total = db.prepare('SELECT COUNT(*) as count FROM dreams').get() as any
  res.json({
    dreams_total: row?.dreams_total ?? 12438,
    projects_incubating: row?.projects_incubating ?? 1284,
    teams_collaborating: row?.teams_collaborating ?? 328,
    products_realized: row?.products_realized ?? 17,
    dreams_actual: total?.count ?? 0,
  })
})

router.get('/my', (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string || ''
  if (!sessionId) { res.json([]); return }
  const db = getDb()
  const dreams = db.prepare('SELECT * FROM dreams WHERE session_id = ? ORDER BY created_at DESC LIMIT 50').all(sessionId) as Dream[]
  res.json(dreams)
})

router.post('/', (req: Request, res: Response) => {
  const { content, nickname } = req.body
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: '梦想内容不能为空' })
    return
  }
  const db = getDb()
  const sessionId = req.headers['x-session-id'] as string || ''
  const trimmed = content.trim().slice(0, 500)
  const name = nickname && typeof nickname === 'string' ? nickname.trim().slice(0, 20) || '匿名' : '匿名'
  const result = db.prepare('INSERT INTO dreams (content, nickname, session_id) VALUES (?, ?, ?)').run(trimmed, name, sessionId)
  db.prepare('UPDATE stats SET dreams_total = dreams_total + 1 WHERE id = 1').run()
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(result.lastInsertRowid) as Dream
  res.status(201).json(dream)
})

router.post('/:id/like', (req: Request, res: Response) => {
  const db = getDb()
  const id = Number(req.params.id)
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(id) as Dream | undefined
  if (!dream) {
    res.status(404).json({ error: '梦想不存在' })
    return
  }
  db.prepare('UPDATE dreams SET likes = likes + 1 WHERE id = ?').run(id)
  res.json({ ...dream, likes: dream.likes + 1 })
})

router.get('/:id/co-creates', (req: Request, res: Response) => {
  const db = getDb()
  const id = Number(req.params.id)
  const items = db.prepare('SELECT * FROM co_creates WHERE dream_id = ? ORDER BY created_at DESC').all(id)
  res.json(items)
})

router.post('/:id/co-creates', (req: Request, res: Response) => {
  const db = getDb()
  const dreamId = Number(req.params.id)
  const { type, content, author } = req.body

  if (!type || !['value', 'problem', 'solution'].includes(type)) {
    res.status(400).json({ error: '类型无效' })
    return
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: '内容不能为空' })
    return
  }

  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId) as Dream | undefined
  if (!dream) {
    res.status(404).json({ error: '梦想不存在' })
    return
  }

  const name = author && typeof author === 'string' ? author.trim().slice(0, 20) || '匿名' : '匿名'
  const result = db.prepare(
    'INSERT INTO co_creates (dream_id, type, content, author) VALUES (?, ?, ?, ?)'
  ).run(dreamId, type, content.trim().slice(0, 500), name)

  const item = db.prepare('SELECT * FROM co_creates WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(item)
})

router.post('/:id/favorite', (req: Request, res: Response) => {
  const db = getDb()
  const dreamId = Number(req.params.id)
  const sessionId = req.headers['x-session-id'] as string || 'anon'

  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId) as Dream | undefined
  if (!dream) {
    res.status(404).json({ error: '梦想不存在' })
    return
  }

  const existing = db.prepare(
    'SELECT * FROM favorites WHERE dream_id = ? AND session_id = ?'
  ).get(dreamId, sessionId) as any

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE dream_id = ? AND session_id = ?').run(dreamId, sessionId)
    res.json({ favorited: false })
  } else {
    db.prepare('INSERT INTO favorites (dream_id, session_id) VALUES (?, ?)').run(dreamId, sessionId)
    res.json({ favorited: true })
  }
})

router.get('/:id/favorite/check', (req: Request, res: Response) => {
  const db = getDb()
  const dreamId = Number(req.params.id)
  const sessionId = req.headers['x-session-id'] as string || 'anon'
  const existing = db.prepare(
    'SELECT * FROM favorites WHERE dream_id = ? AND session_id = ?'
  ).get(dreamId, sessionId)
  res.json({ favorited: !!existing })
})

export default router
