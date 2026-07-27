import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOrderStatus } from '../utils/api'

const OFFLINE_TIMEOUT_MS = 30000
const POLL_INTERVAL_MS   = 5000

const STAGES = [
  { id: 'paid',     label: 'Payment Confirmed', icon: '✅', desc: 'Your payment has been verified'           },
  { id: 'queued',   label: 'Order Queued',       icon: '📋', desc: 'Your document is saved and ready'        },
  { id: 'printing', label: 'Printing',           icon: '🖨️', desc: 'Printing your document...'              },
  { id: 'done',     label: 'Completed',          icon: '🎉', desc: 'Collect your document from the printer!' },
]

function statusToStage(status) {
  switch (status) {
    case 'Printing': return 2
    case 'Printed':  return 3
    case 'Failed':   return 3
    default:         return 1
  }
}

export default function PrintStatus({ fileInfo, settings, orderId, onReset, onViewMyOrders }) {
  // Guard: this screen must never render without a real confirmed orderId
  if (!orderId) return null
  const [stageIndex,    setStageIndex]    = useState(0)
  const [progress,      setProgress]      = useState(0)
  const [serverOffline, setServerOffline] = useState(false)
  const [printFailed,   setPrintFailed]   = useState(false)
  const [lastChecked,   setLastChecked]   = useState(null)
  const [collectionChoice, setCollectionChoice] = useState('now')
  const pollRef    = useRef(null)
  const offlineRef = useRef(null)
  const statusRef  = useRef('Waiting')

  useEffect(() => {
    if (!orderId) return
    offlineRef.current = setTimeout(() => {
      if (statusRef.current === 'Waiting') setServerOffline(true)
    }, OFFLINE_TIMEOUT_MS)

    async function checkStatus() {
      try {
        const data = await getOrderStatus(orderId)
        if (data && data.success && data.printStatus) {
          const status = data.printStatus
          statusRef.current = status
          setLastChecked(new Date().toLocaleTimeString())
          setStageIndex(statusToStage(status))
          if (status !== 'Waiting') { setServerOffline(false); clearTimeout(offlineRef.current) }
          if (status === 'Failed')  { setPrintFailed(true); clearInterval(pollRef.current); return }
          if (status === 'Printed') { clearInterval(pollRef.current) }
        }
      } catch {}
    }

    checkStatus()
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)
    return () => { clearInterval(pollRef.current); clearTimeout(offlineRef.current) }
  }, [orderId])

  useEffect(() => {
    const target = (stageIndex / (STAGES.length - 1)) * 100
    const step   = (target - progress) / 20
    let current  = progress
    const interval = setInterval(() => {
      current += step
      if (current >= target) { setProgress(target); clearInterval(interval) }
      else setProgress(current)
    }, 30)
    return () => clearInterval(interval)
  }, [stageIndex])

  const isDone = stageIndex === STAGES.length - 1

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
          className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4"
        >
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-[#222222]">✓ Order Confirmed</h2>
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200">
          <span className="text-gray-400 text-xs">Order ID:</span>
          <span className="text-[#F78C25] font-mono text-xs font-bold tracking-wider">{orderId}</span>
        </div>
      </div>

      {/* Collection Framing Card */}
      <div className="mb-6 p-5 bg-[#FFF8F2] border border-orange-200 rounded-2xl text-center shadow-xs">
        <p className="text-sm font-bold text-[#222222] mb-3">When would you like to collect your document?</p>
        <div className="flex gap-3 max-w-sm mx-auto mb-4">
          <button
            type="button"
            onClick={() => setCollectionChoice('now')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              collectionChoice === 'now'
                ? 'bg-[#F78C25] text-white border-[#F78C25] shadow-sm shadow-orange-500/20'
                : 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
            }`}
          >
            🏃 Collect Now
          </button>
          <button
            type="button"
            onClick={() => setCollectionChoice('later')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              collectionChoice === 'later'
                ? 'bg-[#F78C25] text-white border-[#F78C25] shadow-sm shadow-orange-500/20'
                : 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
            }`}
          >
            ⏱️ Collect Later
          </button>
        </div>

        {collectionChoice === 'now' ? (
          <div className="bg-white/80 p-3.5 rounded-xl border border-orange-100 text-xs text-gray-600">
            <span className="font-semibold text-[#F78C25]">Head to the booth now and give them this ID.</span>
            <p className="mt-1 text-gray-500">The shopkeeper will enter Order ID <span className="font-mono font-bold text-gray-800">{orderId}</span> into the kiosk to release your print.</p>
          </div>
        ) : (
          <div className="bg-white/80 p-3.5 rounded-xl border border-orange-100 text-xs text-gray-600 space-y-2">
            <span className="font-semibold text-emerald-600">✓ We've saved this for you in My Orders!</span>
            <p className="text-gray-500">You can close this tab and come back anytime. Show Order ID <span className="font-mono font-bold text-gray-800">{orderId}</span> at the booth whenever you are ready.</p>
            {onViewMyOrders && (
              <button
                type="button"
                onClick={onViewMyOrders}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-[#F78C25] font-bold rounded-lg transition-colors text-xs"
              >
                📋 View in My Orders →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Booth instruction */}
      <AnimatePresence>
        {stageIndex < 2 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-start gap-3">
            <span className="text-xl">🏪</span>
            <div>
              <p className="text-[#F78C25] font-semibold text-sm">Go to the Printer Booth</p>
              <p className="text-gray-500 text-xs mt-1">Show your Order ID at the booth. The shopkeeper will enter it to release your print.</p>
              <p className="text-gray-400 text-xs mt-1">Order ID: <span className="font-mono text-[#F78C25] font-bold">{orderId}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline warning */}
      <AnimatePresence>
        {serverOffline && !isDone && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-red-500 font-semibold text-sm">Could not connect to print server</p>
              <p className="text-gray-500 text-xs mt-1">The print agent appears to be offline. Your order is saved and will print once the server is back online.</p>
              <p className="text-gray-400 text-xs mt-1">Please inform the shopkeeper — Order ID: <span className="font-mono text-[#F78C25]">{orderId}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print failed */}
      <AnimatePresence>
        {printFailed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <span className="text-xl">🖨️</span>
            <div>
              <p className="text-amber-600 font-semibold text-sm">Print job failed</p>
              <p className="text-gray-500 text-xs mt-1">There was an issue with the printer. Please show your Order ID to the shopkeeper.</p>
              <p className="text-gray-400 text-xs mt-1">Order ID: <span className="font-mono text-[#F78C25]">{orderId}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print job card */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-100">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
            <span className="text-lg">📄</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#222222] font-medium truncate">{fileInfo.name}</p>
            <p className="text-gray-400 text-xs">
              {fileInfo.totalPages} pages · {settings.colorMode === 'color' ? 'Color' : 'B&W'} · {settings.sideMode === 'double' ? 'Double' : 'Single'} side · {settings.copies} {settings.copies > 1 ? 'copies' : 'copy'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Print Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${serverOffline && !isDone ? 'from-red-400 to-red-300' : 'from-[#F78C25] to-[#ffb347]'}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isActive   = i === stageIndex
            const isComplete = i < stageIndex
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isActive || isComplete ? 1 : 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-orange-50 border border-orange-200' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  isComplete ? 'bg-green-50 border border-green-200' :
                  isActive   ? 'bg-orange-50 border border-orange-300' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {isComplete ? '✓' : stage.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isComplete ? 'text-green-500' : isActive ? 'text-[#222222]' : 'text-gray-400'}`}>
                    {stage.label}
                    {isActive && !isDone && (
                      <span className="ml-2 inline-flex gap-0.5">
                        {[0, 1, 2].map(d => (
                          <motion.span key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                            className="w-1 h-1 rounded-full bg-[#F78C25] inline-block" />
                        ))}
                      </span>
                    )}
                  </p>
                  {isActive && <p className="text-xs text-gray-400 mt-0.5">{stage.desc}</p>}
                </div>
              </motion.div>
            )
          })}
        </div>

        {lastChecked && <p className="text-gray-300 text-xs mt-4 text-right">Last checked: {lastChecked}</p>}
      </div>

      {/* Done */}
      <AnimatePresence>
        {isDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-green-500 font-semibold text-lg mb-1">🎉 Printing Completed!</p>
            <p className="text-gray-400 text-sm mb-2">Please collect your document from the printer.</p>
            {orderId && <p className="text-gray-300 text-xs mb-6 font-mono">Order ID: {orderId}</p>}
            <button onClick={onReset} className="px-6 py-3 bg-[#F78C25] hover:bg-[#e07010] text-white font-semibold rounded-xl transition-all">
              Print Another Document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
