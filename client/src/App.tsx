import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchHot, fetchLatest, fetchRandom, publishDream, likeDream, type Dream } from './api'
import DreamCard from './components/DreamCard'
import DreamForm from './components/DreamForm'
import Universe from './components/Universe'

type Section = 'hot' | 'latest' | 'random' | 'world'

interface NewsItem {
  title: string; tag: string; time: string; category: string
}

const newsData: NewsItem[] = [
  { title: 'SpaceX Starship 完成新一轮静态点火测试', tag: '🚀 航天', time: '2分钟前', category: 'space' },
  { title: 'OpenAI 内部测试新一代推理增强模型', tag: '🤖 AI', time: '18分钟前', category: 'ai' },
  { title: 'Google DeepMind 在蛋白质预测上取得新突破', tag: '🧬 科学', time: '1小时前', category: 'ai' },
  { title: '中国航天启动新一代载人登月系统设计', tag: '🚀 航天', time: '3小时前', category: 'space' },
  { title: 'Anthropic 优化 Claude 多步推理能力', tag: '🤖 AI', time: '5小时前', category: 'ai' },
  { title: 'NASA 宣布 Artemis Ⅳ 月球基地选址方案', tag: '🌙 航天', time: '6小时前', category: 'space' },
  { title: 'Meta 发布开源 AI 模型 Llama 4', tag: '🤖 AI', time: '8小时前', category: 'ai' },
  { title: '蓝色起源完成 New Glenn 火箭二级测试', tag: '🚀 航天', time: '12小时前', category: 'space' },
  { title: 'MIT 研发新型室温超导材料引发热议', tag: '🔬 科学', time: '15小时前', category: 'science' },
  { title: '全球首座商用核聚变反应堆获批建设', tag: '⚡ 能源', time: '2天前', category: 'science' },
  { title: 'Apple 正开发 AI 驱动的健康监测平台', tag: '🍎 AI', time: '2天前', category: 'ai' },
  { title: '量子计算机首次完成实用级药物分子模拟', tag: '💊 科学', time: '3天前', category: 'science' },
]

const moods = ['稳定 🙂', '偏兴奋 🚀', '专注 🧠', '灵感爆发 ⚡']
const reminders = ['整理想法', '探索未知领域', '关注 AI 前沿', '给梦想加点细节', '看看别人在创造什么']

const newsCats = [
  { key: 'all', label: '全部' },
  { key: 'ai', label: 'AI' },
  { key: 'space', label: '航天' },
  { key: 'science', label: '科学' },
]

const tabs: { key: Section; label: string; icon: string }[] = [
  { key: 'hot', label: '热门梦想', icon: '🔥' },
  { key: 'latest', label: '最新梦想', icon: '🆕' },
  { key: 'random', label: '随机梦想', icon: '🌎' },
  { key: 'world', label: '世界动态', icon: '🌍' },
]

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const [show, setShow] = useState(false); const [animClass, setAnimClass] = useState('')
  useEffect(() => {
    if (visible) { setShow(true); setAnimClass('toast-enter'); const t = setTimeout(() => { setAnimClass('toast-exit'); setTimeout(() => setShow(false), 400) }, 2200); return () => clearTimeout(t) }
  }, [visible])
  if (!show) return null
  return <div className={`fixed inset-0 flex items-center justify-center pointer-events-none z-50 ${animClass}`}>
    <div className="glass rounded-2xl px-8 py-5 text-center">
      <span className="text-2xl">✨</span>
      <p className="text-lg text-white font-medium mt-2">{message}</p>
      <p className="text-sm text-gray-500 mt-1">一颗新的星星在宇宙中亮起</p>
    </div>
  </div>
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0); const ref = useRef<HTMLDivElement>(null); const counted = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el || counted.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true; const steps = 30; const inc = value / steps; let cur = 0
        const t = setInterval(() => { cur += inc; if (cur >= value) { setDisplay(value); clearInterval(t) } else setDisplay(Math.floor(cur)) }, 50)
      }
    }, { threshold: 0.3 })
    observer.observe(el); return () => observer.disconnect()
  }, [value])
  return <div ref={ref} className="text-center">
    <div className="text-2xl md:text-3xl font-black glow-text">{display.toLocaleString()}</div>
    <div className="text-xs md:text-sm text-gray-400 mt-1 whitespace-nowrap">{suffix}</div>
  </div>
}

