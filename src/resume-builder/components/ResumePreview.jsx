import { useRef, useState } from 'react'
import { useResume } from '../resumeStore.jsx'
import { getTemplate } from '../templates'

export default function ResumePreview({ onPrint }) {
  const { resume } = useResume()
  const previewRef  = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [zoom, setZoom]           = useState(0.75)

  const tpl = getTemplate(resume.template)
  const TemplateComponent = tpl.component

  async function captureAndExport(action) {
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF }   = await import('jspdf')

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        // Capture at actual A4 size, not zoomed
        width:  previewRef.current.scrollWidth,
        height: previewRef.current.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pdfW    = pdf.internal.pageSize.getWidth()
      const pdfH    = pdf.internal.pageSize.getHeight()

      // Multi-page support
      const canvasH     = canvas.height
      const canvasW     = canvas.width
      const pageH       = Math.floor(canvasH * (pdfW / canvasW) > pdfH
        ? canvasH / Math.ceil((canvasH * (pdfW / canvasW)) / pdfH)
        : canvasH)
      const totalPages  = Math.ceil(canvasH / pageH)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        const srcY    = i * pageH
        const sliceH  = Math.min(pageH, canvasH - srcY)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width  = canvasW
        pageCanvas.height = sliceH
        pageCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvasW, sliceH, 0, 0, canvasW, sliceH)
        const pageImg = pageCanvas.toDataURL('image/png')
        const imgH    = (sliceH / canvasW) * pdfW
        pdf.addImage(pageImg, 'PNG', 0, 0, pdfW, imgH)
      }

      if (action === 'download') {
        const name = resume.personal.name
          ? `${resume.personal.name.replace(/\s+/g, '_')}_Resume.pdf`
          : 'Resume.pdf'
        pdf.save(name)
      } else {
        // Inject into X Buddy print flow
        const blob = pdf.output('blob')
        const name = resume.personal.name
          ? `${resume.personal.name.replace(/\s+/g, '_')}_Resume.pdf`
          : 'Resume.pdf'
        const file = new File([blob], name, { type: 'application/pdf' })
        onPrint(file)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0 bg-[#0a0a0f]">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs">Zoom</span>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-gray-400 text-xs flex items-center justify-center transition-all">−</button>
          <span className="text-gray-500 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.2, z + 0.1))} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-gray-400 text-xs flex items-center justify-center transition-all">+</button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => captureAndExport('download')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? 'Exporting...' : 'Download PDF'}
          </button>
          <button
            onClick={() => captureAndExport('print')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            {exporting ? 'Preparing...' : 'Print with X Buddy'}
          </button>
        </div>
      </div>

      {/* A4 canvas area */}
      <div className="flex-1 overflow-auto bg-neutral-950 p-6 flex justify-center scrollbar-thin">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
          {/* This div is what gets captured — render at true A4 size */}
          <div
            ref={previewRef}
            style={{ width: '210mm', minHeight: '297mm', background: '#fff', boxShadow: '0 4px 40px rgba(0,0,0,0.5)' }}
          >
            <TemplateComponent data={resume} />
          </div>
        </div>
      </div>
    </div>
  )
}
