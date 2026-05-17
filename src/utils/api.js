const API_URL =
  'https://script.google.com/macros/s/AKfycbyzLXasAyvuEBym97z1hbYzGsLwXAu3t9rCaVGGE_15EdNlaFLfxkr2KwpV5rzGTSSG/exec'

const CHUNK_SIZE = 50000 // 50KB per chunk

// GET request — for small text data (order info)
function gasGet(params) {
  return fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
    .catch(() => {})
}

// Form POST via hidden iframe — only way to send large data to GAS from browser
// GAS reads it via e.parameter.payload
function gasFormPost(data) {
  return new Promise((resolve) => {
    const iframeName = 'gas-frame-' + Date.now()

    const iframe = document.createElement('iframe')
    iframe.name = iframeName
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = API_URL
    form.target = iframeName
    form.style.display = 'none'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'payload'
    input.value = JSON.stringify(data)
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()

    // Wait for GAS to process then clean up
    setTimeout(() => {
      try { document.body.removeChild(form) } catch {}
      try { document.body.removeChild(iframe) } catch {}
      resolve()
    }, 2000)
  })
}

// Split base64 into chunks and send each via form POST
async function sendChunks(fileId, fileType, base64Data) {
  const total = Math.ceil(base64Data.length / CHUNK_SIZE)
  for (let i = 0; i < total; i++) {
    const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    await gasFormPost({
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

  // Step 2: Send screenshot chunks → assemble → Drive
  if (orderData.screenshotBase64) {
    await sendChunks(orderId, 'screenshot', orderData.screenshotBase64)
    await gasFormPost({
      action:   'assembleFile',
      fileId:   orderId,
      fileType: 'screenshot',
      fileName: orderId + '_payment.png',
      mimeType: 'image/png',
    })
  }

  // Step 3: Skip PDF upload from frontend — print agent handles this
  // PDF is already downloaded by print agent from Drive directly

  return { success: true, orderId }
}
