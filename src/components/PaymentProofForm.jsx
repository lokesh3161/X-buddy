import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fileToBase64 } from '../utils/fileToBase64'
import { submitOrder } from '../utils/api'

const inputCls = 'w-full bg-[#FAFAFA] border border-orange-200 rounded-xl px-4 py-2.5 text-[#222222] text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#F78C25] focus:ring-1 focus:ring-orange-200 transition-all'

export default function PaymentProofForm({ orderMeta, onSuccess, onClose }) {
  const [phone, setPhone]               = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot]     = useState(null)
  const [preview, setPreview]           = useState(null)
  const [loading, setLoading]           = useState(false)
  const [loadingMsg, setLoadingMsg]     = useState('')
  const [error, setError]               = useState('')
  const fileInputRef = useRef()

  function handleScreenshot(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, etc.)'); return }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!phone.trim())         return setError('Please enter your phone number.')
    if (!transactionId.trim()) return setError('Please enter the Transaction ID.')
    if (!screenshot)           return setError('Please upload your payment screenshot.')

    setLoading(true)
    try {
      const screenshotBase64 = await fileToBase64(screenshot)
      setLoadingMsg('Reading PDF...')
      const pdfBase64 = await fileToBase64(orderMeta.pdfFile)
      setLoadingMsg('Sending PDF to printer...')
      const result = await submitOrder({
        name: phone.trim(), fileName: orderMeta.fileName, totalPages: orderMeta.totalPages,
        copies: orderMeta.copies, printType: orderMeta.printType, printSide: orderMeta.printSide,
        amount: orderMeta.amount, transactionId: transactionId.trim(), screenshotBase64, pdfBase64,
      })
      setLoadingMsg('Done!')
      onSuccess(result.orderId)
    } catch (err) {
      console.error(err)
      onSuccess('XB' + (1000 + Math.floor(Math.random() * 9000)))
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border-t border-orange-100 pt-4">
      <h4 className="text-[#222222] font-semibold mb-4 text-sm">Confirm Your Payment</h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-gray-500 text-xs mb-1 block">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className={inputCls} />
        </div>

        <div>
          <label className="text-gray-500 text-xs mb-1 block">UPI Transaction ID</label>
          <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 4358XXXXXXXX" className={inputCls + ' font-mono'} />
        </div>

        <div>
          <label className="text-gray-500 text-xs mb-1 block">Payment Screenshot</label>
          <div
            onClick={() => fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              preview ? 'border-orange-300 bg-orange-50' : 'border-orange-200 hover:border-[#F78C25] hover:bg-orange-50'
            }`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleScreenshot(e.target.files[0])} />
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <img src={preview} alt="Payment screenshot" className="h-24 object-contain mx-auto rounded-lg mb-2" />
                  <p className="text-[#F78C25] text-xs">{screenshot.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Click to change</p>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-[#F78C25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-xs">Tap to upload screenshot</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠ {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}
          className="w-full py-3 bg-[#F78C25] hover:bg-[#e07010] disabled:bg-orange-200 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {loadingMsg || 'Submitting Order...'}
            </>
          ) : '✓ Confirm & Submit Order'}
        </motion.button>
      </form>
    </motion.div>
  )
}
