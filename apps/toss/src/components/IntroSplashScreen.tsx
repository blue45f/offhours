import { useEffect, useRef, useState } from 'react'

interface NeonStar {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  pulseSpeed: number
  angle: number
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const destroyTimer = setTimeout(() => setIsVisible(false), 2700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const stars: NeonStar[] = []
    const colors = [
      'rgb(244, 63, 94)',  // Rose Pink
      'rgb(6, 182, 212)',  // Cyan
      'rgb(168, 85, 247)', // Purple
    ]

    for (let i = 0; i < 35; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        r: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        pulseSpeed: Math.random() * 0.05 + 0.02,
        angle: Math.random() * Math.PI * 2,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let frame = 0
    const render = () => {
      frame++
      ctx.fillStyle = '#090514' // Cyber Neon City Night Background
      ctx.fillRect(0, 0, width, height)

      // Draw neon elements
      stars.forEach((s) => {
        if (!s) return
        s.x += s.vx
        s.y += s.vy
        s.angle += s.pulseSpeed

        if (s.x < 0 || s.x > width) s.vx *= -1
        if (s.y < 0 || s.y > height) s.vy *= -1

        const currentR = s.r * (1 + Math.sin(s.angle) * 0.25)

        ctx.beginPath()
        ctx.arc(s.x, s.y, currentR, 0, Math.PI * 2)
        ctx.shadowBlur = 15
        ctx.shadowColor = s.color
        ctx.fillStyle = s.color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Main Text
      const text = 'OFF HOURS'
      ctx.font = '900 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '7px'
      ctx.fillStyle = '#ffffff'
      
      ctx.shadowBlur = 12
      ctx.shadowColor = 'rgb(244, 63, 94)'

      const progress = Math.min(frame / 40, 1)
      const currentText = text.substring(0, Math.floor(text.length * progress))
      ctx.fillText(currentText, width / 2, height / 2)
      ctx.shadowBlur = 0

      // Sub
      ctx.font = '500 10px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillStyle = 'rgb(6, 182, 212)'
      ctx.fillText('AFTERWORK EVENT CLUB', width / 2, height / 2 + 32)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090514',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
