/**
 * Page range parser for custom page selection.
 * Supports: single pages (5), comma-separated (1,5,9), ranges (1-10), mixed (1-5,8,12-15).
 * Deduplicates and sorts output ascending.
 *
 * @param {string} input - User provided custom page string
 * @param {number} totalPages - Total pages in the document
 * @returns {{ valid: boolean, selectedPages?: number[], error?: string }}
 */
export function parsePageRange(input, totalPages) {
  if (typeof input !== 'string' || !input.trim()) {
    return { valid: false, error: 'Please enter page numbers or ranges.' }
  }

  const trimmed = input.trim()

  // Reject invalid comma constructs like ",,", leading or trailing commas
  if (trimmed.includes(',,') || trimmed.startsWith(',') || trimmed.endsWith(',')) {
    return { valid: false, error: 'Invalid page range format.' }
  }

  const tokens = trimmed.split(',').map(t => t.trim())
  if (tokens.length === 0 || tokens.some(t => !t)) {
    return { valid: false, error: 'Invalid page range format.' }
  }

  const pagesSet = new Set()

  for (const token of tokens) {
    if (token.includes('-')) {
      const parts = token.split('-').map(p => p.trim())
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return { valid: false, error: 'Invalid page range format.' }
      }
      if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
        return { valid: false, error: 'Invalid page range format.' }
      }
      const start = parseInt(parts[0], 10)
      const end = parseInt(parts[1], 10)
      if (isNaN(start) || isNaN(end) || start > end) {
        return { valid: false, error: 'Invalid page range format.' }
      }
      for (let p = start; p <= end; p++) {
        pagesSet.add(p)
      }
    } else {
      if (!/^\d+$/.test(token)) {
        return { valid: false, error: 'Invalid page range format.' }
      }
      const page = parseInt(token, 10)
      if (isNaN(page)) {
        return { valid: false, error: 'Invalid page range format.' }
      }
      pagesSet.add(page)
    }
  }

  const selectedPages = Array.from(pagesSet).sort((a, b) => a - b)

  for (const page of selectedPages) {
    if (page > totalPages || page < 1) {
      return { valid: false, error: 'Selected page does not exist.' }
    }
  }

  return { valid: true, selectedPages }
}
