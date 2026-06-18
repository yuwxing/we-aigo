import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchHot, fetchLatest, fetchRandom, publishDream, likeDream, fetchNews, fetchFavorites, fetchMyDreams, searchDreams, fetchStats, fetchNotes, addNote as apiAddNote, deleteNote as apiDeleteNote, type Dream, type NewsItem, type Stats, type Note } from './api'
import DreamCard from './components/DreamCard'
import DreamForm from './components/DreamForm'
import Universe from './components/Universe'

type Section = 'hot' | 'latest' | 'random' | 'world' | 'favorites' | 'my'

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
  { key: 'favorites', label: '我的收藏', icon: '⭐' },
  { key: 'my', label: '我的梦想', icon: '👤' },
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
  const [showNotebook, setShowNotebook] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteCat, setNoteCat] = useState('命令')
  const [noteFilter, setNoteFilter] = useState('全部')
  const [showToast, setShowToast] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const [mood, setMood] = useState(moods[0])
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsFilter, setNewsFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Dream[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const universeRef = useRef<{ addStar: (dreamId: number) => void }>(null)
  const dreamsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isWorldSection = section === 'world'

  useEffect(() => {
    if (isWorldSection) { fetchNewsData(); return }
    if (section === 'favorites') { loadFavorites(); return }
    if (section === 'my') { loadMyDreams(); return }
    setSearchResults(null)
    loadDreams(section)
  }, [section])

  const fetchNewsData = async () => {
    setNewsLoading(true)
    try { setNews(await fetchNews()) } catch { setNews([]) }
    finally { setNewsLoading(false) }
  }

  const loadFavorites = async () => {
    setLoading(true)
    try { setDreams(await fetchFavorites()) } catch {}
    finally { setLoading(false) }
  }

  const loadMyDreams = async () => {
    setLoading(true); setError('')
    try { setDreams(await fetchMyDreams()) } catch { setError('加载失败') }
    finally { setLoading(false) }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults(null); return }
    setLoading(true)
    try { setSearchResults(await searchDreams(q.trim())) } catch { setSearchResults([]) }
    finally { setLoading(false) }
  }

  // Fetch stats
  useEffect(() => { fetchStats().then(setStats).catch(() => {}) }, [])

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

  const loadNotes = async () => {
    setNoteLoading(true)
    try { setNotes(await fetchNotes()) } catch { setNotes([]) }
    finally { setNoteLoading(false) }
  }

  useEffect(() => { if (showNotebook) loadNotes() }, [showNotebook])

  const handleAddNote = async () => {
    const text = noteText.trim()
    if (!text) return
    try {
      const note = await apiAddNote(text, noteCat)
      setNotes(prev => [note, ...prev])
      setNoteText('')
    } catch {}
  }
  const handleDelNote = async (id: number) => {
    try {
      await apiDeleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  const handleLike = async (id: number) => {
    const updated = await likeDream(id)
    setDreams(prev => prev.map(d => d.id === id ? updated : d))
  }

  const counters = stats ? [
    { value: stats.dreams_total, suffix: '个梦想被记录' },
    { value: stats.projects_incubating, suffix: '个项目正在孵化' },
    { value: stats.teams_collaborating, suffix: '个团队正在协作' },
    { value: stats.products_realized, suffix: '个梦想已变成真实产品' },
  ] : []

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
          <p className="mt-1.5 text-xs md:text-sm text-gray-600">记录那些还不存在的东西 · 探索火星基地 →</p>
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

      {/* Content Section — visible on all screens */}
      <div className="block">
        {/* Stats */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto glass rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {counters.map((item, i) => <AnimatedCounter key={i} value={item.value} suffix={item.suffix} />)}
            </div>
          </div>
        </div>

        {/* Mars Base removed */}

        {/* Brain Chip removed */}

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

        {/* 多智能体协同办公 */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-violet-500/60 via-fuchsia-500/60 to-indigo-500/60" />
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">多智能体协同办公</p>
                    <p className="text-xs text-gray-500">一个AI不够用？现在拥有整个AI团队</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  当你休息时，你的AI团队仍在运转——AI项目经理统筹任务、AI执行官拍板决策、AI分析师深挖数据、AI文案持续输出。数字分身团队全天候在线，各司其职，自动协作。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 7×24 英语教学AI团队入口 */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto">
            <a href="https://team.we-aigo.cn" target="_blank" rel="noopener noreferrer"
              className="group block glass rounded-2xl px-5 py-4 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors">7×24 英语教学AI团队</p>
                    <p className="text-xs text-gray-500">全天候AI学习支持 · 点击进入</p>
                  </div>
                </div>
                <span className="text-xs text-rose-400 group-hover:text-rose-300 font-medium flex items-center gap-1">
                  进入 <span className="text-base">→</span>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* AI学校指挥中心控制台入口 */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto">
            <a href="https://console.we-aigo.cn" target="_blank" rel="noopener noreferrer"
              className="group block glass rounded-2xl px-5 py-4 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">AI学校指挥中心控制台</p>
                    <p className="text-xs text-gray-500">多智能体 · 任务流 · 可视化看板 · 实时状态</p>
                  </div>
                </div>
                <span className="text-xs text-indigo-400 group-hover:text-indigo-300 font-medium flex items-center gap-1">
                  进入 <span className="text-base">→</span>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* AI高考决策中心入口 */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto">
            <a href="https://gaokao.we-aigo.cn" target="_blank" rel="noopener noreferrer"
              className="group block glass rounded-2xl px-5 py-4 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">AI高考决策中心 v3</p>
                    <p className="text-xs text-gray-500">多智能体志愿模拟 · 冲稳保推荐 · 风险分析</p>
                  </div>
                </div>
                <span className="text-xs text-orange-400 group-hover:text-orange-300 font-medium flex items-center gap-1">
                  进入 <span className="text-base">→</span>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* 数字孪生政府入口 */}
        <div className="relative px-4 pb-6" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto">
            <a href="https://city.we-aigo.cn" target="_blank" rel="noopener noreferrer"
              className="group block glass rounded-2xl px-5 py-4 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">AI Government Simulator 数字孪生政府</p>
                    <p className="text-xs text-gray-500">深圳政府运行模拟器 · 政策 → 部门执行 → 城市反馈 → 再决策</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 group-hover:text-emerald-300 font-medium flex items-center gap-1">
                  进入 <span className="text-base">→</span>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Tabs + Content */}
        <div ref={dreamsRef} className="relative" style={{ zIndex: 1 }}>
          <nav className="flex items-center justify-center gap-2 px-4 mb-6">
            <div className="glass rounded-2xl p-1 inline-flex flex-wrap justify-center">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setSection(t.key)}
                  className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
                    section === t.key ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                  }`}
                ><span className="mr-1">{t.icon}</span>{t.label}</button>
              ))}
            </div>
          </nav>
          {/* Search bar */}
          <div className="max-w-md mx-auto px-4 mb-6">
            <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
              placeholder="🔍 搜索梦想..."
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-gray-200 outline-none glow-border placeholder:text-gray-600"
            />
          </div>

          <main className="max-w-4xl mx-auto px-4 pb-20">
            {searchQuery.trim() && searchResults !== null ? (
              searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="text-gray-500">没有找到匹配的梦想</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">找到 {searchResults.length} 个结果</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map(dream => <DreamCard key={dream.id} dream={dream} onLike={handleLike} />)}
                  </div>
                </div>
              )
            ) : isWorldSection ? (
              <>
                <div className="flex gap-2 mb-6 justify-center">
                  {newsCats.map(c => (
                    <button key={c.key} onClick={() => setNewsFilter(c.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        newsFilter === c.key ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >{c.label}</button>
                  ))}
                </div>
                {newsLoading ? (
                  <div className="flex justify-center py-16">
                    <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(newsFilter === 'all' ? news : news.filter(n => n.category === newsFilter)).map((item, i) => (
                      <div key={i} className="glass rounded-xl p-4 hover:bg-white/5 transition">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#7ad0ff]">{item.tag}</span>
                          <span className="text-[10px] text-gray-500">{item.time}</span>
                        </div>
                        <p className="text-sm leading-relaxed font-medium">{item.titleCn ? <><span className="text-gray-100">{item.titleCn}</span><br /><span className="text-gray-500 text-xs font-normal">{item.title}</span></> : <span className="text-gray-100">{item.title}</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
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
            ) : section === 'favorites' && dreams.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">⭐</p>
                <p className="text-gray-500">还没有收藏的梦想</p>
              </div>
            ) : section === 'my' && dreams.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">👤</p>
                <p className="text-gray-500">你还没有发布过梦想，快去发布第一个吧</p>
              </div>
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
      </div>






      {/* 笔记本按钮 */}
      <button onClick={() => setShowNotebook(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center text-lg">
        📓
      </button>

      {/* 笔记本弹窗 */}
      {showNotebook && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNotebook(false)}>
        <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-zinc-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">📓 我的笔记本</h2>
            <button onClick={() => setShowNotebook(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
          </div>
          <div className="p-5 border-b border-zinc-800">
            <div className="flex gap-2 mb-2">
              <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="记下有用的东西..." className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-600" />
              <select value={noteCat} onChange={e => setNoteCat(e.target.value)}
                className="bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500">
                <option>命令</option><option>技巧</option><option>项目</option><option>其他</option>
              </select>
              <button onClick={handleAddNote} className="px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium">保存</button>
            </div>
          </div>
          <div className="flex gap-2 px-5 pt-4 pb-2">
            {['全部','命令','技巧','项目','其他'].map(c => (
              <button key={c} onClick={() => setNoteFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${noteFilter === c ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>{c}</button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-2">
            {noteLoading ? (
              <p className="text-center text-zinc-600 text-sm py-8">加载中...</p>
            ) : notes.filter(n => noteFilter === '全部' || n.cat === noteFilter).length === 0 ? (
              <p className="text-center text-zinc-600 text-sm py-8">还没有笔记</p>
            ) : notes.filter(n => noteFilter === '全部' || n.cat === noteFilter).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 group">
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400 flex-shrink-0 mt-0.5">{n.cat}</span>
                <p className="flex-1 text-sm text-zinc-300 whitespace-pre-wrap">{n.text}</p>
                <span className="text-2xs text-zinc-600 flex-shrink-0 mt-1">{n.created_at?.slice(5, 16) || ''}</span>
                <button onClick={() => handleDelNote(n.id)} className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition text-xs flex-shrink-0 mt-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Footer — visible on all screens */}
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








