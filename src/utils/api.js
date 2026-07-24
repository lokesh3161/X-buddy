const API_URL    = 'https://script.google.com/macros/s/AKfycbwDcsGng774iNQ9zNdBt-bdkIFGSg7_lvr5MRvIzzqE6s9bGex7ej1U1WChrY-KgOM/exec'
const LOCAL_API  = 'http://localhost:3001'
const GITHUB_RAW = 'https://raw.githubusercontent.com/lokesh3161/X-buddy/main/public/tunnel-url.txt'

let _tunnelUrl = null

async function getTunnelUrl() {
  if (_tunnelUrl) return _tunnelUrl

  // 1. Try local agent (same machine / same WiFi)
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) { _tunnelUrl = data.url; return _tunnelUrl }
    }
  } catch {}

  // 2. Try GitHub raw (pushed on every server start — most reliable for mobile)
  try {
    const res = await fetch(`${GITHUB_RAW}?t=${Date.now()}`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('https://')) { _tunnelUrl = url; return _tunnelUrl }
    }
  } catch {}

  // 3. Try GAS as last resort
  try {
    const res = await fetch(`${API_URL}?action=getTunnelUrl`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) { _tunnelUrl = data.url; return _tunnelUrl }
    }
  } catch {}

  return null
}

async function gasGet(params) {
  try {
    const res = await fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
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

// Send PDF + screenshot — tries local first, then tunnel (direct POST, works on mobile)
async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64) {
  const body = JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 })

  // 1. Try local agent directly
  try {
    const res = await fetch(`${LOCAL_API}/save-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.success) { console.log('[api] PDF saved via local'); return true }
    }
  } catch {}

  // 2. Try tunnel (mobile orders come here)
  const tunnelUrl = await getTunnelUrl()
  if (tunnelUrl) {
    try {
      const res = await fetch(`${tunnelUrl}/save-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal:  AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.success) { console.log('[api] PDF saved via tunnel:', tunnelUrl); return true }
      }
    } catch (err) {
      console.warn('[api] Tunnel POST failed:', err.message)
    }
  } else {
    console.warn('[api] No tunnel URL found')
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
  // Generate orderId here — GAS is a dumb sheet writer, not an ID authority
  const orderId = 'XB' + Date.now().toString().slice(-4)

  // ── Step 1: Send PDF to local print agent first (heaviest op, fail fast) ──
  const agentOk = await sendToLocalAgent(
    orderId,
    orderData.fileName,
    orderData.pdfBase64 || '',
    orderData.screenshotBase64 || ''
  )

  if (!agentOk) {
    return {
      success: false,
      error: 'Cannot connect to Print Agent. Make sure the X Buddy desktop agent is running on the kiosk PC.',
    }
  }

  // ── Step 2: Save order record to Google Apps Script ───────────────────────
  let gasResult = null
  try {
    const res = await fetch(
      `${API_URL}?${new URLSearchParams({
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
      }).toString()}`,
      { signal: AbortSignal.timeout(20000) }
    )
    if (!res.ok) throw new Error(`GAS HTTP ${res.status}`)
    gasResult = await res.json()
  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Order record timed out saving to sheet. Please inform the shopkeeper with Order ID: ' + orderId
      : `Unable to save order record: ${err.message}`
    return { success: false, error: msg }
  }

  if (!gasResult?.success) {
    return {
      success: false,
      error: gasResult?.error || 'Google Apps Script returned an error. Order not saved.',
    }
  }

  // ── Both steps succeeded ──────────────────────────────────────────────────
  return { success: true, orderId }
}
