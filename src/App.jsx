import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Hero from './components/Hero'
import Workflow from './components/Workflow'
import WhyXBuddy from './components/WhyXBuddy'
import PerfectFor from './components/PerfectFor'
import UploadSection from './components/UploadSection'
import PrintSettings from './components/PrintSettings'
import PriceCard from './components/PriceCard'
import PaymentModal from './components/PaymentModal'
import PrintStatus from './components/PrintStatus'
import AcademicToolkit from './components/AcademicToolkit'
import { calcTotal } from './utils/pricing'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()
import { processFile } from './utils/fileProcessor'

import ResumeBuilder from './resume-builder/ResumeBuilder'

const STEP = { HERO: 'hero', UPLOAD: 'upload', SETTINGS: 'settings', PRINTING: 'printing', RESUME: 'resume' }
const DEFAULT_SETTINGS = {
  colorMode: 'bw', sideMode: 'single', copies: 1,
  pageSize: 'A4', orientation: 'portrait', margins: 'normal',
  pageRange: 'all', customPages: '', imageFit: 'fit',
}

async function getPageCountFromFile(file) {
  try {
    const result = await processFile(file)
    return result.totalPages
  } catch {
    // fallback for PDF
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    return pdf.numPages
  }
}

export default function App() {
  const [step, setStep]               = useState(STEP.HERO)
  const [fileInfo, setFileInfo]       = useState(null)
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [showPayment, setShowPayment] = useState(false)
  const [orderId, setOrderId]         = useState(null)
  const settingsRef = useRef(null)

  const total = fileInfo
    ? calcTotal({ totalPages: fileInfo.totalPages, colorMode: settings.colorMode, isDoubleSide: settings.sideMode === 'double', copies: settings.copies })
    : 0

  const orderMeta = fileInfo
    ? {
        fileName: fileInfo.name, totalPages: fileInfo.totalPages,
        copies: settings.copies,
        printType: settings.colorMode === 'color' ? 'Color' : 'B&W',
        printSide: settings.sideMode === 'double' ? 'Double' : 'Single',
        pageSize: settings.pageSize, orientation: settings.orientation,
        margins: settings.margins, pageRange: settings.pageRange,
        customPages: settings.customPages, imageFit: settings.imageFit,
        amount: total, pdfFile: fileInfo.file,
        requiresAgent: fileInfo.requiresAgent || false,
      }
    : null

  async function handleFileReady(info) {
    setFileInfo(info)
    setStep(STEP.SETTINGS)
    setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function handleExternalPrint(fileOrUrl, name) {
    let file
    if (typeof fileOrUrl === 'string') {
      const res  = await fetch(fileOrUrl)
      const blob = await res.blob()
      file = new File([blob], name + '.pdf', { type: 'application/pdf' })
    } else {
      file = fileOrUrl
    }
    const result = await processFile(file)
    setFileInfo({ file: result.pdfBlob, originalFile: file, name: file.name, size: '', totalPages: result.totalPages, thumbnail: result.thumbnail, typeInfo: { label: 'PDF', icon: '📄', category: 'document' }, requiresAgent: false })
    setStep(STEP.SETTINGS)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }

  function handleOrderSuccess(id) {
    setOrderId(id)
    setShowPayment(false)
    setStep(STEP.PRINTING)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleReset() {
    setStep(STEP.HERO)
    setFileInfo(null)
    setSettings(DEFAULT_SETTINGS)
    setShowPayment(false)
    setOrderId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-100 selection:text-[#F7931E]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2.5 group text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F7931E] to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-base tracking-wider">X</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-extrabold text-lg leading-none tracking-tight group-hover:text-[#F7931E] transition-colors">
                X Buddy
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Smart Kiosk Platform
              </span>
            </div>
          </button>

          {step === STEP.HERO ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
                <a href="#how-it-works" className="hover:text-[#F7931E] transition-colors">How It Works</a>
                <a href="#why-x-buddy" className="hover:text-[#F7931E] transition-colors">Why X Buddy</a>
                <a href="#perfect-for" className="hover:text-[#F7931E] transition-colors">Who Is It For</a>
                <a href="#academic-toolkit" className="hover:text-[#F7931E] transition-colors">Academic Toolkit</a>
                <button onClick={() => setStep(STEP.RESUME)} className="hover:text-[#F7931E] transition-colors">
                  Resume Builder
                </button>
              </div>
              <button
                onClick={() => setStep(STEP.UPLOAD)}
                className="px-5 py-2 bg-gradient-to-r from-[#F7931E] to-[#FF6B00] hover:from-[#FF9C26] hover:to-[#EB740A] text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
              >
                Print Now →
              </button>
            </div>
          ) : step === STEP.RESUME ? (
            <button
              onClick={handleReset}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              ← Back to Home
            </button>
          ) : (
            <div className="flex items-center gap-3 text-xs font-semibold">
              {['Upload', 'Settings', 'Pay & Print'].map((label, i) => {
                const stepKeys = [STEP.UPLOAD, STEP.SETTINGS, STEP.PRINTING]
                const isPast   = step === STEP.PRINTING && i < 2
                const isActive = step === stepKeys[i]
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg ${isPast ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : isActive ? 'bg-orange-50 text-[#F7931E] border border-orange-200' : 'text-slate-400'}`}>
                      {isPast ? '✓' : `${i + 1}.`} {label}
                    </span>
                    {i < 2 && <span className="text-slate-300">›</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {step === STEP.HERO && (
            <motion.div key="hero" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              {/* Hero Section */}
              <Hero onGetStarted={() => setStep(STEP.UPLOAD)} onResumeBuilder={() => setStep(STEP.RESUME)} />
              
              {/* Timeline Section */}
              <div id="how-it-works">
                <Workflow onStartPrint={() => setStep(STEP.UPLOAD)} />
              </div>

              {/* Feature Grid */}
              <div id="why-x-buddy">
                <WhyXBuddy />
              </div>

              {/* Perfect For Section */}
              <div id="perfect-for">
                <PerfectFor />
              </div>

              {/* Academic Toolkit Section */}
              <div id="academic-toolkit" className="border-t border-orange-100/60 bg-gradient-to-b from-white via-orange-50/20 to-white">
                <AcademicToolkit onPrint={handleExternalPrint} />
              </div>

              {/* Premium Footer */}
              <footer className="border-t border-orange-100 bg-white py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F7931E] flex items-center justify-center text-white font-bold text-sm">
                      X
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm">X Buddy</p>
                      <p className="text-slate-400 text-xs">Next-Generation Smart Campus Infrastructure Platform</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Powered by <strong className="text-slate-700 font-semibold">NextGen Labs</strong></span>
                    <span className="w-1 h-1 rounded-full bg-[#F7931E]" />
                    <span>© {new Date().getFullYear()} All Rights Reserved.</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {(step === STEP.UPLOAD || step === STEP.SETTINGS) && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadSection onFileReady={handleFileReady} />
              <AnimatePresence>
                {fileInfo && step === STEP.SETTINGS && (
                  <motion.div ref={settingsRef} key="settings" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <PrintSettings fileInfo={fileInfo} settings={settings} onChange={setSettings} />
                    <PriceCard fileInfo={fileInfo} settings={settings} onPayAndPrint={() => setShowPayment(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === STEP.RESUME && (
            <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: 'calc(100vh - 4rem)' }}>
              <ResumeBuilder onPrint={handleExternalPrint} onBack={handleReset} />
            </motion.div>
          )}

          {step === STEP.PRINTING && (
            <motion.div key="printing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PrintStatus fileInfo={fileInfo} settings={settings} orderId={orderId} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showPayment && (
        <PaymentModal total={total} orderMeta={orderMeta} onSuccess={handleOrderSuccess} onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}
