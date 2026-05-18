/**
 * EAN Pro — Export Bridge
 * Gestisce la comunicazione tra il renderer (webapp) e il main process (Electron).
 * Funziona anche nel browser degradando con un alert.
 */

window.ExportBridge = {
    get isElectron() {
        return !!(window.electronAPI && window.electronAPI.isElectron);
    },

    /**
     * Esporta un barcode usando le funzionalità native
     * @param {string} format 'tiff-cmyk' | 'jpeg-cmyk' | 'png-gray' | 'tiff-gray' | 'svg' | 'eps' | 'pdf-x'
     * @param {Object} barcodeData { code, type, svgString, params }
     */
    async export(format, { code, type, svgString, params }) {
        if (!this.isElectron) {
            alert('Questa funzione è disponibile solo nella versione desktop di EAN Pro.');
            return;
        }

        // Verifica Ghostscript per formati vettoriali specifici
        if (['eps', 'pdf-x'].includes(format)) {
            const hasGS = await window.electronAPI.checkGhostscript();
            if (!hasGS) {
                const platform = window.electronAPI.getPlatform();
                if (platform === 'darwin') {
                    // Avvia l'installazione assistita nativa
                    await window.electronAPI.installGhostscript();
                } else {
                    alert('Ghostscript non trovato. Scarica l\'installer da: https://ghostscript.com/releases/gsdnld.html');
                }
                return;
            }
        }

        // Parametri per il file system
        const exportParams = {
            width: params.width,
            height: params.height,
            unit: params.unit,
            dpi: params.dpi,
            colorSpace: params.colorSpace,
            textToPath: params.textToPath,
            forceK100: params.forceK100,
            filename: `${code}.${format === 'tiff-cmyk' || format === 'tiff-gray' ? 'tif' : (format === 'jpeg-cmyk' ? 'jpg' : (format === 'pdf-x' ? 'pdf' : format))}`
        };

        try {
            const result = await window.electronAPI.exportNative({
                svg: svgString,
                format: format,
                params: exportParams
            });

            if (result.success) {
                console.log(`Esportazione completata: ${result.path}`);
            } else if (!result.cancelled) {
                alert(`Errore esportazione: ${result.error}`);
            }
        } catch (err) {
            console.error('Bridge Error:', err);
            alert(`Errore di sistema: ${err.message}`);
        }
    },
    
    /**
     * Esporta più barcode in modalità batch
     * @param {string} format 
     * @param {Array} items [{ code, type, svgString, filename }]
     * @param {Object} params 
     */
    async exportBatch(format, items, params) {
        if (!this.isElectron) {
            alert('Questa funzione è disponibile solo nella versione desktop di EAN Pro.');
            return;
        }

        const exportParams = {
            width: params.width,
            height: params.height,
            unit: params.unit,
            dpi: params.dpi,
            colorSpace: params.colorSpace,
            textToPath: params.textToPath,
            forceK100: params.forceK100
        };

        try {
            const result = await window.electronAPI.exportNativeBatch({
                items: items,
                format: format,
                params: exportParams
            });

            if (result.success) {
                alert(`Esportazione completata con successo in: ${result.path}\nTotale file: ${result.count}`);
            } else if (!result.cancelled) {
                const errorLog = result.errors ? `\n\nErrori:\n${result.errors.join('\n')}` : '';
                alert(`Esportazione batch completata con alcuni errori.${errorLog}`);
            }
        } catch (err) {
            console.error('Bridge Batch Error:', err);
            alert(`Errore di sistema nel batch: ${err.message}`);
        }
    }
};
