const { app, BrowserWindow, ipcMain, dialog, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");

const APP_ROOT = path.join(__dirname, "..");
const RENDERER_DIR = path.join(APP_ROOT, "dist");
const isDev = process.argv.includes("--dev");

function getDevServerUrl() {
  const portArg = process.argv.find((arg) => arg.startsWith("--port="));
  const port = portArg?.split("=")[1] || process.env.TXT_EDITOR_DEV_PORT || "5174";
  return `http://localhost:${port}`;
}

let mainWindow = null;
let watcher = null;
let openedFolderPath = null;

function getBundledContentDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "content")
    : path.join(APP_ROOT, "../../content");
}

function resolveTxtPath(relPath) {
  if (!openedFolderPath) {
    throw new Error("No folder is open");
  }
  const normalized = relPath.split("/").join(path.sep);
  const absPath = path.resolve(openedFolderPath, normalized);
  const rel = path.relative(openedFolderPath, absPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Invalid file path");
  }
  return absPath;
}

const DEFAULT_WINDOW_STATE = {
  width: 1400,
  height: 900,
  isMaximized: false,
};

function windowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(windowStatePath(), "utf8"));
    return { ...DEFAULT_WINDOW_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}

function ensureVisibleOnScreen(state) {
  const { x, y, width, height } = state;
  if (typeof x !== "number" || typeof y !== "number") return state;

  const display = screen.getDisplayMatching({ x, y, width, height });
  const area = display.workArea;
  const fits =
    x >= area.x &&
    y >= area.y &&
    x + width <= area.x + area.width &&
    y + height <= area.y + area.height;

  if (fits) return state;

  return {
    ...state,
    x: area.x + Math.max(0, Math.floor((area.width - width) / 2)),
    y: area.y + Math.max(0, Math.floor((area.height - height) / 2)),
  };
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(
      windowStatePath(),
      JSON.stringify({ ...bounds, isMaximized }),
    );
  } catch {
    /* ignore write failures */
  }
}

function createWindow() {
  const state = ensureVisibleOnScreen(loadWindowState());

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 500,
    show: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
    fullscreenable: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const persistWindowState = () => saveWindowState(mainWindow);
  mainWindow.on("resize", persistWindowState);
  mainWindow.on("move", persistWindowState);
  mainWindow.on("close", persistWindowState);

  if (isDev) {
    mainWindow.loadURL(getDevServerUrl());
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIR, "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  openedFolderPath = result.filePaths[0];
  return openedFolderPath;
});

function readTxtFilesFromDir(folderPath) {
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
        const relPath = path
          .relative(folderPath, fullPath)
          .split(path.sep)
          .join("/");
        let content = "";
        let mtime = 0;
        try {
          content = fs.readFileSync(fullPath, "utf-8");
          mtime = fs.statSync(fullPath).mtimeMs;
        } catch {
          /* ignore unreadable files */
        }
        results.push({ name: relPath, content, mtime });
      }
    }
  }

  walk(folderPath);
  return results;
}

ipcMain.handle("read-txt-files", async (_, folderPath) => {
  openedFolderPath = folderPath;
  return readTxtFilesFromDir(folderPath);
});

ipcMain.handle("read-bundled-samples", async () => {
  const folderPath = getBundledContentDir();
  openedFolderPath = folderPath;
  return {
    folderPath,
    files: readTxtFilesFromDir(folderPath),
  };
});

ipcMain.handle("write-txt-file", async (_, relPath, content) => {
  const absPath = resolveTxtPath(relPath);
  fs.writeFileSync(absPath, content, "utf-8");
  return { ok: true, mtime: fs.statSync(absPath).mtimeMs };
});

ipcMain.handle("create-txt-file", async (_, relPath, content) => {
  const absPath = resolveTxtPath(relPath);
  if (fs.existsSync(absPath)) {
    throw new Error("File already exists");
  }
  const dir = path.dirname(absPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, content, "utf-8");
  return { ok: true, mtime: fs.statSync(absPath).mtimeMs };
});

ipcMain.handle("get-opened-folder", async () => openedFolderPath);

ipcMain.on("watch-folder", (_, folderPath) => {
  openedFolderPath = folderPath;

  if (watcher) {
    watcher.close();
    watcher = null;
  }

  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[/\\])\../,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  const notify = (filePath, eventType) => {
    if (!mainWindow) return;
    if (!filePath.toLowerCase().endsWith(".txt")) return;
    const relPath = path
      .relative(folderPath, filePath)
      .split(path.sep)
      .join("/");
    let content = null;
    if (eventType !== "unlink") {
      try {
        content = fs.readFileSync(filePath, "utf-8");
      } catch {
        /* ignore */
      }
    }
    mainWindow.webContents.send("file-changed", {
      name: relPath,
      content,
      eventType,
    });
  };

  watcher
    .on("add", (fp) => notify(fp, "add"))
    .on("change", (fp) => notify(fp, "change"))
    .on("unlink", (fp) => notify(fp, "unlink"));
});

ipcMain.on("stop-watch", () => {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
});
