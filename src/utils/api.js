const API_URL     = 'https://script.google.com/macros/s/AKfycbyj8UTgncnMmmz4ERZIN49PiHqPOS2GnBABOKgQ9WEirPh8aHSt0tdCcKkv2nUqeKt9/exec'
const LOCAL_API    = 'http://localhost:3001'
const LOCAL_AGENT  = 'https://mechanism-northeast-months-laser.trycloudflare.com'

async function localGet(path) {
  try {
    const res = await fetch(`${LOCAL_API}${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function gasGet(params) {
  try {
    const res = await fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    return await res.json()
  } catch {
    return null
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

async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64) {
  const endpoints = [`${LOCAL_API}/save-order`, `${LOCAL_AGENT}/save-order`]
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 }),
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data?.success) return true
    } catch {
      continue
    }
  }
  return false
}

export async function boothLogin(pin) {
  try {
    const res = await fetch('http://localhost:3001/booth-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pin }),
    })
    return await res.json()
  } catch {
    return { success: false, error: 'Could not connect to print agent.' }
  }
}

export async function validateAndRelease(orderId) {
  try {
    const res = await fetch('http://localhost:3001/release-print', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId }),
    })
    return await res.json()
  } catch {
    return { success: false, error: 'Could not connect to print agent. Is it running?' }
  }
}

export async function submitOrder(orderData) {
  const orderId = 'XB' + (1000 + Math.floor(Math.random() * 9000))

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
