# Relazione degli Errori e Avvisi — EAN Demon Generator

Questo documento contiene una panoramica completa di tutti i messaggi d'errore, avvisi grafici e notifiche di validazione che possono apparire all'interno dell'applicazione **EAN Demon Generator**, ciascuno corredato dal rispettivo **Codice Univoco d'Errore**.

Ogni voce è descritta con il suo codice, la sua dicitura esatta (in Italiano e Inglese), la condizione in cui si verifica e la soluzione consigliata per correggerlo.

---

## 1. Errori di Validazione del Codice EAN (`ERR-EAN-XXX`)
Questi errori vengono generati in tempo reale dal servizio di validazione (`src/barcode-service.js`) durante la digitazione nel pannello di inserimento codici o durante l'importazione di file batch (Excel/CSV).

### ❌ `[ERR-EAN-001]` Inserisci un codice
* **Dicitura EN**: `[ERR-EAN-001] Enter an EAN code or import a file` (in Anteprima) / `[ERR-EAN-001] Please enter a code` (digitato vuoto)
* **Quando appare**: Si verifica all'avvio dell'applicazione o dopo un'operazione di reset, quando l'area di anteprima è in attesa e non ci sono codici digitati nell'area di testo.
* **Correzione**: Digitare un codice EAN a 8 o 13 cifre nel campo di testo o trascinare un file Excel/CSV.

### ❌ `[ERR-EAN-002]` Il codice deve contenere solo numeri
* **Dicitura EN**: `[ERR-EAN-002] The code must contain only numbers`
* **Quando appare**: Se il codice digitato (dopo la pulizia automatica di spazi, trattini o punti) contiene caratteri non numerici (es. lettere, simboli speciali).
* **Correzione**: Rimuovere le lettere e i simboli. Vengono accettati solo numeri interi da 0 a 9.

### ❌ `[ERR-EAN-003]` Codice troppo corto (X cifre)
* **Dicitura EN**: `[ERR-EAN-003] Code too short (X digits)`
* **Quando appare**: Se la lunghezza del codice inserito è inferiore a 8 cifre.
* **Correzione**: Continuare la digitazione. I codici a barre standard supportati sono esclusivamente EAN-8 (8 cifre) ed EAN-13 (13 cifre).

### ❌ `[ERR-EAN-004]` Lunghezza non valida (X cifre). Richieste 8 o 13.
* **Dicitura EN**: `[ERR-EAN-004] Invalid length (X digits). Required 8 or 13.`
* **Quando appare**: Se il codice inserito ha una lunghezza compresa tra 9 e 12 cifre. L'applicazione non può determinarne lo standard di appartenenza.
* **Correzione**: Completare l'inserimento fino a raggiungere 13 cifre, oppure ridurlo a 8 cifre se si tratta di un codice EAN-8.

### ❌ `[ERR-EAN-005]` Codice troppo lungo (X cifre)
* **Dicitura EN**: `[ERR-EAN-005] Code too long (X digits)`
* **Quando appare**: Se il codice inserito supera la lunghezza massima consentita dello standard EAN-13 (più di 13 cifre).
* **Correzione**: Accorciare il codice rimuovendo le cifre in eccesso.

### ❌ `[ERR-EAN-006]` Checksum errato. L'ultima cifra dovrebbe essere X
* **Dicitura EN**: `[ERR-EAN-006] Incorrect checksum. The last digit should be X`
* **Quando appare**: Si verifica quando la cifra di controllo inserita (l'ultima cifra a destra dell'EAN) non corrisponde al calcolo matematico dello standard GS1 eseguito sui primi 7 numeri (per EAN-8) o primi 12 numeri (per EAN-13).
* **Correzione**: Sostituire l'ultima cifra con quella suggerita dall'errore, oppure verificare che non ci sia stato un errore di digitazione nelle cifre precedenti.

---

## 2. Avvisi Tecnici di Prestampa (`WRN-PRE-XXX`)
Questi avvisi appaiono direttamente nell'interfaccia con appositi banner arancioni (`field-notice--warning`) sotto i rispettivi controlli per guidare l'utente verso una produzione di stampa ottimale ed esente da scarti.

