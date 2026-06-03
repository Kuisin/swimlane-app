const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readTxtFiles: (folderPath) => ipcRenderer.invoke('read-txt-files', folderPath),
  renderSvg: (content, themeKey) => ipcRenderer.invoke('render-svg', content, themeKey),
  watchFolder: (folderPath) => ipcRenderer.send('watch-folder', folderPath),
  stopWatch: () => ipcRenderer.send('stop-watch'),
  onFileChanged: (cb) => {
    ipcRenderer.on('file-changed', (_, data) => cb(data))
  },
  removeFileChangedListener: () => {
    ipcRenderer.removeAllListeners('file-changed')
  },
})
