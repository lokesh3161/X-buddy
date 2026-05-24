const API_URL     = 'https://script.google.com/macros/s/AKfycbyj8UTgncnMmmz4ERZIN49PiHqPOS2GnBABOKgQ9WEirPh8aHSt0tdCcKkv2nUqeKt9/exec'
const LOCAL_AGENT = 'https://img-ruled-give-bandwidth.trycloudflare.com'

function gasGet(params) {
  return fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    .catch(() => {})
}

async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64) {
  try {
    const res = await fetch(`${LOCAL_AGENT}/save-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 }),
    })
    const data = await res.json()
    return data.success
  } catch {
    return false
  }
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
