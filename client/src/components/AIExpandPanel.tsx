import { useState } from 'react'
import { aiExpand, type AIExpand } from '../api'

interface Props {
  dreamContent: string
}

export default function AIExpandPanel({ dreamContent }: Props) {
  const [result, setResult] = useState<AIExpand | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleExpand = async () => {
    setLoading(true)
    try {
      const data = await aiExpand(dreamContent)
      setResult(data)
      setExpanded(true)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!expanded && (
        <button
          onClick={handleExpand}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-violet-300 hover:from-violet-500/30 hover:to-blue-500/30 transition disabled:opacity-40 flex items-center gap-1.5"
        >
          {loading ? (
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span>✨</span>
          )}
          AI 扩展
        </button>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          <div className="glass rounded-xl p-3 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🚀</span>
              <span className="text-sm font-medium text-violet-300">梦想放大器</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">梦想名称：</span>
                <span className="text-white font-medium">{result.name}</span>
              </div>
              <div>
                <span className="text-gray-400">核心价值：</span>
                <span className="text-gray-200">{result.core_value}</span>
              </div>
              <div>
                <span className="text-gray-400">可能技术路线：</span>
                <span className="text-gray-200">{result.tech_route}</span>
              </div>
              <div>
                <span className="text-gray-400">面临挑战：</span>
                <span className="text-gray-200">{result.challenges}</span>
              </div>
              <div>
                <span className="text-gray-400">实现时间预测：</span>
                <span className="text-emerald-400 font-medium">{result.timeline}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
