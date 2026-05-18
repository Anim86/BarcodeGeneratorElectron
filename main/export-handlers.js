const { ipcMain, dialog, app, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sharp = require('sharp');

// --- ICC Profile Logic ---
const getICCPath = () => {
    const filename = 'ISOcoated_v2_300_eci.icc';
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'icc', filename);
    }
    return path.join(__dirname, '../assets/icc', filename);
};

// --- Ghostscript Detection ---
const getGSPath = () => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        // 1. Check bundled Ghostscript first
        const bundledPath = app.isPackaged 
            ? path.join(process.resourcesPath, 'gs', 'bin', 'gswin64c.exe')
            : path.join(__dirname, '../assets/gs', 'bin', 'gswin64c.exe');
            
        if (fs.existsSync(bundledPath)) {
            return bundledPath;
        }

        // 2. Check standard installation paths
        const standardPaths = [
            'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.01.2\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe'
        ];
        
        try {
            const gsRoot = 'C:\\Program Files\\gs';
            if (fs.existsSync(gsRoot)) {
                const versions = fs.readdirSync(gsRoot);
                for (const v of versions) {
                    const p = path.join(gsRoot, v, 'bin', 'gswin64c.exe');
                    if (fs.existsSync(p)) return p;
                }
            }
        } catch (e) {}
        
        return 'gswin64c.exe'; // Fallback to PATH
    } else {
        // 1. Check bundled Mac Ghostscript
        const bundledPath = app.isPackaged
            ? path.join(process.resourcesPath, 'gs', 'mac', 'gs')
            : path.join(__dirname, '../assets/gs/mac/gs');
        
        if (fs.existsSync(bundledPath)) {
            // Assicuriamoci che sia eseguibile
            try { fs.chmodSync(bundledPath, '755'); } catch(e) {}
            return bundledPath;
        }

        // 2. Check standard installation paths
        const paths = ['/opt/homebrew/bin/gs', '/usr/local/bin/gs', '/usr/bin/gs'];
        for (const p of paths) {
            if (fs.existsSync(p)) return p;
        }
        return 'gs';
    }
};

const getGSResourcePath = () => {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'gs', 'Resource', 'Init');
    }
    return path.join(__dirname, '../assets/gs', 'Resource', 'Init');
};

ipcMain.handle('check-ghostscript', async () => {
    const gs = getGSPath();
    const env = {
        ...process.env,
        GS_LIB: getGSResourcePath()
    };
    return new Promise((resolve) => {
        exec(`"${gs}" --version`, { env }, (err) => {
            resolve(!err);
        });
    });
});

