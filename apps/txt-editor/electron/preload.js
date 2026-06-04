const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  readTxtFiles: (folderPath) => ipcRenderer.invoke("read-txt-files", folderPath),
  readBundledSamples: () => ipcRenderer.invoke("read-bundled-samples"),
  writeTxtFile: (relPath, content) =>
    ipcRenderer.invoke("write-txt-file", relPath, content),
  getOpenedFolder: () => ipcRenderer.invoke("get-opened-folder"),
  watchFolder: (folderPath) => ipcRenderer.send("watch-folder", folderPath),
  stopWatch: () => ipcRenderer.send("stop-watch"),
  onFileChanged: (cb) => {
    ipcRenderer.on("file-changed", (_, data) => cb(data));
  },
  removeFileChangedListener: () => {
    ipcRenderer.removeAllListeners("file-changed");
  },
});
