import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

export function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('has-seen-offhours-intro')
    }
    return true
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem('has-seen-offhours-intro', 'true')
    }, 3200)

    return () => clearTimeout(timer)
  }, [isVisible])

  // Canvas particle animation representing shifting times & luxury space vibes
  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Particles configuration
    const particleCount = 60
    const particles: Array<{
      x: number
      y: number
      radius: number
      angle: number
      speed: number
      distance: number
      opacity: number
      pulseSpeed: number
      pulseVal: number
    }> = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 1.5 + 0.5,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.002 + 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        distance: Math.random() * Math.min(width, height) * 0.4 + 20,
        opacity: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseVal: Math.random() * Math.PI,
      })
    }

    // Main draw loop
    const draw = () => {
      ctx.fillStyle = 'rgba(11, 15, 26, 0.2)' // Smooth tail effect
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2

      // Draw elegant luxury concentric orbits (Clock/Time motif)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.03)' // accent pink-soft
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(20, 184, 166, 0.03)' // accent teal-soft
      ctx.beginPath()
      ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 240, 0, Math.PI * 2)
      ctx.stroke()

      // Draw clock tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      for (let j = 0; j < 12; j++) {
        const tickAngle = (j * Math.PI) / 6
        const startDist = 75
        const endDist = 85
        ctx.beginPath()
        ctx.moveTo(
          centerX + Math.cos(tickAngle) * startDist,
          centerY + Math.sin(tickAngle) * startDist
        )
        ctx.lineTo(centerX + Math.cos(tickAngle) * endDist, centerY + Math.sin(tickAngle) * endDist)
        ctx.stroke()
      }

      // Draw particles
      particles.forEach((p) => {
        p.angle += p.speed
        p.pulseVal += p.pulseSpeed
        const currentDistance = p.distance + Math.sin(p.pulseVal) * 10

        p.x = centerX + Math.cos(p.angle) * currentDistance
        p.y = centerY + Math.sin(p.angle) * currentDistance

        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (0.6 + Math.sin(p.pulseVal) * 0.4)})`
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0 // Reset
      })

      // Elegant matching lines between close particles
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)' // Matching lines
      ctx.lineWidth = 0.5
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(15px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b0f1a] overflow-hidden select-none"
        >
          {/* Subtle gradient light background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.08)_0%,rgba(11,15,26,0)_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.04)_0%,rgba(11,15,26,0)_50%)] pointer-events-none" />

          {/* Particle Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
          />

          {/* Central Logo & Text */}
          <div className="relative flex flex-col items-center z-10">
            {/* Ambient Pulse Ring */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-48 h-48 rounded-full border border-teal-500/20 blur-sm pointer-events-none"
            />

            {/* Glowing Logo Circle */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.15)] group"
            >
              {/* Inner Glowing Line */}
              <div className="absolute inset-0.5 rounded-[14px] bg-[#0b0f1a]/85" />

              <span className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-rose-400 serif">
                오
              </span>

              {/* Accent Lights */}
              <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-rose-500 animate-ping" />
            </motion.div>

            {/* Typography */}
            <div className="mt-8 text-center flex flex-col items-center">
              <div className="flex items-center gap-2">
                <motion.h1
                  initial={{ letterSpacing: '0.4em', filter: 'blur(8px)', opacity: 0 }}
                  animate={{ letterSpacing: '0.15em', filter: 'blur(0px)', opacity: 1 }}
                  transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-3xl font-bold uppercase tracking-[0.15em] text-white"
                >
                  Offhours
                </motion.h1>
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  className="px-2 py-0.5 text-[9px] font-bold border border-rose-500/50 text-rose-400 rounded-full tracking-normal uppercase"
                >
                  Beta
                </motion.span>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ delay: 0.8, duration: 1.0 }}
                className="mt-3 text-xs text-slate-400 tracking-[0.2em] font-light max-w-xs leading-relaxed"
              >
                비어 있던 그 시간, 가장 멋진 공간이 됩니다.
              </motion.p>
            </div>
          </div>

          {/* Bottom Progress Line */}
          <div className="absolute bottom-16 w-32 h-[1px] bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 3.0, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-teal-500 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
