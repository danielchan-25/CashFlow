export function parseCSV(text) {
  // Strip BOM (\uFEFF) and normalize line endings (CRLF → LF)
  const content = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '').trim()
  const lines = content.split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })

  return { headers, rows }
}

function parseLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function generateCSV(data, filename) {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csv = headers.join(',') + '\n' + data.map(row =>
    headers.map(h => {
      const val = String(row[h] || '')
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
