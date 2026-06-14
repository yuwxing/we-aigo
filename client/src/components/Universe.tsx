import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import type { Dream } from '../api'
import { matchBlueprint } from '../aiKeywords'

interface BgStar {
  x: number; y: number; r: number; a: number; speed: number
  vx: number; vy: number
}

interface ShootStar {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; tail: { x: number; y: number }[]
}

interface LightEvent {
  active: boolean; x: number; y: number; progress: number
  type: 'streak' | 'bubble'; bubbleR: number
}

interface NewStarAnim {
  x: number; y: number; t: number
}

interface DreamStar {
  id: number; content: string; nickname: string; likes: number
  x: number; y: number; r: number; phase: number; speed: number
}

function goldenPos(id: number, w: number, h: number) {
  const angle = id * 2.399963
  const radius = Math.sqrt(id) * 68
  const cx = w * 0.5
  const cy = h * 0.43
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius * 0.55,
    z: Math.min(1, Math.sqrt(id) / 20),
  }
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

const Universe = forwardRef<{ addStar: (dreamId: number) => void }, { dreams: Dream[]; onStarClick?: (id: number) => void }>(
  ({ dreams, onStarClick }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const bgRef = useRef<BgStar[]>([])
    const dreamStarsRef = useRef<DreamStar[]>([])
    const newStarsRef = useRef<NewStarAnim[]>([])
    const shootersRef = useRef<ShootStar[]>([])
    const evRef = useRef<LightEvent>({ active: false, x: 0, y: 0, progress: 0, type: 'streak', bubbleR: 0 })
    const lastShoot = useRef(0)
    const lastEvent = useRef(0)
    const mouseRef = useRef({ x: -999, y: -999 })
    const hoveredRef = useRef<DreamStar | null>(null)
    const [tooltip, setTooltip] = useState<{ star: DreamStar; x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      addStar(dreamId: number) {
        const canvas = canvasRef.current
        if (!canvas) return
        const star = dreamStarsRef.current.find(s => s.id === dreamId)
        if (star) {
          newStarsRef.current.push({ x: star.x, y: star.y, t: Date.now() })
        }
      },
    }))

    // Recompute dream star positions when dreams or canvas size changes
    const [dims, setDims] = useState({ w: 800, h: 600 })
    const prevDreamsLen = useRef(0)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height
      setDims({ w, h })

      const maxLikes = Math.max(...dreams.map(d => d.likes), 1)
      dreamStarsRef.current = dreams.map(d => {
        const pos = goldenPos(d.id, w, h)
        const brightness = d.likes / maxLikes
        return {
          id: d.id, content: d.content, nickname: d.nickname, likes: d.likes,
          x: pos.x, y: pos.y,
          r: 0.8 + brightness * 2.2,
          phase: (d.id * 1.618) % (Math.PI * 2),
          speed: 0.004 + (d.id % 7) * 0.001,
        }
      })

      // Check if new dream was added (trigger animation)
      if (dreams.length > prevDreamsLen.current) {
        const newest = dreamStarsRef.current[dreamStarsRef.current.length - 1]
        if (newest) {
          newStarsRef.current.push({ x: newest.x, y: newest.y, t: Date.now() })
        }
      }
      prevDreamsLen.current = dreams.length
    }, [dreams, dims.w, dims.h])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        setDims({ w: canvas.width, h: canvas.height })
      }
      resize()
      window.addEventListener('resize', resize)

      // Fewer stars + skip nebulae on mobile for perf
      const isMobile = Math.min(canvas.width, canvas.height) < 768
      const divisor = isMobile ? 18000 : 9000
      const count = Math.floor((canvas.width * canvas.height) / divisor)
      bgRef.current = Array.from({ length: Math.max(count, 60) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.1,
        a: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.002,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.04,
      }))

      const nebulae = isMobile ? [] : Array.from({ length: 3 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 80 + Math.random() * 150,
        hue: 200 + Math.random() * 100,
        phase: Math.random() * Math.PI * 2,
      }))

      // Global mouse tracking (not just on canvas, since overlays block events)
      const onGlobalMouse = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY }
      }
      const onGlobalLeave = () => {
        mouseRef.current = { x: -999, y: -999 }
        setTooltip(null)
        hoveredRef.current = null
      }
      const onGlobalClick = () => {
        const h = hoveredRef.current
        if (h && onStarClick) onStarClick(h.id)
      }
      window.addEventListener('mousemove', onGlobalMouse)
      window.addEventListener('mouseleave', onGlobalLeave)
      window.addEventListener('click', onGlobalClick)

      let frame: number
      let lastFrameTime = 0
      const animate = (timestamp: number) => {
        // Throttle to 30fps on mobile, skip when tab hidden
        if (isMobile) {
          if (document.hidden) { frame = requestAnimationFrame(animate); return }
          if (timestamp - lastFrameTime < 33) { frame = requestAnimationFrame(animate); return }
          lastFrameTime = timestamp
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const now = Date.now()
        const w = canvas.width
        const h = canvas.height

        // Nebulae
        for (const n of nebulae) {
          n.x -= 0.02; n.phase += 0.002
          if (n.x + n.r < 0) n.x = w + n.r
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
          g.addColorStop(0, `hsla(${n.hue + Math.sin(n.phase) * 20}, 60%, 40%, 0.025)`)
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2)
        }

        // BG stars drift
        for (const s of bgRef.current) {
          s.x += s.vx; s.y += s.vy
          if (s.x < -5) s.x = w + 5
          if (s.x > w + 5) s.x = -5
          if (s.y < -5) s.y = h + 5
          if (s.y > h + 5) s.y = -5
          s.a += s.speed
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(s.a) * 0.15 + 0.2})`
          ctx.fill()
        }

        // Dream stars (deterministic positions)
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        let nearest: DreamStar | null = null
        let nearestDist = 40

        for (const s of dreamStarsRef.current) {
          s.phase += s.speed
          const pulse = Math.sin(s.phase) * 0.3 + 0.7
          const bri = 0.4 + pulse * 0.6
          const size = s.r * (0.8 + pulse * 0.2)

          ctx.beginPath()
          ctx.arc(s.x, s.y, size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 180, 255, ${bri})`
          ctx.fill()

          // Glow on brighter stars
          if (s.r > 1.5) {
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 4)
            glow.addColorStop(0, `rgba(180, 160, 255, ${bri * 0.1})`)
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(s.x, s.y, size * 4, 0, Math.PI * 2)
            ctx.fill()
          }

          // Hover detection
          if (mx > 0) {
            const d = dist(mx, my, s.x, s.y)
            if (d < nearestDist) {
              nearestDist = d
              nearest = s
            }
          }
        }

        // Hover ring
        if (nearest && nearestDist < 30) {
          ctx.beginPath()
          ctx.arc(nearest.x, nearest.y, nearest.r * 3 + 4, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(180, 160, 255, 0.3)'
          ctx.lineWidth = 1
          ctx.stroke()

          // Connection line to info
          ctx.beginPath()
          ctx.moveTo(nearest.x, nearest.y + nearest.r * 3 + 6)
          ctx.lineTo(nearest.x, nearest.y + 30)
          ctx.strokeStyle = 'rgba(180, 160, 255, 0.15)'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        // Update hovered state
        if (nearest && nearestDist < 30) {
          if (hoveredRef.current?.id !== nearest.id) {
            hoveredRef.current = nearest
            setTooltip({ star: nearest, x: nearest.x, y: nearest.y })
          }
        } else if (hoveredRef.current) {
          hoveredRef.current = null
          setTooltip(null)
        }

        // Shooting stars
        const interval = Math.max(2000, 8000 - (now - lastShoot.current) * 0.1)
        if (now - lastShoot.current > interval + Math.random() * 5000) {
          const angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.3
          const speed = 6 + Math.random() * 8
          shootersRef.current.push({
            x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.3,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 0, maxLife: (isMobile ? 20 : 40) + Math.random() * (isMobile ? 15 : 30), tail: [],
          })
          lastShoot.current = now
        }
        shootersRef.current = shootersRef.current.filter(s => {
          s.life++
          s.tail.push({ x: s.x, y: s.y })
          if (s.tail.length > (isMobile ? 10 : 25)) s.tail.shift()
          s.x += s.vx; s.y += s.vy
          const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8)
          hg.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
          hg.addColorStop(0.3, 'rgba(200, 180, 255, 0.4)')
          hg.addColorStop(1, 'transparent')
          ctx.fillStyle = hg
          ctx.beginPath()
          ctx.arc(s.x, s.y, 8, 0, Math.PI * 2)
          ctx.fill()
          for (let i = 0; i < s.tail.length; i++) {
            const t = s.tail[i]
            ctx.beginPath()
            ctx.arc(t.x, t.y, 1 + (i / s.tail.length) * 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(200, 180, 255, ${(i / s.tail.length) * 0.6})`
            ctx.fill()
          }
          return s.life < s.maxLife && s.x > -20 && s.x < w + 20 && s.y > -20 && s.y < h + 20
        })

        // Random cosmic event (less frequent on mobile)
        if (!evRef.current.active && now - lastEvent.current > (isMobile ? 45000 : 15000) + Math.random() * (isMobile ? 35000 : 25000)) {
          evRef.current = {
            active: true, x: Math.random() * w, y: 50 + Math.random() * (h * 0.4),
            progress: 0, type: Math.random() > 0.5 ? 'streak' : 'bubble', bubbleR: 0,
          }
          lastEvent.current = now
        }
        if (evRef.current.active) {
          const ev = evRef.current
          ev.progress += 0.008
          if (ev.type === 'streak') {
            const sx = ev.x - 100, sy = ev.y
            const ex = ev.x + ev.progress * 600
            const alpha = Math.sin(ev.progress * Math.PI) * 0.5
            const g = ctx.createLinearGradient(sx, sy, ex, sy)
            g.addColorStop(0, 'transparent')
            g.addColorStop(0.1, `rgba(200, 180, 255, ${alpha * 0.1})`)
            g.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`)
            g.addColorStop(0.9, `rgba(200, 180, 255, ${alpha * 0.1})`)
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g
            ctx.fillRect(sx, sy - 1.5, ex - sx, 3)
            if (alpha > 0.05) {
              ctx.fillStyle = `rgba(180, 160, 255, ${alpha * 0.08})`
              ctx.fillRect(sx, sy - 20, ex - sx, 40)
            }
            if (ev.progress >= 1) ev.active = false
          } else {
            ev.bubbleR = ev.progress * 120
            const ba = Math.sin(ev.progress * Math.PI) * 0.15
            ctx.beginPath()
            ctx.arc(ev.x, ev.y, ev.bubbleR, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(180, 160, 255, ${ba})`
            ctx.lineWidth = 1.5
            ctx.stroke()
            if (ba > 0.01) {
              const bg = ctx.createRadialGradient(ev.x, ev.y, 0, ev.x, ev.y, ev.bubbleR)
              bg.addColorStop(0, `rgba(255, 255, 255, ${ba * 0.3})`)
              bg.addColorStop(0.5, `rgba(180, 160, 255, ${ba * 0.1})`)
              bg.addColorStop(1, 'transparent')
              ctx.fillStyle = bg
              ctx.beginPath()
              ctx.arc(ev.x, ev.y, ev.bubbleR, 0, Math.PI * 2)
              ctx.fill()
            }
            const pCount = Math.floor(ev.progress * (isMobile ? 30 : 80))
            for (let i = 0; i < pCount; i++) {
              const angle = Math.random() * Math.PI * 2
              const dist = Math.random() * ev.bubbleR
              ctx.beginPath()
              ctx.arc(ev.x + Math.cos(angle) * dist, ev.y + Math.sin(angle) * dist, Math.random() * 1.5 + 0.5, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
              ctx.fill()
            }
            if (ev.progress >= 1) ev.active = false
          }
        }

        // New star birth animation
        newStarsRef.current = newStarsRef.current.filter(ns => {
          const elapsed = now - ns.t
          if (elapsed > 3000) return false
          const p = Math.min(elapsed / 3000, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          const glowR = 2 + eased * 22
          const g = ctx.createRadialGradient(ns.x, ns.y, 0, ns.x, ns.y, glowR)
          g.addColorStop(0, `rgba(255, 255, 255, ${(1 - eased) * 0.8})`)
          g.addColorStop(0.3, `rgba(180, 160, 255, ${(1 - eased) * 0.3})`)
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(ns.x, ns.y, glowR, 0, Math.PI * 2)
          ctx.fill()
          const coreR = 0.5 + eased * 2.5
          ctx.beginPath()
          ctx.arc(ns.x, ns.y, coreR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + eased * 0.5})`
          ctx.fill()
          if (elapsed < 1500) {
            const pp = elapsed / 1500
            for (let i = 0; i < 14; i++) {
              const angle = (i / 14) * Math.PI * 2 + pp * 2
              const dist = 5 + pp * 28
              ctx.beginPath()
              ctx.arc(ns.x + Math.cos(angle) * dist, ns.y + Math.sin(angle) * dist, 1.5 * (1 - pp), 0, Math.PI * 2)
              ctx.fillStyle = `rgba(180, 160, 255, ${0.6 * (1 - pp)})`
              ctx.fill()
            }
          }
          return true
        })

        frame = requestAnimationFrame(animate)
      }

      animate(0)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', resize)
        window.removeEventListener('mousemove', onGlobalMouse)
        window.removeEventListener('mouseleave', onGlobalLeave)
        window.removeEventListener('click', onGlobalClick)
      }
    }, [])

    return (
      <>
        <canvas
          ref={canvasRef}
          className="fixed inset-0"
          style={{ zIndex: 0, cursor: tooltip ? 'pointer' : 'default' }}
        />
        {tooltip && (
          <div
            ref={tooltipRef}
            className="fixed z-50 pointer-events-none"
            style={{
              left: Math.min(tooltip.x, window.innerWidth - 260),
              top: tooltip.y - 80,
            }}
          >
            <div className="glass rounded-xl px-4 py-3 max-w-[240px]">
              {(() => {
                const bp = matchBlueprint(tooltip.star.content)
                return (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-300 text-xs font-bold">✦ 梦想之星</span>
                      <span className="text-yellow-400 text-xs">{'❤️'.repeat(Math.min(tooltip.star.likes, 3))}{tooltip.star.likes > 3 ? '+' : ''}</span>
                    </div>
                    {bp && (
                      <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30">
                        <span className="text-xs">{bp.icon}</span>
                        <span className="text-[10px] text-violet-300 font-medium">AI 蓝图 · {bp.name}</span>
                      </div>
                    )}
                    <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                      {tooltip.star.content}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">— {tooltip.star.nickname}</p>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </>
    )
  }
)

Universe.displayName = 'Universe'

export default Universe
