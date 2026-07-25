import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMyOrders } from '../utils/orderStore'
import { getOrderStatus } from '../utils/api'

// Status mappings: Real backend values ('Waiting', 'Printing', 'Printed', 'Failed') to user-friendly labels
const STATUS_MAP = {
  Waiting: { label: 'Ready for Collection', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🏪' },
  Printing: { label: 'Printing...', cls: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse', icon: '🖨️' },
  Printed: { label: 'Collected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' },
  Failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: '❌' },
}

export default function MyOrdersPage({ onStartPrinting }) {
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [liveStatuses, setLiveStatuses] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [boothModalOrder, setBoothModalOrder] = useState(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  // Load orders from localStorage
  const loadOrders = () => {
    const data = getMyOrders()
    setOrders(data)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Live polling for getOrderStatus(orderId) across saved orders
  useEffect(() => {
    if (orders.length === 0) return

    async function pollStatuses() {
      const updates = {}
      for (const order of orders) {
        if (!order.orderId) continue
        try {
          const res = await getOrderStatus(order.orderId)
          if (res?.success && res?.printStatus) {
            updates[order.orderId] = res.printStatus
          } else {
            // Default to Waiting if backend returns no explicit printStatus
            updates[order.orderId] = 'Waiting'
          }
        } catch {
          updates[order.orderId] = 'Waiting'
        }
      }
      setLiveStatuses(prev => ({ ...prev, ...updates }))
    }

    pollStatuses()
    pollRef.current = setInterval(pollStatuses, 5000)
    return () => clearInterval(pollRef.current)
  }, [orders])

  // Client-side filter by orderId or fileName
  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const idMatch = o.orderId ? o.orderId.toLowerCase().includes(q) : false
    const nameMatch = o.fileName ? o.fileName.toLowerCase().includes(q) : false
    return idMatch || nameMatch
  })

  function handleCopyId(id) {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatSavedAt(timestamp) {
    if (!timestamp) return 'Just now'
    try {
      const d = new Date(timestamp)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Just now'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            My Print Orders
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Track live print status and access your Order IDs for booth collection.
          </p>
        </div>
        <button
          onClick={onStartPrinting}
          className="self-start md:self-auto px-4 py-2 bg-gradient-to-r from-[#F7931E] to-[#FF6B00] hover:from-[#FF9C26] hover:to-[#EB740A] text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-lg transition-all"
        >
          + New Print Order
        </button>
      </div>

      {/* Search Filter Bar */}
      {orders.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. XB1234) or file name..."
              className="w-full bg-[#FAFAFA] border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-[#222222] text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#F78C25] focus:ring-1 focus:ring-orange-200 transition-all"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFDF9] border border-orange-200/80 rounded-3xl p-10 text-center max-w-md mx-auto my-12 shadow-sm"
        >
          <div className="w-20 h-20 bg-orange-50 border border-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
            📋
          </div>
          <h3 className="text-lg font-bold text-[#222222] mb-1">
            You haven't placed any orders yet.
          </h3>
          <p className="text-gray-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
            Upload your documents, choose your print settings, and your order history will appear right here.
          </p>
          <button
            onClick={onStartPrinting}
            className="px-6 py-3 bg-[#F78C25] hover:bg-[#e07010] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg transition-all"
          >
            Start Printing
          </button>
        </motion.div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-orange-100 rounded-2xl p-8 text-center my-6">
          <p className="text-gray-500 text-sm">No orders match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-[#F78C25] text-xs font-bold hover:underline"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const rawStatus = liveStatuses[order.orderId] || 'Waiting'
            const statusInfo = STATUS_MAP[rawStatus] || STATUS_MAP.Waiting

            return (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-orange-200/80 hover:border-orange-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#F78C25] text-base">
                      {order.orderId}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusInfo.cls}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                  <p className="text-[#222222] font-semibold text-sm truncate">
                    {order.fileName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>{order.totalPages} {order.totalPages === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{order.copies} {order.copies === 1 ? 'copy' : 'copies'}</span>
                    <span>•</span>
                    <span>{order.printType}</span>
                    <span>•</span>
                    <span className="font-bold text-gray-700">₹{order.amount}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Saved: {formatSavedAt(order.savedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-orange-100">
                  {rawStatus === 'Waiting' && (
                    <button
                      onClick={() => setBoothModalOrder(order)}
                      className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-[#F78C25] border border-orange-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>🏪</span> Show at booth
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-xl transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 bg-white border border-orange-200 rounded-3xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#222222]">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 text-gray-400 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Order ID Banner */}
                <div className="p-4 bg-[#FFF8F2] border border-orange-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-mono text-xl font-extrabold text-[#F78C25]">
                      {selectedOrder.orderId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyId(selectedOrder.orderId)}
                    className="px-3 py-1.5 bg-white border border-orange-200 text-[#F78C25] font-bold text-xs rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy ID'}
                  </button>
                </div>

                {/* Details Breakdown */}
                <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">File Name:</span>
                    <span className="font-semibold text-gray-800 text-right truncate max-w-[200px]">
                      {selectedOrder.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Pages:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Copies:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Print Color:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.printType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-extrabold text-[#F78C25] text-sm">₹{selectedOrder.amount}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-500">Placed On:</span>
                    <span className="text-gray-600">{formatSavedAt(selectedOrder.savedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Live Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                      (STATUS_MAP[liveStatuses[selectedOrder.orderId] || 'Waiting'] || STATUS_MAP.Waiting).cls
                    }`}>
                      {(STATUS_MAP[liveStatuses[selectedOrder.orderId] || 'Waiting'] || STATUS_MAP.Waiting).label}
                    </span>
                  </div>
                </div>

                {/* Action button if waiting */}
                {(liveStatuses[selectedOrder.orderId] || 'Waiting') === 'Waiting' && (
                  <button
                    onClick={() => {
                      const ord = selectedOrder
                      setSelectedOrder(null)
                      setBoothModalOrder(ord)
                    }}
                    className="w-full py-3 bg-[#F78C25] hover:bg-[#e07010] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🏪</span> Show at Booth Screen
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Show at Booth Modal (Large Clear Order ID Display) */}
      <AnimatePresence>
        {boothModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBoothModalOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative z-10 bg-[#FFFDF9] border-2 border-orange-300 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <button
                onClick={() => setBoothModalOrder(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 text-gray-500 flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>

              <div className="w-14 h-14 bg-orange-100 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                🏪
              </div>

              <h3 className="text-base font-bold text-[#222222]">
                Show at Printer Booth
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                The booth staff will enter this Order ID to release your print job.
              </p>

              {/* Large, clear, copyable Order ID display */}
              <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 mb-4 shadow-inner">
                <p className="text-[10px] uppercase font-extrabold text-orange-400 tracking-wider mb-1">
                  ORDER ID
                </p>
                <p className="font-mono text-3xl font-black text-[#F78C25] tracking-widest selection:bg-orange-200">
                  {boothModalOrder.orderId}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleCopyId(boothModalOrder.orderId)}
                  className="w-full py-2.5 bg-[#F78C25] hover:bg-[#e07010] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'Order ID Copied!' : 'Copy Order ID'}</span>
                </button>
                <p className="text-[11px] text-gray-400">
                  File: <span className="font-medium text-gray-600 truncate max-w-[200px] inline-block align-bottom">{boothModalOrder.fileName}</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
