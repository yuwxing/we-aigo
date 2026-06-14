import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(__dirname, '..', 'data', 'dreams.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS dreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        nickname TEXT DEFAULT '匿名',
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        dreams_total INTEGER DEFAULT 12438,
        projects_incubating INTEGER DEFAULT 1284,
        teams_collaborating INTEGER DEFAULT 328,
        products_realized INTEGER DEFAULT 17
      )
    `)

    db.exec(`
      INSERT OR IGNORE INTO stats (id, dreams_total, projects_incubating, teams_collaborating, products_realized)
      VALUES (1, 12438, 1284, 328, 17)
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS co_creates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dream_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('value', 'problem', 'solution')),
        content TEXT NOT NULL,
        author TEXT DEFAULT '匿名',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dream_id) REFERENCES dreams(id)
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dream_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dream_id) REFERENCES dreams(id),
        UNIQUE(dream_id, session_id)
      )
    `)

    const row = db.prepare('SELECT COUNT(*) as cnt FROM dreams').get() as any
    if (row.cnt === 0) {
      seed()
    }
  }
  return db
}

function seed() {
  const dreams = [
    ['我想创造一个能净化海洋的机器人，让大海重回蓝色', '海洋卫士'],
    ['发明一种可以治愈所有癌症的药丸', '未来医生'],
    ['建造一座漂浮在太空的城市，让人类成为星际文明', '星辰'],
    ['创造一个AI助手，让每个人都能获得最好的教育和医疗', '理想主义者'],
    ['设计一款能翻译动物语言的设备，和猫猫对话', '猫奴'],
    ['把整个互联网存档，让千年后的人类还能看到今天的我们', '历史守护者'],
    ['开发一个能回收大气中二氧化碳的设备，逆转气候变化', '地球医生'],
    ['建造一条横跨太平洋的超级高铁，上海到洛杉矶2小时', '旅行家'],
    ['制作一个能把梦境录制成电影的装置', '造梦师'],
    ['发明永生技术，让人可以选择自己想要活多久', '哲学家'],
    ['打造人人都能负担得起的私人飞行器，告别堵车', '飞行家'],
    ['创建一个去中心化的全球知识库，让知识完全免费共享', '分享者'],
    ['设计一套可以穿戴的外骨骼，让残疾人重获行走能力', '工程师'],
    ['建立月球基地，开设第一家月球酒店', '太空企业家'],
    ['开发植物神经系统，让植物能告诉我们它们需要什么', '植物学家'],
    ['制造一台时间胶囊，能向后代传递今天的感受和记忆', '诗人'],
    ['创造一个完全沉浸式的全感VR世界', '游戏设计师'],
    ['发明可以100%降解的塑料替代材料', '环保主义者'],
    ['建立全球淡水循环系统，解决干旱地区饮水问题', '水利工程师'],
    ['打造一个AI心理治疗师，24小时在线陪伴每个人', '心理医生'],
  ]

  const insert = db.prepare('INSERT INTO dreams (content, nickname, likes) VALUES (?, ?, ?)')
  const tx = db.transaction(() => {
    for (const [content, nickname] of dreams) {
      insert.run(content, nickname, Math.floor(Math.random() * 50))
    }
  })
  tx()
}

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
}
