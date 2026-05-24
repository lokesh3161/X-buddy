import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { validateAndRelease } from '../utils/api'

export default function ReleasePrint() {
  const [orderId, setOrderId]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState(null)   // { success, message/error }

  async function handleRelease(e) {
    e.preventDefault()
    if (!orderId.trim()) return
    setLoading(true)
    setResult(null)
    const res = await validateAndRelease(orderId.trim().toUpperCase())
    setResult(res)
    setLoading(false)
    if (res.success) setOrderId('')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto px-4 py-16"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🖨️</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Release Print</h2>
        <p className="text-gray-500 text-sm mt-1">Enter the student's Order ID to start printing</p>
      </div>

      {/* Form */}
      <form onSubmit={handleRelease} className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Order ID</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value.toUpperCase()); setResult(null) }}
            placeholder="e.g. XB2045"
            maxLength={8}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-center"
          />
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                result.success
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              <span>{result.success ? '✅' : '⚠️'}</span>
              <span>{result.success ? result.message : result.error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={loading || !orderId.trim()}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying & Printing...
            </>
          ) : (
            '🖨️ Release Print'
          )}
        </motion.button>
      </form>

      {/* Info */}
      <div className="mt-6 space-y-2">
        {[
          ['✅', 'Valid Order ID + Paid', 'Print starts immediately'],
          ['⚠️', 'Wrong Order ID',        'Rejected with error'],
          ['🔒', 'Already Printed',       'Blocked — no duplicate print'],
        ].map(([icon, label, desc]) => (
          <div key={label} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/3 border border-white/5">
            <span>{icon}</span>
            <div>
              <p className="text-white text-xs font-medium">{label}</p>
              <p className="text-gray-600 text-xs">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
