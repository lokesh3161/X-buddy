import React from 'react'
import { motion } from 'framer-motion'
import TrustStats from './TrustStats'
import BlurText from './BlurText'
import { ArrowRight, Sparkles, FileText } from 'lucide-react'

export default function Hero({ onGetStarted, onResumeBuilder }) {
  return (
    <section className="relative min-h-[85vh] flex flex-col justify-between pt-12 pb-16 px-4 overflow-hidden bg-white">
      {/* Soft Orange Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] hero-glow-center rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] hero-glow-accent rounded-full pointer-events-none z-0" />
      
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none z-0" />

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto w-full relative z-10 my-auto text-center flex flex-col items-center">
        
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-amber-50 shadow-sm text-slate-800 text-xs font-semibold mb-6 group cursor-default"
        >
          <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
          <span className="text-[#F7931E] font-bold">⚡ Next-Gen</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Smart Campus Infrastructure Platform</span>
        </motion.div>

        {/* Hero Title with BlurText */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-4">
          <BlurText
            text="X Buddy"
            delay={100}
            animateBy="words"
            direction="top"
            className="gradient-text-orange"
            as="span"
          />
        </h1>

        {/* Title Subhead with BlurText */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-6">
          <BlurText
            text="One Kiosk. Endless Services."
            delay={80}
            animateBy="words"
            direction="top"
            as="span"
          />
        </h2>

        {/* Subtitle Copy with BlurText */}
        <BlurText
          text="Print, scan, generate documents, make secure payments, and access essential campus services—all from one intelligent smart kiosk."
          delay={35}
          animateBy="words"
          direction="top"
          className="text-slate-600 text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-4 max-w-2xl mx-auto"
          as="p"
        />

        {/* Powered By Tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 mb-10"
        >
          <span>Powered by NextGen Labs</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F7931E]" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto mb-14"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F7931E] to-[#FF6B00] text-white font-bold text-base glow-orange-button transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <span>Print Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResumeBuilder}
            className="px-7 py-4 rounded-2xl bg-white hover:bg-orange-50/50 text-slate-800 font-bold text-base border border-orange-200/90 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Build Resume</span>
            <Sparkles className="w-4 h-4 text-[#F7931E]" />
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="#academic-toolkit"
            className="px-7 py-4 rounded-2xl bg-white hover:bg-orange-50/50 text-slate-700 font-bold text-base border border-orange-200/90 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Academic Toolkit</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </motion.a>
        </motion.div>

        {/* Trust Statistics Section */}
        <TrustStats />
      </div>
    </section>
  )
}
