import { Router, Request, Response } from 'express'
import { getDb } from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string || ''
  if (!sessionId) { res.json([]); return }
  const db = getDb()
  const notes = db.prepare('SELECT * FROM notes WHERE session_id = ? ORDER BY created_at DESC').all(sessionId)
  res.json(notes)
})

router.post('/', (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string || ''
  if (!sessionId) { res.status(400).json({ error: 'session required' }); return }
  const { text, cat } = req.body
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: '内容不能为空' })
    return
  }
  const db = getDb()
  const trimmed = text.trim().slice(0, 1000)
  const category = cat && typeof cat === 'string' ? cat.trim().slice(0, 20) || '其他' : '其他'
  const result = db.prepare('INSERT INTO notes (session_id, text, cat) VALUES (?, ?, ?)').run(sessionId, trimmed, category)
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(note)
})

router.delete('/:id', (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string || ''
  if (!sessionId) { res.status(400).json({ error: 'session required' }); return }
  const db = getDb()
  const id = Number(req.params.id)
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND session_id = ?').get(id, sessionId) as any
  if (!note) { res.status(404).json({ error: '笔记不存在' }); return }
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
