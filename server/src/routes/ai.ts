import { Router, Request, Response } from 'express'

const router = Router()

const templates: Array<{
  keywords: string[]
  name: string
  value: string
  tech: string
  challenge: string
  timeline: string
}> = [
  {
    keywords: ['海洋', '海', '水', '净化', '蓝色'],
    name: '「蔚蓝重生」海洋生态净化系统',
    value: '恢复海洋生态平衡，解决塑料污染和富营养化问题，让珊瑚礁重新繁盛，渔业资源可持续',
    tech: '仿生过滤机器人 + 微生物降解反应器 + 卫星监测网格',
    challenge: '深海高压环境下的设备耐久性，大规模部署的能源供给，国际水域治理的协调机制',
    timeline: '5-8年',
  },
  {
    keywords: ['月球', '月亮', '基地', '图书馆'],
    name: '「月宫」月球基地图书馆',
    value: '在月球建立人类首个地外知识中心，保护地球文明火种，开展深空科学研究',
    tech: '月球洞穴改造 + 核聚变能源 + 3D打印月壤建筑 + 地月量子通信链路',
    challenge: '月面极端温差(-180°C到120°C)，辐射防护，物资运输成本高达每公斤百万美元',
    timeline: '15-20年',
  },
  {
    keywords: ['漂浮', '太空', '城市', '星际', '火星', '宇宙'],
    name: '「星环」轨道栖息地计划',
    value: '人类成为多行星物种，缓解地球资源压力，开辟全新的科学研究与产业空间',
    tech: '封闭生态系统 + 空间电梯 + 3D打印月壤建筑 + 人工重力旋转环',
    challenge: '辐射防护成本极高，长期微重力对人体影响未完全解决，初期建设需投入数万亿美元',
    timeline: '20-30年',
  },
  {
    keywords: ['AI', '人工智能', '助手', '智能', '教育', '医疗', '医生'],
    name: '「慧心」全民AI赋能平台',
    value: '消除教育和医疗资源的不平等，每个人都能获得个性化学习和健康管理',
    tech: '大语言模型 + 多模态诊断 + 个性化学习路径算法 + 联邦学习保护隐私',
    challenge: '医疗AI的监管审批，偏远地区的网络覆盖，数据隐私与安全',
    timeline: '3-5年',
  },
  {
    keywords: ['癌症', '药', '治愈', '疾病', '健康', '医疗'],
    name: '「生命密钥」精准医疗计划',
    value: '攻克癌症等重大疾病，大幅延长人类健康寿命，减轻家庭和社会负担',
    tech: 'mRNA技术 + CAR-T细胞治疗 + CRISPR基因编辑 + AI药物筛选',
    challenge: '治疗成本从研发到普及的过渡，个体化治疗的规模化生产，长期安全性验证',
    timeline: '10-15年',
  },
  {
    keywords: ['动物', '翻译', '语言', '猫', '狗', '对话', '交流'],
    name: '「灵语」跨物种沟通系统',
    value: '理解动物需求和情感，改善动物福利，揭示动物认知的奥秘',
    tech: '声纹分析 + 行为AI模型 + 可穿戴传感器 + 高频声波采集阵列',
    challenge: '动物"语言"缺乏语法结构定义，不同物种差异巨大，验证理解准确度困难',
    timeline: '8-12年',
  },
  {
    keywords: ['互联网', '存档', '数据', '保存', '历史', '资料'],
    name: '「永恒之书」人类文明档案馆',
    value: '保存人类数字文明，让千年后的人类或文明能了解我们的时代',
    tech: '蓝光岩盐晶体存储 + 分布式节点网络 + AI自动编目索引 + 量子纠错码',
    challenge: '存储格式的长期兼容性，海量数据的筛选与去重，维持组织的永久运营',
    timeline: '5-10年',
  },
  {
    keywords: ['二氧化碳', '碳', '气候', '环境', '地球', '温度', '温室'],
    name: '「呼吸」大气碳捕获网络',
    value: '逆转气候变化，拯救冰川和生态系统，为子孙后代留下宜居地球',
    tech: '直接空气捕获（DAC）阵列 + 矿化封存 + 太阳能驱动 + 碳交易区块链',
    challenge: '目前每吨碳捕获成本超过100美元，大规模部署的土地占用，封存安全性长期验证',
    timeline: '5-10年',
  },
  {
    keywords: ['高铁', '交通', '旅行', '速度', '管道', '运输'],
    name: '「深渊快线」跨洋真空管道',
    value: '改变全球交通格局，实现洲际通勤，促进文化交流和经济融合',
    tech: '真空管道 + 磁悬浮 + 深海抗震隧道 + 太阳能供电系统',
    challenge: '深海管道施工技术尚未成熟，跨国政协调难度极大，紧急情况疏散体系设计',
    timeline: '15-20年',
  },
  {
    keywords: ['梦境', '梦', '录', '电影', '记忆', '制作'],
    name: '「梦境映像」意识记录仪',
    value: '探索人类潜意识的无限可能，为心理治疗提供全新工具，创造全新艺术形式',
    tech: 'fMRI高分辨率脑成像 + 生成式AI重建 + 神经信号解码算法',
    challenge: '梦境内容具有高度个人化和非逻辑性，脑机接口的伦理争议，隐私保护',
    timeline: '8-15年',
  },
  {
    keywords: ['永生', '寿命', '不死', '生命', '活'],
    name: '「生命延续」长寿工程',
    value: '消除对衰老和死亡的恐惧，让人类可以自主选择生命长度',
    tech: '端粒修复酶 + 细胞重编程 + 纳米修复机器人 + 脑机云备份',
    challenge: '伦理争议巨大（社会公平、资源分配），技术路线不确定，意识上传问题未解决',
    timeline: '20-50年',
  },
]

router.post('/expand', (req: Request, res: Response) => {
  const { content } = req.body
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: '内容不能为空' })
    return
  }

  const text = content.toLowerCase()

  const match = templates.find((t) =>
    t.keywords.some((k) => text.includes(k))
  )

  if (match) {
    res.json({
      name: match.name,
      core_value: match.value,
      tech_route: match.tech,
      challenges: match.challenge,
      timeline: match.timeline,
    })
    return
  }

  res.json({
    name: content.slice(0, 20) + '…',
    core_value: '为人类创造全新可能性，推动社会进步，改善生活质量',
    tech_route: '前沿技术集成 + 跨学科协同创新 + 持续迭代优化',
    challenges: '技术成熟度不足，初始投资巨大，社会接受度需要时间培养',
    timeline: '10-20年',
  })
})

export default router
