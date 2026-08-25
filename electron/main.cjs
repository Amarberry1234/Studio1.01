const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const http = require("http");
const { registerCodeAgent } = require("./code-agent.cjs");

const PORT = 31571;
let mainWindow;
let codeAgentRegistered = false;

function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve();
        retry();
      });
      req.on("error", retry);
      req.setTimeout(1200, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error("Nova server timeout"));
      setTimeout(check, 250);
    };
    check();
  });
}

function ensureDesktopCodeAgent() {
  if (codeAgentRegistered) return;
  registerCodeAgent({ ipcMain, dialog, getWindow: () => mainWindow });
  codeAgentRegistered = true;
}

async function createWindow() {
  process.env.NODE_ENV = "production";
  process.env.NOVA_DESKTOP = "1";
  process.env.NOVA_PORT = String(PORT);
  process.env.NOVA_DATA_DIR = app.getPath("userData");
  process.env.NOVA_DIST_DIR = path.join(__dirname, "..", "dist");

  ensureDesktopCodeAgent();
  require(path.join(__dirname, "..", "dist", "server.cjs"));

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: "#09090b",
    show: false,
    autoHideMenuBar: true,
    title: "Nova Local Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  await waitForServer(`http://127.0.0.1:${PORT}/api/health`);
  await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  mainWindow.show();
}

app.whenReady().then(createWindow).catch((err) => {
  console.error(err);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
