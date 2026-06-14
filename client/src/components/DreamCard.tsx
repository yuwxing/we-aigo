import { useState, useEffect } from 'react'
import type { Dream } from '../api'
import { toggleFavorite, checkFavorite } from '../api'
import CoCreatePanel from './CoCreatePanel'
import AIExpandPanel from './AIExpandPanel'

interface Props {
  dream: Dream
  onLike?: (id: number) => void
}

export default function DreamCard({ dream, onLike }: Props) {
  const [showCoCreate, setShowCoCreate] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    checkFavorite(dream.id).then((r) => setFavorited(r.favorited)).catch(() => {})
  }, [dream.id])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const r = await toggleFavorite(dream.id)
    setFavorited(r.favorited)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  return (
    <div className="dream-card glass rounded-2xl p-5">
      {/* Dream content */}
      <div className="cursor-pointer" onClick={() => onLike?.(dream.id)}>
        <p className="text-[15px] leading-relaxed text-gray-100 mb-3">
          "{dream.content}"
        </p>
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <span>— {dream.nickname}</span>
          <span className="text-xs">{timeAgo(dream.created_at)}</span>
        </div>
      </div>

      {/* Actions: Like / Co-create / Favorite / AI */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onLike?.(dream.id)}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {dream.likes}
        </button>

        <button
          onClick={() => setShowCoCreate(!showCoCreate)}
          className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            showCoCreate ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          🤝 共创
        </button>

        <button
          onClick={handleFavorite}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${
            favorited ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          {favorited ? '⭐ 已收藏' : '☆ 收藏'}
        </button>

        <button
          onClick={() => setShowAI(!showAI)}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${
            showAI ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          ✨ AI
        </button>
      </div>

      {showCoCreate && <CoCreatePanel dreamId={dream.id} />}
      {showAI && <AIExpandPanel dreamContent={dream.content} />}
    </div>
  )
}
