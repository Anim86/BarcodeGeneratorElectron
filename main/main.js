const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
require('./export-handlers');

let mainWindow = null;

function setAppMenu(windowInstance) {
  const locale = app.getLocale();
  const isIt = locale && locale.startsWith('it');
  
  const template = [
    {
      label: 'File',
      submenu: [
        {
          role: 'quit',
          label: isIt ? 'Esci' : 'Exit'
        }
      ]
    },
    {
      label: isIt ? 'Modifica' : 'Edit',
      submenu: [
        { role: 'undo', label: isIt ? 'Annulla' : 'Undo' },
        { role: 'redo', label: isIt ? 'Ripristina' : 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: isIt ? 'Taglia' : 'Cut' },
        { role: 'copy', label: isIt ? 'Copia' : 'Copy' },
        { role: 'paste', label: isIt ? 'Incolla' : 'Paste' },
        { role: 'selectAll', label: isIt ? 'Seleziona tutto' : 'Select All' }
      ]
    },
    {
      label: isIt ? 'Aiuto' : 'Help',
      submenu: [
        {
          label: isIt ? 'Informazioni su EAN Demon Generator' : 'About EAN Demon Generator',
          click: () => {
            if (windowInstance) {
              windowInstance.webContents.send('open-about');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const locale = app.getLocale();
  const isIt = locale && locale.startsWith('it');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, process.platform === 'win32' ? '../build/icon.ico' : '../eandemongentraspa.png'),
    title: isIt ? 'EAN Demon Generator — Generatore Professionale di Codici a Barre' : 'EAN Demon Generator — Professional Barcode Generator',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
  setAppMenu(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register IPC API handlers
  ipcMain.handle('get-locale', () => app.getLocale());
  ipcMain.handle('get-version', () => app.getVersion());
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (err) {
      console.error('Failed to open external url:', err);
      return { success: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
