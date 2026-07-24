import { motion, AnimatePresence } from 'framer-motion'
import { calcEffectivePages, calcTotal, estimatePrintTime, RATES } from '../utils/pricing'

export default function PriceCard({ fileInfo, settings, onPayAndPrint }) {
  const { colorMode, sideMode, copies } = settings
  const isDoubleSide   = sideMode === 'double'
  const effectivePages = calcEffectivePages(fileInfo.totalPages, isDoubleSide)
  const ratePerPage    = colorMode === 'color' ? RATES.color : RATES.bw
  const total          = calcTotal({ totalPages: fileInfo.totalPages, colorMode, isDoubleSide, copies })
  const printTime      = estimatePrintTime(fileInfo.totalPages, isDoubleSide, copies)

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-4 pb-8">
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm glow-orange-sm">
        <h3 className="text-lg font-semibold text-[#222222] mb-5">Price Summary</h3>

        <div className="space-y-3 mb-5">
          <Row label="Total Pages" value={fileInfo.totalPages} />
          {isDoubleSide && <Row label="Effective Pages (double side)" value={effectivePages} highlight />}
          <Row label="Rate" value={`₹${ratePerPage}/page`} />
          <Row label="Copies" value={`× ${copies}`} />
          <div className="border-t border-orange-100 pt-3">
            <Row
              label="Total Amount"
              value={
                <AnimatePresence mode="wait">
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-2xl font-extrabold text-[#F78C25]"
                  >
                    ₹{total}
                  </motion.span>
                </AnimatePresence>
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
          <svg className="w-4 h-4 text-[#F78C25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Estimated print time: <span className="text-[#F78C25] font-medium">{printTime}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPayAndPrint}
          className="w-full py-4 bg-[#F78C25] hover:bg-[#e07010] text-white font-bold text-lg rounded-2xl glow-orange transition-all duration-200"
        >
          Pay ₹{total} & Print →
        </motion.button>
      </div>
    </motion.section>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${highlight ? 'text-[#F78C25]' : 'text-gray-500'}`}>{label}</span>
      <span className={`font-medium ${highlight ? 'text-[#F78C25]' : 'text-[#222222]'}`}>{value}</span>
    </div>
  )
}
