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

// Send PDF + screenshot — tries local first, then tunnel.
// Returns the agent's response data on success, throws { step, reason } on failure.
async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64, printSettings = {}) {
  const body = JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64, ...printSettings })

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
      if (data?.success) return data
      throw { step: 'print_agent', reason: data?.error || 'Print Agent Rejected Job' }
    }
  } catch (err) {
    if (err?.step) throw err  // already typed
  }

  // 2. Try tunnel (mobile orders come here)
  const tunnelUrl = await getTunnelUrl()
  if (!tunnelUrl) throw { step: 'print_agent', reason: 'Printer Offline — No tunnel URL found' }

  try {
    const res = await fetch(`${tunnelUrl}/save-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(30000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.success) return data
      throw { step: 'print_agent', reason: data?.error || 'Print Agent Rejected Job' }
    }
    throw { step: 'print_agent', reason: `Agent HTTP ${res.status}` }
  } catch (err) {
    if (err?.step) throw err
    throw { step: 'print_agent', reason: err.message || 'Printer Offline' }
  }
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

// submitOrder — sequential, throws { step, reason } on any failure.
// A collision-resistant ID is generated client-side and sent to GAS;
// GAS echoes it back (or generates its own) — we always use the server-confirmed value.
export async function submitOrder(orderData, { onStep } = {}) {
  // Client-side ID: 'XB' + base-36 timestamp + 4 random chars = ~10^9 keyspace, not guessable
  const clientOrderId = 'XB' + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()

  // ── Step 1: Save order record to Google Apps Script ───────────────────────────
  onStep?.('save_order')
  let gasResult
  try {
    const res = await fetch(
      `${API_URL}?${new URLSearchParams({
        action:        'saveOrder',
        orderId:       clientOrderId,
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
    if (!res.ok) throw { step: 'save_order', reason: `Server Error (HTTP ${res.status})` }
    gasResult = await res.json()
  } catch (err) {
    if (err?.step) throw err
    throw { step: 'save_order', reason: err.name === 'TimeoutError' ? 'Request Timed Out' : (err.message || 'Network Error') }
  }

  if (!gasResult?.success) {
    throw { step: 'save_order', reason: gasResult?.error || 'Unable to Save Order' }
  }

  const orderId = gasResult.orderId || clientOrderId
  if (!orderId) throw { step: 'save_order', reason: 'Server did not return an Order ID' }

  // ── Step 2: Send PDF to local print agent ─────────────────────────────────
  onStep?.('print_agent')
  const agentData = await sendToLocalAgent(
    orderId,
    orderData.fileName,
    orderData.pdfBase64 || '',
    orderData.screenshotBase64 || '',
    {
      copies:      orderData.copies,
      printSide:   orderData.printSide,
      colorMode:   orderData.printType,   // 'B&W' or 'Color'
      pageSize:    orderData.pageSize,
      orientation: orderData.orientation,
      pageRange:   orderData.pageRange,
    }
  )

  return {
    success:     true,
    orderId,
    agentStatus: agentData?.status ?? null,   // whatever the agent actually returns
    message:     agentData?.message ?? null,
  }
}
