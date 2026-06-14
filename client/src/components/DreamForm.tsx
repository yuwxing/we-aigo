import { useState, type RefObject } from 'react'
import AIExpandPanel from './AIExpandPanel'

interface Props {
  onSubmit: (content: string, nickname: string) => Promise<void>
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

export default function DreamForm({ onSubmit, inputRef }: Props) {
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showName, setShowName] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onSubmit(trimmed, nickname.trim() || '匿名')
      setContent('')
      setNickname('')
      setShowAI(false)
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-5 md:p-7 w-full">
      <textarea
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入你的梦想……"
        className="w-full bg-transparent text-base md:text-lg text-white placeholder-gray-500 resize-none outline-none glow-border rounded-xl p-2 min-h-[70px] leading-relaxed"
        rows={2}
        maxLength={500}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />

      {showAI && content.trim() && (
        <div className="mt-2">
          <AIExpandPanel dreamContent={content} />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowName(!showName)}
            className="text-gray-400 hover:text-gray-200 transition text-xs px-3 py-1.5 rounded-lg glass"
          >
            {showName ? '署名' : '匿名'}
          </button>
          {showName && (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="你的名字"
              maxLength={20}
              className="bg-transparent text-sm text-white placeholder-gray-500 border border-white/10 rounded-lg px-3 py-1.5 w-24 outline-none focus:border-purple-400/50 transition"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {content.trim() && (
            <button
              onClick={() => setShowAI(!showAI)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${
                showAI ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              ✨ AI 扩展
            </button>
          )}
          <span className="text-xs text-gray-500">{content.length}/500</span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="px-5 py-2 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: !content.trim() || submitting ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                发布中
              </span>
            ) : (
              '发布梦想'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
