const sidebarEl         = document.getElementById('sidebar')
const sidebarTitleEl    = document.getElementById('sidebar-title')
const fileListEl        = document.getElementById('file-list')
const emptyStateEl      = document.getElementById('empty-state')
const svgViewEl         = document.getElementById('svg-view')
const svgContainerEl    = document.getElementById('svg-container')
const txtPanelEl        = document.getElementById('txt-panel')
const txtContentEl      = document.getElementById('txt-content')
const txtPanelFilenameEl = document.getElementById('txt-panel-filename')
const folderPathEl      = document.getElementById('folder-path')
const btnToggleTxt      = document.getElementById('btn-toggle-txt')
const themeSelectEl     = document.getElementById('theme-select')

// relPath -> { content: string, svg: string|null, error: string|null }
const files = new Map()
// Folder relative paths that are collapsed (all others are expanded)
const collapsedFolders = new Set()

let selectedFile    = null
let txtVisible      = false
let currentThemeKey = 'basic'

function renderSvg(content) {
  return window.api.renderSvg(content, currentThemeKey)
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function openFolder() {
  window.api.selectFolder().then((folderPath) => {
    if (!folderPath) return
    loadFolder(folderPath)
  })
}

async function loadFolder(folderPath) {
  folderPathEl.textContent = folderPath
  const rootName = folderPath.split(/[/\\]/).pop() || folderPath
  sidebarTitleEl.textContent = rootName

  window.api.removeFileChangedListener()
  window.api.stopWatch()

  const fileList = await window.api.readTxtFiles(folderPath)
  files.clear()
  collapsedFolders.clear()
  selectedFile = null

  if (fileList.length === 0) {
    showEmptyState('No <strong>.txt</strong> files found in this folder.')
    sidebarEl.classList.add('hidden')
    btnToggleTxt.classList.add('hidden')
    return
  }

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

function buildTree(relPaths) {
  const root = { name: '', path: '', folders: {}, files: [] }
  for (const relPath of relPaths) {
    const parts = relPath.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i]
      if (!node.folders[folderName]) {
        const folderPath = parts.slice(0, i + 1).join('/')
        node.folders[folderName] = { name: folderName, path: folderPath, folders: {}, files: [] }
      }
      node = node.folders[folderName]
    }
    node.files.push(relPath)
  }
  return root
}

function renderFileList() {
  fileListEl.innerHTML = ''
  const sorted = [...files.keys()].sort()
  const tree   = buildTree(sorted)
  appendTreeItems(fileListEl, tree, 0)
}

function appendTreeItems(parentEl, node, depth) {
  const BASE = 10
  const STRIDE = 14
  const FILE_EXTRA = 18

  const folderLeft = BASE + depth * STRIDE
  const fileLeft   = folderLeft + FILE_EXTRA

  for (const folderName of Object.keys(node.folders).sort()) {
    const folder      = node.folders[folderName]
    const isCollapsed = collapsedFolders.has(folder.path)

    const li = document.createElement('li')
    li.className = 'folder-item'
    li.dataset.path = folder.path
    li.style.paddingLeft = `${folderLeft}px`

    const chevron = document.createElement('span')
    chevron.className = 'folder-chevron' + (isCollapsed ? '' : ' open')

    const label = document.createElement('span')
    label.className = 'folder-label'
    label.textContent = folderName

    li.appendChild(chevron)
    li.appendChild(label)
    li.addEventListener('click', () => toggleFolder(folder.path))
    parentEl.appendChild(li)

    if (!isCollapsed) {
      appendTreeItems(parentEl, folder, depth + 1)
    }
  }

  for (const relPath of node.files.slice().sort()) {
    const parts       = relPath.split('/')
    const fileName    = parts[parts.length - 1]
    const displayName = fileName.replace(/^\d+[_\-\s]/, '').replace(/\.txt$/i, '')

    const li = document.createElement('li')
    li.className = 'file-item' + (relPath === selectedFile ? ' active' : '')
    li.dataset.name = relPath
    li.style.paddingLeft = `${fileLeft}px`
    li.textContent = displayName
    li.title = relPath
    li.addEventListener('click', () => selectFile(relPath))
    parentEl.appendChild(li)
  }
}

function toggleFolder(folderPath) {
  if (collapsedFolders.has(folderPath)) {
    collapsedFolders.delete(folderPath)
  } else {
    collapsedFolders.add(folderPath)
  }
  renderFileList()
}

function selectFile(relPath) {
  selectedFile = relPath
  for (const li of fileListEl.querySelectorAll('.file-item')) {
    li.classList.toggle('active', li.dataset.name === relPath)
  }
  renderSvgView(relPath)
}

function renderSvgView(relPath) {
  const file = files.get(relPath)
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
      svg.style.width  = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
    }
  }

  txtPanelFilenameEl.textContent = relPath
  txtContentEl.textContent = file.content
  txtPanelEl.classList.toggle('hidden', !txtVisible)
}

async function rerenderAllFiles() {
  if (files.size === 0) return
  await Promise.all(
    [...files.entries()].map(async ([relPath, file]) => {
      const { svg, error } = await renderSvg(file.content)
      files.set(relPath, { ...file, svg, error })
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

document.getElementById('btn-open').addEventListener('click', openFolder)
document.getElementById('btn-open-empty').addEventListener('click', openFolder)
