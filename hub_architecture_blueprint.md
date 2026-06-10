# Antigraviti Tools Hub: Blueprint di Sviluppo e Architettura

Questo documento definisce le linee guida, l'architettura e la logica di sviluppo per la creazione di nuovi applicativi desktop dell'ecosistema **Antigraviti Tools Hub**. 
In futuro, tutti i tool sviluppati seguendo questo blueprint faranno parte di una suite unificata (simile ad Adobe Creative Cloud), gestita da un'applicazione Hub centrale per l'installazione, l'aggiornamento e il lancio dei singoli programmi.

**Questo documento è destinato agli sviluppatori e agli LLM (Large Language Models) come linea guida fondamentale per l'impostazione di nuove chat e lo sviluppo di nuovi tool.**

---

## 1. Visione dell'Ecosistema (L'Hub)
Ogni nuovo tool deve essere progettato come un modulo **standalone** indipendente, ma predisposto per integrarsi in futuro in un Hub centrale.
- **Isolamento**: Il tool deve funzionare perfettamente da solo, con un proprio processo di installazione.
- **Uniformità Visiva**: Tutti i tool devono condividere la stessa interfaccia utente, seguendo scrupolosamente le linee guida del documento `visual_identity.md`.
- **Comunicazione Futura**: L'architettura deve prevedere la possibilità (tramite CLI arguments o Deep Linking) di essere lanciata e gestita da un processo genitore (l'Hub).

---

## 2. Stack Tecnologico Standard
Per garantire prestazioni, coerenza e portabilità cross-platform (Windows e macOS), lo stack tecnologico approvato è il seguente:
- **Framework Principale**: [Electron](https://www.electronjs.org/)
- **Interfaccia Utente (Frontend)**: Vanilla JavaScript (ES6+), HTML5, CSS3. **Non** utilizzare framework complessi (React, Vue, Angular) a meno che l'applicazione non richieda un routing estremamente complesso o una gestione di stato di livello enterprise. L'approccio Vanilla garantisce leggerezza e avvio rapido.
- **Processi Backend (Node.js)**: Utilizzato nel processo `main` per la manipolazione di file, rendering intensivo (es. tramite `sharp`, `pdfkit`) e interazione con il sistema operativo.
- **Build System**: `electron-builder` per la creazione di installer e versioni portable per Windows (NSIS, AppX) e macOS (DMG, ZIP).

---

## 3. Architettura e Struttura delle Directory
Ogni nuovo progetto deve rispettare la seguente struttura standard delle cartelle:

```text
/
├── assets/             # Asset statici (icone, file icc, immagini) usati dal main process o per la build
├── main/               # Codice del Main Process (Node.js)
│   ├── main.js         # Entry point di Electron (inizializzazione finestra, app lifecycle)
│   └── handlers.js     # Moduli separati per la gestione degli IPC e logiche di sistema complesse
├── preload/            # Codice di Preload per IPC Bridge
│   └── preload.js      # Espone API sicure al frontend (ContextIsolation: true)
├── src/                # Codice del Renderer Process (Frontend)
│   ├── index.html      # Markup dell'interfaccia utente
│   ├── style.css       # Fogli di stile (Vanilla CSS, basato su visual_identity.md)
│   ├── app.js          # Controller principale della UI
│   ├── i18n.js         # Sistema di localizzazione e traduzione testi
│   └── [service].js    # Logica di business separata (es. barcode-service.js, calcoli, validazioni)
└── package.json        # Configurazioni di progetto ed electron-builder
```

---

## 4. Principi di Logica e Sviluppo

### 4.1. Sicurezza e IPC (Inter-Process Communication)
- **Node Integration disabilitata**: Nel renderer process (la cartella `/src`) Node.js non deve **mai** essere accessibile.
- **Context Isolation attiva**: L'opzione `contextIsolation` deve essere sempre su `true`.
- **Preload Bridge**: Tutta la comunicazione tra frontend (`src`) e backend (`main`) deve avvenire tramite un bridge sicuro definito in `preload.js` usando `contextBridge.exposeInMainWorld`. 
  *Esempio: Invece di usare moduli fs nel frontend, il frontend chiama `window.api.saveFile(data)`, e il preload inoltra l'evento via IPC al main process.*

### 4.2. Pattern di Sviluppo (Separation of Concerns)
- **Moduli di Servizio**: Qualsiasi logica complessa, calcolo, o manipolazione dei dati nel frontend deve essere isolata in file di servizio (es. `my-tool-service.js`) e **non** mischiata con le logiche del DOM in `app.js`.
- **Main Process Modulare**: Non inserire tutta la logica di backend in `main.js`. `main.js` deve solo creare le finestre. Eventuali esportazioni, elaborazioni di file pesanti e logiche di OS vanno scorporate in file come `export-handlers.js` o simili.

### 4.3. Localizzazione (i18n)
Tutti i tool devono essere multilingua "by design". 
- L'interfaccia non deve contenere testo hardcoded nell'HTML. 
- Utilizzare un modulo `i18n.js` che carichi le chiavi di traduzione (tipicamente dizionari JSON o oggetti JS) e popoli il DOM dinamicamente (es. tramite attributi `data-i18n`).
- Le lingue base devono essere Italiano (`it`) e Inglese (`en`).

### 4.4. UI/UX e Visual Identity
- **CSS Vanilla**: Usare variabili CSS (Custom Properties) per tutti i colori, i font e le spaziature. Queste variabili **devono** essere allineate al documento `visual_identity.md`.
- **Responsività**: L'interfaccia deve adattarsi a diverse dimensioni della finestra di Electron.
- **Componenti Comuni**: Man mano che l'ecosistema cresce, elementi come bottoni, input, toggle e scrollbar devono comportarsi esattamente allo stesso modo in tutti i tool.

---

## 5. Build e Deploy
L'infrastruttura di build è affidata a `electron-builder`.
Il `package.json` deve prevedere script standard per la build locale e multipiattaforma:
- `npm run start` (Avvio in sviluppo)
- `npm run build:mac`
- `npm run build:win`

Eventuali dipendenze native (come librerie di manipolazione immagini in C++) devono essere dichiarate in `asarUnpack` o configurate propriamente per non interrompere la build cross-platform.

---

## Istruzioni Operative per LLM
Quando viene chiesto di creare un **nuovo tool** per l'ecosistema Antigraviti:
1. Leggi prima questo `hub_architecture_blueprint.md`.
2. Leggi il `visual_identity.md` per i colori e i font.
3. Imposta la struttura di base usando Electron, Vanilla JS, e preload isolation.
4. Chiedi all'utente specifiche sui file `service` da implementare.
5. Sviluppa seguendo il principio della modularità e usa il bridge IPC per operazioni di I/O o logiche Node.
