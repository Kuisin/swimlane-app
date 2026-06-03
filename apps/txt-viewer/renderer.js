const sidebarEl = document.getElementById('sidebar')
const fileListEl = document.getElementById('file-list')
const emptyStateEl = document.getElementById('empty-state')
const svgViewEl = document.getElementById('svg-view')
const svgContainerEl = document.getElementById('svg-container')
const txtPanelEl = document.getElementById('txt-panel')
const txtContentEl = document.getElementById('txt-content')
const txtPanelFilenameEl = document.getElementById('txt-panel-filename')
const folderPathEl = document.getElementById('folder-path')
const btnToggleTxt = document.getElementById('btn-toggle-txt')
const themeSelectEl = document.getElementById('theme-select')

// name -> { content: string, svg: string|null, error: string|null }
const files = new Map()
let selectedFile = null
let txtVisible = false
let currentThemeKey = 'basic'

function renderSvg(content) {
  return window.api.renderSvg(content, currentThemeKey)
}

function openFolder() {
  window.api.selectFolder().then((folderPath) => {
    if (!folderPath) return
    loadFolder(folderPath)
  })
}

async function loadFolder(folderPath) {
  folderPathEl.textContent = folderPath
  window.api.removeFileChangedListener()
  window.api.stopWatch()

  const fileList = await window.api.readTxtFiles(folderPath)
  files.clear()
  selectedFile = null

  if (fileList.length === 0) {
    showEmptyState('No <strong>.txt</strong> files found in this folder.')
    sidebarEl.classList.add('hidden')
    btnToggleTxt.classList.add('hidden')
    return
  }

  // Render all SVGs in parallel
  await Promise.all(
    fileList.map(async (f) => {
      const { svg, error } = await renderSvg(f.content)
      files.set(f.name, { content: f.content, svg, error })
    })
  )

  emptyStateEl.classList.add('hidden')
  sidebarEl.classList.remove('hidden')
  btnToggleTxt.classList.remove('hidden')

  renderFileList()
  selectFile([...files.keys()].sort()[0])

  window.api.watchFolder(folderPath)
  window.api.onFileChanged(async ({ name, content, eventType }) => {
    if (eventType === 'unlink') {
      files.delete(name)
      renderFileList()
      if (selectedFile === name) {
        const remaining = [...files.keys()].sort()
        if (remaining.length > 0) {
          selectFile(remaining[0])
        } else {
          showEmptyState('No <strong>.txt</strong> files found in this folder.')
          sidebarEl.classList.add('hidden')
          btnToggleTxt.classList.add('hidden')
          svgViewEl.classList.add('hidden')
        }
      }
    } else {
      const { svg, error } = await renderSvg(content)
      const isNew = !files.has(name)
      files.set(name, { content, svg, error })
      if (isNew) renderFileList()
      if (selectedFile === name) renderSvgView(name)
    }
  })
}

function showEmptyState(msg) {
  emptyStateEl.querySelector('p').innerHTML = msg
  emptyStateEl.classList.remove('hidden')
  svgViewEl.classList.add('hidden')
}

function renderFileList() {
  fileListEl.innerHTML = ''
  const sorted = [...files.keys()].sort()
  for (const name of sorted) {
    const li = document.createElement('li')
    li.className = 'file-item' + (name === selectedFile ? ' active' : '')
    li.dataset.name = name
    const displayName = name.replace(/^\d+[_\-\s]/, '').replace(/\.txt$/i, '')
    li.textContent = displayName
    li.title = name
    li.addEventListener('click', () => selectFile(name))
    fileListEl.appendChild(li)
  }
}

function selectFile(name) {
  selectedFile = name
  for (const li of fileListEl.querySelectorAll('.file-item')) {
    li.classList.toggle('active', li.dataset.name === name)
  }
  renderSvgView(name)
}

function renderSvgView(name) {
  const file = files.get(name)
  if (!file) return

  emptyStateEl.classList.add('hidden')
  svgViewEl.classList.remove('hidden')

  if (file.error) {
    svgContainerEl.innerHTML = `<div class="error-msg">⚠ ${escapeHtml(file.error)}</div>`
  } else {
    svgContainerEl.innerHTML = file.svg || ''
    const svg = svgContainerEl.querySelector('svg')
    if (svg) {
      svg.removeAttribute('width')
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
    }
  }

  txtPanelFilenameEl.textContent = name
  txtContentEl.textContent = file.content
  txtPanelEl.classList.toggle('hidden', !txtVisible)
}

async function rerenderAllFiles() {
  if (files.size === 0) return
  await Promise.all(
    [...files.entries()].map(async ([name, file]) => {
      const { svg, error } = await renderSvg(file.content)
      files.set(name, { ...file, svg, error })
    })
  )
  if (selectedFile) renderSvgView(selectedFile)
}

themeSelectEl.addEventListener('change', () => {
  currentThemeKey = themeSelectEl.value
  rerenderAllFiles()
})

btnToggleTxt.addEventListener('click', () => {
  txtVisible = !txtVisible
  btnToggleTxt.textContent = txtVisible ? 'Hide TXT' : 'Show TXT'
  if (selectedFile) txtPanelEl.classList.toggle('hidden', !txtVisible)
})

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

document.getElementById('btn-open').addEventListener('click', openFolder)
document.getElementById('btn-open-empty').addEventListener('click', openFolder)
