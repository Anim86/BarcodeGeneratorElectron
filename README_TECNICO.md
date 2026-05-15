# Project Summary: EAN Pro — Barcode Generator

## Overview
**EAN Pro** is a specialized client-side web application designed for high-precision generation of EAN-13 and EAN-8 barcodes. It is tailored for prepress professionals and designers who require GS1-compliant output in both vector (SVG) and high-resolution raster (PNG/JPG) formats.

## Technical Architecture
- **Core Logic**: Vanilla JavaScript (ES6+).
- **Barcode Engine**: [JsBarcode](https://github.com/lindell/JsBarcode) utilized as the underlying rendering library, wrapped in a custom `BarcodeService` to enforce GS1 standards.
- **Batch Processing**: Integrated with `XLSX.js` for spreadsheet parsing and `JSZip` for bulk export packaging.
- **File Handling**: `FileSaver.js` for client-side downloads.
- **Persistence**: `LocalStorage` for user-defined presets.

## Key Features & Logic
### 1. Barcode Rendering Service (`barcode-service.js`)
- **Dual Rendering**: Supports both SVG and Canvas targets.
- **GS1 Compliance**: 
    - **EAN-13 Segmentation**: Standard 1-6-6 digit split with middle and end guard bars.
    - **Guard Bar Extension**: Implements "Incorporated" HRI positioning where guard bars are longer than data bars (achieved via `flat: false` in JsBarcode).
    - **Quiet Zones**: Automated calculation of recommended minimum quiet zones based on module width.
- **Precision Units**: Real-time conversion between millimeters (mm) and pixels (px) based on user-defined DPI (default 300, up to 1200).

### 2. Human Readable Interpretation (HRI)
- **Positioning**: 
    - `bottom`: Standard text below uniform bars (`flat: true`).
    - `top`: Text above uniform bars with increased visual margin (`textMargin` boost).
    - `incorporated`: Classic GS1 look with text tucked into pockets between extended guard bars (`flat: false`).
- **Typography**: Supports `OCR-B` standard font stack with a fallback to mono fonts. Allows dynamic `@font-face` injection for user-uploaded font files (.ttf/.otf).

### 3. Batch & Data Management
- **Intelligent Column Detection**: Scans imported CSV/XLSX files for valid EAN strings to automatically identify the data column.
- **Validation Engine**: Real-time checksum calculation (Modulo 10) and length validation (8 or 13 digits).

---

## Color Space Management & Browser Limitations

### Technical Constraint: Native CMYK/Grayscale in Browsers
Web browsers operate natively in the **sRGB** color space. Standard HTML5 Canvas API and common web raster formats (PNG, JPG) **do not support native CMYK color profiles or true Grayscale channels.**

### Implementation Workarounds:
1. **CMYK (Intent/Simulation)**:
    - **Logic**: The application performs an RGB → CMYK conversion for reference. 
    - **SVG Export**: When CMYK is selected, the application adds custom metadata and data attributes to the SVG source (`data-color-space`, `data-cmyk`, `CMYK_INTENT` comments) which professional software (Illustrator, CorelDRAW) can interpret, though the visual hex color remains RGB.
    - **Raster Export**: PNG/JPG exports are generated as RGB images with colors calculated to simulate the CMYK intent. A UI warning informs the user that true CMYK requires post-processing or specialized PDF workflows.

2. **Grayscale (Post-Processing)**:
    - **Logic**: For raster formats, the application performs a per-pixel conversion using the relative luminance formula: `Y = 0.2126R + 0.7152G + 0.0722B`.
    - **Process**: The barcode is rendered to an off-screen canvas, the pixel data is extracted via `getImageData`, converted, and re-injected via `putImageData` before blob generation.

---

## Technical Instructions for Future Maintenance
- **Text Margin**: The visual gap for `top` position is calculated as `baseMargin * 1.5` to compensate for font metrics.
- **SVG Serialization**: Uses `XMLSerializer` to ensure clean, standalone XML headers and namespace declarations required for external vector software compatibility.
- **Dynamic CSS**: The UI dynamically hides irrelevant fields (e.g., Background Color picker when Transparency is active; GS1 Formatting when HRI is 'Incorporated').
