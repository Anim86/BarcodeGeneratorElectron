/**
 * EAN Pro — Application Controller (Professional Edition)
 */
document.addEventListener('DOMContentLoaded', () => {

    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    const isElectron = window.ExportBridge && window.ExportBridge.isElectron;

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
        colorCustomizerContainer: $('color-customizer-container'),
        colorInfoBox:   $('color-info-box'),
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
        resetAllBtn:    $('reset-all-btn')
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
                el.previewStatus.textContent = window.i18n.t('status_invalid');
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
                el.previewStatus.textContent = window.i18n.t('preview_rendering_error');
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
            el.qzWarning.textContent = window.i18n.t('qz_warning', { min: minRec.toFixed(2) });
            el.qzWarning.style.display = 'block';
        } else {
            el.qzWarning.style.display = 'none';
        }
    }
    function syncColors(sourceHex) {
        if (!sourceHex) return;
        
        const hexVal = sourceHex.toUpperCase();
        if ($('val-hex') && document.activeElement !== $('val-hex')) $('val-hex').value = hexVal;

        const rgb = BarcodeService.hexToRgb(sourceHex);
        if ($('val-r') && document.activeElement !== $('val-r')) $('val-r').value = rgb.r;
        if ($('val-g') && document.activeElement !== $('val-g')) $('val-g').value = rgb.g;
        if ($('val-b') && document.activeElement !== $('val-b')) $('val-b').value = rgb.b;

        const hsl = BarcodeService.rgbToHsl(rgb.r, rgb.g, rgb.b);
        if ($('val-h') && document.activeElement !== $('val-h')) $('val-h').value = hsl.h;
        if ($('val-s') && document.activeElement !== $('val-s')) $('val-s').value = hsl.s;
        if ($('val-l') && document.activeElement !== $('val-l')) $('val-l').value = hsl.l;

        const cmyk = BarcodeService.rgbToCmyk(rgb.r, rgb.g, rgb.b);
        if ($('val-c') && document.activeElement !== $('val-c')) $('val-c').value = cmyk.c;
        if ($('val-m') && document.activeElement !== $('val-m')) $('val-m').value = cmyk.m;
        if ($('val-y') && document.activeElement !== $('val-y')) $('val-y').value = cmyk.y;
        if ($('val-k') && document.activeElement !== $('val-k')) $('val-k').value = cmyk.k;
    }

    function updateColorInfo() {
        if (!el.colorInfoBox) return;
        const mode = getV('colorSelect');
        const bars = getC('forceK100Toggle') ? '#000000' : getV('colorBars', '#000000');
        const bg   = getV('colorBg');
        const trans = getC('bgTransToggle');

        // Sync colors
        syncColors(bars);

        el.colorInfoBox.style.display = 'block';

        if (!trans && el.contrastWarn) {
            const ratio = BarcodeService.getContrastRatio(bars, bg);
            if (ratio < 5) {
                el.contrastWarn.textContent = window.i18n.t('contrast_warning', { ratio: ratio.toFixed(1) });
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
        el.gs1Compliance.querySelector('span').textContent = ok ? window.i18n.t('gs1_compliant') : window.i18n.t('gs1_non_compliant');
    }

    function resetPreview() {
        currentBarcode = null;
        if (el.previewStatus) {
            el.previewStatus.textContent = window.i18n.t('preview_waiting');
            el.previewStatus.className = 'badge badge--neutral';
        }
        if (el.previewWrap) {
            el.previewWrap.innerHTML = `
                <div class="preview__empty">
                    <p data-i18n="preview_empty">${window.i18n.t('preview_empty')}</p>
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
                fullReset();
                return;
            }
            
            const codes = val.split(/[\r\n,;]+/).map(c => c.trim()).filter(c => c.length > 0);
            
            if (codes.length > 1) {
                // Modalità batch automatica per input multiplo da area di testo
                const fakeRows = [];
                codes.forEach(c => fakeRows.push([c]));
                runBatch(fakeRows, 0); // EAN column is index 0
            } else if (codes.length === 1) {
                batchData = [];
                if (el.resultsBody) el.resultsBody.innerHTML = '';
                if (el.emptyState) el.emptyState.style.display = 'flex';
                if (el.batchSummary) el.batchSummary.style.display = 'none';
                if (el.downloadBtn) el.downloadBtn.disabled = true;
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
                if (batchData && batchData.length > 0) {
                    refreshBatchTable();
                }
            });
            input.addEventListener('input', () => {
                updateColorInfo();
                if (currentBarcode) showPreview(currentBarcode);
            });
        }
    });

    // --- MANUALLY TYPED COLOR INPUTS ---
    function applyManualColor(hex) {
        if (el.colorBars && el.colorBars.value !== hex) {
            el.colorBars.value = hex;
            updateColorInfo();
            if (currentBarcode) showPreview(currentBarcode);
        }
    }
    
    function parseNum(val, min, max) {
        let n = parseInt(val, 10);
        if (isNaN(n)) return min;
        return Math.min(max, Math.max(min, n));
    }

    if ($('val-hex')) {
        $('val-hex').addEventListener('input', (e) => {
            let v = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyManualColor(v);
        });
    }

    ['r','g','b'].forEach(ch => {
        if ($('val-'+ch)) {
            $('val-'+ch).addEventListener('input', () => {
                const r = parseNum($('val-r').value, 0, 255);
                const g = parseNum($('val-g').value, 0, 255);
                const b = parseNum($('val-b').value, 0, 255);
                const hex = BarcodeService.rgbToHex(r, g, b);
                applyManualColor(hex);
            });
        }
    });

    ['h','s','l'].forEach(ch => {
        if ($('val-'+ch)) {
            $('val-'+ch).addEventListener('input', () => {
                const h = parseNum($('val-h').value, 0, 360);
                const s = parseNum($('val-s').value, 0, 100);
                const l = parseNum($('val-l').value, 0, 100);
                const rgb = BarcodeService.hslToRgb(h, s, l);
                const hex = BarcodeService.rgbToHex(rgb.r, rgb.g, rgb.b);
                applyManualColor(hex);
            });
        }
    });

    ['c','m','y','k'].forEach(ch => {
        if ($('val-'+ch)) {
            $('val-'+ch).addEventListener('input', () => {
                const c = parseNum($('val-c').value, 0, 100);
                const m = parseNum($('val-m').value, 0, 100);
                const y = parseNum($('val-y').value, 0, 100);
                const k = parseNum($('val-k').value, 0, 100);
                const rgb = BarcodeService.cmykToRgb(c, m, y, k);
                const hex = BarcodeService.rgbToHex(rgb.r, rgb.g, rgb.b);
                applyManualColor(hex);
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
        if (el.formatSelect && p.format) {
            el.formatSelect.value = p.format;
            el.formatSelect.dispatchEvent(new Event('change'));
        }
        if (el.colorBars && p.bars) el.colorBars.value = p.bars;
        if (el.colorBg && p.bg) el.colorBg.value = p.bg;

        if (el.bgTransToggle && p.transparent !== undefined) {
            el.bgTransToggle.checked = p.transparent;
            el.bgTransToggle.dispatchEvent(new Event('change'));
        }
        if (el.hriToggle && p.showText !== undefined) el.hriToggle.checked = p.showText;
        if (el.includeQZToggle && p.includeQZ !== undefined) el.includeQZToggle.checked = p.includeQZ;
        if (el.hriFormatToggle && p.hriFormat !== undefined) el.hriFormatToggle.checked = p.hriFormat;

        updateHriState();

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
        if (!name) return alert(window.i18n.t('preset_name_required'));
        
        const presets = loadCustomPresets();
        presets[name] = getExportParams();
        localStorage.setItem('ean_pro_presets', JSON.stringify(presets));
        
        el.newPresetName.value = '';
        renderCustomPresets();
    }

    function deletePreset(name) {
        if (!confirm(window.i18n.t('preset_delete_confirm', { name: name }))) return;
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

    if (el.formatSelect) {
        el.formatSelect.addEventListener('change', () => {
            if (el.bgTransToggle) {
                const isJpg = el.formatSelect.value === 'jpg';
                if (isJpg) {
                    el.bgTransToggle.checked = false;
                    el.bgTransToggle.disabled = true;
                    el.bgTransToggle.closest('.field').style.opacity = '0.5';
                    if (el.bgColorField) el.bgColorField.style.display = 'block';
                } else {
                    el.bgTransToggle.disabled = false;
                    el.bgTransToggle.closest('.field').style.opacity = '1';
                }
            }
        });
        setTimeout(() => el.formatSelect.dispatchEvent(new Event('change')), 100);
    }

    function updateHriState() {
        if (!el.hriToggle) return;
        const active = el.hriToggle.checked;
        if (el.hriOptionsWrap) {
            el.hriOptionsWrap.style.opacity = active ? '1' : '0.5';
            el.hriOptionsWrap.style.pointerEvents = active ? 'auto' : 'none';
        }
        if (el.textToPathToggle) {
            const field = el.textToPathToggle.closest('.field');
            if (field) {
                field.style.opacity = active ? '1' : '0.5';
                field.style.pointerEvents = active ? 'auto' : 'none';
            }
        }
    }

    if (el.hriToggle) {
        el.hriToggle.addEventListener('change', updateHriState);
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

    function analyzeColumns(rows) {
        if (!rows || rows.length === 0) return { eanCol: 0, nameCol: null, hasHeader: false };
        
        let maxCols = 0;
        rows.slice(0, 15).forEach(row => {
            if (row.length > maxCols) maxCols = row.length;
        });
        
        if (maxCols === 0) return { eanCol: 0, nameCol: null, hasHeader: false };
        
        const colStats = [];
        for (let c = 0; c < maxCols; c++) {
            colStats.push({ index: c, eanHits: 0, textHits: 0, total: 0 });
        }
        
        const sampleRows = rows.slice(0, 15);
        sampleRows.forEach(row => {
            for (let c = 0; c < maxCols; c++) {
                const val = String(row[c] || '').trim();
                if (!val) continue;
                colStats[c].total++;
                if (/^\d{8,13}$/.test(val)) {
                    colStats[c].eanHits++;
                } else if (val.length > 1) {
                    colStats[c].textHits++;
                }
            }
        });
        
        let eanCol = 0;
        let maxEanHits = -1;
        colStats.forEach(stat => {
            if (stat.eanHits > maxEanHits) {
                maxEanHits = stat.eanHits;
                eanCol = stat.index;
            }
        });
        
        let nameCol = null;
        let maxTextHits = -1;
        colStats.forEach(stat => {
            if (stat.index !== eanCol && stat.textHits > maxTextHits && stat.textHits > 0) {
                maxTextHits = stat.textHits;
                nameCol = stat.index;
            }
        });
        
        if (nameCol === null && maxCols === 2) {
            nameCol = eanCol === 0 ? 1 : 0;
        }
        
        let hasHeader = false;
        if (rows.length > 1) {
            const firstEanVal = String(rows[0][eanCol] || '').trim();
            if (firstEanVal && !/^\d{8,13}$/.test(firstEanVal)) {
                hasHeader = true;
            }
            if (nameCol !== null) {
                const firstNameVal = String(rows[0][nameCol] || '').trim().toLowerCase();
                const keywords = ['nome', 'prodotto', 'articolo', 'descrizione', 'title', 'name', 'product', 'item', 'code', 'ean', 'barcode'];
                if (keywords.some(kw => firstNameVal.includes(kw))) {
                    hasHeader = true;
                }
            }
        }
        
        return { eanCol, nameCol, hasHeader };
    }

    function detectColumn(rows) {
        const analysis = analyzeColumns(rows);
        let maxCols = 0;
        rows.forEach(r => { if (r.length > maxCols) maxCols = r.length; });
        
        let totalEanHits = 0;
        rows.slice(0, 15).forEach(r => {
            if (r[analysis.eanCol] && /^\d{8,13}$/.test(String(r[analysis.eanCol]).trim())) {
                totalEanHits++;
            }
        });

        if (totalEanHits >= 1) {
            runBatch(rows);
        } else {
            const headers = rows[0];
            const cols = [];
            for (let i = 0; i < maxCols; i++) {
                cols.push({
                    i,
                    name: (headers && headers[i]) ? String(headers[i]) : `${window.i18n.t('custom_col_prefix')} ${i + 1}`
                });
            }
            openColumnPicker(rows, cols);
        }
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

    function toPascalCase(str) {
        if (!str) return '';
        // Sostituiamo trattini, underscore e punteggiature con spazi per separare le parole
        const words = str.replace(/[\-_]/g, ' ').split(/\s+/);
        return words
            .map(word => {
                if (!word) return '';
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    function cleanFilename(name) {
        // Rimuoviamo caratteri non consentiti e punteggiature fastidiose prima di applicare il PascalCase
        let clean = name.replace(/[\/\\:\*\?"<>\|]/g, '');
        // Applica il PascalCase
        clean = toPascalCase(clean);
        // Assicura che non contenga nessuno spazio o carattere strano
        clean = clean.replace(/[^a-zA-Z0-9]/g, '');
        return clean;
    }

    function refreshBatchTable() {
        if (!el.resultsBody || !batchData.length) return;
        el.resultsBody.innerHTML = '';
        const fragment = document.createDocumentFragment();
        batchData.forEach((item, idx) => {
            fragment.appendChild(createRow(item, idx));
        });
        el.resultsBody.appendChild(fragment);
    }

    function runBatch(data, forceEanColIdx = null) {
        batchData = [];
        if (el.resultsBody) el.resultsBody.innerHTML = '';
        if (el.emptyState) el.emptyState.style.display = 'none';

        // Rilevamento automatico intelligente di colonne e intestazioni
        let eanColIdx = 0;
        let nameColIdx = null;
        let hasHeader = false;

        if (forceEanColIdx !== null) {
            eanColIdx = forceEanColIdx;
            let maxCols = 0;
            data.forEach(row => { if (row.length > maxCols) maxCols = row.length; });
            if (maxCols === 2) {
                nameColIdx = eanColIdx === 0 ? 1 : 0;
            }
            if (data.length > 1) {
                const firstVal = String(data[0][eanColIdx] || '').trim();
                if (firstVal && !/^\d{8,13}$/.test(firstVal)) {
                    hasHeader = true;
                }
            }
        } else {
            const analysis = analyzeColumns(data);
            eanColIdx = analysis.eanCol;
            nameColIdx = analysis.nameCol;
            hasHeader = analysis.hasHeader;
        }

        const rows = hasHeader ? data.slice(1) : data.slice(0);
        const fragment = document.createDocumentFragment();

        rows.forEach((row, idx) => {
            const raw = String(row[eanColIdx] || '').trim();
            if (!raw) return;
            const v = BarcodeService.validateEAN(raw);
            v.original = raw;
            v.status = v.isValid ? 'valid' : 'error';
            
            // Determina il nome del file personalizzato: NomeProdotto_EAN
            v.customFilename = null;
            if (nameColIdx !== null && row[nameColIdx] !== undefined && row[nameColIdx] !== null) {
                let name = String(row[nameColIdx]).trim();
                name = cleanFilename(name);
                if (name) {
                    v.customFilename = `${name}_${v.code}`;
                }
            }

            batchData.push(v);
            fragment.appendChild(createRow(v, batchData.length - 1));
        });

        if (el.resultsBody) el.resultsBody.appendChild(fragment);

        const valid = batchData.filter(x => x.isValid).length;
        if (el.countValid) el.countValid.textContent = window.i18n.t('valid_chip', { count: valid });
        if (el.countInvalid) el.countInvalid.textContent = window.i18n.t('error_chip', { count: batchData.length - valid });
        if (el.batchSummary) el.batchSummary.style.display = batchData.length ? 'flex' : 'none';
        if (el.downloadAllBtn) el.downloadAllBtn.disabled = valid === 0;
        if (el.downloadBtn) el.downloadBtn.disabled = valid === 0;

        const firstValid = batchData.find(x => x.isValid);
        if (firstValid) showPreview(firstValid);
    }

    function createRow(item, idx) {
        const tr = document.createElement('tr');
        tr.dataset.idx = idx;
        const statusHTML = item.isValid ? `<span class="badge badge--ok">${window.i18n.t('status_valid')}</span>` : `<span class="badge badge--err">${window.i18n.t('status_invalid')}</span>`;
        
        // Determiniamo il nome file da mostrare o l'errore se non valido
        const format = el.formatSelect ? el.formatSelect.value : 'svg';
        const color = el.colorSelect ? el.colorSelect.value : 'k';
        const ext = format === 'pdf' ? 'pdf' : (format === 'eps' ? 'eps' : (format === 'tiff' ? 'tif' : (format === 'jpg' ? 'jpg' : 'svg')));
        
        let displayFilename = '—';
        if (item.isValid) {
            let base = item.customFilename || item.code;
            displayFilename = `${base}.${ext}`;
            if (color === 'cmyk' || color === 'grayscale') {
                displayFilename = displayFilename.replace(`.${ext}`, `_${color}.${ext}`);
            }
        } else {
            displayFilename = `<span style="color: var(--c-err); font-weight: 500;">${item.error}</span>`;
        }

        const actionBtn = item.isValid ? `<button class="btn-row-dl" data-idx="${idx}">⬇</button>` : '';

        tr.innerHTML = `
            <td><code>${item.original}</code></td>
            <td>${item.type || '—'}</td>
            <td>${statusHTML}</td>
            <td><small>${displayFilename}</small></td>
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
                        params: params,
                        customFilename: item.customFilename
                    });
                    return;
                }
            }

            // Fallback per browser o formati standard (PNG/JPG RGB)
            if (['tiff', 'eps', 'pdf'].includes(format) && (!window.ExportBridge || !window.ExportBridge.isElectron)) {
                alert(window.i18n.t('desktop_only_formats'));
                return;
            }

            const blob = await BarcodeService.exportToBlob(item.code, item.type, params, format);
            const baseName = item.customFilename || item.code;
            saveAs(blob, `${baseName}.${format}`);
        } catch (err) {
            console.error("Download failed:", err);
            alert(window.i18n.t('export_error_detail', { error: err.message }));
        }
    }

    async function downloadBatch() {
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
                    if (el.downloadBtn) el.downloadBtn.disabled = true;
                    
                    // Prepariamo i dati per il batch nativo
                    const batchItems = items.map(item => {
                        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        const opts = BarcodeService.getBarcodeOptions(item.type, { ...params, code: item.code }, 'svg');
                        BarcodeService.generate(tempSvg, item.code, opts);
                        const svgString = BarcodeService.serializeSVG(tempSvg, { ...params, lineColor: opts.lineColor });
                        
                        const ext = (nativeFormat === 'tiff-cmyk' || nativeFormat === 'tiff-gray') ? 'tif' : (nativeFormat === 'pdf-x' ? 'pdf' : format);
                        const baseName = item.customFilename || item.code;
                        return {
                            svg: svgString,
                            filename: `${baseName}.${ext}`
                        };
                    });

                    await window.ExportBridge.exportBatch(nativeFormat, batchItems, params);
                    if (el.downloadBtn) el.downloadBtn.disabled = false;
                    return;
                }
            }

            // Fallback per browser o formati standard (PNG/JPG RGB)
            if (['tiff', 'eps', 'pdf'].includes(format) && (!window.ExportBridge || !window.ExportBridge.isElectron)) {
                alert(window.i18n.t('desktop_only_formats'));
                return;
            }

            if (el.downloadBtn) el.downloadBtn.disabled = true;
            const zip = new JSZip();

            for (const item of items) {
                const blob = await BarcodeService.exportToBlob(item.code, item.type, params, format);
                const baseName = item.customFilename || item.code;
                zip.file(`${baseName}.${format}`, blob);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `ean_batch_${new Date().getTime()}.zip`);
        } catch (err) {
            console.error("Batch download failed:", err);
            alert(window.i18n.t('export_batch_error_detail', { error: err.message }));
        } finally {
            if (el.downloadBtn) el.downloadBtn.disabled = false;
        }
    }

    if (el.downloadBtn) {
        el.downloadBtn.addEventListener('click', () => {
            const validItems = batchData.filter(x => x.isValid);
            if (validItems.length > 0) {
                downloadBatch();
            } else if (currentBarcode && currentBarcode.isValid) {
                downloadSingle(currentBarcode);
            }
        });
    }

    const triggerPreviewUpdate = () => {
        if (currentBarcode) showPreview(currentBarcode);
        else {
            validateCompliance();
            validateAbbondanza();
            updateColorInfo();
        }
    };

    if (el.colorFormatSelect) {
        el.colorFormatSelect.addEventListener('change', () => {
            const format = el.colorFormatSelect.value;
            document.querySelectorAll('.color-input-group').forEach(grp => {
                grp.style.display = 'none';
            });
            const activeGrp = $('color-input-grp-' + format.toLowerCase());
            if (activeGrp) activeGrp.style.display = 'block';
            
            if (el.colorBars) syncColors(el.colorBars.value);
        });
    }

    if (el.colorInputHex) {
        el.colorInputHex.addEventListener('input', () => {
            let val = el.colorInputHex.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                syncColors(val);
                triggerPreviewUpdate();
            }
        });
    }

    const handleRgbChange = () => {
        const r = Math.max(0, Math.min(255, parseInt(el.colorInputR.value) || 0));
        const g = Math.max(0, Math.min(255, parseInt(el.colorInputG.value) || 0));
        const b = Math.max(0, Math.min(255, parseInt(el.colorInputB.value) || 0));
        const hex = BarcodeService.rgbToHex(r, g, b);
        syncColors(hex);
        triggerPreviewUpdate();
    };
    [el.colorInputR, el.colorInputG, el.colorInputB].forEach(input => {
        if (input) {
            input.addEventListener('input', handleRgbChange);
            input.addEventListener('change', handleRgbChange);
        }
    });

    const handleHslChange = () => {
        const h = Math.max(0, Math.min(360, parseInt(el.colorInputH.value) || 0));
        const s = Math.max(0, Math.min(100, parseInt(el.colorInputS.value) || 0));
        const l = Math.max(0, Math.min(100, parseInt(el.colorInputL.value) || 0));
        const rgb = BarcodeService.hslToRgb(h, s, l);
        const hex = BarcodeService.rgbToHex(rgb.r, rgb.g, rgb.b);
        syncColors(hex);
        triggerPreviewUpdate();
    };
    [el.colorInputH, el.colorInputS, el.colorInputL].forEach(input => {
        if (input) {
            input.addEventListener('input', handleHslChange);
            input.addEventListener('change', handleHslChange);
        }
    });

    const handleCmykChange = () => {
        const c = Math.max(0, Math.min(100, parseFloat(el.cmykC.value) || 0));
        const m = Math.max(0, Math.min(100, parseFloat(el.cmykM.value) || 0));
        const y = Math.max(0, Math.min(100, parseFloat(el.cmykY.value) || 0));
        const k = Math.max(0, Math.min(100, parseFloat(el.cmykK.value) || 0));
        const rgb = BarcodeService.cmykToRgb(c, m, y, k);
        const hex = BarcodeService.rgbToHex(rgb.r, rgb.g, rgb.b);
        syncColors(hex);
        triggerPreviewUpdate();
    };
    [el.cmykC, el.cmykM, el.cmykY, el.cmykK].forEach(input => {
        if (input) {
            input.addEventListener('input', handleCmykChange);
            input.addEventListener('change', handleCmykChange);
        }
    });

    if (el.forceK100Toggle) {
        el.forceK100Toggle.addEventListener('change', () => {
            const active = el.forceK100Toggle.checked;
            if (el.colorCustomizerContainer) {
                if (active) {
                    el.colorCustomizerContainer.style.opacity = '0.4';
                    el.colorCustomizerContainer.style.pointerEvents = 'none';
                } else {
                    el.colorCustomizerContainer.style.opacity = '1';
                    el.colorCustomizerContainer.style.pointerEvents = 'auto';
                }
            }
            triggerPreviewUpdate();
        });
        
        // Esegui trigger all'avvio per applicare lo stato iniziale (deselezionato)
        el.forceK100Toggle.checked = false;
        el.forceK100Toggle.dispatchEvent(new Event('change'));
    }

    function getExportParams() {
        const includeQZ = getC('includeQZToggle', true);
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
            bars: getC('forceK100Toggle') ? '#000000' : getV('colorBars', '#000000'),
            bg: getV('colorBg', '#ffffff'),
            transparent: getC('bgTransToggle'),
            hriFont: getV('hriFont', 'OCR-B'),
            hriSize: parseFloat(getV('hriSize', '12')) || 12,
            hriPos: getV('hriPos', 'bottom'),
            hriFormat: getV('hriPos') === 'incorporated' ? false : getC('hriFormatToggle', true),
            textToPath: getC('textToPathToggle', true),
            forceK100: getC('forceK100Toggle'),
            format: getV('formatSelect', 'png')
        };
    }


    // Init
    if (el.hriPos) el.hriPos.dispatchEvent(new Event('change'));
    if (el.bgTransToggle) el.bgTransToggle.dispatchEvent(new Event('change'));
    updateHriState();
    
    if (el.resetAllBtn) {
        el.resetAllBtn.onclick = () => {
            if (confirm(window.i18n.t('reset_confirm'))) {
                fullReset();
            }
        };
    }

    // --- About Modal and Feedback Logic ---
    const aboutModal = $('about-modal');
    const aboutTriggerBtn = $('about-trigger-btn');
    const closeAboutBtn = $('close-about-btn');
    const sendFeedbackBtn = $('send-feedback-btn');

    const openAbout = () => {
        if (aboutModal) {
            aboutModal.setAttribute('aria-hidden', 'false');
            
            // Set dynamic version and platform details
            if (isElectron) {
                window.electronAPI.getVersion().then(version => {
                    const elVerVal = $('about-version-val');
                    if (elVerVal) elVerVal.textContent = version;
                    const elVersion = $('app-version');
                    if (elVersion) elVersion.textContent = `v${version}`;
                });
                
                const platform = window.electronAPI.getPlatform();
                const elPlatform = $('about-platform-val');
                if (elPlatform) elPlatform.textContent = platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux';
            } else {
                const elVerVal = $('about-version-val');
                if (elVerVal) elVerVal.textContent = '1.0.0';
                const elPlatform = $('about-platform-val');
                if (elPlatform) elPlatform.textContent = 'Browser';
            }
        }
    };

    const closeAbout = () => {
        if (aboutModal) aboutModal.setAttribute('aria-hidden', 'true');
    };

    if (aboutTriggerBtn) aboutTriggerBtn.onclick = openAbout;
    if (closeAboutBtn) closeAboutBtn.onclick = closeAbout;

    // Listen to IPC event from main process native menu
    if (isElectron) {
        window.electronAPI.onOpenAbout(() => {
            openAbout();
        });
        
        // Auto-fetch version for the sidebar header logo too
        window.electronAPI.getVersion().then(version => {
            const elVersion = $('app-version');
            if (elVersion) elVersion.textContent = `v${version}`;
        });
    }

    if (sendFeedbackBtn) {
        sendFeedbackBtn.onclick = () => {
            const appName = "Daemon EAN Generator";
            const version = $('about-version-val') ? $('about-version-val').textContent : "1.0.0";
            const platform = isElectron ? window.electronAPI.getPlatform() : "win32";
            const os = platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Browser';
            
            const recipient = "manuel.delbono@gmail.com"; // Customized based on author name
            const bodyTemplate = window.i18n.t('feedback_mail_body', { version: version, os: os });
            const subject = `${window.i18n.t('feedback_btn')} - ${appName} v${version}`;
            
            const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
            
            if (isElectron) {
                window.electronAPI.openExternal(mailtoUrl);
            } else {
                window.open(mailtoUrl, '_blank');
            }
        };
    }

    // --- Interactive Tutorial / Quick Guide Modal Logic ───
    const tutorialModal = $('tutorial-modal');
    const tutorialTriggerBtn = $('tutorial-trigger-btn');
    const tutorialPrevBtn = $('tutorial-prev-btn');
    const tutorialNextBtn = $('tutorial-next-btn');
    const tutorialDots = document.querySelectorAll('.tutorial-dot');
    const tutorialSteps = document.querySelectorAll('.tutorial-step');
    let activeStep = 0;

    const showStep = (index) => {
        activeStep = index;
        tutorialSteps.forEach((step, idx) => {
            step.style.display = idx === index ? 'block' : 'none';
        });
        
        tutorialDots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Toggle back button disable state
        if (tutorialPrevBtn) {
            tutorialPrevBtn.disabled = index === 0;
        }

        // Handle next button vs finish button states
        if (tutorialNextBtn) {
            if (index === tutorialSteps.length - 1) {
                tutorialNextBtn.setAttribute('data-i18n', 'tut_finish');
                tutorialNextBtn.textContent = window.i18n.t('tut_finish');
            } else {
                tutorialNextBtn.setAttribute('data-i18n', 'tut_next');
                tutorialNextBtn.textContent = window.i18n.t('tut_next');
            }
        }
    };

    const openTutorial = () => {
        if (tutorialModal) {
            tutorialModal.setAttribute('aria-hidden', 'false');
            showStep(0);
        }
    };

    const closeTutorial = () => {
        if (tutorialModal) {
            tutorialModal.setAttribute('aria-hidden', 'true');
        }
    };

    if (tutorialTriggerBtn) {
        tutorialTriggerBtn.onclick = openTutorial;
    }

    if (tutorialPrevBtn) {
        tutorialPrevBtn.onclick = () => {
            if (activeStep > 0) {
                showStep(activeStep - 1);
            }
        };
    }

    if (tutorialNextBtn) {
        tutorialNextBtn.onclick = () => {
            if (activeStep < tutorialSteps.length - 1) {
                showStep(activeStep + 1);
            } else {
                closeTutorial();
            }
        };
    }

    tutorialDots.forEach((dot) => {
        dot.onclick = () => {
            const stepIndex = parseInt(dot.getAttribute('data-step')) || 0;
            showStep(stepIndex);
        };
    });

    if (tutorialModal) {
        // Close when clicking outside of the modal dialog
        tutorialModal.onclick = (e) => {
            if (e.target === tutorialModal) {
                closeTutorial();
            }
        };
    }

    window.addEventListener('languageChanged', () => {
        if (currentBarcode) showPreview(currentBarcode);
        else resetPreview();
        
        if (batchData && batchData.length > 0) {
            refreshBatchTable();
            const valid = batchData.filter(x => x.isValid).length;
            if (el.countValid) el.countValid.textContent = window.i18n.t('valid_chip', { count: valid });
            if (el.countInvalid) el.countInvalid.textContent = window.i18n.t('error_chip', { count: batchData.length - valid });
        }
        
        validateCompliance();
        validateAbbondanza();
        updateColorInfo();

        // Dynamically refresh active tutorial step text if it's currently open
        if (tutorialModal && tutorialModal.getAttribute('aria-hidden') === 'false') {
            showStep(activeStep);
        }
    });

    resetPreview();
});
