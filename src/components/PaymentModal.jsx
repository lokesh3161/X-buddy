import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PaymentProofForm from './PaymentProofForm'
import { Smartphone, QrCode, Copy, Check, ArrowRight, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react'

const UPI_ID = import.meta.env.VITE_UPI_ID || 'xbuddy@upi'
const PAYEE_NAME = import.meta.env.VITE_PAYEE_NAME || 'Xerox Buddy'

const PAYMENT_APPS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    description: 'Pay via PhonePe app',
    badge: 'Fast',
    iconBg: '#5f259f',
    textColor: '#5f259f',
    borderColor: 'border-purple-200',
    bgGradient: 'from-purple-50 to-white hover:from-purple-100/70',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-base shadow-xs">
        पे
      </div>
    ),
    getScheme: (query) => `phonepe://pay?${query}`,
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    description: 'Pay via GPay UPI',
    badge: 'Popular',
    iconBg: '#ffffff',
    textColor: '#1a73e8',
    borderColor: 'border-blue-200',
    bgGradient: 'from-blue-50 to-white hover:from-blue-100/70',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-extrabold text-xs shadow-xs">
        <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span>
      </div>
    ),
    getScheme: (query) => `tez://upi/pay?${query}`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    description: 'Pay via Paytm Wallet / UPI',
    badge: null,
    iconBg: '#002970',
    textColor: '#00b9f5',
    borderColor: 'border-sky-200',
    bgGradient: 'from-sky-50 to-white hover:from-sky-100/70',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#002970] text-[#00b9f5] flex items-center justify-center font-black text-[11px] shadow-xs">
        Paytm
      </div>
    ),
    getScheme: (query) => `paytmmp://pay?${query}`,
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    description: 'Pay via BHIM app',
    badge: null,
    iconBg: '#007849',
    textColor: '#007849',
    borderColor: 'border-emerald-200',
    bgGradient: 'from-emerald-50 to-white hover:from-emerald-100/70',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#007849] text-white flex items-center justify-center font-black text-[10px] shadow-xs">
        BHIM
      </div>
    ),
    getScheme: (query) => `bhim://pay?${query}`,
  },
  {
    id: 'generic',
    name: 'Other UPI Apps',
    description: 'CRED, Amazon Pay, Bank UPI',
    badge: 'Universal',
    iconBg: '#F78C25',
    textColor: '#F78C25',
    borderColor: 'border-orange-200',
    bgGradient: 'from-orange-50 to-white hover:from-orange-100/70',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F7931E] to-amber-400 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
        UPI
      </div>
    ),
    getScheme: (query) => `upi://pay?${query}`,
  },
]

