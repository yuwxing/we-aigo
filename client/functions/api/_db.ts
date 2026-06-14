export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

export async function initDB(DB: any) {
  const row = await DB.prepare("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='dreams'").first()
  if (row?.cnt > 0) return

  await DB.prepare("CREATE TABLE IF NOT EXISTS dreams (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, nickname TEXT DEFAULT '匿名', likes INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run()
  await DB.prepare("CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY CHECK(id = 1), dreams_total INTEGER DEFAULT 12438, projects_incubating INTEGER DEFAULT 1284, teams_collaborating INTEGER DEFAULT 328, products_realized INTEGER DEFAULT 17)").run()
  await DB.prepare("CREATE TABLE IF NOT EXISTS co_creates (id INTEGER PRIMARY KEY AUTOINCREMENT, dream_id INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('value', 'problem', 'solution')), content TEXT NOT NULL, author TEXT DEFAULT '匿名', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run()
  await DB.prepare("CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, dream_id INTEGER NOT NULL, session_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(dream_id, session_id))").run()
  await DB.prepare("INSERT OR IGNORE INTO stats (id, dreams_total, projects_incubating, teams_collaborating, products_realized) VALUES (1, 12438, 1284, 328, 17)").run()

  const { count } = await DB.prepare('SELECT COUNT(*) as count FROM dreams').first()
  if (count === 0) {
    const seeds = [
      ['我想创造一个能净化海洋的机器人，让大海重回蓝色', '海洋卫士'],
      ['发明一种可以治愈所有癌症的药丸', '未来医生'],
      ['建造一座漂浮在太空的城市，让人类成为星际文明', '星辰'],
      ['创造一个AI助手，让每个人都能获得最好的教育和医疗', '理想主义者'],
      ['设计一款能翻译动物语言的设备，和猫猫对话', '猫奴'],
      ['把整个互联网存档，让千年后的人类还能看到今天的我们', '历史守护者'],
    ]
    for (const [c, n] of seeds) {
      await DB.prepare('INSERT INTO dreams (content, nickname, likes) VALUES (?, ?, ?)').bind(c, n, Math.floor(Math.random() * 50)).run()
    }
  }
}

export const aiTemplates = [
  { keywords: ['海洋', '海', '水', '净化', '蓝色', '大河', '河流'], name: '「蔚蓝重生」海洋生态净化系统', value: '恢复海洋生态平衡，解决塑料污染和富营养化问题', tech: '仿生过滤机器人 + 微生物降解反应器 + 卫星监测网格', challenge: '深海高压环境下的设备耐久性，大规模部署的能源供给', timeline: '5-8年' },
  { keywords: ['月球', '月亮', '基地', '图书馆', '月', '广寒'], name: '「月宫」月球基地图书馆', value: '在月球建立人类首个地外知识中心，保护地球文明火种', tech: '月球洞穴改造 + 核聚变能源 + 3D打印月壤建筑', challenge: '月面极端温差，辐射防护，物资运输成本高昂', timeline: '15-20年' },
  { keywords: ['漂浮', '太空', '城市', '星际', '火星', '宇宙', '空间站', '轨道'], name: '「星环」轨道栖息地计划', value: '人类成为多行星物种，缓解地球资源压力', tech: '封闭生态系统 + 空间电梯 + 3D打印月壤建筑', challenge: '辐射防护成本高，微重力影响，初期投资巨大', timeline: '20-30年' },
  { keywords: ['AI', '人工智能', '助手', '智能', '教育', '医疗', '医生', '算法'], name: '「慧心」全民AI赋能平台', value: '消除教育和医疗资源不平等，个性化学习和健康管理', tech: '大语言模型 + 多模态诊断 + 联邦学习', challenge: '医疗AI监管审批，偏远地区网络覆盖', timeline: '3-5年' },
  { keywords: ['癌症', '药', '治愈', '疾病', '健康', '治疗', '疫苗'], name: '「生命密钥」精准医疗计划', value: '攻克癌症等重大疾病，延长人类健康寿命', tech: 'mRNA技术 + CAR-T细胞治疗 + CRISPR基因编辑', challenge: '治疗成本普及，规模化生产，长期安全验证', timeline: '10-15年' },
  { keywords: ['动物', '翻译', '语言', '猫', '狗', '对话', '宠物'], name: '「灵语」跨物种沟通系统', value: '理解动物需求和情感，改善动物福利', tech: '声纹分析 + 行为AI模型 + 可穿戴传感器', challenge: '动物语言缺乏语法结构，物种差异巨大', timeline: '8-12年' },
  { keywords: ['互联网', '存档', '数据', '保存', '历史', '信息', '数字化'], name: '「永恒之书」人类文明档案馆', value: '保存人类数字文明，让后人了解我们的时代', tech: '蓝光岩盐晶体存储 + 分布式节点 + AI编目', challenge: '存储格式兼容性，数据筛选与去重', timeline: '5-10年' },
  { keywords: ['二氧化碳', '碳', '气候', '环境', '地球', '温室', '污染'], name: '「呼吸」大气碳捕获网络', value: '逆转气候变化，为后代留下宜居地球', tech: '直接空气捕获阵列 + 矿化封存 + 太阳能驱动', challenge: '每吨成本超100美元，大规模部署土地占用', timeline: '5-10年' },
  { keywords: ['高铁', '交通', '旅行', '速度', '管道', '地铁', '出行'], name: '「深渊快线」跨洋真空管道', value: '改变全球交通格局，实现洲际通勤', tech: '真空管道 + 磁悬浮 + 深海抗震隧道', challenge: '深海施工技术未成熟，跨国协调难度大', timeline: '15-20年' },
  { keywords: ['梦境', '梦', '录', '电影', '记忆', '意识', '睡眠'], name: '「梦境映像」意识记录仪', value: '探索潜意识，为心理治疗提供新工具', tech: 'fMRI脑成像 + 生成式AI重建 + 神经解码', challenge: '内容高度个人化，脑机接口伦理争议', timeline: '8-15年' },
  { keywords: ['永生', '寿命', '不死', '生命', '衰老', '长寿'], name: '「生命延续」长寿工程', value: '消除对衰老和死亡的恐惧', tech: '端粒修复酶 + 细胞重编程 + 纳米机器人', challenge: '伦理争议大，技术路线不确定', timeline: '20-50年' },
  { keywords: ['农业', '食物', '粮食', '种植', '饥饿', '农田', '蔬菜'], name: '「未来农场」垂直农业计划', value: '解决全球粮食危机，让每个人都能吃饱', tech: '垂直水培 + LED光合调控 + 自动化收割', challenge: '初期建设成本高，作物多样性受限', timeline: '3-8年' },
  { keywords: ['能源', '电力', '电池', '充电', '发电', '太阳能', '风力'], name: '「永恒能源」清洁能源网络', value: '告别化石燃料，实现零碳能源自由', tech: '核聚变 + 固态电池 + 超导电网', challenge: '核聚变商业化的不确定性，储能密度瓶颈', timeline: '10-20年' },
  { keywords: ['机器人', '机械', '自动化', '工厂', '制造', '机器'], name: '「智造工厂」全自动化生产', value: '释放人力，让机器做重复劳动，人类做创造', tech: '协作机器人 + AI质检 + 数字孪生', challenge: '工人再培训，中小企业改造成本', timeline: '5-10年' },
  { keywords: ['学校', '学习', '知识', '老师', '上课', '学生', '图书馆'], name: '「全知学院」个性化教育平台', value: '每个孩子都能按自己的节奏和天赋学习', tech: '自适应学习引擎 + VR课堂 + 知识图谱', challenge: '教育体制变革阻力，城乡数字鸿沟', timeline: '5-12年' },
  { keywords: ['房子', '建筑', '城市', '社区', '住房', '大楼', '家园'], name: '「理想居所」智能生态社区', value: '让每个人都有舒适、绿色、可负担的住所', tech: '模块化3D打印建筑 + 智能家居 + 共享空间', challenge: '土地政策限制，大规模推广成本', timeline: '8-15年' },
  { keywords: ['飞机', '飞行', '航空', '无人机', '空中', '翅膀'], name: '「苍穹通途」城市空中交通', value: '让天空成为新的通勤网络', tech: 'eVTOL飞行器 + 空管AI调度 + 垂直起降场', challenge: '航安全标准未成熟，噪音控制', timeline: '5-10年' },
  { keywords: ['虚拟', 'VR', 'AR', '元宇宙', '数字', '沉浸', '模拟'], name: '「平行世界」数字生活空间', value: '打破物理限制，让人们自由创造和体验', tech: '全感官VR + 数字孪生 + 区块链身份', challenge: '沉浸式设备重量，真实的社交连接感缺失', timeline: '5-15年' },
  { keywords: ['森林', '植树', '绿化', '生态', '自然', '树木', '植物'], name: '「绿色方舟」全球森林计划', value: '恢复地球生态系统，重建人与自然和谐', tech: '无人机播种 + 基因优化树种 + AI生态监控', challenge: '非法砍伐监管，大规模种植后的生态平衡', timeline: '10-20年' },
  { keywords: ['音乐', '乐器', '声音', '旋律', '听觉', '歌', '谱'], name: '「天籁引擎」AI音乐创作平台', value: '让每个人都能创作属于自己的音乐', tech: '生成式音频模型 + 实时协作 + 智能混音', challenge: 'AI作品的版权界定，情感表达的深度', timeline: '2-5年' },
  { keywords: ['艺术', '绘画', '设计', '创意', '美学', '画', '创作'], name: '「无限画布」AI艺术共创空间', value: '消除技术门槛，让创意自由流淌', tech: '扩散模型 + 4D创作工具 + 实时渲染', challenge: '艺术品价值认同，AI与传统艺术的融合', timeline: '2-5年' },
  { keywords: ['通信', '网络', '信号', '连接', '5G', '联网'], name: '「万物互联」全域通信网络', value: '连接地球每一个角落，消除信息孤岛', tech: '卫星互联网 + 量子通信 + 地面Mesh网络', challenge: '偏远地区部署成本，频谱资源分配', timeline: '5-12年' },
  { keywords: ['垃圾', '回收', '废物', '环保', '循环', '再利用'], name: '「净环系统」循环经济平台', value: '让垃圾变资源，实现零废弃社会', tech: 'AI分拣机器人 + 化学回收 + 材料数据库', challenge: '回收成本高于原料成本，消费端分类意识', timeline: '5-10年' },
  { keywords: ['好友', '社交', '社区', '陪伴', '孤独', '朋友'], name: '「心灵驿站」情感连接平台', value: '对抗孤独，让每个人都有被理解和陪伴的感觉', tech: 'AI情感分析 + 兴趣图谱 + 线下活动引擎', challenge: '隐私与数据安全，真实连接的不可替代性', timeline: '3-7年' },
  { keywords: ['光明', '黑暗', '光', '照明', '能量', '阳光', '发光'], name: '「追光计划」生物发光城市', value: '用生物光替代电力照明，让城市在夜晚也充满生机', tech: '基因工程发光植物 + 生物反应器路障 + 光能储存', challenge: '发光亮度不足，大规模培养的生态风险', timeline: '8-15年' },
  { keywords: ['地下', '洞穴', '地心', '地下城', '隧道', '挖掘'], name: '「地心探索」地下空间开发', value: '向地下拓展人类生存空间', tech: '大型盾构机 + 地下生态循环 + 地热利用', challenge: '地下施工成本高，地质不确定性', timeline: '15-25年' },
  { keywords: ['太阳', '恒星', '阳光', '光合', '日', '日照'], name: '「夸父」人造恒星计划', value: '模拟太阳核聚变，为地球提供取之不尽的清洁能源', tech: '托卡马克装置 + 激光约束聚变 + 超导磁体', challenge: '等离子体稳定控制，Q值突破', timeline: '20-40年' },
  { keywords: ['老人', '养老', '老年', '退休', '关爱', '陪伴'], name: '「夕阳红」老年关怀计划', value: '让每位老人都能体面、快乐、有尊严地老去', tech: '陪伴机器人 + 远程医疗 + 适老化智能家居', challenge: '老年人对新技术的接受度，护工短缺', timeline: '5-10年' },
]
