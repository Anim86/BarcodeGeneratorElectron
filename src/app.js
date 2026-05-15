/**
 * EAN Pro — Application Controller (Professional Edition)
 */
document.addEventListener('DOMContentLoaded', () => {

    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    // ── CONFIGURAZIONI & PRESET ──
    // ── CONFIGURAZIONI ──

    const el = {
        manualInput:    $('manual-input'),
        previewWrap:    $('barcode-preview-container'),
        previewStatus:  $('preview-status'),
        downloadBtn:    $('download-preview-btn'),
        resultsBody:    $('results-body'),
        emptyState:     $('empty-state'),
        formatSelect:   $('format-select'),
        colorSelect:    $('color-select'),
        widthInput:     $('width-input'),
        heightInput:    $('height-input'),
        dpiInput:       $('dpi-input'),
        qzHInput:       $('qz-h-input'),
        qzVInput:       $('qz-v-input'),
        qzWarning:      $('qz-warning'),
        includeQZToggle:$('include-qz-toggle'),
        colorBars:      $('color-bars'),
        colorBg:        $('color-bg'),
        bgTransToggle:  $('bg-transparent-toggle'),
        bgColorField:   $('bg-color-field'),
        forceK100Toggle:$('force-k100-toggle'),
        colorSelect:    $('color-select'),
        colorInfoBox:   $('color-info-box'),
        cmykValues:     $('cmyk-values'),
        contrastWarn:   $('contrast-warning'),
        hriToggle:      $('hri-toggle'),
        hriFont:        $('hri-font'),
        hriFontFile:    $('hri-font-file'),
        hriSize:        $('hri-size'),
        hriPos:         $('hri-position'),
        hriFormatToggle:$('hri-format-toggle'),
        hriFormatField: $('hri-format-field'),
        hriOptionsWrap: $('hri-options-wrap'),
        textToPathToggle: $('text-to-path-toggle'),
        gs1Compliance:  $('gs1-compliance'),
        presetBtns:     $$('.btn--preset'),
        themeToggle:    $('theme-toggle'),
        fileUpload:     $('file-upload'),
        batchSummary:   $('batch-summary'),
        countValid:     $('batch-count-valid'),
        countInvalid:   $('batch-count-invalid'),
        downloadAllBtn: $('download-all-btn'),
        columnModal:    $('column-modal'),
        columnList:     $('column-list'),
        cancelUpload:   $('cancel-upload'),
        unitSelect:     $('unit-select'),
        unitLabels:     $$('.unit-label'),
        newPresetName:  $('new-preset-name'),
        savePresetBtn:  $('save-preset-btn'),
        customPresetsList: $('custom-presets-list'),
        cmykRasterWarning: $('cmyk-raster-warning'),
        resetAllBtn:    $('reset-all-btn'),
        resultsBody:    $('results-body'),
        emptyState:     $('empty-state')
    };

    let currentBarcode = null;
    let batchData = [];

    // ── UTILS ──
    const getV = (id, def = '') => el[id] ? el[id].value : def;
    const getC = (id, def = false) => el[id] ? el[id].checked : def;

    function debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    // ── ANTEPRIMA ──
    async function showPreview(val) {
        if (!val) return;
        currentBarcode = val;

        if (el.previewWrap) el.previewWrap.innerHTML = '';
        if (el.downloadBtn) el.downloadBtn.disabled = true;

        if (!val.isValid) {
            if (el.previewStatus) {
                el.previewStatus.textContent = 'Errore';
                el.previewStatus.className = 'badge badge--err';
            }
            if (el.previewWrap) el.previewWrap.innerHTML = `<p class="error-text">${val.error}</p>`;
            return;
        }

        if (el.previewStatus) {
            el.previewStatus.textContent = `${val.type} — OK`;
            el.previewStatus.className = 'badge badge--ok';
        }

        const params = getExportParams();
        params.code = val.code;

        const format = getV('formatSelect');
        const isRaster = format === 'png' || format === 'jpg' || format === 'tiff';
        const isVector = format === 'svg' || format === 'pdf' || format === 'eps' || format === 'pdf-x';
        let success = false;

        if (isRaster) {
            // Anteprima Pixel-Perfect per formati raster
            const canvas = document.createElement('canvas');
            const opts = BarcodeService.getBarcodeOptions(val.type, params, 'canvas');
            success = BarcodeService.generate(canvas, val.code, opts);
            
            if (success) {
                if (params.colorSpace === 'gray') BarcodeService._toGrayscale(canvas);
                
                const img = document.createElement('img');
                img.src = canvas.toDataURL();
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                img.className = 'preview-img';
                if (el.previewWrap) el.previewWrap.appendChild(img);
            }
        } else if (isVector) {
            // Anteprima Vettoriale per SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const opts = BarcodeService.getBarcodeOptions(val.type, params, 'svg');
            success = BarcodeService.generate(svg, val.code, opts);
            
            if (success) {
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                if (el.previewWrap) el.previewWrap.appendChild(svg);
            }
        }
        
        if (success) {
            validateAbbondanza();
            updateColorInfo();
            validateCompliance();
            if (el.downloadBtn) el.downloadBtn.disabled = false;
        } else {
            if (el.previewStatus) {
                el.previewStatus.textContent = 'Errore Rendering';
                el.previewStatus.className = 'badge badge--err';
            }
        }
    }

    // ── VALIDAZIONI ──
    function validateAbbondanza() {
        if (!currentBarcode || !currentBarcode.isValid || !el.qzWarning) return;
        const mmW = parseFloat(getV('widthInput', '37.29')) || 37.29;
        const qzH = parseFloat(getV('qzHInput', '0')) || 0;
        const unit = getV('unitSelect');
        
        const checkW = unit === 'px' ? (mmW * 25.4 / 96) : mmW;
        const checkH = unit === 'px' ? (qzH * 25.4 / 96) : qzH;
        
        const minRec = BarcodeService.getRecommendedAbbondanza(currentBarcode.type, checkW);
        if (checkH < minRec) {
            el.qzWarning.textContent = `Abbondanza raccomandata GS1: min. ${minRec.toFixed(2)}mm`;
            el.qzWarning.style.display = 'block';
        } else {
            el.qzWarning.style.display = 'none';
        }
    }

    function updateColorInfo() {
        if (!el.colorInfoBox) return;
        const mode = getV('colorSelect');
        const bars = getV('colorBars');
        const bg   = getV('colorBg');
        const trans = getC('bgTransToggle');

        el.colorInfoBox.style.display = 'block';
        if (mode === 'cmyk' && el.cmykValues) {
            const rgb = BarcodeService.hexToRgb(bars);
            const cmyk = BarcodeService.rgbToCmyk(rgb.r, rgb.g, rgb.b);
            el.cmykValues.innerHTML = `<span><strong>CMYK:</strong> C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}</span>`;
            el.cmykValues.style.display = 'block';
        } else if (el.cmykValues) {
            el.cmykValues.style.display = 'none';
        }

        if (!trans && el.contrastWarn) {
            const ratio = BarcodeService.getContrastRatio(bars, bg);
            if (ratio < 5) {
                el.contrastWarn.textContent = `Contrasto scarso (${ratio.toFixed(1)}:1). Minimo 5:1 raccomandato.`;
                el.contrastWarn.style.display = 'block';
            } else {
                el.contrastWarn.style.display = 'none';
            }
        } else if (el.contrastWarn) {
            el.contrastWarn.style.display = 'none';
        }

        // Warning compatibilità CMYK
        if (el.cmykRasterWarning) {
            const format = getV('formatSelect');
            const isNoCmyk = format === 'png' || format === 'svg';
            el.cmykRasterWarning.style.display = (mode === 'cmyk' && isNoCmyk) ? 'block' : 'none';
        }
    }

    function validateCompliance() {
        if (!currentBarcode || !currentBarcode.isValid || !el.gs1Compliance) return;
        const mmW = parseFloat(getV('widthInput')) || 0;
        const mmH = parseFloat(getV('heightInput')) || 0;
        const unit = getV('unitSelect');
        
        const checkW = unit === 'px' ? (mmW * 25.4 / 96) : mmW;
        const checkH = unit === 'px' ? (mmH * 25.4 / 96) : mmH;
        
        const ok = BarcodeService.isGS1Compliant(currentBarcode.type, checkW, checkH);
        el.gs1Compliance.style.display = 'flex';
        el.gs1Compliance.className = ok ? 'compliance-badge compliance-badge--ok' : 'compliance-badge compliance-badge--warn';
        el.gs1Compliance.querySelector('span').textContent = ok ? 'Dimensioni conformi GS1' : 'Dimensioni fuori standard';
    }

    function resetPreview() {
        currentBarcode = null;
        if (el.previewStatus) {
            el.previewStatus.textContent = 'In attesa';
            el.previewStatus.className = 'badge badge--neutral';
        }
        if (el.previewWrap) {
            el.previewWrap.innerHTML = `
                <div class="preview__empty">
                    <p>Inserisci un codice EAN o importa un file</p>
                </div>
            `;
        }
        if (el.downloadBtn) el.downloadBtn.disabled = true;
    }

    function fullReset() {
        if (el.manualInput) el.manualInput.value = '';
        batchData = [];
        if (el.resultsBody) el.resultsBody.innerHTML = '';
        if (el.emptyState) el.emptyState.style.display = 'flex';
        if (el.batchSummary) el.batchSummary.style.display = 'none';
        resetPreview();
    }

    // ── EVENT LISTENERS ──
    if (el.manualInput) {
        el.manualInput.addEventListener('input', debounce(() => {
            const val = el.manualInput.value.trim();
            if (!val) {
                resetPreview();
                return;
            }
            
            const codes = val.split(/[\s,]+/).filter(c => c.length > 0);
            
            if (codes.length > 1) {
                // Modalità batch automatica per input multiplo
                const fakeRows = [['Codici']];
                codes.forEach(c => fakeRows.push([c]));
                detectColumn(fakeRows);
            } else {
                showPreview(BarcodeService.validateEAN(codes[0]));
            }
        }, 300));
    }



    const liveInputs = [
        el.widthInput, el.heightInput, el.unitSelect, el.dpiInput, el.qzHInput, el.qzVInput, 
        el.includeQZToggle, el.colorBars, el.colorBg, el.bgTransToggle, el.forceK100Toggle,
        el.colorSelect, el.hriToggle, el.hriFont, el.hriSize, el.hriPos, el.hriFormatToggle, el.formatSelect, el.textToPathToggle
    ];

    if (el.unitSelect) {
        el.unitSelect.addEventListener('change', () => {
            const unit = el.unitSelect.value;
            el.unitLabels.forEach(lbl => {
                if (lbl.textContent !== 'DPI' && lbl.textContent !== 'pt') {
                    lbl.textContent = unit;
                }
            });
            if (unit === 'px') {
                el.widthInput.step = "1";
                el.heightInput.step = "1";
                el.qzHInput.step = "1";
                el.qzVInput.step = "1";
                el.widthInput.value = Math.round(parseFloat(el.widthInput.value) || 0);
                el.heightInput.value = Math.round(parseFloat(el.heightInput.value) || 0);
            } else {
                el.widthInput.step = "0.01";
                el.heightInput.step = "0.01";
                el.qzHInput.step = "0.01";
                el.qzVInput.step = "0.01";
            }
        });
    }

    liveInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', () => {
                if (currentBarcode) showPreview(currentBarcode);
                else {
                    validateCompliance();
                    validateAbbondanza();
                    updateColorInfo();
                }
            });
            input.addEventListener('input', () => {
                if (currentBarcode) showPreview(currentBarcode);
            });
        }
    });



    function applyPreset(p) {
        if (!p) return;
        if (el.widthInput && p.width) el.widthInput.value = p.width;
        if (el.heightInput && p.height) el.heightInput.value = p.height;
        if (el.unitSelect && p.unit) {
            el.unitSelect.value = p.unit;
            el.unitSelect.dispatchEvent(new Event('change'));
        }
        if (el.dpiInput && p.dpi) el.dpiInput.value = p.dpi;
        if (el.colorSelect && p.colorSpace) el.colorSelect.value = p.colorSpace;
        if (el.qzHInput && p.qzH) el.qzHInput.value = p.qzH;
        if (el.qzVInput && p.qzV) el.qzVInput.value = p.qzV;
        if (el.hriFont && p.hriFont) el.hriFont.value = p.hriFont;
        if (el.hriSize && p.hriSize) el.hriSize.value = p.hriSize;
        if (el.hriPos && p.hriPos) {
            el.hriPos.value = p.hriPos;
            el.hriPos.dispatchEvent(new Event('change'));
        }
        if (el.formatSelect && p.format) el.formatSelect.value = p.format;
        if (el.colorBars && p.bars) el.colorBars.value = p.bars;
        if (el.colorBg && p.bg) el.colorBg.value = p.bg;

        if (el.bgTransToggle && p.transparent !== undefined) {
            el.bgTransToggle.checked = p.transparent;
            el.bgTransToggle.dispatchEvent(new Event('change'));
        }
        if (el.hriToggle && p.showText !== undefined) el.hriToggle.checked = p.showText;
        if (el.includeQZToggle && p.includeQZ !== undefined) el.includeQZToggle.checked = p.includeQZ;
        if (el.hriFormatToggle && p.hriFormat !== undefined) el.hriFormatToggle.checked = p.hriFormat;

        if (currentBarcode) showPreview(currentBarcode);
        else {
            validateCompliance();
            validateAbbondanza();
            updateColorInfo();
        }
    }

    // ── GESTIONE PRESET PERSONALIZZATI ──
    function loadCustomPresets() {
        const stored = localStorage.getItem('ean_pro_presets');
        return stored ? JSON.parse(stored) : {};
    }

    function renderCustomPresets() {
        if (!el.customPresetsList) return;
        const presets = loadCustomPresets();
        el.customPresetsList.innerHTML = '';
        
        Object.keys(presets).forEach(name => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preset-item-custom';
            
            const btn = document.createElement('button');
            btn.className = 'btn btn--preset flex-grow';
            btn.textContent = name;
            btn.onclick = () => applyPreset(presets[name]);
            
            const del = document.createElement('button');
            del.className = 'btn-del-preset';
            del.innerHTML = '&times;';
            del.title = 'Elimina preset';
            del.onclick = (e) => {
                e.stopPropagation();
                deletePreset(name);
            };
            
            wrapper.appendChild(btn);
            wrapper.appendChild(del);
            el.customPresetsList.appendChild(wrapper);
        });
    }

    function savePreset() {
        const name = el.newPresetName.value.trim();
        if (!name) return alert('Inserisci un nome per il preset');
        
        const presets = loadCustomPresets();
        presets[name] = getExportParams();
        localStorage.setItem('ean_pro_presets', JSON.stringify(presets));
        
        el.newPresetName.value = '';
        renderCustomPresets();
    }

    function deletePreset(name) {
        if (!confirm(`Sei sicuro di voler eliminare il preset "${name}"?`)) return;
        const presets = loadCustomPresets();
        delete presets[name];
        localStorage.setItem('ean_pro_presets', JSON.stringify(presets));
        renderCustomPresets();
    }

    if (el.savePresetBtn) {
        el.savePresetBtn.addEventListener('click', savePreset);
    }

    renderCustomPresets();

    if (el.hriFont) {
        el.hriFont.addEventListener('change', () => {
            if (el.hriFontFile) el.hriFontFile.style.display = el.hriFont.value === 'custom' ? 'block' : 'none';
        });
    }

    if (el.hriPos) {
        el.hriPos.addEventListener('change', () => {
            if (el.hriFormatField) {
                const isInc = el.hriPos.value === 'incorporated';
                if (isInc) {
                    if (el.hriFormatToggle) el.hriFormatToggle.checked = false;
                    el.hriFormatField.style.opacity = '0.5';
                    el.hriFormatField.style.pointerEvents = 'none';
                } else {
                    el.hriFormatField.style.opacity = '1';
                    el.hriFormatField.style.pointerEvents = 'auto';
                }
            }
        });
    }

    if (el.bgTransToggle) {
        el.bgTransToggle.addEventListener('change', () => {
            if (el.bgColorField) {
                el.bgColorField.style.display = el.bgTransToggle.checked ? 'none' : 'block';
            }
        });
    }

    if (el.hriFontFile) {
        el.hriFontFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const fontData = ev.target.result;
                const style = document.createElement('style');
                style.textContent = `@font-face { font-family: "CustomBarcodeFont"; src: url("${fontData}"); }`;
                document.head.appendChild(style);
                if (currentBarcode) showPreview(currentBarcode);
            };
            reader.readAsDataURL(file);
        });
    }

    if (el.themeToggle) {
        el.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
        });
    }

    // ── BATCH & FILE UPLOAD ──
    function handleFileUpload(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
            if (!rows.length) return;
            detectColumn(rows);
        };
        reader.readAsArrayBuffer(file);
    }

    if (el.fileUpload) {
        el.fileUpload.addEventListener('change', (e) => {
            handleFileUpload(e.target.files[0]);
            e.target.value = '';
        });
    }

    // ── DRAG AND DROP ──
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.classList.add('drag-active');
    });

    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (e.target === document.body || !document.body.contains(e.relatedTarget)) {
            document.body.classList.remove('drag-active');
        }
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
            handleFileUpload(file);
        }
    });

    function detectColumn(rows) {
        const headers = rows[0];
        const samples = rows.slice(1, 8);
        const cols = headers.map((h, i) => {
            let hits = 0;
            samples.forEach(r => {
                if (r[i] && /^\d{8,13}$/.test(String(r[i]).trim())) hits++;
            });
            return { i, name: h || `Colonna ${i + 1}`, hits };
        });
        const best = cols.sort((a, b) => b.hits - a.hits)[0];
        if (best.hits >= 2) runBatch(rows, best.i);
        else openColumnPicker(rows, cols);
    }

    function openColumnPicker(rows, cols) {
        if (!el.columnList || !el.columnModal) return;
        el.columnList.innerHTML = '';
        cols.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'column-btn';
            btn.textContent = c.name;
            btn.onclick = () => {
                el.columnModal.setAttribute('aria-hidden', 'true');
                runBatch(rows, c.i);
            };
            el.columnList.appendChild(btn);
        });
        el.columnModal.setAttribute('aria-hidden', 'false');
    }

    if (el.cancelUpload) {
        el.cancelUpload.onclick = () => el.columnModal.setAttribute('aria-hidden', 'true');
    }

    function runBatch(data, colIdx) {
        batchData = [];
        if (el.resultsBody) el.resultsBody.innerHTML = '';
        if (el.emptyState) el.emptyState.style.display = 'none';

        const rows = data.slice(1);
        const fragment = document.createDocumentFragment();

        rows.forEach((row, idx) => {
            const raw = String(row[colIdx] || '').trim();
            if (!raw) return;
            const v = BarcodeService.validateEAN(raw);
            v.original = raw;
            v.status = v.isValid ? 'valid' : 'error';
            batchData.push(v);
            fragment.appendChild(createRow(v, batchData.length - 1));
        });

        if (el.resultsBody) el.resultsBody.appendChild(fragment);

        const valid = batchData.filter(x => x.isValid).length;
        if (el.countValid) el.countValid.textContent = `${valid} validi`;
        if (el.countInvalid) el.countInvalid.textContent = `${batchData.length - valid} errori`;
        if (el.batchSummary) el.batchSummary.style.display = batchData.length ? 'flex' : 'none';
        if (el.downloadAllBtn) el.downloadAllBtn.disabled = valid === 0;

        const firstValid = batchData.find(x => x.isValid);
        if (firstValid) showPreview(firstValid);
    }

    function createRow(item, idx) {
        const tr = document.createElement('tr');
        tr.dataset.idx = idx;
        const statusHTML = item.isValid ? '<span class="badge badge--ok">Valido</span>' : '<span class="badge badge--err">Errore</span>';
        const errorMsg = item.isValid ? '—' : item.error;
        const actionBtn = item.isValid ? `<button class="btn-row-dl" data-idx="${idx}">⬇</button>` : '';

        tr.innerHTML = `
            <td><code>${item.original}</code></td>
            <td>${item.type || '—'}</td>
            <td>${statusHTML}</td>
            <td><small>${errorMsg}</small></td>
            <td>${actionBtn}</td>
        `;

        if (item.isValid) {
            tr.style.cursor = 'pointer';
            tr.onclick = () => showPreview(item);
            const btn = tr.querySelector('.btn-row-dl');
            if (btn) btn.onclick = (e) => { e.stopPropagation(); downloadSingle(item); };
        }
        return tr;
    }

    // ── DOWNLOAD LOGIC ──
    async function downloadSingle(item) {
        try {
            const params = getExportParams();
            const format = el.formatSelect.value;
            const color = el.colorSelect.value;

            // Verifico se usare l'esportazione nativa Electron (per formati professionali)
            if (window.ExportBridge && window.ExportBridge.isElectron) {
                let nativeFormat = null;
                
                if (format === 'tiff') {
                    nativeFormat = color === 'gray' ? 'tiff-gray' : 'tiff-cmyk';
                } else if (format === 'eps') {
                    nativeFormat = 'eps';
                } else if (format === 'pdf') {
                    nativeFormat = 'pdf-x';
                } else if (format === 'jpg' && color === 'cmyk') {
                    nativeFormat = 'jpeg-cmyk';
                } else if (format === 'png' && color === 'gray') {
                    nativeFormat = 'png-gray';
                } else if (format === 'svg') {
                    nativeFormat = 'svg'; // Salvataggio nativo per SVG
                }

                if (nativeFormat) {
                    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    const opts = BarcodeService.getBarcodeOptions(item.type, { ...params, code: item.code }, 'svg');
                    BarcodeService.generate(tempSvg, item.code, opts);
                    const svgString = BarcodeService.serializeSVG(tempSvg, { ...params, lineColor: opts.lineColor });

                    await window.ExportBridge.export(nativeFormat, {
                        code: item.code,
                        type: item.type,
                        svgString: svgString,
                        params: params
                    });
                    return;
                }
            }

            // Fallback per browser o formati standard (PNG/JPG RGB)
            if (['tiff', 'eps', 'pdf'].includes(format) && (!window.ExportBridge || !window.ExportBridge.isElectron)) {
                alert('I formati TIFF, EPS e PDF sono disponibili solo nella versione desktop di EAN Pro.');
                return;
            }

            const blob = await BarcodeService.exportToBlob(item.code, item.type, params, format);
            saveAs(blob, `${item.code}.${format}`);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Errore durante l'esportazione: " + err.message);
        }
    }

    if (el.downloadBtn) {
        el.downloadBtn.addEventListener('click', () => {
            if (currentBarcode && currentBarcode.isValid) downloadSingle(currentBarcode);
        });
    }

    if (el.downloadAllBtn) {
        el.downloadAllBtn.addEventListener('click', async () => {
            try {
                const format = el.formatSelect.value;
                const color = el.colorSelect.value;
                const items = batchData.filter(x => x.isValid);
                if (!items.length) return;

                const params = getExportParams();

                // Verifico se usare l'esportazione nativa Electron Batch
                if (window.ExportBridge && window.ExportBridge.isElectron) {
                    let nativeFormat = null;
                    if (format === 'tiff') {
                        nativeFormat = color === 'gray' ? 'tiff-gray' : 'tiff-cmyk';
                    } else if (format === 'eps') {
                        nativeFormat = 'eps';
                    } else if (format === 'pdf') {
                        nativeFormat = 'pdf-x';
                    } else if (format === 'jpg' && color === 'cmyk') {
                        nativeFormat = 'jpeg-cmyk';
                    } else if (format === 'png' && color === 'gray') {
                        nativeFormat = 'png-gray';
                    } else if (format === 'svg') {
                        nativeFormat = 'svg';
                    }

                    if (nativeFormat) {
                        el.downloadAllBtn.disabled = true;
                        
                        // Prepariamo i dati per il batch nativo
                        const batchItems = items.map(item => {
                            const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            const opts = BarcodeService.getBarcodeOptions(item.type, { ...params, code: item.code }, 'svg');
                            BarcodeService.generate(tempSvg, item.code, opts);
                            const svgString = BarcodeService.serializeSVG(tempSvg, { ...params, lineColor: opts.lineColor });
                            
                            const ext = (nativeFormat === 'tiff-cmyk' || nativeFormat === 'tiff-gray') ? 'tif' : (nativeFormat === 'pdf-x' ? 'pdf' : format);
                            return {
                                svg: svgString,
                                filename: `${item.code}.${ext}`
                            };
                        });

                        await window.ExportBridge.exportBatch(nativeFormat, batchItems, params);
                        el.downloadAllBtn.disabled = false;
                        return;
                    }
                }

                // Fallback per browser o formati standard (PNG/JPG RGB)
                if (['tiff', 'eps', 'pdf'].includes(format) && (!window.ExportBridge || !window.ExportBridge.isElectron)) {
                    alert('I formati TIFF, EPS e PDF sono disponibili solo nella versione desktop di EAN Pro.');
                    return;
                }

                el.downloadAllBtn.disabled = true;
                const zip = new JSZip();

                for (const item of items) {
                    const blob = await BarcodeService.exportToBlob(item.code, item.type, params, format);
                    zip.file(`${item.code}.${format}`, blob);
                }

                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, `ean_batch_${new Date().getTime()}.zip`);
            } catch (err) {
                console.error("Batch download failed:", err);
                alert("Errore durante l'esportazione batch: " + err.message);
            } finally {
                el.downloadAllBtn.disabled = false;
            }
        });
    }

    function getExportParams() {
        const includeQZ = getC('include-qz-toggle', true);
        return {
            width: parseFloat(getV('widthInput', '37.29')) || 37.29,
            height: parseFloat(getV('heightInput', '25.93')) || 25.93,
            unit: getV('unitSelect', 'mm'),
            dpi: parseInt(getV('dpiInput', '300')) || 300,
            colorSpace: getV('colorSelect', 'rgb'),
            showText: getC('hriToggle', true),
            includeQZ: includeQZ,
            qzH: includeQZ ? (parseFloat(getV('qzHInput', '0')) || 0) : 0,
            qzV: includeQZ ? (parseFloat(getV('qzVInput', '0')) || 0) : 0,
            bars: getV('colorBars', '#000000'),
            bg: getV('colorBg', '#ffffff'),
            transparent: getC('bgTransToggle'),
            hriFont: getV('hriFont', 'OCR-B'),
            hriSize: parseFloat(getV('hriSize', '12')) || 12,
            hriPos: getV('hriPos', 'bottom'),
            hriFormat: getV('hriPos') === 'incorporated' ? false : getC('hriFormatToggle', true),
            textToPath: getC('text-to-path-toggle', true),
            forceK100: getC('force-k100-toggle', true),
            format: getV('formatSelect', 'png')
        };
    }


    // Init
    if (el.hriPos) el.hriPos.dispatchEvent(new Event('change'));
    if (el.bgTransToggle) el.bgTransToggle.dispatchEvent(new Event('change'));
    
    if (el.resetAllBtn) {
        el.resetAllBtn.onclick = () => {
            if (confirm('Vuoi resettare tutti i codici inseriti? (Le impostazioni tecniche rimarranno invariate)')) {
                fullReset();
            }
        };
    }

    resetPreview();
});
