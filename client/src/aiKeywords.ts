export interface BlueprintInfo {
  name: string
  icon: string
}

const templates: { keywords: string[]; name: string; icon: string }[] = [
  { keywords: ['海洋', '海', '水', '净化', '蓝色', '大河', '河流'], name: '蔚蓝重生', icon: '🌊' },
  { keywords: ['月球', '月亮', '基地', '图书馆', '月', '广寒'], name: '月宫', icon: '🌙' },
  { keywords: ['漂浮', '太空', '城市', '星际', '火星', '宇宙', '空间站', '轨道'], name: '星环', icon: '🪐' },
  { keywords: ['AI', '人工智能', '助手', '智能', '教育', '医疗', '医生', '算法'], name: '慧心', icon: '🧠' },
  { keywords: ['癌症', '药', '治愈', '疾病', '健康', '治疗', '疫苗'], name: '生命密钥', icon: '🧬' },
  { keywords: ['动物', '翻译', '语言', '猫', '狗', '对话', '宠物'], name: '灵语', icon: '🐾' },
  { keywords: ['互联网', '存档', '数据', '保存', '历史', '信息', '数字化'], name: '永恒之书', icon: '📚' },
  { keywords: ['二氧化碳', '碳', '气候', '环境', '地球', '温室', '污染'], name: '呼吸', icon: '🌍' },
  { keywords: ['高铁', '交通', '旅行', '速度', '管道', '地铁', '出行'], name: '深渊快线', icon: '🚄' },
  { keywords: ['梦境', '梦', '录', '电影', '记忆', '意识', '睡眠'], name: '梦境映像', icon: '💭' },
  { keywords: ['永生', '寿命', '不死', '生命', '衰老', '长寿'], name: '生命延续', icon: '♾️' },
  { keywords: ['农业', '食物', '粮食', '种植', '饥饿', '农田', '蔬菜'], name: '未来农场', icon: '🌾' },
  { keywords: ['能源', '电力', '电池', '充电', '发电', '太阳能', '风力'], name: '永恒能源', icon: '⚡' },
  { keywords: ['机器人', '机械', '自动化', '工厂', '制造', '机器'], name: '智造工厂', icon: '🏭' },
  { keywords: ['学校', '学习', '知识', '老师', '上课', '学生', '图书馆'], name: '全知学院', icon: '🎓' },
  { keywords: ['房子', '建筑', '城市', '社区', '住房', '大楼', '家园'], name: '理想居所', icon: '🏠' },
  { keywords: ['飞机', '飞行', '航空', '无人机', '空中', '翅膀'], name: '苍穹通途', icon: '✈️' },
  { keywords: ['虚拟', 'VR', 'AR', '元宇宙', '数字', '沉浸', '模拟'], name: '平行世界', icon: '🕶️' },
  { keywords: ['森林', '植树', '绿化', '生态', '自然', '树木', '植物'], name: '绿色方舟', icon: '🌳' },
  { keywords: ['音乐', '乐器', '声音', '旋律', '听觉', '歌', '谱'], name: '天籁引擎', icon: '🎵' },
  { keywords: ['艺术', '绘画', '设计', '创意', '美学', '画', '创作'], name: '无限画布', icon: '🎨' },
  { keywords: ['通信', '网络', '信号', '连接', '5G', '联网'], name: '万物互联', icon: '📡' },
  { keywords: ['垃圾', '回收', '废物', '环保', '循环', '再利用'], name: '净环系统', icon: '♻️' },
  { keywords: ['好友', '社交', '社区', '陪伴', '孤独', '朋友'], name: '心灵驿站', icon: '💜' },
  { keywords: ['光明', '黑暗', '光', '照明', '能量', '阳光', '发光'], name: '追光计划', icon: '☀️' },
  { keywords: ['地下', '洞穴', '地心', '地下城', '隧道', '挖掘'], name: '地心探索', icon: '⛰️' },
  { keywords: ['太阳', '恒星', '阳光', '光合', '日', '日照'], name: '夸父', icon: '☀️' },
  { keywords: ['老人', '养老', '老年', '退休', '关爱', '陪伴'], name: '夕阳红', icon: '👴' },
]

export function matchBlueprint(content: string): BlueprintInfo | null {
  for (const t of templates) {
    for (const kw of t.keywords) {
      if (content.includes(kw)) return { name: t.name, icon: t.icon }
    }
  }
  return null
}
