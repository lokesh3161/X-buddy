import { motion, AnimatePresence } from 'framer-motion'
import { calcPriceBreakdown, estimatePrintTime } from '../utils/pricing'
import { parsePageRange } from '../utils/pageRangeParser'

export default function PriceCard({ fileInfo, settings, onPayAndPrint }) {
  const { colorMode, sideMode, copies, pageRange, customPages } = settings
  const isDoubleSide = sideMode === 'double'

  let selectedPages = []
  if (pageRange === 'custom' && customPages) {
    const parsed = parsePageRange(customPages, fileInfo.totalPages)
    if (parsed.valid) selectedPages = parsed.selectedPages
  }

  const breakdown = calcPriceBreakdown({
    totalPages: fileInfo.totalPages,
    colorMode,
    isDoubleSide,
    copies,
    pageRange,
    selectedPages,
  })

  const { printablePages, effectivePages, ratePerPage, printingCost, serviceFee, totalAmount } = breakdown
  const printTime = estimatePrintTime(printablePages, isDoubleSide, copies)

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-4 pb-8">
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm glow-orange-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#222222]">Price Summary</h3>
          <span className="text-[11px] font-semibold px-2.5 py-1 bg-orange-50 text-[#F78C25] rounded-lg border border-orange-200">
            Transparent Pricing
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <Row label="Total Document Pages" value={fileInfo.totalPages} />
          {pageRange === 'custom' && <Row label="Selected Pages to Print" value={selectedPages.length} highlight />}
          {isDoubleSide && <Row label="Effective Sheets (double side)" value={effectivePages} highlight />}
          <Row label="Rate per Page" value={`₹${ratePerPage}`} />
          <Row label="Copies" value={`× ${copies}`} />

          <div className="border-t border-orange-100/80 pt-3 space-y-2">
            <Row label="Printing Cost" value={`₹${printingCost}`} />
            <Row
              label={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <span>X Buddy Service Fee</span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                    Platform
                  </span>
                </span>
              }
              value={<span className="text-gray-700 font-semibold">+₹{serviceFee}</span>}
            />
          </div>

          <div className="border-t-2 border-orange-200 pt-3">
            <Row
              label={<span className="font-bold text-slate-800 text-base">Final Amount</span>}
              value={
                <AnimatePresence mode="wait">
                  <motion.span
                    key={totalAmount}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="text-2xl font-extrabold text-[#F78C25]"
                  >
                    ₹{totalAmount}
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
          className="w-full py-4 bg-[#F78C25] hover:bg-[#e07010] text-white font-bold text-lg rounded-2xl glow-orange transition-all duration-200 shadow-md shadow-orange-500/20"
        >
          Pay ₹{totalAmount} &amp; Print →
        </motion.button>
      </div>
    </motion.section>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={highlight ? 'text-[#F78C25] font-semibold' : 'text-gray-500'}>{label}</span>
      <span className={`font-medium ${highlight ? 'text-[#F78C25]' : 'text-[#222222]'}`}>{value}</span>
    </div>
  )
}

