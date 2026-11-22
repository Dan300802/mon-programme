import { useEffect, useRef } from 'react'

const PORTEE = 140

export default function ReseauAnime() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let noeuds = []
    let paquets = []
    let raf = 0

    function lier() {
      const liens = []
      for (let i = 0; i < noeuds.length; i++) {
        for (let j = i + 1; j < noeuds.length; j++) {
          const d = Math.hypot(noeuds[i].x - noeuds[j].x, noeuds[i].y - noeuds[j].y)
          if (d < PORTEE) liens.push([noeuds[i], noeuds[j], d])
        }
      }
      return liens
    }

    function dessiner(liens) {
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      liens.forEach(([a, b, d]) => {
        ctx.strokeStyle = `rgba(129, 140, 248, ${0.3 * (1 - d / PORTEE)})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      })
      ctx.fillStyle = 'rgba(165, 180, 252, 0.9)'
      noeuds.forEach((n) => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#67e8f9'
      paquets.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.6, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0
    }

    function boucle() {
      noeuds.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      })
      const liens = lier()
      if (liens.length && paquets.length < 12 && Math.random() < 0.05) {
        const [a, b] = liens[Math.floor(Math.random() * liens.length)]
        paquets.push({ a, b, t: 0, v: 0.012 + Math.random() * 0.012 })
      }
      paquets.forEach((p) => (p.t += p.v))
      paquets = paquets.filter((p) => p.t < 1)
      dessiner(liens)
      raf = requestAnimationFrame(boucle)
    }

    function init() {
      const dpr = window.devicePixelRatio || 1
      w = canvas.clientWidth
      h = canvas.clientHeight
      if (!w || !h) return
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(80, Math.floor((w * h) / 14000))
      noeuds = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 1,
      }))
      paquets = []
      if (reduit) dessiner(lier())
    }

    init()
    if (!reduit) boucle()
    const ro = new ResizeObserver(init)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="reseau" aria-hidden="true" />
}