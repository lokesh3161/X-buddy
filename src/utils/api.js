const API_URL     = 'https://script.google.com/macros/s/AKfycbyj8UTgncnMmmz4ERZIN49PiHqPOS2GnBABOKgQ9WEirPh8aHSt0tdCcKkv2nUqeKt9/exec'
const LOCAL_AGENT = 'https://distributions-marijuana-enb-inn.trycloudflare.com'

// Send order text data to GAS → saves to Sheets instantly
function gasGet(params) {
  return fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    .catch(() => {})
}

// Send PDF + screenshot directly to local print agent (fast, no size limit)
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
    // Local agent not running — order still saved to Sheets
    return false
  }
}

export async function submitOrder(orderData) {
  const orderId = 'XB' + (1000 + Math.floor(Math.random() * 9000))

  // Step 2: Send PDF + screenshot to local agent FIRST (await it)
  if (orderData.pdfBase64) {
    await sendToLocalAgent(
      orderId,
      orderData.fileName,
      orderData.pdfBase64 || '',
      orderData.screenshotBase64 || ''
    )
  }

  // Step 3: Save order to Sheets AFTER PDF is ready on local agent
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
