const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPlatform: () => process.platform,
   exportNative: (params) => ipcRenderer.invoke('export-native', params),
   exportNativeBatch: (data) => ipcRenderer.invoke('export-native-batch', data),
   checkGhostscript: () => ipcRenderer.invoke('check-ghostscript'),
   installGhostscript: () => ipcRenderer.invoke('install-ghostscript'),
});
