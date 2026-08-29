// Pricing constants
export const RATES = {
  bw: 2,     // ₹2 per page for Black & White
  color: 5,  // ₹5 per page for Color
}

/**
 * X Buddy Service Fee Slabs:
 * ₹1–₹20   → +₹1
 * ₹21–₹40  → +₹2
 * ₹41–₹80  → +₹3
 * ₹81–₹120 → +₹5
 * ₹121–₹200 → +₹7
 * ₹201+    → +₹10
 */
export function calcServiceFee(printingCost) {
  const cost = Number(printingCost) || 0
  if (cost <= 0) return 0
  if (cost <= 20) return 1
  if (cost <= 40) return 2
  if (cost <= 80) return 3
  if (cost <= 120) return 5
  if (cost <= 200) return 7
  return 10
}

/**
 * Calculate effective pages based on double-side setting.
 */
export function calcEffectivePages(totalPages, isDoubleSide) {
  if (isDoubleSide) return Math.ceil(totalPages / 2)
  return totalPages
}

export function calcPriceBreakdown({ totalPages, colorMode, isDoubleSide, copies = 1, pageRange, selectedPages }) {
  const numCopies = Math.max(1, Number(copies) || 1)
  const isCustom = pageRange === 'custom'
  const printablePages = isCustom
    ? (Array.isArray(selectedPages) ? selectedPages.length : (selectedPages?.length || 0))
    : (Number(totalPages) || 0)

  const effectivePages = calcEffectivePages(printablePages, isDoubleSide)
  const ratePerPage = colorMode === 'color' ? RATES.color : RATES.bw
  const printingCost = effectivePages * ratePerPage * numCopies
  const serviceFee = calcServiceFee(printingCost)
  const totalAmount = printingCost + serviceFee

  return {
    printablePages,
    effectivePages,
    ratePerPage,
    copies: numCopies,
    printingCost,
    serviceFee,
    totalAmount,
  }
}

export function calcTotal(params) {
  const { totalAmount } = calcPriceBreakdown(params)
  return totalAmount
}

// Estimate print time: ~8 seconds per page (single side), ~12s double side
export function estimatePrintTime(totalPages, isDoubleSide, copies = 1) {
  const secsPerPage = isDoubleSide ? 6 : 8
  const totalSecs = (Number(totalPages) || 1) * (Number(copies) || 1) * secsPerPage
  if (totalSecs < 60) return `~${totalSecs} seconds`
  return `~${Math.ceil(totalSecs / 60)} minute${Math.ceil(totalSecs / 60) > 1 ? 's' : ''}`
}

