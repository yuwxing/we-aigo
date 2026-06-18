import { json, aiTemplates } from '../_db'

export async function onRequest(context: any) {
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id' } })
  if (context.request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await context.request.json()
  if (!body.content?.trim()) return json({ error: '内容不能为空' }, 400)

  const text = body.content.toLowerCase()
  const match = aiTemplates.find((t) => t.keywords.some((k) => text.includes(k)))
  if (match) return json({ name: match.name, core_value: match.value, tech_route: match.tech, challenges: match.challenge, timeline: match.timeline })

  return json({
    name: body.content.slice(0, 20) + '…',
    core_value: '为人类创造全新可能性',
    tech_route: '前沿技术集成 + 跨学科创新',
    challenges: '技术成熟度不足，初始投资巨大',
    timeline: '10-20年',
  })
}
