import { useState, useEffect } from 'react'
import { fetchCoCreates, addCoCreate, type CoCreate } from '../api'

interface Props {
  dreamId: number
}

const typeLabels: Record<CoCreate['type'], string> = {
  value: '有什么价值',
  problem: '会遇到什么问题',
  solution: '怎么实现',
}

const typeIcons: Record<CoCreate['type'], string> = {
  value: '💡',
  problem: '⚠️',
  solution: '🔧',
}

const typeColors: Record<CoCreate['type'], string> = {
  value: 'border-emerald-500/30 bg-emerald-500/5',
  problem: 'border-amber-500/30 bg-amber-500/5',
  solution: 'border-blue-500/30 bg-blue-500/5',
}

export default function CoCreatePanel({ dreamId }: Props) {
  const [items, setItems] = useState<CoCreate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<CoCreate['type']>('value')
  const [input, setInput] = useState('')
  const [author, setAuthor] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCoCreates(dreamId).then((data) => {
      setItems(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [dreamId])

  const handleSubmit = async () => {
    if (!input.trim()) return
    setSubmitting(true)
    try {
      const item = await addCoCreate(dreamId, activeType, input.trim(), author.trim() || '匿名')
      setItems((prev) => [item, ...prev])
      setInput('')
      setShowForm(false)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const grouped = { value: items.filter((i) => i.type === 'value'), problem: items.filter((i) => i.type === 'problem'), solution: items.filter((i) => i.type === 'solution') }

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center gap-1 mb-3">
        {(['value', 'problem', 'solution'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setShowForm(false) }}
            className={`text-xs px-2.5 py-1 rounded-lg transition ${
              activeType === t
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {typeIcons[t]} {typeLabels[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs text-gray-500 text-center py-2">加载中...</div>
      ) : grouped[activeType].length > 0 ? (
        <div className="space-y-2 mb-3">
          {grouped[activeType].map((item) => (
            <div key={item.id} className={`text-xs border rounded-lg p-2.5 ${typeColors[item.type]}`}>
              <p className="text-gray-200 leading-relaxed">{item.content}</p>
              <p className="text-gray-500 mt-1">— {item.author}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-3">还没有人参与共创，来说说你的想法吧</p>
      )}

      {showForm ? (
        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeType === 'value' ? '这个梦想的价值是...' : activeType === 'problem' ? '可能会遇到...' : '可以通过...来实现'}
            className="w-full bg-white/5 text-xs text-white placeholder-gray-500 rounded-lg p-2.5 outline-none border border-white/10 focus:border-purple-400/50 resize-none"
            rows={2}
            maxLength={300}
          />
          <div className="flex items-center gap-2">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="你的名字"
              maxLength={20}
              className="flex-1 bg-white/5 text-xs text-white placeholder-gray-500 rounded-lg px-2.5 py-1.5 outline-none border border-white/10 focus:border-purple-400/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition disabled:opacity-40"
            >
              {submitting ? '...' : '提交'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-purple-400 hover:text-purple-300 transition"
        >
          + 补充{typeLabels[activeType]}
        </button>
      )}
    </div>
  )
}
