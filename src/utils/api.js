import { auth, getShopConfig } from './firebase'

const LOCAL_API  = 'http://localhost:3001'

let _tunnelUrl = null
let _tunnelFetchedAt = 0
let _shopConfig = null
const TUNNEL_TTL = 30000

async function getConfig() {
  if (_shopConfig) return _shopConfig
  const user = auth.currentUser
  if (user) _shopConfig = await getShopConfig(user.uid)
  return _shopConfig
}

async function getGasUrl() {
  const config = await getConfig()
  return config?.gasUrl || 'https://script.google.com/macros/s/AKfycbzEGtssDA6cpNQ2Wg-TexwMFq4fhVeguNzp3EiAUd8W5aTZ4bgYscvGg2_7Ez2z2utr/exec'
}

async function getTunnelUrl() {
  const now = Date.now()
  if (_tunnelUrl && now - _tunnelFetchedAt < TUNNEL_TTL) return _tunnelUrl

  // 1. Try local agent
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) { _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl }
    }
  } catch {}

  // 2. Try GAS (tunnel.js publishes URL here on every agent start)
  try {
    const gasUrl = await getGasUrl()
    const res = await fetch(`${gasUrl}?action=getTunnelUrl`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) {
        _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl
      }
    }
  } catch {}

  return null
}

async function gasGet(params) {
  try {
    const gasUrl = await getGasUrl()
    const res = await fetch(`${gasUrl}?${new URLSearchParams(params).toString()}`)
    return await res.json()
  } catch {
    return null
  }
}

async function localGet(path) {
  try {
    const res = await fetch(`${LOCAL_API}${path}`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Send PDF in chunks via GAS proxy → tunnel (safe for mobile)
async function sendViaGasProxy(orderId, fileName, pdfBase64, screenshotBase64) {
  const gasUrl = await getGasUrl()
  const CHUNK_SIZE = 150000 // 150KB per chunk — safe for GAS URL length limit
  const totalChunks = Math.ceil(pdfBase64.length / CHUNK_SIZE)

  for (let i = 0; i < totalChunks; i++) {
    const chunk = pdfBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const isLast = i === totalChunks - 1
    const params = new URLSearchParams({
      action:      'proxyChunk',
      orderId,
      chunk,
      chunkIndex:  String(i),
      totalChunks: String(totalChunks),
    })
    if (isLast && screenshotBase64) params.set('screenshotBase64', screenshotBase64)

    const res = await fetch(`${gasUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(60000),
    }).then(r => r.json())

    if (!res.success) throw new Error(res.error || `Chunk ${i} failed`)
  }
  return true
}

// Send PDF + screenshot to print agent — tries local first, then GAS proxy for mobile
async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64) {
  // 1. Try local agent directly (works when on same network / same device)
  try {
    const res = await fetch(`${LOCAL_API}/save-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 }),
      signal:  AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.success) { console.log('[api] PDF saved via local'); return true }
    }
  } catch {}

  // 2. Try tunnel directly (fast if connection is good)
  const tunnelUrl = await getTunnelUrl()
  if (tunnelUrl) {
    try {
      const res = await fetch(`${tunnelUrl}/save-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 }),
        signal:  AbortSignal.timeout(20000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success) { console.log('[api] PDF saved via tunnel direct'); return true }
      }
    } catch {}
  }

  // 3. Fallback: send in chunks via GAS proxy (works on mobile over slow connections)
  try {
    console.log('[api] Trying chunked upload via GAS proxy...')
    await sendViaGasProxy(orderId, fileName, pdfBase64, screenshotBase64)
    console.log('[api] PDF saved via GAS proxy chunks')
    return true
  } catch (err) {
    console.warn('[api] GAS proxy also failed:', err.message)
  }

  console.warn('[api] Could not reach print agent — PDF not saved locally')
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin }),
        signal:  AbortSignal.timeout(5000),
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
        signal:  AbortSignal.timeout(10000),
      })
      if (res.ok) return await res.json()
    } catch { continue }
  }
  return { success: false, error: 'Could not connect to print agent. Is it running?' }
}

export async function submitOrder(orderData) {
  const orderId = 'XB' + (1000 + Math.floor(Math.random() * 9000))

  // Pre-fetch tunnel URL before submitting (so it's ready)
  await getTunnelUrl()

  await sendToLocalAgent(
    orderId,
    orderData.fileName,
    orderData.pdfBase64 || '',
    orderData.screenshotBase64 || ''
  )

  await gasGet({
    action:        'saveOrder',
    orderId,
    name:          orderData.name,
    fileName:      orderData.fileName,
    totalPages:    String(orderData.totalPages),
    copies:        String(orderData.copies),
    printType:     orderData.printType,
    printSide:     orderData.printSide || '',
    amount:        String(orderData.amount),
    transactionId: orderData.transactionId,
  })

  return { success: true, orderId }
}
