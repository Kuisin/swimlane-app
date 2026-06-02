const grid = document.getElementById('grid')
const emptyState = document.getElementById('empty-state')
const folderPathEl = document.getElementById('folder-path')

let currentFolder = null

function openFolder() {
  window.api.selectFolder().then((folderPath) => {
    if (!folderPath) return
    loadFolder(folderPath)
  })
}

async function loadFolder(folderPath) {
  currentFolder = folderPath
  folderPathEl.textContent = folderPath

  window.api.removeFileChangedListener()
  window.api.stopWatch()

  const files = await window.api.readTxtFiles(folderPath)

  grid.innerHTML = ''

  if (files.length === 0) {
    emptyState.classList.remove('hidden')
    grid.classList.add('hidden')
    emptyState.querySelector('p').innerHTML =
      'No <strong>.txt</strong> files found in this folder.'
  } else {
    emptyState.classList.add('hidden')
    grid.classList.remove('hidden')
    files.forEach((f) => addOrUpdateCard(f.name, f.content))
  }

  window.api.watchFolder(folderPath)
  window.api.onFileChanged(({ name, content, eventType }) => {
    if (eventType === 'unlink') {
      removeCard(name)
    } else {
      addOrUpdateCard(name, content, true)
    }
    if (grid.children.length === 0) {
      emptyState.classList.remove('hidden')
      grid.classList.add('hidden')
    } else {
      emptyState.classList.add('hidden')
      grid.classList.remove('hidden')
    }
  })
}

function cardId(name) {
  return 'card-' + name.replace(/[^a-zA-Z0-9]/g, '_')
}

function addOrUpdateCard(name, content, flash = false) {
  const id = cardId(name)
  let card = document.getElementById(id)

  const svg = buildSVG(name, content)

  if (card) {
    card.querySelector('.card-svg').innerHTML = svg
    if (flash) {
      card.classList.add('flash')
      setTimeout(() => card.classList.remove('flash'), 600)
    }
  } else {
    card = document.createElement('div')
    card.className = 'card'
    card.id = id
    card.innerHTML = `
      <div class="card-header">
        <span class="card-filename">${escapeHtml(name)}</span>
        <span class="card-badge">live</span>
      </div>
      <div class="card-svg">${svg}</div>
    `
    grid.appendChild(card)
  }
}

function removeCard(name) {
  const card = document.getElementById(cardId(name))
  if (card) {
    card.classList.add('removing')
    setTimeout(() => card.remove(), 300)
  }
}

function buildSVG(filename, content) {
  const W = 560
  const PADDING = 20
  const LINE_HEIGHT = 20
  const FONT_SIZE = 13
  const MAX_CHARS_PER_LINE = 68

  const rawLines = content.split('\n')
  const wrapped = []
  for (const line of rawLines) {
    if (line.trim() === '') { wrapped.push(''); continue }
    let start = 0
    while (start < line.length) {
      wrapped.push(line.slice(start, start + MAX_CHARS_PER_LINE))
      start += MAX_CHARS_PER_LINE
    }
  }

  const MAX_LINES = 40
  const displayLines = wrapped.slice(0, MAX_LINES)
  const truncated = wrapped.length > MAX_LINES

  const H = PADDING * 2 + displayLines.length * LINE_HEIGHT + (truncated ? LINE_HEIGHT : 0)

  const textRows = displayLines
    .map((line, i) => {
      const y = PADDING + i * LINE_HEIGHT + FONT_SIZE
      return `<text x="${PADDING}" y="${y}" class="txt-line">${escapeXml(line)}</text>`
    })
    .join('\n')

  const truncNote = truncated
    ? `<text x="${PADDING}" y="${H - PADDING + FONT_SIZE - LINE_HEIGHT}" class="txt-trunc">… (${wrapped.length - MAX_LINES} more lines)</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${W} ${H}">
  <style>
    .txt-line { font-family: 'SF Mono', 'Consolas', monospace; font-size: ${FONT_SIZE}px; fill: #c9d1d9; }
    .txt-trunc { font-family: 'SF Mono', 'Consolas', monospace; font-size: 11px; fill: #6e7681; font-style: italic; }
  </style>
  <rect width="${W}" height="${H}" fill="#0d1117" rx="4"/>
  ${textRows}
  ${truncNote}
</svg>`
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

document.getElementById('btn-open').addEventListener('click', openFolder)
document.getElementById('btn-open-empty').addEventListener('click', openFolder)
