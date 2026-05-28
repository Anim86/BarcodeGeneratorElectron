const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
    const win = new BrowserWindow({ show: false });
    win.loadFile('index.html');
    win.webContents.on('did-finish-load', () => {
        win.webContents.executeJavaScript('document.querySelector(".logo").naturalWidth')
            .then(w => {
                console.log('Logo width:', w);
                app.quit();
            })
            .catch(err => {
                console.error(err);
                app.quit();
            });
    });
});
