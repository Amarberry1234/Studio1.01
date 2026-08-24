const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const http = require("http");

const PORT = 31571;
let mainWindow;

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

async function createWindow() {
  process.env.NODE_ENV = "production";
  process.env.NOVA_DESKTOP = "1";
  process.env.NOVA_PORT = String(PORT);
  process.env.NOVA_DATA_DIR = app.getPath("userData");
  process.env.NOVA_DIST_DIR = path.join(__dirname, "..", "dist");

  require(path.join(__dirname, "..", "dist", "server.cjs"));

  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0a0a0a",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
