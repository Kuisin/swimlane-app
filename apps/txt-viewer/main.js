const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const chokidar = require('chokidar')

let mainWindow
let watcher = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
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
    .map((f) => {
      const fullPath = path.join(folderPath, f)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const stat = fs.statSync(fullPath)
      return { name: f, content, mtime: stat.mtimeMs }
    })
  return files
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