export default function PaymentModal({ total, orderMeta, onSuccess, onClose }) {
  // Step states: 'SELECT' | 'LAUNCHING' | 'DID_YOU_PAY' | 'FORM'
  const [step, setStep] = useState('SELECT')
  const [selectedApp, setSelectedApp] = useState(null)
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [viewMode, setViewMode] = useState('apps') // 'apps' | 'qr'
  const [desktopNotice, setDesktopNotice] = useState('')

  // Build dynamic standard UPI URI
  const note = `XBuddy Print ${orderMeta?.fileName ? orderMeta.fileName.slice(0, 15) : 'Order'}`
  const upiQuery = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`
  const genericUpiUri = `upi://pay?${upiQuery}`
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(genericUpiUri)}&size=220x220&margin=4`

  function handleSelectApp(app) {
    const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent || '')
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '')
    const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '')

    // Debug logging without sensitive credentials
    console.log('[X Buddy Payment] Selected App:', app.name)
    console.log('[X Buddy Payment] Device Type:', isMobile ? (isAndroid ? 'Android' : (isIOS ? 'iOS' : 'Mobile')) : 'Desktop')
    console.log('[X Buddy Payment] Payable Amount: ₹' + total)
    console.log('[X Buddy Payment] Order Note:', note)
    console.log('[X Buddy Payment] Standard UPI URI:', genericUpiUri)

    if (!isMobile) {
      // Desktop / laptop fallback
      console.log('[X Buddy Payment] Desktop browser detected. Switching to QR view.')
      setSelectedApp(app)
      setViewMode('qr')
      setDesktopNotice('Open this page on your phone or scan the QR code using any UPI app.')
      return
    }

    setDesktopNotice('')
    setSelectedApp(app)
    setStep('LAUNCHING')

    let attemptedSpecific = false

    if (app.id === 'phonepe') {
      attemptedSpecific = true
      console.log('[X Buddy Payment] PhonePe launch attempted with standard UPI fallback')
      
      const phonePeUri = isAndroid 
        ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.phonepe.app;end` 
        : `phonepe://pay?${upiQuery}`

      try {
        const a = document.createElement('a')
        a.href = phonePeUri
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (err) {
        console.log('[X Buddy Payment] PhonePe direct launch exception, falling back to standard UPI:', err)
        window.location.href = genericUpiUri
      }

      // Graceful fallback to standard upi://pay without showing any error
      setTimeout(() => {
        console.log('[X Buddy Payment] Safe fallback: triggering standard upi://pay intent')
        try {
          const fallbackLink = document.createElement('a')
          fallbackLink.href = genericUpiUri
          fallbackLink.rel = 'noopener noreferrer'
          document.body.appendChild(fallbackLink)
          fallbackLink.click()
          document.body.removeChild(fallbackLink)
        } catch {
          // ignore
        }
      }, 1200)
    } else if (app.id === 'gpay') {
      attemptedSpecific = true
      console.log('[X Buddy Payment] Google Pay launch attempted')
      const gpayUri = isAndroid ? `tez://upi/pay?${upiQuery}` : `gpay://upi/pay?${upiQuery}`
      try {
        const a = document.createElement('a')
        a.href = gpayUri
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch {
        window.location.href = genericUpiUri
      }
    } else if (app.id === 'paytm') {
      attemptedSpecific = true
      console.log('[X Buddy Payment] Paytm launch attempted')
      const paytmUri = `paytmmp://pay?${upiQuery}`
      try {
        const a = document.createElement('a')
        a.href = paytmUri
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch {
        window.location.href = genericUpiUri
      }
    } else {
      // BHIM & Other UPI Apps: Standard Universal UPI Intent
      console.log('[X Buddy Payment] Standard UPI intent launched')
      try {
        const a = document.createElement('a')
        a.href = genericUpiUri
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch {
        window.location.href = genericUpiUri
      }
    }

    console.log('[X Buddy Payment] App-specific launch status:', { attemptedSpecific })

    // Auto prompt payment completion check after 2.5 seconds
    setTimeout(() => {
      setStep('DID_YOU_PAY')
    }, 2500)
  }

  function copyUpiId() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-orange-200 shadow-2xl max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#222222]">
                {step === 'FORM' ? 'Confirm Payment' : 'Scan & Pay'}
              </h3>
              <p className="text-gray-400 text-xs">
                {step === 'FORM' ? 'Enter transaction details' : 'Pay via UPI and confirm your order'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
            >✕</button>
          </div>

          {/* Amount breakdown badge */}
          <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3.5 mb-4 text-xs">
            <div className="flex justify-between text-gray-500 mb-1">
              <span>Printing Cost</span>
              <span className="font-semibold text-gray-800">₹{orderMeta?.printingCost ?? total}</span>
            </div>
            <div className="flex justify-between text-gray-500 mb-1.5">
              <span>Digital Processing Fee</span>
              <span className="font-semibold text-gray-800">+₹{orderMeta?.digitalProcessingFee ?? orderMeta?.serviceFee ?? 0}</span>
            </div>
            <div className="flex justify-between items-center border-t border-orange-200 pt-2 font-bold">
              <span className="text-slate-800 text-sm">Total Payable:</span>
              <span className="text-[#F78C25] font-extrabold text-2xl">₹{total}</span>
            </div>
          </div>

          {/* ─── STEP 1: SELECT PAYMENT METHOD ─── */}
          {step === 'SELECT' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('apps')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'apps' ? 'bg-white text-[#F78C25] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> 1-Tap UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('qr')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'qr' ? 'bg-white text-[#F78C25] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Scan QR Code
                </button>
              </div>

              {/* View: 1-Tap UPI Apps */}
              {viewMode === 'apps' && (
                <div className="space-y-2.5 mb-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                    <span>Pay ₹{total} using:</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Pre-filled Amount</span>
                  </p>

                  {PAYMENT_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleSelectApp(app)}
                      className={`w-full py-2.5 px-3 rounded-2xl border ${app.borderColor} bg-gradient-to-r ${app.bgGradient} text-slate-900 font-semibold text-xs flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer group`}
                    >
                      <div className="flex items-center gap-3">
                        {app.icon}
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{app.name}</span>
                            {app.badge && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-orange-100 text-[#F78C25]">
                                {app.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{app.description}</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: app.textColor }}>
                        Pay ₹{total} <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* View: QR Code */}
              {viewMode === 'qr' && (
                <div className="mb-4 text-center">
                  {desktopNotice ? (
                    <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                      📱 {desktopNotice}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mb-2">Scan using PhonePe, GPay, Paytm, or BHIM</p>
                  )}
                  <div className="bg-[#FFF8F2] rounded-2xl p-3.5 mb-3 mx-auto w-fit border border-orange-100 shadow-xs">
                    <img
                      src={dynamicQrUrl}
                      alt="UPI Payment QR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.src = '/qr-code.png'
                      }}
                    />
                  </div>

                  {/* UPI ID copy */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                    <div className="text-left">
                      <span className="text-slate-400 text-[10px] block">UPI ID</span>
                      <span className="font-mono font-bold text-slate-700">{UPI_ID}</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#F78C25] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedUpi ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Jump to Form if already paid */}
              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="text-xs font-semibold text-[#F78C25] hover:text-[#e07010] hover:underline cursor-pointer transition-colors"
                >
                  Already paid? Enter Transaction ID →
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: LAUNCHING APP ─── */}
          {step === 'LAUNCHING' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center relative shadow-sm">
                <div className="w-10 h-10 border-3 border-[#F78C25] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Opening {selectedApp?.name || 'UPI App'}...</h4>
                <p className="text-xs text-slate-400 mt-1">Please approve the payment of ₹{total} in your app.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                After completing the payment, return here to submit your transaction ID.
              </div>
              <button
                type="button"
                onClick={() => setStep('DID_YOU_PAY')}
                className="w-full py-2.5 bg-[#F78C25] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#e07010] transition-colors cursor-pointer"
              >
                I Completed the Payment →
              </button>
            </motion.div>
          )}

          {/* ─── STEP 3: DID YOU PAY CONFIRMATION CHECK ─── */}
          {step === 'DID_YOU_PAY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Did you complete the payment?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Payment of <strong className="text-slate-800">₹{total}</strong> via {selectedApp?.name || 'UPI'}.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Yes, I Paid ₹{total}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> No, Try Again / Scan QR
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: TRANSACTION ID & SCREENSHOT FORM ─── */}
          {step === 'FORM' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-500 font-medium">Payment for:</span>
                <span className="font-bold text-slate-800">₹{total}</span>
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="text-xs text-[#F78C25] font-semibold hover:underline cursor-pointer"
                >
                  Change App
                </button>
              </div>

              <PaymentProofForm orderMeta={orderMeta} onSuccess={onSuccess} onClose={onClose} />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
