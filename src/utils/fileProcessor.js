/**
 * fileProcessor.js
 * Converts any supported file format into a printable PDF Blob.
 * Each processor is self-contained and returns { pdfBlob, totalPages, thumbnail }.
 */

import * as pdfjsLib from 'pdfjs-dist'
import { jsPDF } from 'jspdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPPORTED_TYPES = {
  'application/pdf':                                                    { label: 'PDF',  ext: '.pdf',  icon: '📄', category: 'document' },
  'application/msword':                                                 { label: 'DOC',  ext: '.doc',  icon: '📝', category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', ext: '.docx', icon: '📝', category: 'document' },
  'application/vnd.ms-powerpoint':                                      { label: 'PPT',  ext: '.ppt',  icon: '📊', category: 'document' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PPTX', ext: '.pptx', icon: '📊', category: 'document' },
  'application/vnd.ms-excel':                                           { label: 'XLS',  ext: '.xls',  icon: '📈', category: 'document' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':  { label: 'XLSX', ext: '.xlsx', icon: '📈', category: 'document' },
  'application/rtf':                                                    { label: 'RTF',  ext: '.rtf',  icon: '📄', category: 'document' },
  'text/rtf':                                                           { label: 'RTF',  ext: '.rtf',  icon: '📄', category: 'document' },
  'text/plain':                                                         { label: 'TXT',  ext: '.txt',  icon: '📃', category: 'text'     },
  'image/jpeg':                                                         { label: 'JPG',  ext: '.jpg',  icon: '🖼️', category: 'image'    },
  'image/png':                                                          { label: 'PNG',  ext: '.png',  icon: '🖼️', category: 'image'    },
  'image/bmp':                                                          { label: 'BMP',  ext: '.bmp',  icon: '🖼️', category: 'image'    },
  'image/tiff':                                                         { label: 'TIFF', ext: '.tiff', icon: '🖼️', category: 'image'    },
  'image/webp':                                                         { label: 'WEBP', ext: '.webp', icon: '🖼️', category: 'image'    },
  'image/svg+xml':                                                      { label: 'SVG',  ext: '.svg',  icon: '🎨', category: 'image'    },
  'text/html':                                                          { label: 'HTML', ext: '.html', icon: '🌐', category: 'html'     },
}

// Also match by extension for browsers that return wrong MIME
const EXT_MAP = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  rtf: 'text/rtf', txt: 'text/plain',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  bmp: 'image/bmp', tiff: 'image/tiff', tif: 'image/tiff',
  webp: 'image/webp', svg: 'image/svg+xml', html: 'text/html', htm: 'text/html',
}

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export function resolveFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const mime = SUPPORTED_TYPES[file.type] ? file.type : (EXT_MAP[ext] || null)
  return mime ? { mime, ...SUPPORTED_TYPES[mime] } : null
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// ─── Thumbnail from first PDF page ────────────────────────────────────────────

async function pdfThumbnail(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
    const page = await pdf.getPage(1)
    const vp = page.getViewport({ scale: 0.5 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

// ─── PDF Processor ────────────────────────────────────────────────────────────

async function processPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const thumbnail = await pdfThumbnail(arrayBuffer)
  return { pdfBlob: file, totalPages, thumbnail }
}

// ─── Image Processor ─────────────────────────────────────────────────────────

async function processImage(file, imageFit = 'fit') {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const A4_W = 210, A4_H = 297 // mm
        const doc = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const pageH = doc.internal.pageSize.getHeight()

        let x = 0, y = 0, w = pageW, h = pageH
        const imgRatio = img.width / img.height
        const pageRatio = pageW / pageH

        if (imageFit === 'fit') {
          if (imgRatio > pageRatio) { w = pageW; h = pageW / imgRatio }
          else { h = pageH; w = pageH * imgRatio }
          x = (pageW - w) / 2
          y = (pageH - h) / 2
        } else if (imageFit === 'fill') {
          if (imgRatio > pageRatio) { h = pageH; w = pageH * imgRatio; x = (pageW - w) / 2 }
          else { w = pageW; h = pageW / imgRatio; y = (pageH - h) / 2 }
        }
        // 'stretch' uses full page w/h

        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        const fmt = file.type === 'image/png' ? 'PNG' : 'JPEG'
        doc.addImage(dataUrl, fmt, x, y, w, h)

        const pdfBlob = doc.output('blob')
        URL.revokeObjectURL(url)
        resolve({ pdfBlob, totalPages: 1, thumbnail: dataUrl })
      } catch (e) { reject(e) }
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── SVG Processor ───────────────────────────────────────────────────────────

async function processSvg(file) {
  const text = await file.text()
  const blob = new Blob([text], { type: 'image/svg+xml' })
  const svgFile = new File([blob], file.name, { type: 'image/svg+xml' })
  return processImage(svgFile, 'fit')
}

// ─── Text Processor ───────────────────────────────────────────────────────────

async function processText(file) {
  const text = await file.text()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  const lineH = 6
  const maxW = pageW - margin * 2
  const maxLines = Math.floor((pageH - margin * 2) / lineH)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)

  const rawLines = text.split('\n')
  const allLines = []
  for (const raw of rawLines) {
    const wrapped = doc.splitTextToSize(raw || ' ', maxW)
    allLines.push(...wrapped)
  }

  let page = 1
  for (let i = 0; i < allLines.length; i++) {
    const lineIndex = i % maxLines
    if (i > 0 && lineIndex === 0) { doc.addPage(); page++ }
    doc.text(allLines[i], margin, margin + lineIndex * lineH)
  }

  const pdfBlob = doc.output('blob')
  return { pdfBlob, totalPages: page, thumbnail: null }
}

// ─── HTML Processor ───────────────────────────────────────────────────────────

async function processHtml(file) {
  const html = await file.text()
  // Render in hidden iframe, capture via canvas
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;'
    document.body.appendChild(iframe)
    iframe.onload = async () => {
      try {
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(iframe.contentDocument.body, { scale: 1.5, useCORS: true, logging: false })
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        const doc = new jsPDF({ unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const pageH = doc.internal.pageSize.getHeight()
        const ratio = canvas.width / canvas.height
        let w = pageW, h = pageW / ratio
        if (h > pageH) { h = pageH; w = pageH * ratio }
        doc.addImage(dataUrl, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h)
        document.body.removeChild(iframe)
        resolve({ pdfBlob: doc.output('blob'), totalPages: 1, thumbnail: dataUrl })
      } catch (e) { document.body.removeChild(iframe); reject(e) }
    }
    iframe.srcdoc = html
  })
}

// ─── Office Processor (DOC/DOCX/PPT/PPTX/XLS/XLSX/RTF) ───────────────────────
// Browser-side full fidelity conversion of Office formats is not possible without
// a server. We render a clear user-facing notice page as the PDF and flag it so
// the UI can show a warning. In a production deployment this would call a backend
// conversion endpoint (LibreOffice / Gotenberg).

async function processOffice(file, typeInfo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(255, 248, 242)
  doc.rect(0, 0, pageW, 297, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(247, 140, 37)
  doc.text('X Buddy', pageW / 2, 50, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(60, 60, 60)
  doc.text(`File: ${file.name}`, pageW / 2, 70, { align: 'center' })
  doc.text(`Type: ${typeInfo.label} Document`, pageW / 2, 82, { align: 'center' })
  doc.text(`Size: ${formatBytes(file.size)}`, pageW / 2, 94, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(120, 120, 120)
  const note = [
    'This document will be sent to the print agent.',
    'Office format conversion requires the X Buddy',
    'desktop agent to be running on the kiosk PC.',
    '',
    'The agent will convert and print this file',
    'automatically using LibreOffice.',
  ]
  note.forEach((line, i) => doc.text(line, pageW / 2, 120 + i * 9, { align: 'center' }))

  return {
    pdfBlob: doc.output('blob'),
    totalPages: 1,
    thumbnail: null,
    requiresAgent: true,
    originalFile: file,
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function processFile(file, options = {}) {
  if (file.size > MAX_FILE_SIZE) throw new Error(`File too large. Maximum size is 100 MB.`)

  const typeInfo = resolveFileType(file)
  if (!typeInfo) throw new Error(`Unsupported file format. Please upload a supported document or image.`)

  const { imageFit = 'fit' } = options

  switch (typeInfo.category) {
    case 'document':
      if (typeInfo.mime === 'application/pdf') return processPdf(file)
      return processOffice(file, typeInfo)
    case 'image':
      if (typeInfo.mime === 'image/svg+xml') return processSvg(file)
      return processImage(file, imageFit)
    case 'text':
      return processText(file)
    case 'html':
      return processHtml(file)
    default:
      throw new Error('Unsupported file type.')
  }
}
