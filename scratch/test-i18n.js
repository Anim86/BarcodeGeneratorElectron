const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
    const win = new BrowserWindow({ show: false });
    win.loadFile('index.html');
    win.webContents.on('did-finish-load', async () => {
        try {
            const html = await win.webContents.executeJavaScript('document.getElementById("language-switcher-container").innerHTML');
            console.log("HTML:", html);
            const len = await win.webContents.executeJavaScript('document.querySelectorAll("[data-i18n]").length');
            console.log("TRANSLATED:", len);
            const bodyLang = await win.webContents.executeJavaScript('document.body.innerText');
            console.log("BODY START:", bodyLang.substring(0, 100));
        } catch(e) {
            console.error(e);
        }
        app.quit();
    });
});
