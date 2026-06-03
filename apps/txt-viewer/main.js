const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const chokidar = require('chokidar')
const { pathToFileURL } = require('url')

let mainWindow
let watcher = null
let coreModules = null

async function getCoreModules() {
  if (coreModules) return coreModules
  const renderPureMod = await import(
    pathToFileURL(path.join(__dirname, '../../packages/core/src/render-pure/index.js')).href
  )
  coreModules = { textToSvg: renderPureMod.textToSvg }
  return coreModules
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('read-txt-files', async (_, folderPath) => {
  const entries = fs.readdirSync(folderPath)
  const files = entries
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort()
    .map((f) => {
      const fullPath = path.join(folderPath, f)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const stat = fs.statSync(fullPath)
      return { name: f, content, mtime: stat.mtimeMs }
    })
  return files
})

ipcMain.handle('render-svg', async (_, content, themeKey) => {
  try {
    const { textToSvg } = await getCoreModules()
    const { svg, errors } = textToSvg(content, { themeKey: themeKey || 'basic' })
    if (!svg) return { svg: null, error: errors[0]?.msg ?? 'Render error' }
    return { svg, error: null }
  } catch (err) {
    return { svg: null, error: err.message }
  }
})

ipcMain.on('watch-folder', (_, folderPath) => {
  if (watcher) {
    watcher.close()
    watcher = null
  }

  watcher = chokidar.watch(path.join(folderPath, '*.txt'), {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  })

  const notify = (filePath, eventType) => {
    if (!mainWindow) return
    const name = path.basename(filePath)
    let content = null
    if (eventType !== 'unlink') {
      try { content = fs.readFileSync(filePath, 'utf-8') } catch {}
    }
    mainWindow.webContents.send('file-changed', { name, content, eventType })
  }

  watcher
    .on('add', (fp) => notify(fp, 'add'))
    .on('change', (fp) => notify(fp, 'change'))
    .on('unlink', (fp) => notify(fp, 'unlink'))
})

ipcMain.on('stop-watch', () => {
  if (watcher) { watcher.close(); watcher = null }
})