export default function App() {
  const [section, setSection] = useState<Section>('hot')
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAbout, setShowAbout] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const [mood, setMood] = useState(moods[0])
  const [newsFilter, setNewsFilter] = useState('all')
  const universeRef = useRef<{ addStar: (dreamId: number) => void }>(null)
  const dreamsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isWorldSection = section === 'world'

  useEffect(() => {
    if (isWorldSection) { setLoading(false); return }
    loadDreams(section)
  }, [section])

  // Rotate mood
  useEffect(() => {
    const t = setInterval(() => setMood(moods[Math.floor(Math.random() * moods.length)]), 8000)
    return () => clearInterval(t)
  }, [])

  const loadDreams = useCallback(async (s: Section) => {
    setLoading(true); setError('')
    try {
      const data = s === 'hot' ? await fetchHot() : s === 'latest' ? await fetchLatest() : await fetchRandom()
      setDreams(data)
    } catch { setError('加载失败，请刷新重试') }
    finally { setLoading(false) }
  }, [])

  const handlePublish = async (content: string, nickname: string) => {
    const dream = await publishDream(content, nickname || '匿名')
    setToastKey(k => k + 1); setShowToast(true)
    setTimeout(() => setShowToast(false), 2600)
    loadDreams(section)
    setTimeout(() => { universeRef.current?.addStar(dream.id); dreamsRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 1500)
  }

  const handleStarClick = (dreamId: number) => {
    if (dreams.find(d => d.id === dreamId)) { setSection('latest'); dreamsRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  }

  const handleLike = async (id: number) => {
    const updated = await likeDream(id)
    setDreams(prev => prev.map(d => d.id === id ? updated : d))
  }

  const counters = [
    { value: 12438, suffix: '个梦想被记录' },
    { value: 1284, suffix: '个项目正在孵化' },
    { value: 328, suffix: '个团队正在协作' },
    { value: 17, suffix: '个梦想已变成真实产品' },
  ]

  const filteredNews = newsFilter === 'all' ? newsData : newsData.filter(n => n.category === newsFilter)

  return (
    <div className="relative">
      <Universe ref={universeRef} dreams={dreams} onStarClick={handleStarClick} />
      <Toast key={toastKey} message="新梦想已被记录" visible={showToast} />

      {/* Hero */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center px-4" style={{ zIndex: 1 }}>
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight">
            <span className="glow-text">WE-AIGO</span>
          </h1>
          <p className="mt-4 md:mt-5 text-sm md:text-base text-gray-400 font-light">如果资源不是问题，你最想创造什么？</p>
          <p className="mt-1.5 text-xs md:text-sm text-gray-600">记录那些还不存在的东西。</p>
        </div>
        <div className="mt-10 w-full max-w-lg mx-auto">
          <DreamForm onSubmit={handlePublish} inputRef={inputRef} />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="animate-bounce text-gray-600 text-xs">
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto glass rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {counters.map((item, i) => <AnimatedCounter key={i} value={item.value} suffix={item.suffix} />)}
          </div>
        </div>
      </div>

      {/* AI Console bar */}
      <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto glass rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">🧠 {mood}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">⏰ {reminders[Math.floor(Math.random() * reminders.length)]}</span>
          </div>
          <div className="text-xs text-gray-500">
            📌 WE-AIGO <span className="text-[#6bd6ff]">45%</span>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div ref={dreamsRef} className="relative" style={{ zIndex: 1 }}>
        <nav className="flex items-center justify-center gap-1 px-4 mb-8">
          <div className="glass rounded-2xl p-1 inline-flex">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setSection(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  section === t.key ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              ><span className="mr-1">{t.icon}</span>{t.label}</button>
            ))}
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 pb-20">
          {isWorldSection ? (
            <>
              {/* News category filter */}
              <div className="flex gap-2 mb-6 justify-center">
                {newsCats.map(c => (
                  <button key={c.key} onClick={() => setNewsFilter(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      newsFilter === c.key ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >{c.label}</button>
                ))}
              </div>
              {/* News grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredNews.map((item, i) => (
                  <div key={i} className="glass rounded-xl p-4 hover:bg-white/5 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#7ad0ff]">{item.tag}</span>
                      <span className="text-[10px] text-gray-500">{item.time}</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">{item.title}</p>
                  </div>
                ))}
              </div>
            </>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : error ? (
            <p className="text-center text-red-400 py-16">{error}</p>
          ) : dreams.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">✨</p>
              <p className="text-gray-500">还没有梦想，快来第一个发布吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dreams.map(dream => <DreamCard key={dream.id} dream={dream} onLike={handleLike} />)}
            </div>
          )}
        </main>
      </div>

      <footer className="relative text-center pb-12 px-4" style={{ zIndex: 1 }}>
        <button onClick={() => setShowAbout(!showAbout)} className="text-sm text-gray-500 hover:text-gray-300 transition">
          {showAbout ? '收起 ▲' : '关于 WE-AIGO ▼'}
        </button>
        {showAbout && (
          <div className="mt-4 glass rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-sm text-gray-400 leading-relaxed">WE-AIGO 收集人类对未来的想象，记录每一个正在诞生的未来。</p>
          </div>
        )}
      </footer>
    </div>
  )
}
