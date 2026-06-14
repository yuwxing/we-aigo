import { XMLParser } from 'fast-xml-parser'

interface NewsItem {
  title: string
  tag: string
  time: string
  category: string
}

const sources = [
  { url: 'https://hnrss.org/frontpage', category: 'ai', tag: '🤖 AI' },
  { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'space', tag: '🚀 航天' },
  { url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science', tag: '🔬 科学' },
  { url: 'https://techcrunch.com/feed/', category: 'ai', tag: '🤖 AI' },
  { url: 'https://www.space.com/feeds/all', category: 'space', tag: '🚀 航天' },
]

const fallback: NewsItem[] = [
  { title: 'SpaceX Starship 完成新一轮静态点火测试', tag: '🚀 航天', time: '2分钟前', category: 'space' },
  { title: 'NASA 宣布月球基地选址方案', tag: '🚀 航天', time: '1小时前', category: 'space' },
  { title: 'OpenAI 发布新一代推理模型', tag: '🤖 AI', time: '3小时前', category: 'ai' },
  { title: 'MIT 研发室温超导材料引发热议', tag: '🔬 科学', time: '6小时前', category: 'science' },
  { title: '量子计算机首次完成药物分子模拟', tag: '🔬 科学', time: '12小时前', category: 'science' },
  { title: 'Google DeepMind 在蛋白质预测上取得新突破', tag: '🧬 科学', time: '1天前', category: 'science' },
  { title: '中国航天启动新一代载人登月系统设计', tag: '🚀 航天', time: '2天前', category: 'space' },
  { title: 'Meta 发布开源 AI 模型 Llama 4', tag: '🤖 AI', time: '2天前', category: 'ai' },
  { title: 'Apple 正开发 AI 驱动的健康监测平台', tag: '🍎 AI', time: '3天前', category: 'ai' },
  { title: '全球首座商用核聚变反应堆获批建设', tag: '⚡ 能源', time: '3天前', category: 'science' },
]

const parser = new XMLParser({ ignoreAttributes: false })

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  if (diff < 0) return '刚刚'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

function extractItems(data: any, category: string, tag: string): NewsItem[] {
  try {
    let items = data?.rss?.channel?.item || data?.feed?.entry || []
    if (!items) return []
    if (!Array.isArray(items)) items = [items]
    return items.slice(0, 8).map((item: any) => {
      const title = item?.title?.trim?.() || item?.['title'] || ''
      if (!title) return null
      const rawDate = item?.pubDate || item?.updated || item?.published || item?.['dc:date']
      const date = rawDate ? new Date(rawDate) : new Date()
      return { title, tag, time: timeAgo(date), category }
    }).filter(Boolean) as NewsItem[]
  } catch {
    return []
  }
}

export async function onRequest(context: any) {
  const cache = caches.default
  const cacheKey = new Request('https://we-aigo/api/news-cache')

  try {
    const cached = await cache.match(cacheKey)
    if (cached) return new Response(await cached.text(), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' }
    })
  } catch {}

  const results = await Promise.allSettled(
    sources.map(src =>
      fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; we-aigo-bot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
        .then(r => r.text())
        .then(xml => extractItems(parser.parse(xml), src.category, src.tag))
    )
  )

  let news: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') news.push(...r.value)
  }

  if (news.length === 0) {
    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  news = news.slice(0, 40)

  const resp = new Response(JSON.stringify(news), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' }
  })
  try { await cache.put(cacheKey, resp.clone()) } catch {}
  return resp
}
