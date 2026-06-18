import { Router, Request, Response } from 'express'

const router = Router()

// Bilingual news items (Chinese + English)
const NEWS_POOL: Array<{ title_cn: string; title_en: string; tag_cn: string; tag_en: string; category: string }> = [
  { title_cn: 'OpenAI 发布 GPT-5，推理能力再次飞跃', title_en: 'OpenAI Releases GPT-5 with Breakthrough Reasoning', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: 'SpaceX 星舰第五飞成功着陆', title_en: 'SpaceX Starship Lands Successfully on Fifth Flight', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '科学家发现新型超导材料', title_en: 'Scientists Discover New Superconducting Material', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: '中国空间站完成第六批科学实验', title_en: 'China Space Station Completes Sixth Batch of Experiments', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '全球首款通用 AI Agent 正式发布', title_en: 'World\'s First General-Purpose AI Agent Launched', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '量子计算里程碑：1000 量子比特芯片问世', title_en: 'Milestone: 1000-Qubit Quantum Chip Unveiled', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: '脑机接口帮助瘫痪患者重新行走', title_en: 'Brain-Computer Interface Helps Paralyzed Patient Walk Again', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: 'NASA 宣布 2040 年载人火星计划', title_en: 'NASA Announces 2040 Crewed Mars Mission', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '合成生物学创造出首个完全人工基因组', title_en: 'Synthetic Biology Creates First Fully Artificial Genome', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: 'AI 辅助设计的新一代疫苗进入临床试验', title_en: 'AI-Designed Next-Gen Vaccine Enters Clinical Trials', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '马斯克宣布 Neuralink 人体实验取得突破', title_en: 'Musk Announces Neuralink Human Trial Breakthrough', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '全球首个太空太阳能电站成功并网', title_en: 'World\'s First Space Solar Power Station Goes Online', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: 'CRISPR 基因编辑治愈遗传性失明', title_en: 'CRISPR Gene Editing Cures Hereditary Blindness', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: '无人驾驶出租车在 20 个城市全面运营', title_en: 'Robotaxis Launch Full Operations in 20 Cities', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '月球基地 3D 打印居住舱完成组装', title_en: '3D-Printed Lunar Base Habitat Completed', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '新型核聚变装置实现 10 分钟稳态运行', title_en: 'New Fusion Reactor Achieves 10-Minute Steady State', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: '深度学习破解蛋白质折叠全部模式', title_en: 'Deep Learning Decodes All Protein Folding Patterns', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '国际空间站迎来首批商业旅游团', title_en: 'ISS Welcomes First Commercial Tourist Group', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '全球首个室温超导材料通过复现验证', title_en: 'First Room-Temperature Superconductor Replication Verified', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: 'AI 音乐创作平台生成专辑登顶排行榜', title_en: 'AI Music Platform\'s Album Tops Charts', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '火星样本返回任务成功带回岩石样本', title_en: 'Mars Sample Return Mission Successfully Returns Rock Samples', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '新型电池技术实现 1000 公里电动车续航', title_en: 'New Battery Tech Enables 1000km EV Range', tag_cn: '科学', tag_en: 'Science', category: 'science' },
  { title_cn: 'OpenAI 开放全模态 API 供开发者使用', title_en: 'OpenAI Opens Full-Modal API to Developers', tag_cn: 'AI', tag_en: 'AI', category: 'ai' },
  { title_cn: '太空电梯原材料取得突破性进展', title_en: 'Space Elevator Material Breakthrough Achieved', tag_cn: '航天', tag_en: 'Space', category: 'space' },
  { title_cn: '神经形态芯片能效达到传统 GPU 的 100 倍', title_en: 'Neuromorphic Chip 100x More Efficient Than Traditional GPUs', tag_cn: '科学', tag_en: 'Science', category: 'science' },
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getDateSeed(): number {
  const now = new Date()
  // Reset at 6 AM Beijing time (UTC+8) each day
  const utcHours = now.getUTCHours()
  const utcDay = now.getUTCDate()
  // Beijing 6 AM = UTC 22:00 previous day
  const beijingHour = (utcHours + 8) % 24
  const dayOffset = beijingHour < 6 ? 1 : 0
  const seedDate = new Date(now)
  seedDate.setUTCDate(utcDay - dayOffset)
  return seedDate.getUTCFullYear() * 10000 + (seedDate.getUTCMonth() + 1) * 100 + seedDate.getUTCDate()
}

router.get('/', (_req: Request, res: Response) => {
  const seed = getDateSeed()
  const itemsPerCategory = 4

  const categories = ['ai', 'space', 'science']
  const result: Array<{ title: string; titleCn: string; tag: string; time: string; category: string }> = []

  categories.forEach(cat => {
    const pool = NEWS_POOL.filter(n => n.category === cat)
    for (let i = 0; i < itemsPerCategory; i++) {
      const idx = Math.floor(seededRandom(seed + categories.indexOf(cat) * 100 + i) * pool.length)
      const item = pool[idx]
      result.push({
        title: item.title_cn,
        titleCn: item.title_en,
        tag: item.tag_cn,
        time: '今日更新',
        category: item.category,
      })
    }
  })

  // Shuffle the combined results deterministically
  const shuffled = result.sort((a, b) => {
    const aIdx = result.indexOf(a)
    const bIdx = result.indexOf(b)
    return seededRandom(seed + aIdx) - seededRandom(seed + bIdx)
  })

  res.json(shuffled)
})

export default router
