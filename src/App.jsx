import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Hero from './components/Hero'
import UploadSection from './components/UploadSection'
import PrintSettings from './components/PrintSettings'
import PriceCard from './components/PriceCard'
import PaymentModal from './components/PaymentModal'
import PrintStatus from './components/PrintStatus'
import { calcTotal } from './utils/pricing'

const STEP = { HERO: 'hero', UPLOAD: 'upload', SETTINGS: 'settings', PRINTING: 'printing' }
const DEFAULT_SETTINGS = { colorMode: 'bw', sideMode: 'single', copies: 1 }

export default function App() {
  const [step, setStep] = useState(STEP.HERO)
  const [fileInfo, setFileInfo] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [showPayment, setShowPayment] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const settingsRef = useRef(null)

  const total = fileInfo
    ? calcTotal({
        totalPages: fileInfo.totalPages,
        colorMode: settings.colorMode,
        isDoubleSide: settings.sideMode === 'double',
        copies: settings.copies,
      })
    : 0

  const orderMeta = fileInfo
    ? {
        fileName: fileInfo.name,
        totalPages: fileInfo.totalPages,
        copies: settings.copies,
        printType: settings.colorMode === 'color' ? 'Color' : 'B&W',
        printSide: settings.sideMode === 'double' ? 'Double' : 'Single',
        amount: total,
        pdfFile: fileInfo.file,
      }
    : null

  async function handleFileReady(info) {
    setFileInfo(info)
    setStep(STEP.SETTINGS)
    setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <button onClick={handleReset} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <span className="text-white font-bold text-lg">X Buddy</span>
        </button>
        {step !== STEP.HERO && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {['Upload', 'Settings', 'Pay & Print'].map((label, i) => {
              const stepKeys = [STEP.UPLOAD, STEP.SETTINGS, STEP.PRINTING]
              const isPast   = step === STEP.PRINTING && i < 2
              const isActive = step === stepKeys[i]
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`${isPast ? 'text-green-400' : isActive ? 'text-purple-400' : 'text-gray-600'} font-medium`}>
                    {isPast ? '✓' : `${i + 1}.`} {label}
                  </span>
                  {i < 2 && <span className="text-gray-700">›</span>}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {step === STEP.HERO && (
            <motion.div key="hero" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Hero onGetStarted={() => setStep(STEP.UPLOAD)} />
            </motion.div>
          )}

          {(step === STEP.UPLOAD || step === STEP.SETTINGS) && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadSection onFileReady={handleFileReady} />
              <AnimatePresence>
                {fileInfo && step === STEP.SETTINGS && (
                  <motion.div
                    ref={settingsRef}
                    key="settings"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PrintSettings fileInfo={fileInfo} settings={settings} onChange={setSettings} />
                    <PriceCard fileInfo={fileInfo} settings={settings} onPayAndPrint={() => setShowPayment(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === STEP.PRINTING && (
            <motion.div key="printing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PrintStatus
                fileInfo={fileInfo}
                settings={settings}
                orderId={orderId}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          orderMeta={orderMeta}
          onSuccess={handleOrderSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
