/**
 * BarcodeService
 * Motore di generazione barcode EAN con resa GS1 standard.
 * Gestisce:
 *   - Guard bars più lunghe (start, center, end)
 *   - Testo segmentato (1 + 6 + 6 per EAN-13, 4 + 4 per EAN-8)
 *   - Font OCR-B o fallback compatibile
 *   - Spazi colore: RGB, CMYK (intento), Scala di grigi
 *   - Conversione mm → px con risoluzione DPI
 */
const BarcodeService = {

    /** Font stack: OCR-B nativo se presente, altrimenti fallback mono */
    BARCODE_FONT: '"OCR-B", "OCR B Std", "OCRB", "Courier New", monospace',

    /** Numero di moduli (barre unitarie) per tipo EAN */
    MODULES: { EAN13: 95, EAN8: 67 },

    // ═══════════════════════════════════════
    //  VALIDAZIONE
    // ═══════════════════════════════════════

    /**
     * Valida un codice EAN (13 o 8 cifre)
     * @param {string} code
     * @returns {{ isValid: boolean, type: string, error: string|null, code?: string, checksumExpected?: number }}
     */
    validateEAN(code) {
        if (!code) return { isValid: false, type: 'unknown', error: 'Inserisci un codice' };
        
        const cleanCode = code.replace(/[\s\-\.]/g, '');

        if (!cleanCode) {
            return { isValid: false, type: 'unknown', error: 'Inserisci un codice' };
        }

        if (!/^\d+$/.test(cleanCode)) {
            return { isValid: false, type: 'unknown', error: 'Il codice deve contenere solo numeri' };
        }

        if (cleanCode.length < 8) {
            return { isValid: false, type: 'unknown', error: `Codice troppo corto (${cleanCode.length} cifre)` };
        }
        if (cleanCode.length > 8 && cleanCode.length < 13) {
            return { isValid: false, type: 'unknown', error: `Lunghezza non valida (${cleanCode.length} cifre). Richieste 8 o 13.` };
        }
        if (cleanCode.length > 13) {
            return { isValid: false, type: 'unknown', error: `Codice troppo lungo (${cleanCode.length} cifre)` };
        }

        const type = cleanCode.length === 13 ? 'EAN13' : 'EAN8';
        const expected = parseInt(cleanCode[cleanCode.length - 1]);
        const calculated = this.calculateChecksum(cleanCode.slice(0, -1));

        if (expected !== calculated) {
            return {
                isValid: false, type,
                error: `Checksum errato. L'ultima cifra dovrebbe essere ${calculated}`,
                checksumExpected: calculated
            };
        }
        return { isValid: true, type, error: null, code: cleanCode };
    },

    /**
     * Calcola checksum EAN (standard GS1)
     */
    calculateChecksum(digits) {
        let sum = 0;
        const rev = digits.split('').reverse();
        for (let i = 0; i < rev.length; i++) {
            sum += parseInt(rev[i]) * (i % 2 === 0 ? 3 : 1);
        }
        return (10 - (sum % 10)) % 10;
    },

    // ═══════════════════════════════════════
    //  CONVERSIONE UNITÀ
    // ═══════════════════════════════════════

    /** mm → px */
    mmToPx(mm, dpi) {
        return (mm * dpi) / 25.4;
    },

    // ═══════════════════════════════════════
    //  COLORE
    // ═══════════════════════════════════════

    /** Hex/RGB/Color → {r,g,b} */
    hexToRgb(color) {
        if (!color || typeof color !== 'string') return { r: 0, g: 0, b: 0 };
        
        if (color.startsWith('rgb')) {
            const m = color.match(/\d+/g);
            return m ? { r: parseInt(m[0]), g: parseInt(m[1]), b: parseInt(m[2]) } : { r: 0, g: 0, b: 0 };
        }

        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(s => s + s).join('');
        }
        
        const r = parseInt(hex.slice(0, 2), 16) || 0;
        const g = parseInt(hex.slice(2, 4), 16) || 0;
        const b = parseInt(hex.slice(4, 6), 16) || 0;
        return { r, g, b };
    },

    /** RGB → CMYK (approssimato per intento) */
    rgbToCmyk(r, g, b) {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, m, y);

        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        c = Math.round(((c - k) / (1 - k)) * 100);
        m = Math.round(((m - k) / (1 - k)) * 100);
        y = Math.round(((y - k) / (1 - k)) * 100);
        k = Math.round(k * 100);
        return { c, m, y, k };
    },

    /** Calcola luminanza relativa */
    getLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    },

    /** Calcola contrast ratio (1:1 a 21:1) */
    getContrastRatio(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b) + 0.05;
        const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b) + 0.05;
        return Math.max(l1, l2) / Math.min(l1, l2);
    },

    /** RGB → Gray hex */
    toGrayHex(hex) {
        const { r, g, b } = this.hexToRgb(hex);
        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        const s = gray.toString(16).padStart(2, '0');
        return `#${s}${s}${s}`;
    },

    /**
     * Restituisce il colore barre e sfondo in base allo spazio colore selezionato.
     */
    getColors({ colorSpace = 'rgb', bars = '#000000', bg = '#ffffff', transparent = false } = {}, target = 'svg') {
        let lineColor = bars;
        let background = transparent ? (target === 'svg' ? 'none' : 'rgba(255,255,255,0)') : bg;

        if (colorSpace === 'gray') {
            lineColor = this.toGrayHex(lineColor);
            if (!transparent) background = this.toGrayHex(background);
        }

        let note = `Color Space: ${colorSpace.toUpperCase()}`;
        if (colorSpace === 'cmyk') {
            const cmyk = this.rgbToCmyk(...Object.values(this.hexToRgb(lineColor)));
            note += ` | Bar C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}`;
        }

        return { lineColor, background, colorNote: note };
    },

    // ═══════════════════════════════════════
    //  GENERAZIONE BARCODE
    // ═══════════════════════════════════════

    /**
     * Genera un barcode EAN su un elemento SVG o Canvas.
     */
    generate(element, code, options = {}) {
        const {
            format = 'EAN13',
            width = 2,
            height = 100,
            displayValue = true,
            fontSize = 20,
            font = this.BARCODE_FONT,
            background = '#ffffff',
            lineColor = '#000000',
            margin = 10,
            textMargin = 2,
            textPosition = 'bottom',
            flat = false
        } = options;

        try {
            JsBarcode(element, code, {
                format,
                width,
                height,
                displayValue,
                text: options.text || undefined,
                fontSize,
                font,
                fontOptions: '',
                textAlign: 'center',
                textPosition,
                textMargin,
                background,
                lineColor,
                margin: options.margin !== undefined ? options.margin : margin,
                marginTop: options.marginTop !== undefined ? options.marginTop : margin,
                marginBottom: options.marginBottom !== undefined ? options.marginBottom : margin,
                marginLeft: options.marginLeft !== undefined ? options.marginLeft : margin,
                marginRight: options.marginRight !== undefined ? options.marginRight : margin,
                flat
            });
            return true;
        } catch (e) {
            console.error('Errore generazione barcode:', e);
            return false;
        }
    },

    // ═══════════════════════════════════════
    //  EXPORT HELPERS
    // ═══════════════════════════════════════

    /**
     * Calcola l'abbondanza (quiet zone) minima raccomandata GS1 in mm.
     */
    getRecommendedAbbondanza(type, barcodeWidthMM) {
        const modules = this.MODULES[type] || 95;
        const moduleSize = barcodeWidthMM / modules;
        const multiplier = type === 'EAN13' ? 10 : 7;
        return moduleSize * multiplier;
    },

    /**
     * Verifica se le dimensioni sono conformi allo standard GS1.
     */
    isGS1Compliant(type, mmW, mmH) {
        if (type === 'EAN13') {
            const minW = 37.29 * 0.8, maxW = 37.29 * 2.0;
            const minH = 25.93 * 0.8, maxH = 25.93 * 2.0;
            return mmW >= minW && mmW <= maxW && mmH >= minH && mmH <= maxH;
        } else {
            const minW = 26.73 * 0.8, maxW = 26.73 * 2.0;
            const minH = 21.31 * 0.8, maxH = 21.31 * 2.0;
            return mmW >= minW && mmW <= maxW && mmH >= minH && mmH <= maxH;
        }
    },

    /**
     * Formatta il testo in stile standard GS1 (EAN-13: 1-6-6).
     */
    formatEANText(code, type) {
        if (type === 'EAN13' && code.length === 13) {
            return `${code[0]} · ${code.slice(1, 7)} · ${code.slice(7)}`;
        }
        if (type === 'EAN8' && code.length === 8) {
            return `${code.slice(0, 4)} · ${code.slice(4)}`;
        }
        return code;
    },

    /**
     * Unifica la logica di costruzione opzioni per Anteprima ed Export.
     */
    getBarcodeOptions(type, params, target = 'svg') {
        const { width, height, unit, dpi = 300, colorSpace, showText, hriFont, hriSize, hriPos, hriFormat, bars, bg, transparent, qzH, qzV } = params;

        const isMM = unit === 'mm';
        
        // Calcola lo spazio interno effettivo sottraendo le abbondanze
        const availableWidth = Math.max(0.1, width - (qzH * 2));
        const availableHeight = Math.max(0.1, height - (qzV * 2));

        const pxW = isMM ? this.mmToPx(availableWidth, dpi) : availableWidth;
        const pxH = isMM ? this.mmToPx(availableHeight, dpi) : availableHeight;

        const colors = this.getColors({ colorSpace, bars, bg, transparent }, target);
        const modules = this.MODULES[type] || 95;
        const moduleWidth = pxW / modules; 

        return {
            format: type,
            width: moduleWidth,
            height: pxH,
            displayValue: showText,
            fontSize: isMM ? this.mmToPx(hriSize * 0.3528, dpi) : hriSize,
            font: hriFont === 'custom' ? 'CustomBarcodeFont' : hriFont,
            lineColor: colors.lineColor,
            background: colors.background,
            margin: 0,
            textPosition: hriPos === 'incorporated' ? 'bottom' : hriPos,
            flat: hriPos !== 'incorporated', 
            text: (hriFormat && hriPos !== 'top') ? this.formatEANText(params.code || '', type) : params.code,
            marginLeft: isMM ? this.mmToPx(qzH, dpi) : qzH,
            marginRight: isMM ? this.mmToPx(qzH, dpi) : qzH,
            marginTop: isMM ? this.mmToPx(qzV, dpi) : qzV,
            marginBottom: isMM ? this.mmToPx(qzV, dpi) : qzV,
            textMargin: (isMM ? Math.max(2, Math.round(dpi / 72)) : 2) * (hriPos === 'top' ? 1.5 : 1)
        };
    },

    // ═══════════════════════════════════════
    //  SVG POST-PROCESSING
    // ═══════════════════════════════════════

    /**
     * Serializza un SVG element in stringa XML pulita.
     */
    serializeSVG(svgEl, { width = 37.29, height = 25.93, unit = 'mm', colorSpace = 'rgb', lineColor = '#000000' } = {}) {
        const s = new XMLSerializer();
        
        if (unit === 'mm') {
            svgEl.setAttribute('width', `${width}mm`);
            svgEl.setAttribute('height', `${height}mm`);
        } else {
            svgEl.setAttribute('width', width);
            svgEl.setAttribute('height', height);
        }

        // Aggiunta metadati CMYK se richiesto (per tool esterni)
        if (colorSpace === 'cmyk') {
            const rgb = this.hexToRgb(lineColor);
            const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
            const metadata = `<!-- CMYK_INTENT: C=${cmyk.c} M=${cmyk.m} Y=${cmyk.y} K=${cmyk.k} -->\n`;
            svgEl.setAttribute('data-color-space', 'CMYK');
            svgEl.setAttribute('data-cmyk', `${cmyk.c},${cmyk.m},${cmyk.y},${cmyk.k}`);
        }

        let src = s.serializeToString(svgEl);

        if (!src.includes('xmlns="http://www.w3.org/2000/svg"')) {
            src = src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        src = '<?xml version="1.0" encoding="UTF-8"?>\n' + src;
        return src;
    },

    // ═══════════════════════════════════════
    //  EXPORT ENTRY POINT
    // ═══════════════════════════════════════

    /**
     * Entry point principale per l'export.
     */
    async exportToBlob(code, type, params, format = 'svg') {
        const opts = this.getBarcodeOptions(type, { ...params, code }, format === 'svg' ? 'svg' : 'canvas');

        if (format === 'svg') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.generate(svg, code, opts);
            const serialized = this.serializeSVG(svg, { ...params, lineColor: opts.lineColor });
            return new Blob([serialized], { type: 'image/svg+xml' });
        } else {
            return this.renderToBlob(code, opts, format, params.colorSpace);
        }
    },

    /**
     * Genera un barcode su canvas e restituisce un Blob.
     */
    async renderToBlob(code, opts, format = 'png', colorSpace = 'rgb') {
        const canvas = document.createElement('canvas');
        this.generate(canvas, code, opts);

        if (colorSpace === 'gray') {
            this._toGrayscale(canvas);
        }

        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpg' ? 0.95 : undefined;

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), mime, quality);
        });
    },

    /**
     * Converte un canvas in scala di grigi (in-place).
     */
    _toGrayscale(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);
    }
};
