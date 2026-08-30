import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Eye, EyeOff, FileText } from 'lucide-react'

export default function DocumentPreview({ fileInfo, settings }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(fileInfo?.totalPages || 1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  
  const canvasRef = useRef(null)
  const expandedCanvasRef = useRef(null)

  const isBw = settings?.colorMode === 'bw'
  const isLandscape = settings?.orientation === 'landscape'
  const isImage = fileInfo?.typeInfo?.category === 'image'
  const isPdf = fileInfo?.typeInfo?.mime === 'application/pdf'
  const isOffice = fileInfo?.requiresAgent || fileInfo?.typeInfo?.category === 'document'

  // Update total pages if fileInfo changes
  useEffect(() => {
    if (fileInfo?.totalPages) {
      setTotalPages(fileInfo.totalPages)
    }
  }, [fileInfo?.totalPages])

  // Load PDF document if applicable
  useEffect(() => {
    let active = true
    if (isPdf && fileInfo?.originalFile) {
      setLoading(true)
      fileInfo.originalFile.arrayBuffer().then(buffer => {
        if (!active) return
        pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          disableFontFace: true,
        }).promise.then(pdf => {
          if (!active) return
          setPdfDoc(pdf)
          setTotalPages(pdf.numPages)
          setLoading(false)
        }).catch(err => {
          console.warn('PDF preview loader error:', err)
          if (active) setLoading(false)
        })
      })
    } else if (isImage && fileInfo?.originalFile) {
      const url = URL.createObjectURL(fileInfo.originalFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPdfDoc(null)
    }
    return () => { active = false }
  }, [fileInfo, isPdf, isImage])

  // Render current PDF page to canvas
  const renderPdfPage = async (pageNumber, canvas) => {
    if (!pdfDoc || !canvas) return
    try {
      const page = await pdfDoc.getPage(pageNumber)
      const scale = 1.2
      const viewport = page.getViewport({ scale })
      const ctx = canvas.getContext('2d')

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise
    } catch (e) {
      console.warn('Error rendering PDF page:', e)
    }
  }

  useEffect(() => {
    if (isPdf && pdfDoc && canvasRef.current) {
      renderPdfPage(currentPage, canvasRef.current)
    }
    if (isPdf && pdfDoc && isExpanded && expandedCanvasRef.current) {
      renderPdfPage(currentPage, expandedCanvasRef.current)
    }
  }, [currentPage, pdfDoc, isPdf, isExpanded])

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1)
  }

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1)
  }

  return (
    <div className="bg-white border border-orange-100 rounded-3xl p-5 mb-6 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#F78C25] flex items-center justify-center font-bold text-sm">
            👁️
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#222222]">Document Preview</h3>
            <p className="text-[11px] text-gray-400">
              Live print preview · {isBw ? 'Simulating B&W' : 'Full Color'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-600 font-semibold gap-1">
              <button
                type="button"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                type="button"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F78C25] transition-colors cursor-pointer"
            title="Fullscreen Preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            title={isOpen ? 'Collapse Preview' : 'Expand Preview'}
          >
            {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FFF8F2] border border-orange-100/80 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] relative">
              {loading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
                  <div className="w-8 h-8 border-2 border-[#F78C25] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* PDF Preview Canvas */}
              {isPdf && (
                <div className="relative shadow-md rounded-lg overflow-hidden border border-slate-200 bg-white max-h-[360px] flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="max-h-[340px] w-auto object-contain transition-all duration-300"
                    style={{
                      filter: isBw ? 'grayscale(100%) contrast(115%)' : 'none',
                    }}
                  />
                </div>
              )}

              {/* Image Preview */}
              {isImage && imageUrl && (
                <div className="relative shadow-md rounded-lg overflow-hidden border border-slate-200 bg-white max-h-[340px] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Document preview"
                    className="max-h-[320px] w-auto object-contain transition-all duration-300"
                    style={{
                      filter: isBw ? 'grayscale(100%) contrast(115%)' : 'none',
                      transform: isLandscape ? 'rotate(90deg)' : 'none',
                    }}
                  />
                </div>
              )}

              {/* Office / DOCX / PPTX Document Mockup Preview */}
              {!isPdf && !isImage && (
                <div className="w-full max-w-xs bg-white rounded-xl shadow-md border border-slate-200 p-5 text-center space-y-3">
                  <div className="w-12 h-14 mx-auto bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-2xl shadow-xs">
                    {fileInfo?.typeInfo?.icon || '📝'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm truncate">{fileInfo?.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{fileInfo?.size} · {fileInfo?.typeInfo?.label} Document</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#F78C25] font-bold">
                      {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                      {settings?.orientation || 'Portrait'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg">
                    ✨ Automatically formatted for high-quality Xerox printing
                  </p>
                </div>
              )}

              {/* Bottom bar indicator */}
              <div className="mt-3 flex items-center justify-between w-full text-xs text-gray-500 px-1">
                <span className="text-[11px] text-slate-400">
                  {fileInfo?.name}
                </span>
                <span className="font-semibold text-slate-700">
                  {isBw ? '⬛ Black & White' : '🎨 Full Color'} ({settings?.sideMode === 'double' ? 'Double-Sided' : 'Single-Sided'})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-orange-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{fileInfo?.name}</h3>
                  <p className="text-xs text-slate-400">Page {currentPage} of {totalPages} · {isBw ? 'B&W Simulation' : 'Full Color'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {totalPages > 1 && (
                    <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1 text-xs text-slate-700 font-bold gap-1.5">
                      <button
                        type="button"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>{currentPage} / {totalPages}</span>
                      <button
                        type="button"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-4 min-h-[350px]">
                {isPdf && (
                  <canvas
                    ref={expandedCanvasRef}
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                    style={{
                      filter: isBw ? 'grayscale(100%) contrast(115%)' : 'none',
                    }}
                  />
                )}
                {isImage && imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Expanded preview"
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                    style={{
                      filter: isBw ? 'grayscale(100%) contrast(115%)' : 'none',
                    }}
                  />
                )}
                {!isPdf && !isImage && (
                  <div className="text-center p-8 space-y-3">
                    <span className="text-5xl">{fileInfo?.typeInfo?.icon || '📝'}</span>
                    <h4 className="font-bold text-slate-800 text-base">{fileInfo?.name}</h4>
                    <p className="text-sm text-slate-500">{totalPages} Pages · {fileInfo?.size}</p>
                    <p className="text-xs text-[#F78C25] font-semibold bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl inline-block">
                      Office conversion will run at the kiosk print agent
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
