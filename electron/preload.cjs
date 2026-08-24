const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("novaDesktop", {
  selectWorkspace: () => ipcRenderer.invoke("nova-code:select-workspace"),
  inspectWorkspace: (root) => ipcRenderer.invoke("nova-code:inspect-workspace", { root }),
  readWorkspaceFile: (root, relativePath) => ipcRenderer.invoke("nova-code:read-file", { root, relativePath }),
  runCodeTask: (payload) => ipcRenderer.invoke("nova-code:run-task", payload),
  undoCodeTask: (root, snapshotId) => ipcRenderer.invoke("nova-code:undo-task", { root, snapshotId }),
  onCodeProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("nova-code:progress", listener);
    return () => ipcRenderer.removeListener("nova-code:progress", listener);
  },
});
