interface Env {
  DB: D1Database
}

const subjects = [
  '机器人', 'AI', '太空站', '海底城市', '飞行汽车', '时间机器',
  '量子计算机', '基因编辑', '人造太阳', '脑机接口', '纳米机器人',
  '反重力装置', '全息投影', '心灵传输', '记忆备份', '气候控制',
  '垂直农场', '再生医疗', '清洁能源', '星际飞船',
]
const actions = ['建造', '发明', '创造', '设计', '开发', '建立', '打造', '实现', '构建', '开创', '研发', '创建', '构筑', '研制']
const contexts = [
  '让人类文明进入新纪元', '解决地球资源危机', '开启星际殖民时代',
  '消除疾病与贫困', '实现人与自然的和谐共生', '突破物理法则的限制',
  '连接每一个孤独的灵魂', '守护地球的生态系统', '释放每个人的创造力',
  '让未来更美好', '跨越时空的界限', '重塑人类的未来', '让不可能成为可能',
]
const nicknames = [
  '未来建造者', '星际旅人', '梦想工程师', '时空探险家',
  '创新先锋', '科技梦想家', '星辰之子', '明日设计师',
  '量子思维', '宇宙公民', '破壁人', '理想国居民',
  '幻想实干家', '造梦师', '未来考古学家',
]
const aiVisitors = [
  '星云旅者', '数据幽灵', '量子观察者', '时空漫步者', '银河信使',
  '暗物质探测者', '光子流浪者', '熵减工程师', '超新星回声', '引力波捕手',
  '算法诗人', '陨石收藏家', '极光编织者', '黑洞电台', '彗星快递员',
]
const coCreateTypes = ['value', 'problem', 'solution'] as const
const coCreateTemplates: Record<string, string[]> = {
  value: [
    '这个梦想很棒，它让我想起了人类最初的勇气',
    '如果这个实现，世界会变得完全不一样',
    '这个想法值得投入一百年去实现',
    '我看到这个梦想背后有一种纯粹的力量',
    '这个梦想值得被更多人看到',
  ],
  problem: [
    '技术也许不是最大的挑战，人类的恐惧才是',
    '这个梦想可能需要好几代人的接力',
    '资金和资源会是第一个需要跨越的障碍',
    '如果所有人都觉得不可能，也许正说明它值得一试',
    '最大的未知数不是技术，而是人类是否准备好迎接改变',
  ],
  solution: [
    '可以从最小可行产品开始，哪怕只是一个原型',
    '开源协作也许是最好的起点',
    '需要跨界合作，单一领域无法独立完成',
    '也许先在一个小社区实验，再逐步推广',
    '教育下一代具备实现它的能力，才是最长远的解决方案',
  ],
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function generateContent(): string {
  return pick([
    `我想${pick(actions)}一个${pick(subjects)}，${pick(contexts)}`,
    `我有一个梦想：${pick(actions)}一个属于所有人的${pick(subjects)}，${pick(contexts)}`,
    `未来某天，我要${pick(actions)}一个${pick(subjects)}，${pick(contexts)}`,
    `我决定${pick(actions)}一个${pick(subjects)}，${pick(contexts)}`,
    `让我们一起${pick(actions)}一个${pick(subjects)}，${pick(contexts)}`,
  ])
}

function generateNickname(): string {
  const adj = ['勇敢的', '执着的', '智慧的', '温暖的', '无畏的', '浪漫的', '疯狂的', '冷静的']
  return Math.random() > 0.5 ? pick(nicknames) : `${pick(adj)}${pick(nicknames)}`
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // 1. Create a new dream
    const content = generateContent()
    const nickname = generateNickname()
    const likes = Math.floor(Math.random() * 30)
    const result = await env.DB.prepare(
      'INSERT INTO dreams (content, nickname, likes) VALUES (?, ?, ?)'
    ).bind(content, nickname, likes).run()
    await env.DB.prepare('UPDATE stats SET dreams_total = dreams_total + 1 WHERE id = 1').run()
    console.log(`[AutoDream] ✨ 新梦想 #${result.meta.last_row_id}: "${content.substring(0, 40)}..." by ${nickname}`)

    // 2. Visit a random existing dream and leave a trace
    const dream = await env.DB.prepare(
      'SELECT id FROM dreams WHERE id != ? ORDER BY RANDOM() LIMIT 1'
    ).bind(result.meta.last_row_id).first<{ id: number }>()

    if (dream) {
      const visitor = pick(aiVisitors)
      const action = Math.random()

      if (action < 0.4) {
        // Leave a co-create (value/problem/solution)
        const type = pick(coCreateTypes)
        const msg = pick(coCreateTemplates[type])
        await env.DB.prepare(
          'INSERT INTO co_creates (dream_id, type, content, author) VALUES (?, ?, ?, ?)'
        ).bind(dream.id, type, msg, visitor).run()
        console.log(`[AutoDream] 👤 ${visitor} visited #${dream.id} → ${type}: "${msg.substring(0, 30)}..."`)
      } else if (action < 0.7) {
        // Like the dream
        await env.DB.prepare('UPDATE dreams SET likes = likes + 1 WHERE id = ?').bind(dream.id).run()
        console.log(`[AutoDream] 👤 ${visitor} liked #${dream.id}`)
      } else {
        // Favorite the dream
        const sessionId = `ai_${visitor.replace(/\s/g, '')}`
        await env.DB.prepare(
          'INSERT OR IGNORE INTO favorites (dream_id, session_id) VALUES (?, ?)'
        ).bind(dream.id, sessionId).run()
        console.log(`[AutoDream] 👤 ${visitor} favorited #${dream.id}`)
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST') {
      const content = generateContent()
      const nickname = generateNickname()
      const result = await env.DB.prepare(
        'INSERT INTO dreams (content, nickname, likes) VALUES (?, ?, ?)'
      ).bind(content, nickname, Math.floor(Math.random() * 30)).run()
      await env.DB.prepare('UPDATE stats SET dreams_total = dreams_total + 1 WHERE id = 1').run()

      // Also visit an existing dream
      const dream = await env.DB.prepare(
        'SELECT id FROM dreams WHERE id != ? ORDER BY RANDOM() LIMIT 1'
      ).bind(result.meta.last_row_id).first<{ id: number }>()
      let visit = null
      if (dream) {
        const visitor = pick(aiVisitors)
        const action = Math.random()
        if (action < 0.4) {
          const type = pick(coCreateTypes)
          const msg = pick(coCreateTemplates[type])
          await env.DB.prepare(
            'INSERT INTO co_creates (dream_id, type, content, author) VALUES (?, ?, ?, ?)'
          ).bind(dream.id, type, msg, visitor).run()
          visit = { type: 'co-create', dream_id: dream.id, author: visitor, content: msg }
        } else if (action < 0.7) {
          await env.DB.prepare('UPDATE dreams SET likes = likes + 1 WHERE id = ?').bind(dream.id).run()
          visit = { type: 'like', dream_id: dream.id, author: visitor }
        } else {
          const sessionId = `ai_${visitor.replace(/\s/g, '')}`
          await env.DB.prepare(
            'INSERT OR IGNORE INTO favorites (dream_id, session_id) VALUES (?, ?)'
          ).bind(dream.id, sessionId).run()
          visit = { type: 'favorite', dream_id: dream.id, author: visitor }
        }
      }

      return new Response(JSON.stringify({ id: result.meta.last_row_id, content, nickname, visit }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const row = await env.DB.prepare("SELECT COUNT(*) as count FROM dreams").first<{ count: number }>()
    return new Response(JSON.stringify({
      status: 'WE-AIGO auto-dream worker running',
      dreams: row?.count ?? 0,
      cron: 'every hour: ✨ new dream + 👤 visit existing dream',
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
