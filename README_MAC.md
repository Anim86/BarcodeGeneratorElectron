# EAN Pro — Istruzioni per macOS

Per far funzionare correttamente EAN Pro su macOS, segui questi passaggi.

## 1. Installazione Ghostscript
A differenza di Windows, dove Ghostscript è incluso nell'app, su macOS è necessario installarlo nel sistema per abilitare le esportazioni professionali (PDF/X-1a ed EPS).

Il modo più semplice è usare [Homebrew](https://brew.sh/):
```bash
brew install ghostscript
```

## 2. Compilazione (Build)
Poiché stiamo usando moduli nativi come `sharp`, è fortemente consigliato compilare l'applicazione direttamente su un Mac.

### Se hai un Mac:
1. Scarica la cartella del progetto sul Mac.
2. Apri il terminale nella cartella.
3. Installa le dipendenze: `npm install`.
4. Avvia la build: `npm run build:mac`.
5. Troverai il file `.dmg` nella cartella `dist`.

### Se NON hai un Mac (GitHub Actions):
Ho configurato un'azione automatica su GitHub. Se carichi questo progetto su un repository GitHub, puoi andare nella sezione **Actions** e avviare la build. GitHub userà un computer Mac nei suoi server per creare il file per te.

## 3. Sicurezza (Gatekeeper)
Poiché l'app non è firmata con un certificato Apple Developer (che è a pagamento), al primo avvio macOS potrebbe bloccarla.
- Fai click destro sull'app e seleziona **Apri**.
- Conferma di volerla aprire nonostante l'avviso.
- Questo va fatto solo la prima volta.
