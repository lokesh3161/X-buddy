import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function UploadSection({ onFileReady }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const processFile = useCallback(async (file) => {
    setError('')
    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      onFileReady({ file, name: file.name, size: formatBytes(file.size), totalPages: pdf.numPages })
    } catch {
      setError('Could not read PDF. Please upload a valid PDF file.')
    } finally {
      setLoading(false)
    }
  }, [onFileReady])

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) processFile(accepted[0])
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#222222] mb-2">Upload Your PDF</h2>
        <p className="text-gray-500">Drag & drop or click to select your document</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 bg-white
          ${isDragActive
            ? 'border-[#F78C25] bg-orange-50 glow-orange'
            : 'border-orange-200 hover:border-[#F78C25] hover:bg-orange-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-12 h-12 border-2 border-[#F78C25] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#F78C25] font-medium">Reading PDF...</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F78C25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[#222222] font-medium mb-1">
                {isDragActive ? 'Drop it here!' : 'Drop your PDF here'}
              </p>
              <p className="text-gray-500 text-sm">or click to browse files</p>
              <p className="text-gray-400 text-xs mt-3">PDF files only • Max 50MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center mt-3">
          {error}
        </motion.p>
      )}
    </section>
  )
}
