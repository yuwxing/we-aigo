export interface Dream {
  id: number
  content: string
  nickname: string
  likes: number
  created_at: string
}

export interface Stats {
  dreams_total: number
  projects_incubating: number
  teams_collaborating: number
  products_realized: number
  dreams_actual: number
}

export interface CoCreate {
  id: number
  dream_id: number
  type: 'value' | 'problem' | 'solution'
  content: string
  author: string
  created_at: string
}

export interface AIExpand {
  name: string
  core_value: string
  tech_route: string
  challenges: string
  timeline: string
}

const BASE = '/api/dreams'

function sessionId(): string {
  let id = sessionStorage.getItem('weaigo_session')
  if (!id) {
    id = Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('weaigo_session', id)
  }
  return id
}

function headers(): Record<string, string> {
  return { 'X-Session-Id': sessionId(), 'Content-Type': 'application/json' }
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/stats`)
  return res.json()
}

export async function fetchHot(): Promise<Dream[]> {
  const res = await fetch(`${BASE}/hot`)
  return res.json()
}

export async function fetchLatest(): Promise<Dream[]> {
  const res = await fetch(`${BASE}/latest`)
  return res.json()
}

export async function fetchRandom(): Promise<Dream[]> {
  const res = await fetch(`${BASE}/random`)
  return res.json()
}

export async function publishDream(content: string, nickname: string): Promise<Dream> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, nickname }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '发布失败')
  }
  return res.json()
}

export async function likeDream(id: number): Promise<Dream> {
  const res = await fetch(`${BASE}/${id}/like`, { method: 'POST' })
  if (!res.ok) throw new Error('点赞失败')
  return res.json()
}

export async function fetchCoCreates(dreamId: number): Promise<CoCreate[]> {
  const res = await fetch(`${BASE}/${dreamId}/co-creates`)
  return res.json()
}

export async function addCoCreate(dreamId: number, type: CoCreate['type'], content: string, author: string): Promise<CoCreate> {
  const res = await fetch(`${BASE}/${dreamId}/co-creates`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ type, content, author }),
  })
  if (!res.ok) throw new Error('添加失败')
  return res.json()
}

export async function toggleFavorite(dreamId: number): Promise<{ favorited: boolean }> {
  const res = await fetch(`${BASE}/${dreamId}/favorite`, {
    method: 'POST',
    headers: headers(),
  })
  return res.json()
}

export async function checkFavorite(dreamId: number): Promise<{ favorited: boolean }> {
  const res = await fetch(`${BASE}/${dreamId}/favorite/check`, {
    headers: headers(),
  })
  return res.json()
}

export interface NewsItem {
  title: string; tag: string; time: string; category: string
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch('/api/news')
  return res.json()
}

export async function aiExpand(content: string): Promise<AIExpand> {
  const res = await fetch('/api/ai/expand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('AI 扩展失败')
  return res.json()
}
