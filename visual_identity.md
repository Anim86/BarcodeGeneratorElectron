# Visual Identity & Design System
**Progetto**: Daemon EAN Generator
**Estetica**: Strumento tecnico per prestampa e designer. Nessun effetto decorativo gratuito. Precisione e pulizia.

Questo documento definisce le regole di utilizzo e i token grafici per l'interfaccia utente.

---

## 1. Tipografia

### Font Principale (Interfaccia)
* **Famiglia**: `'Inter', -apple-system, 'Segoe UI', sans-serif`
* **Utilizzo**: Testo generale, bottoni, etichette, titoli.
* **Pesi utilizzati**: 400 (Regular), 500 (Medium), 600 (SemiBold).
* **Dimensione base (Body)**: 13px con line-height 1.5.

### Font Monospace (Codice e Dati)
* **Famiglia**: `'JetBrains Mono', 'Menlo', 'Consolas', monospace`
* **Utilizzo**: Visualizzazione codici EAN, valori numerici (HEX, RGB, CMYK, Dimensioni), log di sistema.
* **Pesi utilizzati**: 400 (Regular), 500 (Medium).

---

## 2. Palette Colori (Tokens)

L'applicazione supporta nativamente due temi: **Light Mode** e **Dark Mode**. Si raccomanda di utilizzare sempre le variabili (tokens) invece dei valori HEX diretti per garantire la compatibilità tra i temi.

### Colori di Base (Sfondi e Superfici)
| Variabile CSS | Light Mode | Dark Mode | Utilizzo |
| :--- | :--- | :--- | :--- |
| `--c-bg` | `#f3f4f6` | `#111318` | Sfondo principale dell'applicazione |
| `--c-surface` | `#ffffff` | `#1a1d24` | Sfondo di pannelli, sidebar, modali e bottoni di default |
| `--c-surface-2` | `#f9fafb` | `#21242c` | Sfondo secondario (aree preview, input read-only) |

### Testi
| Variabile CSS | Light Mode | Dark Mode | Utilizzo |
| :--- | :--- | :--- | :--- |
| `--c-text` | `#1a1d23` | `#e4e5e9` | Testo principale, titoli |
| `--c-text-2` | `#5f6673` | `#8b8f9a` | Testo secondario, label, descrizioni brevi |
| `--c-text-3` | `#9ca1ad` | `#5b5f6a` | Placeholder, testi disabilitati, hint, meta-info |

### Bordi e Divisori
| Variabile CSS | Light Mode | Dark Mode | Utilizzo |
| :--- | :--- | :--- | :--- |
| `--c-border` | `#e0e2e7` | `#2d313a` | Bordi di input, bottoni, separatori principali |
| `--c-border-subtle`| `#eceef2` | `#262930` | Bordi leggeri (es. griglie interne, divisori secondari) |

### Colore Primario / Accento (Interazioni)
| Variabile CSS | Light Mode | Dark Mode | Utilizzo |
| :--- | :--- | :--- | :--- |
| `--c-accent` | `#2563eb` | `#5b93f5` | Bottoni primari, link, focus, stati attivi |
| `--c-accent-h` | `#1d4ed8` | `#7aabff` | Stato hover del colore d'accento |
| `--c-accent-bg` | `rgba(37, 99, 235, .07)` | `rgba(91, 147, 245, .1)` | Sfondi leggeri per stati attivi o badge informativi |

### Colori Semantici (Feedback)
| Variabile CSS | Light Mode | Dark Mode | Utilizzo |
| :--- | :--- | :--- | :--- |
| `--c-ok` | `#059669` | `#34d399` | Successo, validazione corretta, icone OK |
| `--c-ok-bg` | `rgba(5, 150, 105, .08)` | `rgba(52, 211, 153, .1)`| Sfondo badge di successo |
| `--c-err` | `#dc2626` | `#f87171` | Errore, azioni distruttive, codici invalidi |
| `--c-err-bg` | `rgba(220, 38, 38, .07)`| `rgba(248, 113, 113, .1)` | Sfondo badge/box di errore |
| `--c-warn` | `#d97706` | `#fbbf24` | Avvisi, warning, stati intermedi |

---

## 3. Layout, Spaziature e Dimensioni

### Variabili Strutturali
* **Sidebar Larghezza**: `330px` (`--sidebar-w`)
* **Altezza Toolbar / Header**: `64px` (Header app), `52px` (`--toolbar-h` per la toolbar interna).
* **Raggio dei bordi (Border Radius)**:
  * `--radius`: `4px` (Bottoni, input, checkbox, card piccole).
  * `--radius-lg`: `6px` (Modali, pannelli più ampi).

### Layout Principale (App Shell)
* Layout Full-Width e Full-Height (`100vh`), design non scorrevole (le singole aree interne scorrono).
* **Header in alto**, **Sidebar a sinistra** e **Workspace principale** diviso in pannelli fluidi.
* Aree di lavoro delineate da bordi solidi a 1px.
* Spaziature (Padding/Margin) utilizzate frequentemente: `4px`, `8px`, `10px`, `12px`, `20px`.

---

## 4. Componenti UI (Regole Generali)

### Bottoni
I bottoni presentano angoli leggermente arrotondati (4px), padding orizzontale comodo e testo centrato.
* **Primario**: Sfondo `--c-accent`, testo bianco.
* **Secondario / Outline**: Sfondo trasparente o superficie base, bordo `1px solid --c-border`, testo `--c-text-2`.
* **Disabilitato**: Opacità ridotta al `40%`, cursore `not-allowed`.

### Input e Select
* **Stile base**: Sfondo in `--c-bg` (per differenziarli dal pannello su cui poggiano in `--c-surface`), bordo `--c-border`.
* **Focus**: Bordo in `--c-accent` con box-shadow esterna leggera in `--c-accent-bg` (`0 0 0 2px`).
* **Testo**: `13px`, font principale.

### Checkbox Custom
Le checkbox di sistema sono nascoste. Viene utilizzato un riquadro personalizzato `16x16px` con bordo `1.5px`. Quando attive, lo sfondo diventa `--c-accent` e mostrano una spunta bianca.

### Anteprima (Preview Area)
La canvas di anteprima ha uno sfondo particolare a graticcio (crosshatch pattern) per simulare l'ambiente di prestampa e distinguere l'area trasparente dell'immagine.

---

## 5. Iconografia
* **Stile**: Lineare (stroke-based), geometrico, spessore della linea variabile tra `1.5px` e `2px` a seconda della dimensione (icone più piccole, `12-14px`, spesso usano `2px` o `2.5px` per leggibilità).
* I formati icona primari sono in SVG inline per un controllo preciso del colore (`currentColor`).

---

## 6. Logo e Brand
* **Nome dell'App**: Daemon EAN Generator
* **Immagine Logo**: `eandemongentraspa.png`
* Il logo è inserito nell'header e nelle sezioni di brand mantenendo un aspetto tecnico ma riconoscibile, solitamente accompagnato dal nome in formato testo in `--c-text-2` e font weight 600.
