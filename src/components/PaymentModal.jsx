import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PaymentProofForm from './PaymentProofForm'
import { Smartphone, QrCode, Copy, Check } from 'lucide-react'

const UPI_ID = import.meta.env.VITE_UPI_ID || 'xbuddy@upi'
const PAYEE_NAME = import.meta.env.VITE_PAYEE_NAME || 'X Buddy'

export default function PaymentModal({ total, orderMeta, onSuccess, onClose }) {
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [activeTab, setActiveTab] = useState('apps') // 'apps' | 'qr'

  function getUpiLink(appScheme) {
    const note = `XBuddy Print ${orderMeta?.fileName ? orderMeta.fileName.slice(0, 15) : 'Order'}`
    const params = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`
    
    if (appScheme === 'phonepe') return `phonepe://pay?${params}`
    if (appScheme === 'gpay') return `gpay://upi/pay?${params}`
    if (appScheme === 'paytm') return `paytmmp://pay?${params}`
    if (appScheme === 'bhim') return `bhim://pay?${params}`
    return `upi://pay?${params}`
  }

  function handleOpenApp(appScheme) {
    const link = getUpiLink(appScheme)
    // Direct browser redirect to launch native UPI app on mobile
    window.location.href = link
  }

  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-orange-200 shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#222222]">Pay ₹{total}</h3>
              <p className="text-gray-400 text-xs">Choose your UPI app or scan QR</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
            >✕</button>
          </div>

          {/* Amount breakdown badge */}
          <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3 mb-4 text-xs">
            <div className="flex justify-between text-gray-500 mb-1">
              <span>Printing Cost</span>
              <span className="font-semibold text-gray-800">₹{orderMeta?.printingCost ?? total}</span>
            </div>
            <div className="flex justify-between text-gray-500 mb-1.5">
              <span>Digital Processing Fee</span>
              <span className="font-semibold text-gray-800">+₹{orderMeta?.digitalProcessingFee ?? orderMeta?.serviceFee ?? 0}</span>
            </div>
            <div className="flex justify-between items-center border-t border-orange-200 pt-1.5 font-bold">
              <span className="text-slate-800">Total Payable:</span>
              <span className="text-[#F78C25] font-extrabold text-xl">₹{total}</span>
            </div>
          </div>

          {/* Tab Selector: Direct UPI Apps vs Scan QR */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('apps')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'apps' ? 'bg-white text-[#F78C25] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 1-Tap UPI Apps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'qr' ? 'bg-white text-[#F78C25] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> Scan QR Code
            </button>
          </div>

          {/* 1-Tap UPI Apps Section */}
          {activeTab === 'apps' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5 mb-4">
              <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                <span>Tap to open installed app:</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Instant Pre-filled</span>
              </p>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => handleOpenApp('phonepe')}
                className="w-full py-2.5 px-3 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 text-purple-900 font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    पे
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-xs">PhonePe</p>
                    <p className="text-[10px] text-slate-400">Pay directly via PhonePe</p>
                  </div>
                </div>
                <span className="text-[#5f259f] font-bold text-xs group-hover:translate-x-0.5 transition-transform">Pay ₹{total} →</span>
              </button>

              {/* Google Pay */}
              <button
                type="button"
                onClick={() => handleOpenApp('gpay')}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 text-blue-900 font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-xs shadow-xs">
                    <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-xs">Google Pay (GPay)</p>
                    <p className="text-[10px] text-slate-400">Fast UPI transfer</p>
                  </div>
                </div>
                <span className="text-blue-600 font-bold text-xs group-hover:translate-x-0.5 transition-transform">Pay ₹{total} →</span>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => handleOpenApp('paytm')}
                className="w-full py-2.5 px-3 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white hover:from-sky-100 text-sky-900 font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#002970] text-[#00b9f5] flex items-center justify-center font-extrabold text-[10px] shadow-xs">
                    Paytm
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-xs">Paytm</p>
                    <p className="text-[10px] text-slate-400">Pay via Paytm UPI</p>
                  </div>
                </div>
                <span className="text-[#00b9f5] font-bold text-xs group-hover:translate-x-0.5 transition-transform">Pay ₹{total} →</span>
              </button>

              {/* Generic / BHIM / Other UPI */}
              <button
                type="button"
                onClick={() => handleOpenApp('generic')}
                className="w-full py-2.5 px-3 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 text-[#F78C25] font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#F7931E] to-amber-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    UPI
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-xs">BHIM / Any Other UPI App</p>
                    <p className="text-[10px] text-slate-400">CRED, Amazon Pay, Bank UPI</p>
                  </div>
                </div>
                <span className="text-[#F78C25] font-bold text-xs group-hover:translate-x-0.5 transition-transform">Open App →</span>
              </button>
            </motion.div>
          )}

          {/* QR Code Tab */}
          {activeTab === 'qr' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <div className="bg-[#FFF8F2] rounded-2xl p-3 mb-2.5 mx-auto w-fit border border-orange-100">
                <img
                  src="/qr-code.png"
                  alt="PhonePe QR Code"
                  className="w-44 h-44 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  className="w-44 h-44 flex flex-col items-center justify-center bg-orange-50 rounded-xl text-gray-400 text-center p-4"
                >
                  <p className="text-xs font-medium">Place QR image at</p>
                  <p className="text-xs font-mono mt-1">public/qr-code.png</p>
                </div>
              </div>

              {/* UPI ID copy */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <div>
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
            </motion.div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <PaymentProofForm orderMeta={orderMeta} onSuccess={onSuccess} onClose={onClose} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