### ⚠️ `[WRN-PRE-001]` Contrasto scarso (X:1). Minimo 5:1 raccomandato.
* **Dicitura EN**: `[WRN-PRE-001] Poor contrast (X:1). Minimum 5:1 recommended.`
* **Quando appare**: Viene attivato in tempo reale quando il contrasto cromatico calcolato tra il *Colore Barre* e il *Colore Sfondo* selezionati scende sotto la soglia di tolleranza di **5:1**. I lettori ottici fisici potrebbero riscontrare serie difficoltà nella scansione.
* **Correzione**: Scurire il colore delle barre (preferibilmente Nero K100) o schiarire lo sfondo per massimizzare il contrasto.

### ⚠️ `[WRN-PRE-002]` Nota: I formati PNG e SVG non supportano nativamente lo spazio colore CMYK.
* **Dicitura EN**: `[WRN-PRE-002] Note: PNG and SVG formats do not natively support CMYK color space. They will be generated in RGB by default.`
* **Quando appare**: Appare sotto la selezione del formato file se l'utente ha impostato il *Metodo Colore* su CMYK ma il formato file di output selezionato è SVG o PNG (che per standard web lavorano solo in RGB).
* **Correzione**: Se è richiesta l'esportazione in CMYK nativo per la prestampa, selezionare un formato compatibile come **PDF/X-1a**, **EPS** o **TIFF**.

### ⚠️ `[WRN-PRE-003]` Dimensioni fuori standard
* **Dicitura EN**: `[WRN-PRE-003] Non-standard dimensions` (con indicatore rosso)
* **Quando appare**: Appare sotto i campi Larghezza e Altezza quando le dimensioni impostate differiscono dallo standard GS1 (SC0 a SC9) per la riproduzione dei codici EAN.
* **Correzione**: Cliccare sul preset GS1 oppure impostare le dimensioni raccomandate per rientrare nella tolleranza di ingrandimento (tra l'80% e il 200%).

### ⚠️ `[WRN-PRE-004]` Abbondanza raccomandata GS1: min X mm
* **Dicitura EN**: `[WRN-PRE-004] Recommended GS1 quiet zone: min X mm`
* **Quando appare**: Appare se l'area di abbondanza laterale impostata (Quiet Zone sinistra e destra) è inferiore al minimo richiesto per garantire che il lettore non scansioni elementi grafici adiacenti. Il minimo è 3.63mm per EAN-13 e 2.31mm per EAN-8.
* **Correzione**: Aumentare il valore dei campi "Abbondanza Orizzontale".

---

## 3. Errori e Avvisi del Sistema di Salvataggio ed Esportazione (`ERR-SYS-XXX`)
Questi messaggi compaiono sotto forma di modali, notifiche di sistema o finestre di dialogo native.

### ❌ `[ERR-SYS-001]` Inserisci un nome per il preset
* **Dicitura EN**: `[ERR-SYS-001] Please enter a name for the preset`
* **Quando appare**: Se l'utente clicca su "Salva" sotto la sezione dei preset personali senza aver digitato alcun nome nel campo di testo.
* **Correzione**: Digitare un nome descrittivo (es. "Etichette Scatola") prima di cliccare su Salva.

### ❌ `[ERR-SYS-002]` I formati TIFF, EPS e PDF sono disponibili solo nella versione desktop di EAN Demon Generator.
* **Dicitura EN**: `[ERR-SYS-002] TIFF, EPS and PDF formats are only available in the desktop version of EAN Demon Generator.`
* **Quando appare**: Appare in ambiente browser qualora si tenti di esportare file vettoriali CMYK avanzati (PDF o EPS) o raster professionali (TIFF).
* **Correzione**: Eseguire l'applicazione tramite l'eseguibile desktop Windows (`EAN-Demon-Generator-Portable-1.5.3.exe`) per abilitare l'esportazione nativa integrata.

### ❌ `[ERR-SYS-003]` Errore durante l'esportazione: {error} / Errore di sistema
* **Dicitura EN**: `[ERR-SYS-003] Error during export: {error}` / `[ERR-SYS-003] System error: {error}`
* **Quando appare**: Se si verifica una violazione di scrittura su disco (es. permessi cartella mancanti, file PDF di destinazione già aperto e bloccato da Acrobat, o mancanza di Ghostscript per l'elaborazione vettoriale).
* **Correzione**: Chiudere eventuali visualizzatori PDF aperti, assicurarsi che la cartella di esportazione sia scrivibile ed eventualmente reinstallare Ghostscript dal pannello di verifica.
