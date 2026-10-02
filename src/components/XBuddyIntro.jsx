import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * XBuddyIntro
 * Cinematic, full-viewport brand intro video player.
 *
 * Rules:
 * - Plays /assets/xbuddy-intro.mp4 on initial fresh visit.
 * - Sits as a non-blocking overlay above the pre-rendered website.
 * - Autoplays muted and inline with zero browser player controls.
 * - Smoothly fades into the homepage when the video finishes (onEnded).
 * - Has an unobtrusive Skip button.
 * - Graceful fallback on autoplay error, timeout, or prefers-reduced-motion.
 * - Completely unmounts from DOM after fade-out to prevent memory leaks.
 */
export default function XBuddyIntro({ onComplete }) {
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)
  const [fallbackTriggered, setFallbackTriggered] = useState(false)
  const timerRef = useRef(null)

  // Complete and transition out
  const handleTransitionOut = () => {
    if (!isVisible) return
    setIsVisible(false)
    try {
      sessionStorage.setItem('xbuddy_intro_seen', 'true')
    } catch {}
    
    // Pause and clean up video resources
    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {}
    }

    // Allow fade animation to finish before notifying parent to unmount
    setTimeout(() => {
      onComplete?.()
    }, 600)
  }

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        // Skip video immediately for reduced-motion users
        handleTransitionOut()
        return
      }
    }

    const video = videoRef.current
    if (!video) return

    // 2. Autoplay attempt
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setHasStartedPlaying(true)
        })
        .catch(() => {
          // Autoplay blocked by browser policy -> trigger quick fallback
          console.warn('[XBuddyIntro] Autoplay blocked, falling back to homepage.')
          setFallbackTriggered(true)
          const fbTimer = setTimeout(handleTransitionOut, 600)
          return () => clearTimeout(fbTimer)
        })
    }

    // 3. Stalls/freeze safety fallback: if video doesn't play or end within 13 seconds
    timerRef.current = setTimeout(() => {
      if (isVisible) {
        handleTransitionOut()
      }
    }, 13000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // When video reaches end naturally
  const handleVideoEnded = () => {
    // Brief hold on final brand frame (200ms) for cinematic feel, then fade out
    setTimeout(() => {
      handleTransitionOut()
    }, 200)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="xbuddy-intro-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden select-none pointer-events-auto"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle brand glow behind video */}
          <div className="absolute inset-0 bg-radial-at-c from-orange-950/20 via-black to-black pointer-events-none" />

          {/* Minimal Unobtrusive Skip Button */}
          <button
            type="button"
            onClick={handleTransitionOut}
            className="absolute top-5 right-5 sm:top-7 sm:right-7 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white text-xs font-semibold tracking-wide backdrop-blur-md border border-white/15 transition-all shadow-lg cursor-pointer"
            aria-label="Skip Intro Animation"
          >
            <span>Skip</span>
            <span className="text-[10px] opacity-70">✕</span>
          </button>

          {/* Fallback Poster Card (visible if video decoding stalls) */}
          {fallbackTriggered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute z-10 text-center px-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F7931E] to-amber-400 flex items-center justify-center font-black text-white text-2xl shadow-xl mx-auto mb-3">
                X
              </div>
              <h2 className="text-xl font-black text-white tracking-wider">X BUDDY</h2>
              <p className="text-xs text-orange-400 font-medium tracking-widest uppercase mt-1">Smart Digital Printing</p>
            </motion.div>
          )}

          {/* The Intro Video */}
          <video
            ref={videoRef}
            src="/assets/xbuddy-intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onError={() => {
              console.warn('[XBuddyIntro] Video failed to load, transitioning to homepage.')
              handleTransitionOut()
            }}
            onPlaying={() => setHasStartedPlaying(true)}
            className={`w-full h-full object-contain md:object-cover transition-opacity duration-300 ${
              hasStartedPlaying ? 'opacity-100' : 'opacity-90'
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
