import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * XBuddyIntro
 * 
 * 6-7 second cinematic website intro built natively with Framer Motion and SVG.
 * 
 * Timeline:
 * - Scene 1 (0.0 - 1.2s): Character A ("/") enters from LEFT carrying printed papers.
 * - Scene 2 (1.2 - 2.4s): Character B ("\") enters from RIGHT carrying print package.
 * - Scene 3 (2.4 - 3.5s): Both approach center, slow down, glance at each other.
 * - Scene 4 (3.5 - 4.5s): Physical Crossing: "/" rotates CW (+45°), "\" rotates CCW (-45°).
 *                         They physically cross through the center to form the iconic "X" with impact pulse.
 * - Scene 5 (4.5 - 5.2s): The unified "X" settles into place with playful bounce and soft shadow.
 * - Scene 6 (5.2 - 6.1s): Reveal "Buddy" beside the X -> "XBuddy" lockup.
 * - Scene 7 (6.1 - 7.0s): Reveal "Upload • Pay • Print" tagline underneath.
 * - Final Transition: Smooth fade out (500ms) revealing the pre-rendered homepage.
 */
export default function XBuddyIntro({ onComplete }) {
  // Animation phases:
  // 1: Scene 1 (Char A enters)
  // 2: Scene 2 (Char B enters)
  // 3: Scene 3 (Approach & anticipation)
  // 4: Scene 4 (Physical crossing / + \ -> X)
  // 5: Scene 5 (X settles & shifts)
  // 6: Scene 6 (Buddy appears beside X)
  // 7: Scene 7 (Tagline appears)
  // 8: Exit (fade out overlay)
  const [phase, setPhase] = useState(1)
  const [isVisible, setIsVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timerRefs = useRef([])

  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t))
    timerRefs.current = []
  }

  // Handle immediate or natural transition out
  const handleTransitionOut = () => {
    if (!isVisible) return
    setIsVisible(false)
    clearAllTimers()

    // Save session flag so internal navigation does not replay intro
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('xbuddy_intro_seen', 'true')
      }
    } catch {}

    // Allow 500ms exit fade before unmounting
    setTimeout(() => {
      onComplete?.()
    }, 550)
  }

  useEffect(() => {
    // 1. Accessibility: Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        setReducedMotion(true)
        // Show static logo briefly then fade out
        const t = setTimeout(() => {
          handleTransitionOut()
        }, 1400)
        timerRefs.current.push(t)
        return
      }
    }

    // 2. Cinematic Timeline Orchestration
    const schedule = [
      { p: 2, t: 1200 }, // 1.2s: Char B enters
      { p: 3, t: 2400 }, // 2.4s: Both approach center
      { p: 4, t: 3500 }, // 3.5s: Physical crossing into "X"
      { p: 5, t: 4500 }, // 4.5s: X settles & shifts left
      { p: 6, t: 5200 }, // 5.2s: "Buddy" appears
      { p: 7, t: 6100 }, // 6.1s: Tagline appears
      { p: 8, t: 7100 }, // 7.1s: Exit fade out
    ]

    schedule.forEach(({ p, t }) => {
      const timeout = setTimeout(() => {
        setPhase(p)
        if (p === 8) {
          handleTransitionOut()
        }
      }, t)
      timerRefs.current.push(timeout)
    })

    return () => {
      clearAllTimers()
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="xbuddy-intro-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FAF8F5] select-none overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle Ambient Background Gradients & Grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFE6] pointer-events-none" />
          
          {/* Soft warm glow in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-200/40 via-amber-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#F7931E 0.75px, transparent 0.75px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Minimal Unobtrusive "Skip" Control */}
          <button
            type="button"
            onClick={handleTransitionOut}
            className="absolute top-5 right-5 sm:top-7 sm:right-7 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 active:scale-95 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-wide backdrop-blur-md border border-slate-300/50 transition-all shadow-xs cursor-pointer"
            aria-label="Skip Intro Animation"
          >
            <span>Skip</span>
            <span className="text-[10px] text-slate-400">✕</span>
          </button>

          {/* REDUCED MOTION FALLBACK */}
          {reducedMotion ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 flex flex-col items-center justify-center text-center p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F7931E] to-[#FFB703] flex items-center justify-center shadow-xl shadow-orange-500/25">
                  <span className="text-white font-extrabold text-3xl tracking-wider">X</span>
                </div>
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  Buddy
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold tracking-widest text-slate-500 uppercase">
                Upload <span className="text-[#F7931E]">•</span> Pay <span className="text-[#F7931E]">•</span> Print
              </p>
            </motion.div>
          ) : (
            /* FULL NATIVE FRAMER MOTION & SVG CINEMATIC INTRO */
            <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col items-center justify-center">
              
              {/* Dynamic Stage Canvas */}
              <div className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center">
                
                {/* 1. Ground Shadow Container */}
                <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md h-6 pointer-events-none flex items-center justify-center">
                  {/* Shadow for Character A */}
                  {phase < 4 && (
                    <motion.div
                      animate={{
                        x: phase === 1 ? [-220, -110] : phase === 2 ? -110 : -45,
                        scaleX: [1, 1.25, 0.9, 1.15, 1],
                        opacity: [0.15, 0.35, 0.25, 0.35],
                      }}
                      transition={{
                        x: { duration: phase === 1 ? 1.1 : 0.8, ease: 'easeOut' },
                        scaleX: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' },
                        opacity: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      className="w-20 h-4 bg-slate-900/20 rounded-full blur-xs"
                    />
                  )}

                  {/* Shadow for Character B */}
                  {phase >= 2 && phase < 4 && (
                    <motion.div
                      initial={{ x: 220, opacity: 0 }}
                      animate={{
                        x: phase === 2 ? [220, 110] : 45,
                        scaleX: [1, 1.2, 0.95, 1.15, 1],
                        opacity: [0.15, 0.35, 0.25, 0.35],
                      }}
                      transition={{
                        x: { duration: phase === 2 ? 1.1 : 0.8, ease: 'easeOut' },
                        scaleX: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' },
                        opacity: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      className="w-20 h-4 bg-slate-900/20 rounded-full blur-xs"
                    />
                  )}

                  {/* Unified Hero X Shadow (Phase 4+) */}
                  {phase >= 4 && (
                    <motion.div
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{
                        scale: phase === 4 ? [0.4, 1.3, 1] : 1,
                        x: phase >= 5 ? -78 : 0, // shifts with X in Phase 5+
                        opacity: 0.3,
                      }}
                      transition={{
                        scale: { duration: 0.5, ease: 'backOut' },
                        x: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                      }}
                      className="w-28 h-5 bg-orange-950/25 rounded-full blur-xs"
                    />
                  )}
                </div>

                {/* 2. Hero Characters Stage */}
                <div className="relative flex items-center justify-center">

                  {/* Impact Burst Ring on Physical Fusion (Phase 4) */}
                  {phase >= 4 && (
                    <motion.div
                      initial={{ scale: 0.2, opacity: 1 }}
                      animate={{ scale: [0.3, 2.4], opacity: [0.9, 0] }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      className="absolute w-28 h-28 rounded-full border-4 border-[#F7931E]/60 bg-gradient-to-tr from-[#F7931E]/20 to-amber-300/10 pointer-events-none z-0"
                    />
                  )}

                  {/* Sparkle Confetti on Fusion */}
                  {phase >= 4 && (
                    <div className="absolute pointer-events-none z-20">
                      {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos((deg * Math.PI) / 180) * 65,
                            y: Math.sin((deg * Math.PI) / 180) * 65,
                            scale: [0, 1.2, 0],
                            opacity: [1, 0.8, 0],
                          }}
                          transition={{ duration: 0.6, delay: idx * 0.03, ease: 'easeOut' }}
                          className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#F7931E] to-amber-300 shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  {/* MAIN BRAND LOCKUP CONTAINER */}
                  <motion.div
                    animate={{
                      // In phase 5+, the whole lockup positions seamlessly
                      x: 0,
                    }}
                    className="relative flex items-center justify-center"
                  >

                    {/* CHARACTER A ("/" forward diagonal runner) */}
                    <motion.div
                      initial={{ x: -280, y: 0, opacity: 0 }}
                      animate={{
                        // Coordinates over the scenes:
                        // Scene 1: Enters from left to -110px
                        // Scene 2: Idles at -110px with running bounce
                        // Scene 3: Approaches to -45px
                        // Scene 4: Physically crosses center into X (x: 0, rotate: 45°)
                        // Scene 5+: Moves left to -78px alongside "Buddy"
                        x:
                          phase === 1
                            ? -110
                            : phase === 2
                            ? -110
                            : phase === 3
                            ? -45
                            : phase === 4
                            ? 0
                            : -78,
                        y:
                          phase === 1
                            ? [0, -8, 0, -8, 0]
                            : phase === 2
                            ? [0, -5, 0, -5, 0]
                            : phase === 3
                            ? [0, -6, 0]
                            : phase === 4
                            ? [-10, 3, -1, 0]
                            : 0,
                        rotate:
                          phase < 4
                            ? 25 // Natural "/" running angle
                            : 45, // Exact 45° angle for hero "X"
                        scale:
                          phase === 4
                            ? [1.0, 1.18, 0.95, 1.05, 1.0]
                            : phase === 5
                            ? [1.0, 1.04, 1.0]
                            : 1.0,
                        opacity: 1,
                      }}
                      transition={{
                        x: {
                          duration:
                            phase === 1
                              ? 1.05
                              : phase === 3
                              ? 0.85
                              : phase === 4
                              ? 0.5
                              : 0.6,
                          ease:
                            phase === 4
                              ? [0.34, 1.56, 0.64, 1] // Punchy spring connection
                              : [0.16, 1, 0.3, 1],
                        },
                        y: {
                          duration: phase < 4 ? 0.4 : 0.45,
                          repeat: phase < 4 ? Infinity : 0,
                          ease: 'easeInOut',
                        },
                        rotate: {
                          duration: phase === 4 ? 0.45 : 0.3,
                          ease: [0.34, 1.56, 0.64, 1],
                        },
                        scale: { duration: 0.5, ease: 'easeOut' },
                        opacity: { duration: 0.3 },
                      }}
                      className="relative z-10 flex items-center justify-center cursor-default"
                      style={{ transformOrigin: 'center center' }}
                    >
                      {/* Character A SVG Graphic */}
                      <svg
                        width="110"
                        height="160"
                        viewBox="0 0 110 160"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="overflow-visible"
                      >
                        <defs>
                          {/* Rich 3D Gradient for Character A */}
                          <linearGradient id="charAGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFA439" />
                            <stop offset="50%" stopColor="#F7931E" />
                            <stop offset="100%" stopColor="#EA580C" />
                          </linearGradient>

                          {/* Top Gloss Highlight */}
                          <linearGradient id="glossGradA" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Paper Drop Shadow */}
                          <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.18" />
                          </filter>
                        </defs>

                        {/* Motion Wind Trail Lines (Scenes 1 - 3) */}
                        {phase < 4 && (
                          <g className="opacity-70">
                            <motion.line
                              x1="-24"
                              y1="50"
                              x2="-8"
                              y2="50"
                              stroke="#F7931E"
                              strokeWidth="3"
                              strokeLinecap="round"
                              animate={{ x1: [-26, -14, -26], opacity: [0.4, 0.9, 0.4] }}
                              transition={{ duration: 0.35, repeat: Infinity }}
                            />
                            <motion.line
                              x1="-30"
                              y1="75"
                              x2="-10"
                              y2="75"
                              stroke="#FBBF24"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              animate={{ x1: [-32, -18, -32], opacity: [0.3, 0.8, 0.3] }}
                              transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                            />
                            <motion.line
                              x1="-22"
                              y1="100"
                              x2="-6"
                              y2="100"
                              stroke="#F7931E"
                              strokeWidth="2"
                              strokeLinecap="round"
                              animate={{ x1: [-24, -12, -24], opacity: [0.2, 0.7, 0.2] }}
                              transition={{ duration: 0.38, repeat: Infinity, delay: 0.15 }}
                            />
                          </g>
                        )}

                        {/* RUNNING LEGS FOR CHARACTER A (Scenes 1 - 3) */}
                        {phase < 4 && (
                          <g id="legs-a">
                            {/* Left Leg */}
                            <motion.g
                              animate={{
                                rotate: [-24, 28, -24],
                                y: [0, -3, 0],
                              }}
                              transition={{
                                duration: 0.32,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                              style={{ transformOrigin: '46px 130px' }}
                            >
                              <line x1="46" y1="130" x2="42" y2="148" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                              {/* Shoe */}
                              <ellipse cx="40" cy="150" rx="7" ry="4" fill="#0F172A" />
                              <ellipse cx="38" cy="151" rx="4" ry="2" fill="#F7931E" />
                            </motion.g>

                            {/* Right Leg */}
                            <motion.g
                              animate={{
                                rotate: [28, -24, 28],
                                y: [-3, 0, -3],
                              }}
                              transition={{
                                duration: 0.32,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                              style={{ transformOrigin: '64px 130px' }}
                            >
                              <line x1="64" y1="130" x2="68" y2="148" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                              {/* Shoe */}
                              <ellipse cx="70" cy="150" rx="7" ry="4" fill="#0F172A" />
                              <ellipse cx="72" cy="151" rx="4" ry="2" fill="#F7931E" />
                            </motion.g>
                          </g>
                        )}

                        {/* MAIN DIAGONAL "/" CAPSULE BODY */}
                        <g id="body-capsule-a">
                          <rect
                            x="40"
                            y="14"
                            width="30"
                            height="126"
                            rx="15"
                            fill="url(#charAGradient)"
                            className="shadow-md"
                          />

                          {/* 3D Gloss Highlight Stripe */}
                          <rect
                            x="43"
                            y="17"
                            width="10"
                            height="118"
                            rx="5"
                            fill="url(#glossGradA)"
                          />
                        </g>

                        {/* FRIENDLY FACE (Always cute and expressive) */}
                        <g id="face-a">
                          {/* Eyes */}
                          <motion.g
                            animate={{
                              scaleY: [1, 1, 0.1, 1], // Cute blink
                            }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              times: [0, 0.85, 0.9, 1],
                            }}
                            style={{ transformOrigin: '55px 50px' }}
                          >
                            {/* Left Eye */}
                            <circle cx="50" cy="50" r="3.6" fill="#0F172A" />
                            <circle cx="51.2" cy="48.8" r="1.3" fill="#FFFFFF" />

                            {/* Right Eye */}
                            <circle cx="61" cy="50" r="3.6" fill="#0F172A" />
                            <circle cx="62.2" cy="48.8" r="1.3" fill="#FFFFFF" />
                          </motion.g>

                          {/* Happy Cheerful Smile */}
                          <path
                            d="M 50 58 Q 55.5 64 61 58"
                            stroke="#0F172A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                          />

                          {/* Rosy Cheeks */}
                          <circle cx="46" cy="56" r="2.2" fill="#EA580C" opacity="0.4" />
                          <circle cx="65" cy="56" r="2.2" fill="#EA580C" opacity="0.4" />
                        </g>

                        {/* ARMS & CARRIED PRINTED PAPERS (Scenes 1 - 3) */}
                        {phase < 4 && (
                          <g id="arm-and-papers">
                            {/* Back Arm Swinging */}
                            <motion.path
                              d="M 40 70 Q 28 80 32 94"
                              stroke="#EA580C"
                              strokeWidth="5"
                              strokeLinecap="round"
                              animate={{ d: ['M 40 70 Q 28 80 32 94', 'M 40 70 Q 26 65 30 55', 'M 40 70 Q 28 80 32 94'] }}
                              transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Front Arm holding stack of papers */}
                            <motion.g
                              animate={{
                                y: [-1, 2, -1],
                                rotate: [-2, 3, -2],
                              }}
                              transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ transformOrigin: '68px 74px' }}
                            >
                              {/* Arm */}
                              <path
                                d="M 68 74 Q 82 78 88 86"
                                stroke="#EA580C"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <circle cx="88" cy="86" r="3.5" fill="#FFA439" />

                              {/* Stack of Printed Papers with Flutter */}
                              <g filter="url(#paperShadow)" transform="translate(82, 70)">
                                {/* Back Paper Sheet */}
                                <rect
                                  x="3"
                                  y="-2"
                                  width="22"
                                  height="28"
                                  rx="2"
                                  fill="#E2E8F0"
                                  transform="rotate(-6)"
                                />
                                {/* Middle Paper Sheet */}
                                <rect
                                  x="1"
                                  y="0"
                                  width="22"
                                  height="28"
                                  rx="2"
                                  fill="#F1F5F9"
                                  transform="rotate(3)"
                                />
                                {/* Front Main Printed Sheet */}
                                <rect
                                  x="0"
                                  y="2"
                                  width="22"
                                  height="28"
                                  rx="2"
                                  fill="#FFFFFF"
                                  stroke="#CBD5E1"
                                  strokeWidth="0.8"
                                />
                                {/* Paper Content: Header bar & text lines */}
                                <rect x="3" y="5" width="10" height="2.5" rx="1" fill="#F7931E" />
                                <line x1="3" y1="11" x2="19" y2="11" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                                <line x1="3" y1="15" x2="17" y2="15" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                                <line x1="3" y1="19" x2="14" y2="19" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                                <line x1="3" y1="23" x2="18" y2="23" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                              </g>
                            </motion.g>
                          </g>
                        )}
                      </svg>
                    </motion.div>


                    {/* CHARACTER B ("\" backward diagonal runner) */}
                    {/* Appears starting at Scene 2 (Phase >= 2) */}
                    {phase >= 2 && (
                      <motion.div
                        initial={{ x: 280, y: 0, opacity: 0 }}
                        animate={{
                          // Coordinates over the scenes:
                          // Scene 2: Enters from right to +110px
                          // Scene 3: Approaches to +45px
                          // Scene 4: Physically crosses center into X (x: 0, rotate: -45°)
                          // Scene 5+: Moves left to -78px alongside "Buddy"
                          x:
                            phase === 2
                              ? 110
                              : phase === 3
                              ? 45
                              : phase === 4
                              ? 0
                              : -78,
                          y:
                            phase === 2
                              ? [0, -5, 0, -5, 0]
                              : phase === 3
                              ? [0, -6, 0]
                              : phase === 4
                              ? [-10, 3, -1, 0]
                              : 0,
                          rotate:
                            phase < 4
                              ? -25 // Natural "\" running angle
                              : -45, // Exact -45° angle for hero "X"
                          scale:
                            phase === 4
                              ? [1.0, 1.18, 0.95, 1.05, 1.0]
                              : phase === 5
                              ? [1.0, 1.04, 1.0]
                              : 1.0,
                          opacity: 1,
                        }}
                        transition={{
                          x: {
                            duration:
                              phase === 2
                                ? 1.05
                                : phase === 3
                                ? 0.85
                                : phase === 4
                                ? 0.5
                                : 0.6,
                            ease:
                              phase === 4
                                ? [0.34, 1.56, 0.64, 1] // Punchy spring connection
                                : [0.16, 1, 0.3, 1],
                          },
                          y: {
                            duration: phase < 4 ? 0.4 : 0.45,
                            repeat: phase < 4 ? Infinity : 0,
                            ease: 'easeInOut',
                          },
                          rotate: {
                            duration: phase === 4 ? 0.45 : 0.3,
                            ease: [0.34, 1.56, 0.64, 1],
                          },
                          scale: { duration: 0.5, ease: 'easeOut' },
                          opacity: { duration: 0.3 },
                        }}
                        className="absolute z-10 flex items-center justify-center cursor-default"
                        style={{ transformOrigin: 'center center' }}
                      >
                        {/* Character B SVG Graphic */}
                        <svg
                          width="110"
                          height="160"
                          viewBox="0 0 110 160"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="overflow-visible"
                        >
                          <defs>
                            {/* Rich 3D Gradient for Character B */}
                            <linearGradient id="charBGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#FFBA3B" />
                              <stop offset="50%" stopColor="#F7931E" />
                              <stop offset="100%" stopColor="#D97706" />
                            </linearGradient>

                            {/* Top Gloss Highlight */}
                            <linearGradient id="glossGradB" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                            </linearGradient>

                            {/* Folder Drop Shadow */}
                            <filter id="folderShadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="-1" dy="2" stdDeviation="2" floodOpacity="0.18" />
                            </filter>
                          </defs>

                          {/* Motion Wind Trail Lines (Scenes 2 - 3) */}
                          {phase < 4 && (
                            <g className="opacity-70">
                              <motion.line
                                x1="120"
                                y1="50"
                                x2="136"
                                y2="50"
                                stroke="#F7931E"
                                strokeWidth="3"
                                strokeLinecap="round"
                                animate={{ x2: [136, 124, 136], opacity: [0.4, 0.9, 0.4] }}
                                transition={{ duration: 0.35, repeat: Infinity }}
                              />
                              <motion.line
                                x1="118"
                                y1="75"
                                x2="138"
                                y2="75"
                                stroke="#FBBF24"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                animate={{ x2: [138, 126, 138], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                              />
                              <motion.line
                                x1="122"
                                y1="100"
                                x2="134"
                                y2="100"
                                stroke="#F7931E"
                                strokeWidth="2"
                                strokeLinecap="round"
                                animate={{ x2: [134, 122, 134], opacity: [0.2, 0.7, 0.2] }}
                                transition={{ duration: 0.38, repeat: Infinity, delay: 0.15 }}
                              />
                            </g>
                          )}

                          {/* RUNNING LEGS FOR CHARACTER B (Scenes 2 - 3) */}
                          {phase < 4 && (
                            <g id="legs-b">
                              {/* Left Leg */}
                              <motion.g
                                animate={{
                                  rotate: [28, -24, 28],
                                  y: [-3, 0, -3],
                                }}
                                transition={{
                                  duration: 0.32,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                                style={{ transformOrigin: '46px 130px' }}
                              >
                                <line x1="46" y1="130" x2="42" y2="148" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                                <ellipse cx="40" cy="150" rx="7" ry="4" fill="#0F172A" />
                                <ellipse cx="38" cy="151" rx="4" ry="2" fill="#FBBF24" />
                              </motion.g>

                              {/* Right Leg */}
                              <motion.g
                                animate={{
                                  rotate: [-24, 28, -24],
                                  y: [0, -3, 0],
                                }}
                                transition={{
                                  duration: 0.32,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                                style={{ transformOrigin: '64px 130px' }}
                              >
                                <line x1="64" y1="130" x2="68" y2="148" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                                <ellipse cx="70" cy="150" rx="7" ry="4" fill="#0F172A" />
                                <ellipse cx="72" cy="151" rx="4" ry="2" fill="#FBBF24" />
                              </motion.g>
                            </g>
                          )}

                          {/* MAIN DIAGONAL "\" CAPSULE BODY */}
                          <g id="body-capsule-b">
                            <rect
                              x="40"
                              y="14"
                              width="30"
                              height="126"
                              rx="15"
                              fill="url(#charBGradient)"
                              className="shadow-md"
                            />

                            {/* 3D Gloss Highlight Stripe */}
                            <rect
                              x="57"
                              y="17"
                              width="10"
                              height="118"
                              rx="5"
                              fill="url(#glossGradB)"
                            />
                          </g>

                          {/* FRIENDLY FACE FOR CHARACTER B (Scenes 2 - 3) */}
                          {phase < 4 && (
                            <g id="face-b">
                              {/* Eyes looking forward toward Character A */}
                              <motion.g
                                animate={{
                                  scaleY: [1, 1, 0.1, 1],
                                }}
                                transition={{
                                  duration: 2.4,
                                  repeat: Infinity,
                                  times: [0, 0.82, 0.88, 1],
                                }}
                                style={{ transformOrigin: '55px 50px' }}
                              >
                                <circle cx="49" cy="50" r="3.6" fill="#0F172A" />
                                <circle cx="48" cy="48.8" r="1.3" fill="#FFFFFF" />

                                <circle cx="60" cy="50" r="3.6" fill="#0F172A" />
                                <circle cx="59" cy="48.8" r="1.3" fill="#FFFFFF" />
                              </motion.g>

                              {/* Cheerful Smile */}
                              <path
                                d="M 49 58 Q 54.5 64 60 58"
                                stroke="#0F172A"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                              />

                              {/* Rosy Cheeks */}
                              <circle cx="45" cy="56" r="2.2" fill="#D97706" opacity="0.4" />
                              <circle cx="64" cy="56" r="2.2" fill="#D97706" opacity="0.4" />
                            </g>
                          )}

                          {/* ARMS & PRINT ORDER PACKAGE (Scenes 2 - 3) */}
                          {phase < 4 && (
                            <g id="arm-and-package">
                              {/* Back Arm */}
                              <motion.path
                                d="M 70 70 Q 82 80 78 94"
                                stroke="#D97706"
                                strokeWidth="5"
                                strokeLinecap="round"
                                animate={{ d: ['M 70 70 Q 82 80 78 94', 'M 70 70 Q 84 65 80 55', 'M 70 70 Q 82 80 78 94'] }}
                                transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}
                              />

                              {/* Front Arm holding Courier Print Folder/Package */}
                              <motion.g
                                animate={{
                                  y: [-1, 2, -1],
                                  rotate: [2, -3, 2],
                                }}
                                transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '42px 74px' }}
                              >
                                <path
                                  d="M 42 74 Q 28 78 22 86"
                                  stroke="#D97706"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                />
                                <circle cx="22" cy="86" r="3.5" fill="#FFBA3B" />

                                {/* Print Order Package / Kraft Folder */}
                                <g filter="url(#folderShadow)" transform="translate(2, 70)">
                                  <rect
                                    x="0"
                                    y="0"
                                    width="24"
                                    height="28"
                                    rx="3"
                                    fill="#F59E0B"
                                    stroke="#D97706"
                                    strokeWidth="1"
                                  />
                                  {/* Folder flap & stamp */}
                                  <polygon points="0,0 12,10 24,0" fill="#D97706" />
                                  <circle cx="12" cy="16" r="4.5" fill="#FFFFFF" />
                                  <path d="M 10 16 L 14 16 M 12 14 L 12 18" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
                                </g>
                              </motion.g>
                            </g>
                          )}
                        </svg>
                      </motion.div>
                    )}


                    {/* SCENE 6: "Buddy" REVEAL BESIDE THE HERO X */}
                    {phase >= 6 && (
                      <motion.div
                        initial={{ opacity: 0, x: 45, scale: 0.9 }}
                        animate={{
                          opacity: 1,
                          x: 20, // Places directly beside the X
                          scale: 1,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 280,
                          damping: 18, // Clean overshoot bounce
                          mass: 0.8,
                        }}
                        className="flex items-center select-none"
                      >
                        <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-none">
                          Buddy
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* SCENE 7: "Upload • Pay • Print" TAGLINE */}
              {phase >= 7 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base md:text-lg font-bold text-slate-600 tracking-wide mt-2"
                >
                  <span className="hover:text-slate-900 transition-colors">Upload</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7931E] shadow-xs" />
                  <span className="hover:text-slate-900 transition-colors">Pay</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7931E] shadow-xs" />
                  <span className="hover:text-slate-900 transition-colors">Print</span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
