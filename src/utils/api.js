const API_URL    = 'https://script.google.com/macros/s/AKfycbyWiu74FuFA-m-uord17vVKSN67y3_Hr7gH1u-mZ6SHafeD818LvRaA194C517_HinS/exec'
const LOCAL_API  = 'http://localhost:3001'
const GITHUB_RAW = 'https://raw.githubusercontent.com/lokesh3161/X-buddy/main/public/tunnel-url.txt'

let _tunnelUrl = null
let _tunnelFetchedAt = 0
const TUNNEL_TTL = 5 * 60 * 1000

async function getTunnelUrl() {
  const now = Date.now()
  if (_tunnelUrl && (now - _tunnelFetchedAt) < TUNNEL_TTL) return _tunnelUrl

  // Local agent — fast timeout
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(500) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) { _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl }
    }
  } catch {}

  // GitHub raw
  try {
    const res = await fetch(`${GITHUB_RAW}?t=${now}`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('https://')) { _tunnelUrl = url; _tunnelFetchedAt = now; return _tunnelUrl }
    }
  } catch {}

  // GAS fallback
  try {
    const res = await fetch(`${API_URL}?action=getTunnelUrl`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) { _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl }
    }
  } catch {}

  _tunnelUrl = null
  return null
}

async function gasGet(params) {
  try {
    const res = await fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    return await res.json()
  } catch { return null }
}

async function localGet(path) {
  try {
    const res = await fetch(`${LOCAL_API}${path}`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

// Upload PDF to GAS Drive in 200KB chunks
async function uploadPdfViaGas(orderId, fileName, pdfBase64) {
  const CHUNK_SIZE = 200 * 1024
  const total = Math.ceil(pdfBase64.length / CHUNK_SIZE)

  for (let i = 0; i < total; i++) {
    const chunk = pdfBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const params = new URLSearchParams({
      action: 'saveChunk', fileId: orderId, fileType: 'pdf',
      index: String(i), total: String(total), chunk,
    })
    const res = await fetch(`${API_URL}?${params.toString()}`, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`Chunk ${i} failed: HTTP ${res.status}`)
    const data = await res.json()
    if (!data?.success) throw new Error(`Chunk ${i} rejected`)
  }

  const assembleParams = new URLSearchParams({
    action: 'assemblePdf', fileId: orderId,
    fileName, mimeType: 'application/pdf',
  })
  const res = await fetch(`${API_URL}?${assembleParams.toString()}`, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`Assemble failed: HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.success || !data?.fileUrl) throw new Error('Assembly failed — no Drive URL')
  return data.fileUrl
}

// Send only metadata + driveUrl to agent (no PDF in body — avoids Cloudflare block)
async function notifyAgent(orderId, driveUrl, printSettings, screenshotBase64) {
  const body = JSON.stringify({ orderId, driveUrl, screenshotBase64: screenshotBase64 || '', ...printSettings })

  // Try local first
  try {
    const res = await fetch(`${LOCAL_API}/save-order-meta`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body, signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.success) return true
    }
  } catch {}

  // Try tunnel (metadata is tiny — always works through Cloudflare)
  const tunnelUrl = await getTunnelUrl()
  if (tunnelUrl) {
    try {
      const res = await fetch(`${tunnelUrl}/save-order-meta`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body, signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success) return true
      }
    } catch {}
  }

  return false
}

export async function getOrderStatus(orderId) {
  return await gasGet({ action: 'getOrderStatus', orderId })
}

export async function fetchAdminOrders() {
  return await localGet('/admin/orders') ?? await gasGet({ action: 'listOrders' })
}

export async function fetchAdminStats() {
  return await localGet('/admin/stats') ?? await gasGet({ action: 'getDashboard' })
}

export async function fetchBoothStatus() {
  return await localGet('/admin/booths') ?? await gasGet({ action: 'getBooths' })
}

export async function fetchHealthStatus() {
  return await localGet('/admin/health') ?? await gasGet({ action: 'getHealth' })
}

export async function boothLogin(pin) {
  const tunnelUrl = await getTunnelUrl()
  const endpoints = [
    `${LOCAL_API}/booth-login`,
    tunnelUrl ? `${tunnelUrl}/booth-login` : null,
  ].filter(Boolean)
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }), signal: AbortSignal.timeout(5000),
      })
      if (res.ok) return await res.json()
    } catch { continue }
  }
  return { success: false, error: 'Could not connect to print agent.' }
}

export async function validateAndRelease(orderId) {
  const tunnelUrl = await getTunnelUrl()
  const endpoints = [
    `${LOCAL_API}/release-print`,
    tunnelUrl ? `${tunnelUrl}/release-print` : null,
  ].filter(Boolean)
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }), signal: AbortSignal.timeout(10000),
      })
      if (res.ok) return await res.json()
    } catch { continue }
  }
  return { success: false, error: 'Could not connect to print agent. Is it running?' }
}

export async function submitOrder(orderData, { onStep } = {}) {
  const clientOrderId = 'XB' + String(Math.floor(1000 + Math.random() * 9000))

  const printSettings = {
    copies:      orderData.copies,
    printSide:   orderData.printSide   || 'Single',
    colorMode:   orderData.printType   || 'B&W',
    pageSize:    orderData.pageSize    || 'A4',
    orientation: orderData.orientation || 'portrait',
    pageRange:   orderData.pageRange   || 'all',
  }

  // ── Step 1: Save order to GAS ─────────────────────────────────────────────
  onStep?.('save_order')
  let gasResult
  try {
    const res = await fetch(
      `${API_URL}?${new URLSearchParams({
        action: 'saveOrder', orderId: clientOrderId,
        name: orderData.name, fileName: orderData.fileName,
        totalPages: String(orderData.totalPages), copies: String(orderData.copies),
        printType: orderData.printType || 'B&W', printSide: orderData.printSide || 'Single',
        pageSize: orderData.pageSize || 'A4', orientation: orderData.orientation || 'portrait',
        amount: String(orderData.amount), transactionId: orderData.transactionId,
      }).toString()}`,
      { signal: AbortSignal.timeout(20000) }
    )
    if (!res.ok) throw { step: 'save_order', reason: `HTTP ${res.status}` }
    gasResult = await res.json()
  } catch (err) {
    if (err?.step) throw err
    throw { step: 'save_order', reason: err.name === 'TimeoutError' ? 'Request Timed Out' : (err.message || 'Network Error') }
  }

  if (!gasResult?.success) throw { step: 'save_order', reason: gasResult?.error || 'Unable to Save Order' }
  const orderId = gasResult.orderId || clientOrderId

  // ── Step 2: Upload PDF to Drive + notify agent ────────────────────────────
  onStep?.('print_agent')

  // If on kiosk (localhost reachable), send PDF directly — fast and reliable
  try {
    const res = await fetch(`${LOCAL_API}/save-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId, fileName: orderData.fileName,
        pdfBase64: orderData.pdfBase64 || '',
        screenshotBase64: orderData.screenshotBase64 || '',
        ...printSettings,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.success) return { success: true, orderId, message: null }
    }
  } catch {}

  // Mobile path: upload PDF to Drive, then send tiny metadata to agent via tunnel
  try {
    const driveUrl = await uploadPdfViaGas(orderId, orderData.fileName, orderData.pdfBase64 || '')
    await notifyAgent(orderId, driveUrl, printSettings, orderData.screenshotBase64)
    return { success: true, orderId, message: null }
  } catch {
    // Drive upload failed — order is saved in sheet, shopkeeper can handle manually
    return {
      success: true, orderId,
      message: 'Order saved! Show your Order ID to the shopkeeper.',
    }
  }
}
