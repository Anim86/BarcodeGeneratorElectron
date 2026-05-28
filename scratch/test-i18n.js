const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
    const win = new BrowserWindow({ show: false });
    win.loadFile('index.html');
    win.webContents.on('did-finish-load', async () => {
        try {
            const html = await win.webContents.executeJavaScript('document.getElementById("language-switcher-container").innerHTML');
            console.log("SWITCHER HTML:", html);
            
            const numTranslated = await win.webContents.executeJavaScript('document.querySelectorAll("[data-i18n]").length');
            console.log("TRANSLATED ELEMENTS:", numTranslated);

            const display = await win.webContents.executeJavaScript('window.getComputedStyle(document.getElementById("language-switcher-container")).display');
            console.log("DISPLAY:", display);
        } catch(e) {
            console.error(e);
        }
        app.quit();
    });
});