ipcMain.handle('install-ghostscript', async () => {
    const isWin = process.platform === 'win32';
    if (isWin) return false;

    // Mostra un dialog nativo all'utente con tre opzioni
    const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Scarica Installatore .pkg (Consigliato)', 'Installa con Homebrew (Terminale)', 'Annulla'],
        defaultId: 0,
        title: 'Ghostscript Richiesto',
        message: 'Ghostscript non è presente nel tuo sistema.',
        detail: 'Questa libreria è necessaria per esportare nei formati professionali EPS e PDF/X-1a.\n\n' +
                '• Metodo Consigliato (.pkg): Scarica e installa il pacchetto grafico ufficiale per Mac. È immediato e compatibile con tutte le versioni di macOS (incluso macOS 12 Monterey e precedenti).\n\n' +
                '• Metodo Alternativo (Homebrew): Avvia l\'installazione automatica tramite Terminale (richiede privilegi amministratore).'
    });

    if (response === 0) {
        // Scarica l'installatore .pkg ufficiale da Richard Koch
        shell.openExternal('https://pages.uoregon.edu/koch/Ghostscript-10.07.0.pkg');
        
        await dialog.showMessageBox({
            type: 'info',
            buttons: ['Ho capito'],
            title: 'Download Avviato',
            message: 'Il download di Ghostscript è stato avviato nel browser.',
            detail: 'Fai doppio clic sul file scaricato (Ghostscript-10.07.0.pkg) per installarlo sul tuo Mac.\n\nUna volta completata l\'installazione, potrai riprovare ad esportare immediatamente!'
        });
        return true;
    }

    if (response === 1) {
        const scriptContent = `#!/bin/bash
clear
echo "=========================================================="
echo "         EAN Pro - Installazione Assistita Ghostscript     "
echo "=========================================================="
echo ""

# Verifica se Ghostscript è già installato
if command -v gs &> /dev/null || [ -f /opt/homebrew/bin/gs ] || [ -f /usr/local/bin/gs ]; then
    echo "[V] Ghostscript è già installato nel sistema!"
    exit 0
fi

# Verifica Homebrew
if ! command -v brew &> /dev/null && [ ! -f /opt/homebrew/bin/brew ] && [ ! -f /usr/local/bin/brew ]; then
    echo "[!] Homebrew non è installato."
    echo "    L'installazione di Homebrew richiede i primi privilegi di amministratore."
    echo "    Inserisci la tua password di sistema quando richiesto e premi Invio."
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Carica l'ambiente Homebrew nella sessione corrente
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo "[V] Homebrew rilevato."
fi

# Assicuriamoci che brew sia nel PATH anche se era preesistente ma non caricato
if ! command -v brew &> /dev/null; then
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

echo ""
echo "⏳ Installazione di Ghostscript tramite Homebrew..."
echo "----------------------------------------------------------"
brew install ghostscript
echo "----------------------------------------------------------"

if command -v gs &> /dev/null || [ -f /opt/homebrew/bin/gs ] || [ -f /usr/local/bin/gs ]; then
    echo ""
    echo "✅ INSTALLAZIONE COMPLETATA CON SUCCESSO!"
    echo "   Ora puoi tornare a EAN Pro ed esportare in EPS o PDF/X-1a."
else
    echo ""
    echo "❌ Si è verificato un errore durante l'installazione."
    echo "   Se sei su macOS 12 (Monterey) o precedente, Homebrew potrebbe fallire."
    echo "   Puoi installarlo facilmente scaricando e aprendo il pacchetto ufficiale:"
    echo "   👉 https://pages.uoregon.edu/koch/Ghostscript-10.07.0.pkg"
fi

echo ""
echo "Premi un tasto qualsiasi per chiudere questa finestra..."
read -n 1 -s
exit 0
`;

        try {
            const tempScriptPath = path.join(app.getPath('temp'), 'eanpro_install_gs.sh');
            fs.writeFileSync(tempScriptPath, scriptContent, { mode: 0o755 });

            // Esegui tramite AppleScript nel Terminale visibile
            const appleScript = 'tell application "Terminal" to do script "bash \\"' + tempScriptPath + '\\""';
            const activateScript = 'tell application "Terminal" to activate';

            exec('osascript -e \'' + appleScript + '\' -e \'' + activateScript + '\'', (err) => {
                if (err) {
                    console.error('Errore durante l\'apertura del Terminale:', err);
                }
            });

            // Mostra messaggio di avviso che l'installazione è partita
            await dialog.showMessageBox({
                type: 'info',
                buttons: ['OK'],
                title: 'Installazione Avviata',
                message: "Il Terminale è stato aperto per avviare l'installazione.",
                detail: "Segui le istruzioni visibili nella finestra del Terminale (potrebbe essere necessario inserire la password di amministratore del Mac).\n\nUna volta completata l'installazione, potrai riprovare ad esportare liberamente!"
            });
            return true;
        } catch (e) {
            console.error('Errore durante la creazione dello script:', e);
            dialog.showErrorBox("Errore di sistema", "Impossibile avviare l'installatore: " + e.message);
        }
    }

    return false;
});

