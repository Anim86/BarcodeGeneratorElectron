/**
 * EAN Demon Generator — i18n Localization System
 * Handles translation of HTML elements and exposes JS translation utilities.
 */

(function () {
    const translations = {
        it: {
            // App Identity
            "app_title": "EAN Deamon Generator — Generatore Codici a Barre",
            "app_name": "EAN Deamon Generator",
            "app_description": "Strumento professionale per la generazione di codici a barre EAN-13 ed EAN-8 in alta risoluzione, ottimizzato per il mondo della prestampa e del packaging.",
            "brand_subtitle": "Client-side · Nessun dato inviato",
            "author_credit": "Ideazione e realizzazione di",

            // Presets
            "presets_legend": "I Miei Preset",
            "preset_placeholder": "Nome preset...",
            "save_btn": "Salva",
            "preset_name_required": "[ERR-SYS-001] Inserisci un nome per il preset",
            "preset_delete_confirm": "Sei sicuro di voler eliminare il preset \"{name}\"?",

            // Export Config
            "export_config_legend": "Configurazione Export",
            "file_format": "Formato File",
            "color_method": "Metodo Colore",
            "format_svg": "SVG (Vettoriale standard)",
            "format_png": "PNG (Immagine Raster)",
            "format_jpg": "JPG (Immagine Raster)",
            "format_tiff": "TIFF (Professional Raster)",
            "format_eps": "EPS (Vettoriale CMYK)",
            "format_pdf": "PDF/X-1a (Prestampista)",
            "cmyk_warning": "<strong>[WRN-PRE-002] Nota:</strong> I formati PNG e SVG non supportano nativamente lo spazio colore CMYK. Verranno generati in RGB di default.",
            "color_cmyk": "CMYK (Intento Prestampa)",
            "color_rgb": "RGB (Digitale)",
            "color_gray": "Scala di Grigi",

            // Colors
            "colors_legend": "Colori e Personalizzazione",
            "bar_color": "Colore Barre",
            "bg_color": "Colore Sfondo",
            "bg_transparent": "Sfondo trasparente",
            "bg_transparent_hint": "(solo SVG/PNG)",
            "force_k100": "Forza Nero K100",
            "force_k100_hint": "(Scala di Grigio)",
            "contrast_warning": "[WRN-PRE-001] Contrasto scarso ({ratio}:1). Minimo 5:1 raccomandato.",

            // Dimensions
            "dimensions_legend": "Dimensioni e Risoluzione",
            "unit_mm": "Unità: mm",
            "unit_px": "Unità: px",
            "width": "Larghezza",
            "height": "Altezza",
            "gs1_compliant": "Dimensioni conformi GS1",
            "gs1_non_compliant": "[WRN-PRE-003] Dimensioni fuori standard",
            "resolution": "Risoluzione",
            "raster_only_hint": "(solo raster)",

            // Quiet Zone
            "qz_legend": "Area di Abbondanza",
            "qz_horizontal": "Abbondanza<br>Orizzontale",
            "qz_vertical": "Abbondanza<br>Verticale",
            "qz_include": "Includi abbondanza nell'esportazione",
            "qz_warning": "[WRN-PRE-004] Abbondanza raccomandata GS1: min. {min}mm",

            // Text & HRI
            "text_hri_legend": "Testo e HRI",
            "show_hri": "Mostra testo leggibile (HRI)",
            "text_to_path": "Testi in tracciato",
            "text_to_path_hint": "(solo PDF/EPS)",
            "font_label": "Carattere",
            "font_ocrb": "OCR-B (Standard)",
            "font_custom": "Font Personale...",
            "font_size": "Dimensione",
            "font_position": "Posizione",
            "pos_bottom": "Sotto le barre",
            "pos_top": "Sopra le barre",
            "pos_incorporated": "Incorporato",
            "gs1_format": "Formato standard GS1 (1 · 6 · 6)",
            "gs1_format_desc": "Separa il codice come da standard GS1: prima cifra, sei cifre sinistra, sei cifre destra. Se disattivato, il codice appare come stringa continua.",
            "gs1_active": "Attivo:",
            "gs1_inactive": "Non attivo:",

            // Toolbar
            "input_label": "Inserimento Codici (EAN)",
            "input_placeholder": "Inserisci i codici EAN (scrivili uno per riga)",
            "import_btn": "Importa file",
            "valid_chip": "{count} validi",
            "error_chip": "{count} errori",

            // Preview Panel
            "preview_title": "Anteprima",
            "preview_waiting": "In attesa",
            "preview_rendering_error": "Errore Rendering",
            "preview_error": "Errore",
            "preview_empty": "Inserisci un codice EAN o importa un file",
            "export_barcode_btn": "Esporta Barcode",
            "reset_btn": "Reset",
            "reset_confirm": "Vuoi resettare tutti i codici inseriti? (Le impostazioni tecniche rimarranno invariate)",

            // Batch Panel
            "batch_title": "Elaborazione Batch",
            "download_zip_btn": "Scarica Archivio ZIP",
            "th_ean": "Codice EAN",
            "th_type": "Tipo",
            "th_status": "Stato",
            "th_filename": "Nome File",
            "empty_batch": "Nessun dato importato",
            "empty_batch_hint": "Carica un file CSV o XLSX per elaborare più codici.",
            "custom_filename_title": "💡 Nomi dei file personalizzati (EAN + Nome):",
            "custom_filename_desc": "Se il file contiene <strong>due colonne</strong> (una con il <em>Nome Prodotto</em> e una con il <em>Codice EAN</em>, in qualsiasi ordine, con o senza intestazioni), i file esportati verranno nominati automaticamente come:",

            // Modal Column Picker
            "modal_title": "Seleziona colonna EAN",
            "modal_desc": "Il file contiene più colonne. Indica quale contiene i codici a barre.",
            "modal_cancel": "Annulla",

            // JS Logic & Alerts
            "desktop_only_formats": "[ERR-SYS-002] I formati TIFF, EPS e PDF sono disponibili solo nella versione desktop di EAN Demon Generator.",
            "export_success": "Esportazione completata con successo in:\n{path}\n\nTotale file: {count}",
            "export_partial_errors": "Esportazione batch completata con alcuni errori.",
            "system_error": "[ERR-SYS-003] Errore di sistema: {error}",
            "batch_system_error": "Errore di sistema nel batch: {error}",
            "export_error_detail": "[ERR-SYS-003] Errore durante l'esportazione: {error}",
            "export_batch_error_detail": "[ERR-SYS-003] Errore durante l'esportazione batch: {error}",
            "custom_col_prefix": "Colonna",
            "status_valid": "Valido",
            "status_invalid": "Errore",

            // About & Feedback
            "theme_toggle": "Cambia tema (Chiaro/Scuro)",
            "about_btn": "Informazioni su EAN Demon Generator",
            "about_title": "Informazioni su EAN Demon Generator",
            "about_version": "Versione",
            "about_platform": "Piattaforma",
            "about_developer": "Sviluppato da",
            "about_copyright": "© 2026 EAN Demon Generator. Tutti i diritti riservati.",
            "about_close": "Chiudi",
            "feedback_btn": "Invia Feedback",
            "feedback_mail_body": "Ciao Manuel,\n\n[Scrivi qui il tuo feedback...]\n\n---\nApp: EAN Demon Generator\nVersione: {version}\nOS: {os}\n",

            // Tutorial / Quick Guide
            "tutorial_btn": "Guida Rapida all'Uso",
            "tutorial_title": "Guida Rapida",
            "tutorial_subtitle": "Scopri come utilizzare al meglio EAN Demon Generator",
            "tut_back": "Precedente",
            "tut_next": "Avanti",
            "tut_finish": "Ho Capito!",
            "tut_step0_title": "1. Inserimento Codici",
            "tut_step0_desc": "Nel pannello di sinistra, inserisci i tuoi codici EAN manuali scrivendoli uno per riga. L'applicazione convaliderà all'istante la validità sintattica del codice e calcolerà la cifra di controllo corretta se mancante.",
            "tut_step1_title": "2. Configurazione e Anteprima",
            "tut_step1_desc": "Al centro viene mostrata l'anteprima in tempo reale. Puoi regolare dimensioni, margini di abbondanza (consigliata conformità GS1), colori (RGB, CMYK, grigi o nero K100%) e le opzioni del testo HRI, con avviso per contrasti insufficienti.",
            "tut_step2_title": "3. Importazione ed Elaborazione Batch",
            "tut_step2_desc": "Nel pannello di destra, carica file Excel (XLSX) o CSV. Se il file include una colonna coi nomi dei prodotti ed una coi codici EAN, l'app nominerà i file in modo dinamico ed intelligente (es. 'NomeProdotto_EAN.png') per esportarli tutti in un clic!"
        },
        en: {
            // App Identity
            "app_title": "EAN Deamon Generator — Barcode Generator",
            "app_name": "EAN Deamon Generator",
            "app_description": "Professional tool for high-resolution EAN-13 and EAN-8 barcode generation, optimized for prepress and packaging workflows.",
            "brand_subtitle": "Client-side · No data sent",
            "author_credit": "Designed and developed by",

            // Presets
            "presets_legend": "My Presets",
            "preset_placeholder": "Preset name...",
            "save_btn": "Save",
            "preset_name_required": "[ERR-SYS-001] Please enter a name for the preset",
            "preset_delete_confirm": "Are you sure you want to delete the preset \"{name}\"?",

            // Export Config
            "export_config_legend": "Export Configuration",
            "file_format": "File Format",
            "color_method": "Color Method",
            "format_svg": "SVG (Standard Vector)",
            "format_png": "PNG (Raster Image)",
            "format_jpg": "JPG (Raster Image)",
            "format_tiff": "TIFF (Professional Raster)",
            "format_eps": "EPS (CMYK Vector)",
            "format_pdf": "PDF/X-1a (Prepress)",
            "cmyk_warning": "<strong>[WRN-PRE-002] Note:</strong> PNG and SVG formats do not natively support CMYK color space. They will be generated in RGB by default.",
            "color_cmyk": "CMYK (Prepress Intent)",
            "color_rgb": "RGB (Digital)",
            "color_gray": "Grayscale",

            // Colors
            "colors_legend": "Colors & Customization",
            "bar_color": "Bar Color",
            "bg_color": "Background Color",
            "bg_transparent": "Transparent background",
            "bg_transparent_hint": "(SVG/PNG only)",
            "force_k100": "Force K100 Black",
            "force_k100_hint": "(Grayscale)",
            "contrast_warning": "[WRN-PRE-001] Poor contrast ({ratio}:1). Minimum 5:1 recommended.",

            // Dimensions
            "dimensions_legend": "Dimensions & Resolution",
            "unit_mm": "Unit: mm",
            "unit_px": "Unit: px",
            "width": "Width",
            "height": "Height",
            "gs1_compliant": "GS1 compliant dimensions",
            "gs1_non_compliant": "[WRN-PRE-003] Non-standard dimensions",
            "resolution": "Resolution",
            "raster_only_hint": "(raster only)",

            // Quiet Zone
            "qz_legend": "Quiet Zone (Bleed)",
            "qz_horizontal": "Horizontal<br>Quiet Zone",
            "qz_vertical": "Vertical<br>Quiet Zone",
            "qz_include": "Include quiet zone in export",
            "qz_warning": "[WRN-PRE-004] Recommended GS1 quiet zone: min. {min}mm",

            // Text & HRI
            "text_hri_legend": "Text & HRI",
            "show_hri": "Show human readable text (HRI)",
            "text_to_path": "Text to path",
            "text_to_path_hint": "(PDF/EPS only)",
            "font_label": "Font",
            "font_ocrb": "OCR-B (Standard)",
            "font_custom": "Custom Font...",
            "font_size": "Size",
            "font_position": "Position",
            "pos_bottom": "Below bars",
            "pos_top": "Above bars",
            "pos_incorporated": "Incorporated",
            "gs1_format": "GS1 standard format (1 · 6 · 6)",
            "gs1_format_desc": "Separate code according to GS1 standard: first digit, six left digits, six right digits. If disabled, code appears as a continuous string.",
            "gs1_active": "Enabled:",
            "gs1_inactive": "Disabled:",

            // Toolbar
            "input_label": "Enter Codes (EAN)",
            "input_placeholder": "Enter EAN codes (write one per line)",
            "import_btn": "Import file",
            "valid_chip": "{count} valid",
            "error_chip": "{count} errors",

            // Preview Panel
            "preview_title": "Preview",
            "preview_waiting": "Waiting",
            "preview_rendering_error": "Rendering Error",
            "preview_error": "Error",
            "preview_empty": "Enter an EAN code or import a file",
            "export_barcode_btn": "Export Barcode",
            "reset_btn": "Reset",
            "reset_confirm": "Do you want to reset all entered codes? (Technical settings will remain unchanged)",

            // Batch Panel
            "batch_title": "Batch Processing",
            "download_zip_btn": "Download ZIP Archive",
            "th_ean": "EAN Code",
            "th_type": "Type",
            "th_status": "Status",
            "th_filename": "Filename",
            "empty_batch": "No data imported",
            "empty_batch_hint": "Upload a CSV or XLSX file to process multiple codes.",
            "custom_filename_title": "💡 Custom filenames (EAN + Name):",
            "custom_filename_desc": "If the file contains <strong>two columns</strong> (one with the <em>Product Name</em> and one with the <em>EAN Code</em>, in any order, with or without headers), the exported files will be automatically named as:",

            // Modal Column Picker
            "modal_title": "Select EAN Column",
            "modal_desc": "The file contains multiple columns. Select the one containing the barcodes.",
            "modal_cancel": "Cancel",

            // JS Logic & Alerts
            "desktop_only_formats": "[ERR-SYS-002] TIFF, EPS and PDF formats are only available in the desktop version of EAN Demon Generator.",
            "export_success": "Export completed successfully to:\n{path}\n\nTotal files: {count}",
            "export_partial_errors": "Batch export completed with some errors.",
            "system_error": "[ERR-SYS-003] System error: {error}",
            "batch_system_error": "System error in batch: {error}",
            "export_error_detail": "[ERR-SYS-003] Error during export: {error}",
            "export_batch_error_detail": "[ERR-SYS-003] Error during batch export: {error}",
            "custom_col_prefix": "Column",
            "status_valid": "Valid",
            "status_invalid": "Error",

            // About & Feedback
            "theme_toggle": "Switch theme (Light/Dark)",
            "about_btn": "About EAN Demon Generator",
            "about_title": "About EAN Demon Generator",
            "about_version": "Version",
            "about_platform": "Platform",
            "about_developer": "Developed by",
            "about_copyright": "© 2026 EAN Demon Generator. All rights reserved.",
            "about_close": "Close",
            "feedback_btn": "Send Feedback",
            "feedback_mail_body": "Hi Manuel,\n\n[Write your feedback here...]\n\n---\nApp: EAN Demon Generator\nVersion: {version}\nOS: {os}\n",

            // Tutorial / Quick Guide
            "tutorial_btn": "Quick User Guide",
            "tutorial_title": "Quick Guide",
            "tutorial_subtitle": "Discover how to get the best out of EAN Demon Generator",
            "tut_back": "Back",
            "tut_next": "Next",
            "tut_finish": "Got It!",
            "tut_step0_title": "1. Codes Input",
            "tut_step0_desc": "In the left panel, enter your EAN codes manually by writing them one per line. The application will instantly validate the syntactic validity of the code and calculate the correct check digit if missing.",
            "tut_step1_title": "2. Settings and Preview",
            "tut_step1_desc": "The live preview is shown in the center. You can adjust barcode dimensions, quiet zones (GS1-compliant bleed limits), colors (RGB, CMYK, grayscale, or forced K100% black), and HRI text options with instant contrast warnings.",
            "tut_step2_title": "3. Excel/CSV Import & Batch Export",
            "tut_step2_desc": "In the right panel, upload Excel (XLSX) or CSV files. If the file includes a column with product names and one with EAN codes, the app will name the files dynamically and intelligently (e.g. 'ProductName_EAN.png') for a one-click bulk export!"
        }
    };

    let currentLang = 'en';

    function getPreferredLanguage() {
        // 1. Storage
        const saved = localStorage.getItem('ean_lang');
        if (saved) return saved;

        // 2. Browser Navigator Language (fully synchronous and works in Electron as well)
        const navLang = navigator.language || navigator.userLanguage;
        if (navLang && navLang.toLowerCase().startsWith('it')) {
            return 'it';
        }

        return 'en';
    }

    function translateDOM() {
        // Translate innerHTML/textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = t(key);
            if (translation !== key) {
                // If it contains tags (e.g. <small> or <strong>), set as HTML, else text
                if (translation.includes('<') && translation.includes('>')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = t(key);
            if (translation !== key) {
                el.setAttribute('placeholder', translation);
            }
        });

        // Translate titles / tooltips
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = t(key);
            if (translation !== key) {
                el.setAttribute('title', translation);
            }
        });

        // Update document title
        document.title = t('app_title');
        
        // Notify page elements that language has updated (in case they need to re-render preview)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: currentLang }));
    }

    function t(key, vars = {}) {
        const dict = translations[currentLang] || translations['en'];
        let text = dict[key] || key;

        // Replace placeholders like {name} or {count}
        Object.keys(vars).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
        });

        return text;
    }

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        localStorage.setItem('ean_lang', lang);
        document.documentElement.setAttribute('lang', lang);
        
        // Apply class to body for custom layout/selectors styling
        document.body.classList.remove('lang-it', 'lang-en');
        document.body.classList.add(`lang-${lang}`);
        
        translateDOM();
        renderLanguageSwitcher();
    }

    function renderLanguageSwitcher() {
        const container = document.getElementById('language-switcher-container');
        if (!container) return;
        
        const tooltipText = currentLang === 'it' ? 'Cambia lingua (Inglese)' : 'Switch language (Italian)';
        
        container.innerHTML = `
            <button id="lang-toggle-btn" class="btn-icon" title="${tooltipText}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            </button>
        `;
        
        const btn = document.getElementById('lang-toggle-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const nextLang = currentLang === 'it' ? 'en' : 'it';
                window.i18n.setLanguage(nextLang);
            });
        }
    }

    // Expose global i18n object
    window.i18n = {
        t: t,
        setLanguage: setLanguage,
        getLanguage: () => currentLang,
        init: () => {
            const preferred = getPreferredLanguage();
            setLanguage(preferred);

            // Optional async update from Electron's system locale, if not already configured in localStorage
            if (!localStorage.getItem('ean_lang') && window.electronAPI && typeof window.electronAPI.getLocale === 'function') {
                window.electronAPI.getLocale().then(electronLocale => {
                    if (electronLocale && typeof electronLocale === 'string') {
                        const startsWithIt = electronLocale.toLowerCase().startsWith('it');
                        if (startsWithIt && window.i18n.getLanguage() !== 'it') {
                            window.i18n.setLanguage('it');
                        } else if (!startsWithIt && window.i18n.getLanguage() !== 'en') {
                            window.i18n.setLanguage('en');
                        }
                    }
                }).catch(err => {
                    console.error("Failed to get electron locale asynchronously:", err);
                });
            }
        }
    };

    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.init();
    });
})();
