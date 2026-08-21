import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchHot, fetchLatest, fetchRandom, publishDream, likeDream, fetchNews, fetchFavorites, fetchMyDreams, searchDreams, fetchStats, fetchNotes, addNote as apiAddNote, deleteNote as apiDeleteNote, type Dream, type NewsItem, type Stats, type Note } from './api'
import DreamCard from './components/DreamCard'
import DreamForm from './components/DreamForm'
import Universe from './components/Universe'

type Section = 'hot' | 'latest' | 'random' | 'world' | 'favorites' | 'my'

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

const productIcons: Record<string, string[]> = {
  school: ['M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'],
  team: ['M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  teacher: ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
  console: ['M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'],
  v3: ['M13 10V3L4 14h7v7l9-11h-7z'],
  gaokao: ['M12 14l9-5-9-5-9 5 9 5z', 'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'],
  city: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  drama: ['M15.5 6.5A3.5 3.5 0 1012 10a3.5 3.5 0 003.5-3.5z', 'M8.5 6.5A3.5 3.5 0 1112 10a3.5 3.5 0 01-3.5-3.5z', 'M12 14c-4 0-6 1.5-6 4v2h12v-2c0-2.5-2-4-6-4z'],
  hub: ['M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'],
  agenthubos: ['M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  robotteam: ['M12 4v2M6 10h12v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6z', 'M2 12h2M20 12h2M9 13v1M15 13v1'],
  agentos: ['M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z', 'M9 11l2 2 4-4'],
  home: ['M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75'],
  agenthome: ['M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75', 'M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z'],
  exchange: ['M3 3v18h18', 'M7 14l3-3 3 3 5-6'],
  knowledge: ['M4 19.5A2.5 2.5 0 016.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z', 'M8 7h8M8 11h8'],
}

const values = [
  { icon: '🤖', title: '多智能体协作', desc: '多个专业 Agent 分工协作——研究员、规划师、执行者、审核者，自动完成复杂任务' },
  { icon: '🌌', title: '收集未来想象', desc: '每个人都能记录梦想，AI 将其扩展为可执行的蓝图，构建知识宇宙' },
  { icon: '⚡', title: '即配即用', desc: '无需代码，配置 DeepSeek Key 即可运行；支持个人与企业级部署' },
]

type ProductStatus = 'new' | 'online' | 'beta' | 'preview'

interface ProductEntry {
  key: string
  href: string
  title: string
  desc: string
  gradient: string
  status: ProductStatus
}

const statusStyle: Record<ProductStatus, { label: string; cls: string }> = {
  new: { label: 'NEW', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  online: { label: '在线', cls: 'bg-lime-500/10 text-lime-300/80 border-lime-500/20' },
  beta: { label: '试点', cls: 'bg-amber-500/10 text-amber-300/80 border-amber-500/20' },
  preview: { label: '内测', cls: 'bg-sky-500/10 text-sky-300/80 border-sky-500/20' },
}

const productGroups: { title: string; items: ProductEntry[] }[] = [
  {
    title: '智能体平台',
    items: [
      { key: 'agentos', href: 'https://agent-os.we-aigo.cn', title: 'Agent OS v0.2', desc: '工作台 · Agent Store · 智能体编辑器', gradient: 'from-sky-500 to-blue-600', status: 'online' },
      { key: 'agenthubos', href: 'https://agenthub.we-aigo.cn', title: 'AgentHub OS', desc: '60 智能体协作平台 · LLM 自动编排', gradient: 'from-violet-500 to-fuchsia-600', status: 'online' },
      { key: 'hub', href: 'https://agents.we-aigo.cn', title: 'AgentHub MCP', desc: 'AI Agent 发现平台 · 语义检索', gradient: 'from-indigo-500 to-purple-600', status: 'online' },
      { key: 'console', href: 'https://console.we-aigo.cn', title: '智慧校园 AI 治理平台 v2', desc: '多智能体 · 任务流 · 可视化看板', gradient: 'from-indigo-500 to-violet-600', status: 'online' },
      { key: 'v3', href: 'https://v3.we-aigo.cn', title: '智慧校园 AI 治理平台 v3', desc: '三栏面板 · Agent 组织树 · 逐步执行', gradient: 'from-purple-500 to-fuchsia-600', status: 'beta' },
      { key: 'robotteam', href: 'https://agent-os-platform-781.pages.dev', title: '机器人团队', desc: '团队画布 · HITL 人工审批 · MCP 执行', gradient: 'from-cyan-500 to-blue-600', status: 'beta' },
    ],
  },
  {
    title: '教育',
    items: [
      { key: 'school', href: 'https://school.we-aigo.cn', title: 'AI 教务调代课系统 V1', desc: 'AI 匹配最优代课教师 · 确认拒绝流程', gradient: 'from-sky-500 to-cyan-600', status: 'online' },
      { key: 'team', href: 'https://team.we-aigo.cn', title: '7×24 英语教学 AI 团队', desc: '全天候 AI 学习支持 · 点击进入', gradient: 'from-rose-500 to-red-600', status: 'online' },
      { key: 'teacher', href: 'https://ai-headteacher-os.pages.dev', title: '班主任 AI 助理', desc: '考勤 · 作业 · 家校沟通 · 成绩分析', gradient: 'from-emerald-500 to-teal-600', status: 'online' },
      { key: 'gaokao', href: 'https://gaokao.we-aigo.cn', title: 'AI 高考决策中心 v3', desc: '多智能体志愿模拟 · 冲稳保推荐', gradient: 'from-amber-500 to-orange-600', status: 'online' },
    ],
  },
  {
    title: '研究与知识',
    items: [
      { key: 'knowledge', href: '/knowledge-entity/', title: '动态知识体实验室', desc: '研究问题 · 文献系统 · 实验复现 · AI 导师', gradient: 'from-blue-600 to-teal-500', status: 'new' },
    ],
  },
  {
    title: '生活与城市',
    items: [
      { key: 'agenthome', href: 'https://agent-home.we-aigo.cn', title: 'Agent Home OS', desc: '家庭数字孪生 · 多 Agent 实时协作 · Device Mesh', gradient: 'from-cyan-500 to-teal-600', status: 'new' },
      { key: 'home', href: 'https://live.we-aigo.cn', title: 'Home OS · 智能家居', desc: '虚拟家庭设备控制 · 场景一键执行', gradient: 'from-emerald-500 to-teal-600', status: 'online' },
      { key: 'city', href: 'https://city.we-aigo.cn', title: '数字孪生政府', desc: '政策 → 部门执行 → 城市反馈 → 再决策', gradient: 'from-emerald-500 to-teal-600', status: 'preview' },
      { key: 'drama', href: 'https://science.we-aigo.cn/play/', title: '原创科普剧', desc: '分支叙事 · 你的选择改变剧情 · 4 种结局', gradient: 'from-amber-500 to-orange-600', status: 'online' },
    ],
  },
  {
    title: '模拟交易',
    items: [
      { key: 'exchange', href: 'https://exchange.we-aigo.cn', title: 'AI Exchange 模拟证券市场', desc: 'AI 生态股模拟交易 · 实时行情 · WEG 生态指数', gradient: 'from-emerald-500 to-teal-600', status: 'new' },
    ],
  },
]


const steps = [
  { num: '01', title: '注册 / 登录', icon: '👤' },
  { num: '02', title: '配置 DeepSeek Key', icon: '🔑' },
  { num: '03', title: '创建第一个 AI 团队', icon: '🚀' },
  { num: '04', title: '开启未来想象', icon: '✨' },
]

const navItems = [
  { label: '首页', id: 'hero' },
  { label: '产品矩阵', id: 'products' },
  { label: '快速开始', id: 'start' },
  { label: '梦想宇宙', id: 'dreams' },
  { label: '关于', id: 'about' },
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
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsFilter, setNewsFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Dream[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const universeRef = useRef<{ addStar: (dreamId: number) => void }>(null)
  const dreamsRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => { fetchStats().then(setStats).catch(() => {}) }, [])

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

  const scrollTo = (id: string) => {
    setMobileNavOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
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

      {/* ===== Navbar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,15,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }} className="text-lg font-black glow-text tracking-tight">WE-AIGO</a>
          <div className="hidden md:flex items-center gap-8 text-sm">
            {navItems.map((item) => (
              <a key={item.label} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollTo(item.id) }}
                className="text-gray-400 hover:text-white transition-colors duration-200">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo('dreams')}
              className="hidden sm:inline-flex px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200">
              立即体验
            </button>
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden text-gray-400 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNavOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-white/5" style={{ background: 'rgba(5,5,15,0.95)' }}>
            {navItems.map((item) => (
              <a key={item.label} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollTo(item.id) }}
                className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition">
                {item.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-10" style={{ zIndex: 1 }}>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            多智能体协同 · AI 团队全天候在线
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none">
            <span className="glow-text">WE-AIGO</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-gray-300 font-light">
            收集人类对未来的想象，让 AI 为你打工
          </p>
          <p className="mt-3 text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            多智能体协同 · 零代码 · 配置 DeepSeek Key，5 分钟开启脑力大革命
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => scrollTo('dreams')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.97]">
              立即配置 Key 体验
            </button>
            <button onClick={() => scrollTo('products')}
              className="px-6 py-3 rounded-xl glass text-gray-300 text-sm font-medium hover:bg-white/10 hover:text-white transition-all duration-200">
              探索 AI 团队
            </button>
          </div>
        </div>

        {/* Stats */}
        {counters.length > 0 && (
          <div className="mt-16 w-full max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {counters.map((item, i) => <AnimatedCounter key={i} value={item.value} suffix={item.suffix} />)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== VALUE PROPOSITIONS ===== */}
      <section className="relative px-4 py-16 md:py-24" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white">为什么选择 WE-AIGO</h2>
            <p className="mt-3 text-sm text-gray-500">不止是一个工具，而是一整个 AI 团队</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI TEAM PRODUCTS ===== */}
      <section id="products" className="relative px-4 py-16 md:py-24" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white">AI 团队 · 多智能体产品矩阵</h2>
            <p className="mt-3 text-sm text-gray-500">一个AI不够用？现在拥有整个AI团队</p>
          </div>

          {/* Multi-Agent highlight */}
          <div className="glass rounded-2xl overflow-hidden mb-10">
            <div className="h-[3px] bg-gradient-to-r from-violet-500/60 via-fuchsia-500/60 to-indigo-500/60" />
            <div className="px-5 md:px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-white">多智能体协同办公</p>
                  <p className="text-xs text-gray-500">AI项目经理统筹 · AI执行官决策 · AI分析师深挖 · AI文案持续输出</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                当你休息时，你的AI团队仍在运转——数字分身团队全天候在线，各司其职，自动协作。
              </p>
            </div>
          </div>

          {/* Product groups */}
          {productGroups.map((group) => (
            <div key={group.title} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-semibold text-white">{group.title}</span>
                <span className="text-xs text-gray-500">{group.items.length} 个</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map((p) => {
                  const st = statusStyle[p.status]
                  return (
                    <a key={p.key} href={p.href} target="_blank" rel="noopener noreferrer"
                      className="group relative glass rounded-2xl p-4 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                      <div className="flex items-start gap-3 pr-4">
                        <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {productIcons[p.key].map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />)}
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white">{p.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.desc}</p>
                        </div>
                      </div>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all text-base">→</span>
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW TO START ===== */}
      <section id="start" className="relative px-4 py-16 md:py-24" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white">快速开始</h2>
            <p className="mt-3 text-sm text-gray-500">4 步开启你的 AI 多智能体之旅</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-5 text-center hover:bg-white/[0.06] transition-all duration-300 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                <div className="text-xs text-violet-400 font-mono mb-1">{s.num}</div>
                <div className="text-sm font-medium text-white">{s.title}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => scrollTo('dreams')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200">
              立即体验 →
            </button>
          </div>
        </div>
      </section>

      {/* ===== DREAMS UNIVERSE ===== */}
      <section id="dreams" ref={dreamsRef} className="relative py-16 md:py-24" style={{ zIndex: 1 }}>
        <div className="text-center mb-10 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white">梦想宇宙</h2>
          <p className="mt-3 text-sm text-gray-500">记录每一个正在诞生的未来</p>
        </div>

        {/* Dream Form */}
        <div className="max-w-lg mx-auto px-4 mb-10">
          <DreamForm onSubmit={handlePublish} inputRef={inputRef} />
        </div>

        {/* Tabs */}
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

        {/* Search */}
        <div className="max-w-md mx-auto px-4 mb-6">
          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
            placeholder="🔍 搜索梦想..."
            className="w-full glass rounded-xl px-4 py-2.5 text-sm text-gray-200 outline-none glow-border placeholder:text-gray-600"
          />
        </div>

        {/* Dream Cards / News */}
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
      </section>

      {/* ===== Notebook Button ===== */}
      <button onClick={() => setShowNotebook(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center text-lg">
        📓
      </button>

      {/* ===== Notebook Modal ===== */}
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

      {/* ===== Footer ===== */}
      <footer id="about" className="relative text-center pb-12 px-4 pt-8" style={{ zIndex: 1 }}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setShowAbout(!showAbout)} className="text-sm text-gray-500 hover:text-gray-300 transition">
            {showAbout ? '收起 ▲' : '关于 WE-AIGO ▼'}
          </button>
          {showAbout && (
            <div className="mt-4 glass rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-400 leading-relaxed">WE-AIGO 收集人类对未来的想象，记录每一个正在诞生的未来。</p>
            </div>
          )}
          <p className="mt-8 text-xs text-gray-600">© {new Date().getFullYear()} WE-AIGO · 多智能体协同平台</p>
        </div>
      </footer>
    </div>
  )
}