// --- Export Handler ---
// --- Internal helper for the actual export logic ---
async function performExport(svg, format, params, filePath) {
    const svgBuffer = Buffer.from(svg);
    const iccProfile = getICCPath();
    const { dpi } = params;

    switch (format) {
        case 'tiff-cmyk':
            if (fs.existsSync(iccProfile)) {
                const profileBuffer = fs.readFileSync(iccProfile);
                await sharp(svgBuffer, { density: dpi })
                    .withMetadata({ density: dpi, icc: profileBuffer })
                    .toColourspace('cmyk')
                    .tiff({ compression: 'lzw' })
                    .toFile(filePath);
            } else {
                await sharp(svgBuffer, { density: dpi })
                    .withMetadata({ density: dpi })
                    .toColourspace('cmyk')
                    .tiff({ compression: 'lzw', predictor: 'horizontal' })
                    .toFile(filePath);
            }
            break;

        case 'jpeg-cmyk':
            if (fs.existsSync(iccProfile)) {
                const profileBuffer = fs.readFileSync(iccProfile);
                await sharp(svgBuffer, { density: dpi })
                    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
                    .withMetadata({ density: dpi, icc: profileBuffer })
                    .toColourspace('cmyk')
                    .toFile(filePath);
            } else {
                await sharp(svgBuffer, { density: dpi })
                    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
                    .toColourspace('cmyk')
                    .toFile(filePath);
            }
            break;

        case 'png-gray':
            await sharp(svgBuffer, { density: dpi })
                .toColourspace('b-w')
                .png()
                .toFile(filePath);
            break;

        case 'tiff-gray':
            await sharp(svgBuffer, { density: dpi })
                .toColourspace('b-w')
                .tiff({ compression: 'lzw' })
                .toFile(filePath);
            break;

        case 'svg':
            fs.writeFileSync(filePath, svg);
            break;

        case 'eps':
            await handleEPSExport(svg, filePath, params);
            break;

        case 'pdf-x':
            await handlePDFXExport(svg, filePath, params);
            break;

        default:
            throw new Error(`Formato ${format} non supportato`);
    }
}

// Single export
ipcMain.handle('export-native', async (event, { svg, format, params }) => {
    const { filename } = params;
    
    const { filePath } = await dialog.showSaveDialog({
        title: `Esporta Barcode - ${format.toUpperCase()}`,
        defaultPath: filename,
        filters: getFiltersForFormat(format)
    });

    if (!filePath) return { success: false, cancelled: true };

    try {
        await performExport(svg, format, params, filePath);
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Export Error:', error);
        return { success: false, error: error.message };
    }
});

// Batch export
ipcMain.handle('export-native-batch', async (event, { items, format, params }) => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Seleziona dove salvare la cartella dei barcode',
        properties: ['openDirectory', 'createDirectory']
    });

    if (!filePaths || filePaths.length === 0) return { success: false, cancelled: true };
    const parentDir = filePaths[0];

    // Creazione automatica sottocartella con timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const folderName = `Esportazione_EAN_${timestamp}`;
    const baseDir = path.join(parentDir, folderName);

    try {
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
    } catch (e) {
        return { success: false, error: `Impossibile creare la cartella: ${e.message}` };
    }

    let successCount = 0;
    let errors = [];

    for (const item of items) {
        try {
            const filePath = path.join(baseDir, item.filename);
            await performExport(item.svg, format, params, filePath);
            successCount++;
        } catch (error) {
            errors.push(`${item.filename}: ${error.message}`);
        }
    }

    return { 
        success: errors.length === 0, 
        count: successCount, 
        total: items.length,
        errors: errors.length > 0 ? errors : null,
        path: baseDir
    };
});

function getFiltersForFormat(format) {
    switch (format) {
        case 'tiff-cmyk':
        case 'tiff-gray': return [{ name: 'TIFF Image', extensions: ['tif', 'tiff'] }];
        case 'jpeg-cmyk': return [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }];
        case 'png-gray': return [{ name: 'PNG Image', extensions: ['png'] }];
        case 'svg': return [{ name: 'Scalable Vector Graphics', extensions: ['svg'] }];
        case 'eps': return [{ name: 'Encapsulated PostScript', extensions: ['eps'] }];
        case 'pdf-x': return [{ name: 'PDF/X Document', extensions: ['pdf'] }];
        default: return [];
    }
}

const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

function getDimensionsInPoints(width, height, unit) {
    let wPt = width;
    let hPt = height;
    if (unit === 'mm') {
        wPt = (width / 25.4) * 72;
        hPt = (height / 25.4) * 72;
    } else if (unit === 'in') {
        wPt = width * 72;
        hPt = height * 72;
    } else if (unit === 'px') {
        wPt = (width / 96) * 72;
        hPt = (height / 96) * 72;
    }
    return { width: wPt, height: hPt };
}

