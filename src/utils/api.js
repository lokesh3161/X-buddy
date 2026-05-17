const API_URL =
  'https://script.google.com/macros/s/AKfycbwPf44zofag9bzab-x9uaHi6Zuw0sfZvC4pZeYOaXmrNTKkcMyLDVXbgZ9NlbIIqlGA/exec'

const CHUNK_SIZE = 100000 // 100KB per chunk in POST body (no URL encoding issue)

// Small text params → GET request (works fine, no encoding issues)
function gasGet(params) {
  return fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    .catch(() => {})
}

// Large base64 data → POST with JSON body (no URL length limit)
function gasPost(data) {
  return fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors', // avoids CORS block, body is preserved in POST
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data),
  }).catch(() => {})
}

// Split base64 into chunks and POST each one
async function sendChunks(fileId, fileType, base64Data) {
  const total = Math.ceil(base64Data.length / CHUNK_SIZE)
  for (let i = 0; i < total; i++) {
    const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    await gasPost({
      action: 'saveChunk',
      fileId,
      fileType,
      index:  i,
      total,
      chunk,
    })
  }
}

export async function submitOrder(orderData) {
  const orderId = 'XB' + (1000 + Math.floor(Math.random() * 9000))

  // Step 1: Save order text data → Sheets via GET
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

  // Step 2: Send screenshot chunks via POST → assemble → Drive
  if (orderData.screenshotBase64) {
    await sendChunks(orderId, 'screenshot', orderData.screenshotBase64)
    await gasPost({
      action:   'assembleFile',
      fileId:   orderId,
      fileType: 'screenshot',
      fileName: orderId + '_payment.png',
      mimeType: 'image/png',
    })
  }

  // Step 3: Send PDF chunks via POST → assemble → Drive
  if (orderData.pdfBase64) {
    await sendChunks(orderId, 'pdf', orderData.pdfBase64)
    await gasPost({
      action:   'assembleFile',
      fileId:   orderId,
      fileType: 'pdf',
      fileName: orderId + '_' + orderData.fileName,
      mimeType: 'application/pdf',
    })
  }

  return { success: true, orderId }
}