async function createTempPDF(svg, params) {
    const { width, height } = getDimensionsInPoints(params.width, params.height, params.unit);
    const tempPdf = path.join(app.getPath('temp'), `temp_barcode_${Date.now()}.pdf`);
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [width, height],
                margin: 0
            });
            const stream = fs.createWriteStream(tempPdf);
            doc.pipe(stream);
            // Passiamo le dimensioni della pagina in punti a SVGtoPDF.
            // svg-to-pdfkit usa width/height per scalare il viewBox dell'SVG
            // (che è in px) alle dimensioni fisiche corrette della pagina PDF.
            // Senza questi valori, interpreta autonomamente i mm dell'SVG
            // in modo incoerente rispetto alla pagina PDF.
            const options = { width, height, assumePt: false };
            
            if (params.colorSpace === 'cmyk') {
                options.colorCallback = (color) => {
                    if (Array.isArray(color) && color.length === 3) {
                        const r = color[0], g = color[1], b = color[2];
                        let c = 1 - (r / 255);
                        let m = 1 - (g / 255);
                        let y = 1 - (b / 255);
                        let k = Math.min(c, m, y);
                        
                        if (k === 1) return [0, 0, 0, 100]; // Pure K100
                        
                        c = Math.round(((c - k) / (1 - k)) * 100) || 0;
                        m = Math.round(((m - k) / (1 - k)) * 100) || 0;
                        y = Math.round(((y - k) / (1 - k)) * 100) || 0;
                        k = Math.round(k * 100);
                        return [c, m, y, k];
                    }
                    return color;
                };
            }
            
            SVGtoPDF(doc, svg, 0, 0, options);
            doc.end();
            stream.on('finish', () => resolve(tempPdf));
            stream.on('error', reject);
        } catch (e) {
            reject(e);
        }
    });
}

async function handleEPSExport(svg, outputPath, params) {
    const tempPdf = await createTempPDF(svg, params);
    const gs = getGSPath();
    
    let colorCmd = '';
    if (params.forceK100) {
        colorCmd = '-sProcessColorModel=DeviceGray -sColorConversionStrategy=Gray ';
    } else if (params.colorSpace === 'cmyk') {
        colorCmd = '-sProcessColorModel=DeviceCMYK -sColorConversionStrategy=CMYK ';
    }
    
    const textCmd = params.textToPath ? '-dNoOutputFonts ' : '';
    const cmd = `"${gs}" -q -dNOPAUSE -dBATCH -sDEVICE=eps2write ${colorCmd}${textCmd}-sOutputFile="${outputPath}" "${tempPdf}"`;
    
    const env = {
        ...process.env,
        GS_LIB: getGSResourcePath()
    };
    
    return new Promise((resolve, reject) => {
        exec(cmd, { env }, (err) => {
            if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
            if (err) reject(err);
            else resolve();
        });
    });
}

async function handlePDFXExport(svg, outputPath, params) {
    const tempPdf = await createTempPDF(svg, params);
    const gs = getGSPath();
    const iccProfile = getICCPath();
    
    // Convert generic PDF to PDF/X-1a using Ghostscript
    let colorCmd = '';
    if (params.forceK100) {
        colorCmd = '-sProcessColorModel=DeviceGray -sColorConversionStrategy=Gray ';
    } else if (params.colorSpace === 'cmyk') {
        colorCmd = '-sProcessColorModel=DeviceCMYK -sColorConversionStrategy=CMYK ';
    }
    
    const textCmd = params.textToPath ? '-dNoOutputFonts ' : '';
    let cmd = `"${gs}" -dPDFX -dBATCH -dNOPAUSE -dNOOUTERSAVE -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress ${colorCmd}${textCmd}-sOutputFile="${outputPath}" "${tempPdf}"`;
    
    const env = {
        ...process.env,
        GS_LIB: getGSResourcePath()
    };
    
    return new Promise((resolve, reject) => {
        exec(cmd, { env }, (err) => {
            if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
            if (err) reject(err);
            else resolve();
        });
    });
}
