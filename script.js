// Variabili globali per gestire l'offset e la sincronizzazione
let serverTimeOffset = 0;
let lastSyncTime = 0;
let isSyncing = false;
let currentBackgroundMode = 'automatico'; // 'automatico' o un valore di colore

// --- GESTIONE TEMI A EVENTO (MODULARE PER FUTURI EVENTI) ---
const eventThemes = {
    natale: {
        name: 'natale',
        desktopImage: 'https://res.cloudinary.com/dk0f2y0hu/image/upload/v1763217481/christmas-desktop_wel7lu.png',
        mobileImage: 'https://res.cloudinary.com/dk0f2y0hu/image/upload/v1763217481/christmas-mobile_mrhqra.png',
        clockColor: '#ffffff',
        dateColor: '#ffffff',
        applyButtonStyles: function () {
            // Tutti i pulsanti: sfondo bianco, icona rossa
            const buttons = ['backIcon', 'scheduleIcon', 'settingsIcon', 'infoIcon', 'calendarIcon'];
            buttons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.style.backgroundColor = '#ffffff';
                    btn.style.color = '#dc2626';
                }
            });
            // GitHub: sfondo rosso, icona bianca (invertito)
            const githubBtn = document.getElementById('githubIcon');
            if (githubBtn) {
                githubBtn.style.backgroundColor = '#dc2626';
                githubBtn.style.color = '#ffffff';
            }

            // Cambia tutti i verdi in rossi nella tabella orario
            const scheduleTable = document.getElementById('scheduleTable');
            if (scheduleTable) {
                const ths = scheduleTable.querySelectorAll('th');
                ths.forEach(th => {
                    const bgColor = th.style.backgroundColor || window.getComputedStyle(th).backgroundColor;
                    // Se è verde (#1b912b o rgb equivalente), cambia in rosso
                    if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)' || bgColor === '' || !th.style.backgroundColor) {
                        th.style.backgroundColor = '#dc2626';
                    }
                });
                // Cambia anche le caselle (td) verdi in rosso
                const tds = scheduleTable.querySelectorAll('td');
                tds.forEach(td => {
                    const bgColor = td.style.backgroundColor || window.getComputedStyle(td).backgroundColor;
                    // Se è verde, cambia in rosso
                    if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)') {
                        td.style.backgroundColor = '#dc2626';
                        td.style.color = 'white';
                    }
                });
            }

            // Cambia tutti i verdi in rossi nei pulsanti (già fatto sopra, ma assicuriamoci)
            // Cambia anche il colore del pulsante "Salva" nelle impostazioni
            const closeSettingsBtn = document.getElementById('closeSettingsModal');
            if (closeSettingsBtn) {
                closeSettingsBtn.style.backgroundColor = '#dc2626';
            }

            // Cambia il colore del toggle quando è attivo
            const toggles = document.querySelectorAll('.toggle input:checked + .toggle-slider');
            toggles.forEach(toggle => {
                toggle.style.backgroundColor = '#dc2626';
            });

            // Cambia pulsanti "Chiudi"
            const closeInfoBtn = document.getElementById('closeInfoModal');
            if (closeInfoBtn) {
                closeInfoBtn.style.backgroundColor = '#dc2626';
            }
            const closeScheduleBtn = document.getElementById('closeScheduleModal');
            if (closeScheduleBtn) {
                closeScheduleBtn.style.backgroundColor = '#dc2626';
            }
            const closeCalendarBtn = document.getElementById('closeCalendarModal');
            if (closeCalendarBtn) {
                closeCalendarBtn.style.backgroundColor = '#dc2626';
            }

            // Cambia colore testo sincronizzazione (verde → rosso)
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                // Salva il colore originale se non è già salvato
                if (!syncStatus.dataset.originalColor) {
                    const currentColor = syncStatus.style.color || window.getComputedStyle(syncStatus).color;
                    syncStatus.dataset.originalColor = currentColor;
                }
                // Cambia a rosso solo se non è un errore (rosso già)
                if (syncStatus.style.color !== '#ff6b6b' && syncStatus.style.color !== 'rgb(255, 107, 107)') {
                    syncStatus.style.color = '#dc2626';
                }
            }

            // Cambia animazione sincronizzazione (cerchi verdi → rossi)
            const pulseInner = document.querySelector('.pulse-inner');
            if (pulseInner) {
                pulseInner.style.backgroundColor = '#dc2626'; // Rosso
            }
            const pulseFixed = document.querySelector('.pulse-fixed');
            if (pulseFixed) {
                pulseFixed.style.backgroundColor = '#f87171'; // Rosso più chiaro
            }

            // Cambia barra di progresso materia se è verde
            const materiaProgress = document.getElementById('materia-progress');
            if (materiaProgress) {
                const bgColor = materiaProgress.style.backgroundColor || window.getComputedStyle(materiaProgress).backgroundColor;
                if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)') {
                    materiaProgress.style.backgroundColor = '#dc2626';
                }
            }

            // Cambia selezione testo (verde → rosso)
            const style = document.createElement('style');
            style.id = 'christmas-selection-style';
            style.textContent = '::selection { background-color: #dc2626 !important; } ::-moz-selection { background-color: #dc2626 !important; }';
            document.head.appendChild(style);

            // Aggiungi classe al body per tema natalizio
            document.body.classList.add('christmas-theme');
        },
        removeButtonStyles: function () {
            // Ripristina stili originali
            const backIcon = document.getElementById('backIcon');
            if (backIcon) {
                backIcon.style.backgroundColor = '#1b912b';
                backIcon.style.color = 'white';
            }
            const scheduleIcon = document.getElementById('scheduleIcon');
            if (scheduleIcon) {
                scheduleIcon.style.backgroundColor = '#1b912b';
                scheduleIcon.style.color = 'white';
            }
            const settingsIcon = document.getElementById('settingsIcon');
            if (settingsIcon) {
                settingsIcon.style.backgroundColor = '#1b912b';
                settingsIcon.style.color = 'white';
            }
            const infoIcon = document.getElementById('infoIcon');
            if (infoIcon) {
                infoIcon.style.backgroundColor = '#1b912b';
                infoIcon.style.color = 'white';
            }
            const calendarIcon = document.getElementById('calendarIcon');
            if (calendarIcon) {
                calendarIcon.style.backgroundColor = '#1b912b';
                calendarIcon.style.color = 'white';
            }
            const githubIcon = document.getElementById('githubIcon');
            if (githubIcon) {
                githubIcon.style.backgroundColor = '#333';
                githubIcon.style.color = 'white';
            }

            // Ripristina colori originali nella tabella orario
            const scheduleTable = document.getElementById('scheduleTable');
            if (scheduleTable) {
                const ths = scheduleTable.querySelectorAll('th');
                ths.forEach(th => {
                    th.style.backgroundColor = '#1b912b';
                });
                // Ripristina anche le caselle (td) verdi
                const tds = scheduleTable.querySelectorAll('td');
                tds.forEach(td => {
                    const bgColor = td.style.backgroundColor || window.getComputedStyle(td).backgroundColor;
                    // Se era stato cambiato in rosso, ripristina
                    if (bgColor === '#dc2626' || bgColor === 'rgb(220, 38, 38)') {
                        td.style.backgroundColor = '';
                        td.style.color = '';
                    }
                });
            }

            // Ripristina colore pulsante "Salva"
            const closeSettingsBtn = document.getElementById('closeSettingsModal');
            if (closeSettingsBtn) {
                closeSettingsBtn.style.backgroundColor = '#1b912b';
            }

            // Ripristina colore toggle
            const toggles = document.querySelectorAll('.toggle-slider');
            toggles.forEach(toggle => {
                toggle.style.backgroundColor = '';
            });

            // Ripristina pulsanti "Chiudi"
            const closeInfoBtn = document.getElementById('closeInfoModal');
            if (closeInfoBtn) {
                closeInfoBtn.style.backgroundColor = '#1b912b';
            }
            const closeScheduleBtn = document.getElementById('closeScheduleModal');
            if (closeScheduleBtn) {
                closeScheduleBtn.style.backgroundColor = '#1b912b';
            }
            const closeCalendarBtn = document.getElementById('closeCalendarModal');
            if (closeCalendarBtn) {
                closeCalendarBtn.style.backgroundColor = '#1b912b';
            }

            // Ripristina colore testo sincronizzazione
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus && syncStatus.dataset.originalColor) {
                syncStatus.style.color = syncStatus.dataset.originalColor;
                delete syncStatus.dataset.originalColor;
            }

            // Ripristina animazione sincronizzazione (cerchi verdi)
            const pulseInner = document.querySelector('.pulse-inner');
            if (pulseInner) {
                pulseInner.style.backgroundColor = 'rgb(74, 222, 128)'; // Verde originale
            }
            const pulseFixed = document.querySelector('.pulse-fixed');
            if (pulseFixed) {
                pulseFixed.style.backgroundColor = 'rgb(74, 222, 128)'; // Verde originale
            }

            // Ripristina barra di progresso materia se era stata cambiata
            const materiaProgress = document.getElementById('materia-progress');
            if (materiaProgress) {
                const bgColor = materiaProgress.style.backgroundColor || window.getComputedStyle(materiaProgress).backgroundColor;
                if (bgColor === '#dc2626' || bgColor === 'rgb(220, 38, 38)') {
                    // Ripristina al colore originale basato sulla materia
                    materiaProgress.style.backgroundColor = '';
                }
            }

            // Rimuovi stile selezione testo
            const selectionStyle = document.getElementById('christmas-selection-style');
            if (selectionStyle) {
                selectionStyle.remove();
            }

            // Rimuovi classe dal body
            document.body.classList.remove('christmas-theme');
        }
    },
    stranger_things: {
        name: 'stranger_things',
        desktopImage: 'https://res.cloudinary.com/dk0f2y0hu/image/upload/v1763583944/st-wallpaper_jm6eya.jpg',
        mobileImage: 'https://res.cloudinary.com/dk0f2y0hu/image/upload/v1763583944/st-wallpaper_jm6eya.jpg',
        clockColor: '#ffffff',
        dateColor: '#ffffff',
        applyButtonStyles: function () {
            // Tutti i pulsanti: sfondo bianco, icona maroon
            const buttons = ['backIcon', 'scheduleIcon', 'settingsIcon', 'infoIcon', 'calendarIcon'];
            buttons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.style.backgroundColor = '#ffffff';
                    btn.style.color = '#800000';
                }
            });
            // GitHub: sfondo maroon, icona bianca (invertito)
            const githubBtn = document.getElementById('githubIcon');
            if (githubBtn) {
                githubBtn.style.backgroundColor = '#800000';
                githubBtn.style.color = '#ffffff';
            }

            // Cambia tutti i verdi in maroon nella tabella orario
            const scheduleTable = document.getElementById('scheduleTable');
            if (scheduleTable) {
                const ths = scheduleTable.querySelectorAll('th');
                ths.forEach(th => {
                    const bgColor = th.style.backgroundColor || window.getComputedStyle(th).backgroundColor;
                    if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)' || bgColor === '' || !th.style.backgroundColor) {
                        th.style.backgroundColor = '#800000';
                    }
                });
                const tds = scheduleTable.querySelectorAll('td');
                tds.forEach(td => {
                    const bgColor = td.style.backgroundColor || window.getComputedStyle(td).backgroundColor;
                    if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)') {
                        td.style.backgroundColor = '#800000';
                        td.style.color = 'white';
                    }
                });
            }

            // Cambia il colore del pulsante "Salva" nelle impostazioni
            const closeSettingsBtn = document.getElementById('closeSettingsModal');
            if (closeSettingsBtn) {
                closeSettingsBtn.style.backgroundColor = '#800000';
            }

            // Cambia il colore del toggle quando è attivo
            const toggles = document.querySelectorAll('.toggle input:checked + .toggle-slider');
            toggles.forEach(toggle => {
                toggle.style.backgroundColor = '#800000';
            });

            // Cambia pulsanti "Chiudi"
            const closeInfoBtn = document.getElementById('closeInfoModal');
            if (closeInfoBtn) {
                closeInfoBtn.style.backgroundColor = '#800000';
            }
            const closeScheduleBtn = document.getElementById('closeScheduleModal');
            if (closeScheduleBtn) {
                closeScheduleBtn.style.backgroundColor = '#800000';
            }
            const closeCalendarBtn = document.getElementById('closeCalendarModal');
            if (closeCalendarBtn) {
                closeCalendarBtn.style.backgroundColor = '#800000';
            }

            // Cambia colore testo sincronizzazione
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                if (!syncStatus.dataset.originalColor) {
                    const currentColor = syncStatus.style.color || window.getComputedStyle(syncStatus).color;
                    syncStatus.dataset.originalColor = currentColor;
                }
                if (syncStatus.style.color !== '#ff6b6b' && syncStatus.style.color !== 'rgb(255, 107, 107)') {
                    syncStatus.style.color = '#800000';
                }
            }

            // Cambia animazione sincronizzazione
            const pulseInner = document.querySelector('.pulse-inner');
            if (pulseInner) {
                pulseInner.style.backgroundColor = '#800000';
            }
            const pulseFixed = document.querySelector('.pulse-fixed');
            if (pulseFixed) {
                pulseFixed.style.backgroundColor = '#a52a2a'; // Maroon più chiaro
            }

            // Cambia barra di progresso materia se è verde
            const materiaProgress = document.getElementById('materia-progress');
            if (materiaProgress) {
                const bgColor = materiaProgress.style.backgroundColor || window.getComputedStyle(materiaProgress).backgroundColor;
                if (bgColor === '#1b912b' || bgColor === 'rgb(27, 145, 43)') {
                    materiaProgress.style.backgroundColor = '#800000';
                }
            }

            // Cambia selezione testo
            const style = document.createElement('style');
            style.id = 'stranger-things-selection-style';
            style.textContent = '::selection { background-color: #800000 !important; } ::-moz-selection { background-color: #800000 !important; }';
            document.head.appendChild(style);

            // Aggiungi classe al body
            document.body.classList.add('stranger-things-theme');
        },
        removeButtonStyles: function () {
            // Ripristina stili originali (copia da natale.removeButtonStyles)
            const backIcon = document.getElementById('backIcon');
            if (backIcon) {
                backIcon.style.backgroundColor = '#1b912b';
                backIcon.style.color = 'white';
            }
            const scheduleIcon = document.getElementById('scheduleIcon');
            if (scheduleIcon) {
                scheduleIcon.style.backgroundColor = '#1b912b';
                scheduleIcon.style.color = 'white';
            }
            const settingsIcon = document.getElementById('settingsIcon');
            if (settingsIcon) {
                settingsIcon.style.backgroundColor = '#1b912b';
                settingsIcon.style.color = 'white';
            }
            const infoIcon = document.getElementById('infoIcon');
            if (infoIcon) {
                infoIcon.style.backgroundColor = '#1b912b';
                infoIcon.style.color = 'white';
            }
            const calendarIcon = document.getElementById('calendarIcon');
            if (calendarIcon) {
                calendarIcon.style.backgroundColor = '#1b912b';
                calendarIcon.style.color = 'white';
            }
            const githubIcon = document.getElementById('githubIcon');
            if (githubIcon) {
                githubIcon.style.backgroundColor = '#333';
                githubIcon.style.color = 'white';
            }

            const scheduleTable = document.getElementById('scheduleTable');
            if (scheduleTable) {
                const ths = scheduleTable.querySelectorAll('th');
                ths.forEach(th => {
                    th.style.backgroundColor = '#1b912b';
                });
                const tds = scheduleTable.querySelectorAll('td');
                tds.forEach(td => {
                    const bgColor = td.style.backgroundColor || window.getComputedStyle(td).backgroundColor;
                    if (bgColor === '#800000' || bgColor === 'rgb(128, 0, 0)') {
                        td.style.backgroundColor = '';
                        td.style.color = '';
                    }
                });
            }

            const closeSettingsBtn = document.getElementById('closeSettingsModal');
            if (closeSettingsBtn) {
                closeSettingsBtn.style.backgroundColor = '#1b912b';
            }

            const toggles = document.querySelectorAll('.toggle-slider');
            toggles.forEach(toggle => {
                toggle.style.backgroundColor = '';
            });

            const closeInfoBtn = document.getElementById('closeInfoModal');
            if (closeInfoBtn) {
                closeInfoBtn.style.backgroundColor = '#1b912b';
            }
            const closeScheduleBtn = document.getElementById('closeScheduleModal');
            if (closeScheduleBtn) {
                closeScheduleBtn.style.backgroundColor = '#1b912b';
            }
            const closeCalendarBtn = document.getElementById('closeCalendarModal');
            if (closeCalendarBtn) {
                closeCalendarBtn.style.backgroundColor = '#1b912b';
            }

            const syncStatus = document.getElementById('sync-status');
            if (syncStatus && syncStatus.dataset.originalColor) {
                syncStatus.style.color = syncStatus.dataset.originalColor;
                delete syncStatus.dataset.originalColor;
            }

            const pulseInner = document.querySelector('.pulse-inner');
            if (pulseInner) {
                pulseInner.style.backgroundColor = 'rgb(74, 222, 128)';
            }
            const pulseFixed = document.querySelector('.pulse-fixed');
            if (pulseFixed) {
                pulseFixed.style.backgroundColor = 'rgb(74, 222, 128)';
            }

            const materiaProgress = document.getElementById('materia-progress');
            if (materiaProgress) {
                const bgColor = materiaProgress.style.backgroundColor || window.getComputedStyle(materiaProgress).backgroundColor;
                if (bgColor === '#800000' || bgColor === 'rgb(128, 0, 0)') {
                    materiaProgress.style.backgroundColor = '';
                }
            }

            const selectionStyle = document.getElementById('stranger-things-selection-style');
            if (selectionStyle) {
                selectionStyle.remove();
            }

            document.body.classList.remove('stranger-things-theme');
        }
    }
};

// --- IMPOSTAZIONI ORARIO SCOLASTICO ---
const orarioScolastico = {
    1: ["Scienze", "Scienze", "Matematica", "Matematica", "Inglese", "Religione"], // Lunedì (+ Test Religione)
    2: ["Informatica", "Religione", "Fisica", "Inglese", "Italiano"],
    3: ["Scienze", "Scienze", "Italiano", "Arte", "Matematica"],
    4: ["Inglese", "Storia", "Filosofia", "Fisica", "Scienze"],
    5: ["Ginnastica", "Ginnastica", "Italiano", "Italiano", "Matematica"],
    6: ["Storia", "Arte", "Filosofia", "Informatica", "Fisica"]
};

const materiaColori = {
    "Arte": "#D81B60",
    "Ginnastica": "#995C43",
    "Fisica": "#3CB040",
    "Informatica": "#636363",
    "Inglese": "#1E88E5",
    "Italiano": "#0D47A1",
    "Matematica": "#D32F2F",
    "Storia": "#D6A127",
    "Scienze": "#9824AD",
    "Filosofia": "#007CBF",
    "Religione": "#F9C025",
    "Ricreazione": "#757575"
};

const materiaColoriSfondo = {
    "Arte": "#FFCFD7",
    "Ginnastica": "#E8D4CD",
    "Fisica": "#CEF5CE",
    "Informatica": "#E4E4E4",
    "Inglese": "#E2EAFB",
    "Italiano": "#DDDBFF",
    "Matematica": "#FFC4C4",
    "Storia": "#FBEFDC",
    "Scienze": "#F3CEF5",
    "Filosofia": "#D0E1F5",
    "Religione": "#FFF2D5",
    "Ricreazione": "#E1E1E1"
};

const fasceOrarie = [
    // Orario Standard
    { nome: "Ora 1", inizio: { ore: 8, minuti: 15 }, fine: { ore: 9, minuti: 15 } },
    { nome: "Ora 2", inizio: { ore: 9, minuti: 15 }, fine: { ore: 10, minuti: 10 } },
    { nome: "Ricreazione", inizio: { ore: 10, minuti: 10 }, fine: { ore: 10, minuti: 20 } },
    { nome: "Ora 3", inizio: { ore: 10, minuti: 20 }, fine: { ore: 11, minuti: 15 } },
    { nome: "Ora 4", inizio: { ore: 11, minuti: 15 }, fine: { ore: 12, minuti: 15 } },
    { nome: "Ora 5", inizio: { ore: 12, minuti: 15 }, fine: { ore: 13, minuti: 15 } },
    // Materia di TEST PROVVISORIA
    { nome: "Ora 6", inizio: { ore: 18, minuti: 10 }, fine: { ore: 19, minuti: 10 } }
];

// ----------------------------------------------------------------

function updateClock() {
    const now = new Date(Date.now() + serverTimeOffset);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('it-IT', dateOptions);
    document.getElementById('date').textContent = dateStr;
    updateScheduleWidget();
    if (currentBackgroundMode === 'automatico') {
        updateAutomaticBackground();
    }
    const currentTime = Date.now();
    if (currentTime - lastSyncTime > 900000 && !isSyncing) {
        syncTimeWithServer();
    }
}

function updateScheduleWidget() {
    const now = new Date(Date.now() + serverTimeOffset);
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const scheduleWidget = document.getElementById('schedule-widget');

    let inSchoolTime = false;
    for (let i = 0; i < fasceOrarie.length; i++) {
        const fascia = fasceOrarie[i];
        const startMinutes = fascia.inizio.ore * 60 + fascia.inizio.minuti;
        const endMinutes = fascia.fine.ore * 60 + fascia.fine.minuti;

        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            // Controlla anche se il giorno è corretto (Lunedì-Sabato)
            if (day >= 1 && day <= 6) {
                inSchoolTime = true;
                const totalDuration = endMinutes - startMinutes;
                const elapsed = currentMinutes - startMinutes;
                const percentage = Math.floor((elapsed / totalDuration) * 100);

                let materia;
                if (fascia.nome === "Ricreazione") {
                    materia = "Ricreazione";
                } else {
                    // **LOGICA CORRETTA**: Calcola l'indice della materia contando le "Ore" precedenti
                    const subjectIndex = fasceOrarie.slice(0, i + 1).filter(f => f.nome.startsWith("Ora")).length - 1;
                    materia = (orarioScolastico[day] && orarioScolastico[day][subjectIndex]) ? orarioScolastico[day][subjectIndex] : "Pausa";
                }

                let color = materiaColori[materia] || "#000000";
                // Se siamo in modalità natalizia o stranger things e il colore è verde, cambia
                if (currentBackgroundMode === 'natale' && (color === '#1b912b' || color === 'rgb(27, 145, 43)')) {
                    color = '#dc2626';
                } else if (currentBackgroundMode === 'stranger_things' && (color === '#1b912b' || color === 'rgb(27, 145, 43)')) {
                    color = '#800000';
                }
                document.getElementById('materia-nome').textContent = materia;
                document.getElementById('materia-nome').style.color = color;
                document.getElementById('materia-percentuale').textContent = `${percentage}%`;
                document.getElementById('materia-percentuale').style.color = color;
                document.getElementById('materia-progress').style.width = `${percentage}%`;
                document.getElementById('materia-progress').style.backgroundColor = color;

                break;
            }
        }
    }
    if (scheduleWidget) {
        scheduleWidget.dataset.visible = inSchoolTime;
    }
}

async function syncWithTimeis() {
    try {
        updateSyncStatus('Sincronizzazione con time.is...');
        const requestStartTime = Date.now();
        const response = await fetch('https://cors-anywhere.herokuapp.com/https://time.is/');
        if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
        const text = await response.text();
        const requestEndTime = Date.now();
        const match = text.match(/<div id="clock" data-time="(\d+)"/);
        if (match && match[1]) {
            const serverTimestamp = parseInt(match[1]) * 1000;
            const latency = (requestEndTime - requestStartTime) / 2;
            const localTime = new Date();
            serverTimeOffset = serverTimestamp - localTime.getTime() + latency;
            console.log('Sincronizzazione time.is completata. Offset:', serverTimeOffset, 'ms');
            return true;
        }
        throw new Error('Impossibile estrarre l\'orario da time.is');
    } catch (error) {
        console.error('Errore durante la sincronizzazione con time.is:', error);
        return false;
    }
}

async function syncTimeWithServer() {
    if (isSyncing) return;
    isSyncing = true;
    updateSyncStatus('Sincronizzazione in corso...');
    try {
        let success = await syncWithTimeApi();
        if (!success) {
            success = await syncWithTimeis();
        }
        if (success) {
            lastSyncTime = Date.now();
            const showOffset = localStorage.getItem('showOffset') === 'true';
            const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
            updateSyncStatus(`Sincronizzato con il server${offsetText}`);
            const pulse = document.getElementById('pulse-indicator');
            if (pulse) pulse.style.display = 'inline-block';
        } else {
            updateSyncStatus('Errore di sincronizzazione', true);
        }
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error);
        updateSyncStatus('Errore di sincronizzazione', true);
    } finally {
        isSyncing = false;
    }
}

async function syncWithTimeApi() {
    try {
        updateSyncStatus('Sincronizzazione con il server...');
        const requestStartTime = Date.now();
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Europe/Rome', {
            method: 'GET', headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
        const data = await response.json();
        const requestEndTime = Date.now();
        const latency = (requestEndTime - requestStartTime) / 2;
        const serverTime = new Date(data.dateTime);
        const localTime = new Date();
        serverTimeOffset = serverTime.getTime() - localTime.getTime() + latency;
        console.log('Sincronizzazione con il server completata. Offset:', serverTimeOffset, 'ms');
        return true;
    } catch (error) {
        console.error('Errore durante la sincronizzazione con il server:', error);
        return false;
    }
}

function updateSyncStatus(message, isError = false) {
    const status = document.getElementById('sync-status');
    if (status) {
        status.style.opacity = '0';
        setTimeout(() => {
            status.innerHTML = message;
            // Se siamo in modalità natalizia o stranger things, usa colore specifico
            const isChristmasTheme = currentBackgroundMode === 'natale';
            const isStrangerThingsTheme = currentBackgroundMode === 'stranger_things';
            if (isError) {
                status.style.color = '#ff6b6b';
            } else {
                if (isChristmasTheme) {
                    status.style.color = '#dc2626';
                } else if (isStrangerThingsTheme) {
                    status.style.color = '#800000';
                } else {
                    status.style.color = '#1b912b';
                }
            }
            status.style.opacity = '1';
        }, 150);
    }
}

function getMateriaForCurrentTime(now) {
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (day < 1 || day > 6) { // Domenica o giorno non valido
        return null;
    }

    for (let i = 0; i < fasceOrarie.length; i++) {
        const fascia = fasceOrarie[i];
        const startMinutes = fascia.inizio.ore * 60 + fascia.inizio.minuti;
        const endMinutes = fascia.fine.ore * 60 + fascia.fine.minuti;

        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            if (fascia.nome === "Ricreazione") {
                return "Ricreazione";
            }
            if (fascia.nome.startsWith("Ora")) {
                const subjectIndex = fasceOrarie.slice(0, i + 1).filter(f => f.nome.startsWith("Ora")).length - 1;
                const materia = (orarioScolastico[day] && orarioScolastico[day][subjectIndex]) ? orarioScolastico[day][subjectIndex] : null;
                return materia;
            }
        }
    }

    return null; // Fuori orario scolastico
}

function updateAutomaticBackground() {
    const now = new Date(Date.now() + serverTimeOffset);
    const materia = getMateriaForCurrentTime(now);

    let backgroundColor;
    if (materia && materiaColoriSfondo[materia]) {
        backgroundColor = materiaColoriSfondo[materia];
    } else {
        backgroundColor = '#D4D4D4'; // Grigio predefinito
    }

    document.body.style.backgroundColor = backgroundColor;
    const pill = document.getElementById('status-pill');
    if (pill) {
        // Se lo sfondo del body è bianco, la pillola deve avere uno sfondo leggermente grigio per contrasto
        pill.style.backgroundColor = backgroundColor === '#ffffff' ? '#f8f9fa' : 'white';
    }
}

function applyBackground(color) {
    const clock = document.querySelector('.clock');
    const date = document.querySelector('.date');
    let blurOverlay = document.getElementById('event-blur-overlay');
    const eventTheme = eventThemes[color];

    // Rimuovi tutti i temi a evento attivi
    Object.keys(eventThemes).forEach(themeKey => {
        if (eventThemes[themeKey].removeButtonStyles) {
            eventThemes[themeKey].removeButtonStyles();
        }
    });
    if (blurOverlay) blurOverlay.remove();

    currentBackgroundMode = color;

    if (color === 'automatico') {
        updateAutomaticBackground();
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        if (clock) clock.style.color = '#1a1a1a';
        if (date) date.style.color = '#666';
    } else if (eventTheme) {
        // Tema a evento (modulare)
        document.body.style.backgroundColor = '';
        applyEventThemeBackground(eventTheme);
        const pill = document.getElementById('status-pill');
        if (pill) pill.style.backgroundColor = 'white';
        if (clock) clock.style.color = eventTheme.clockColor;
        if (date) date.style.color = eventTheme.dateColor;
        createEventBlurOverlay();
        if (eventTheme.applyButtonStyles) {
            eventTheme.applyButtonStyles();
        }
    } else {
        // Sfondo colorato normale
        document.body.style.backgroundColor = color;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        const pill = document.getElementById('status-pill');
        if (pill) pill.style.backgroundColor = color === '#ffffff' ? '#f8f9fa' : 'white';
        if (clock) clock.style.color = '#1a1a1a';
        if (date) date.style.color = '#666';
    }
}

function createEventBlurOverlay() {
    let blurOverlay = document.getElementById('event-blur-overlay');
    if (blurOverlay) return; // Già esistente

    blurOverlay = document.createElement('div');
    blurOverlay.id = 'event-blur-overlay';
    document.body.appendChild(blurOverlay);
}

function applyEventThemeBackground(eventTheme) {
    const isMobile = window.innerWidth <= 768;
    const imageUrl = isMobile ? eventTheme.mobileImage : eventTheme.desktopImage;

    document.body.style.backgroundImage = `url(${imageUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
}

window.addEventListener('resize', function () {
    const eventTheme = eventThemes[currentBackgroundMode];
    if (eventTheme) {
        applyEventThemeBackground(eventTheme);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Precarica immagini per tutti i temi a evento
    Object.keys(eventThemes).forEach(themeKey => {
        const theme = eventThemes[themeKey];
        if (theme.desktopImage) {
            const imgDesktop = new Image();
            imgDesktop.src = theme.desktopImage;
        }
        if (theme.mobileImage) {
            const imgMobile = new Image();
            imgMobile.src = theme.mobileImage;
        }
    });

    const overlay = document.getElementById('overlay');
    const githubIcon = document.getElementById('githubIcon');
    const backIcon = document.getElementById('backIcon');
    const scheduleIcon = document.getElementById('scheduleIcon');
    const settingsIcon = document.getElementById('settingsIcon');
    const infoIcon = document.getElementById('infoIcon');
    const settingsModal = document.getElementById('settingsModal');
    const infoModal = document.getElementById('infoModal');
    const scheduleModal = document.getElementById('scheduleModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const closeInfoModal = document.getElementById('closeInfoModal');

    // --- CALENDAR MODAL LOGIC ---
    const calendarIcon = document.getElementById('calendarIcon');
    const calendarModal = document.getElementById('calendarModal');
    const closeCalendarModal = document.getElementById('closeCalendarModal');

    if (calendarIcon && calendarModal) {
        calendarIcon.addEventListener('click', () => {
            updateAdventCalendar();
            openModal(calendarModal);
        });
    }

    if (closeCalendarModal) {
        closeCalendarModal.addEventListener('click', () => {
            closeModal(calendarModal);
        });
    }

    function updateAdventCalendar() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentDate = now.getDate();

        // Countdown to Christmas (Dec 25 00:00)
        // If current date is after Dec 25, target next year? 
        // Or just show 0 if it's Dec 25?
        // User says "giorni rimanenti a Natale, il 25 dicembre a 00:00"

        let targetYear = currentYear;
        if (currentMonth === 11 && currentDate > 25) {
            targetYear++;
        }

        const christmasDate = new Date(targetYear, 11, 25, 0, 0, 0);
        const diffTime = christmasDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const daysRemainingEl = document.getElementById('daysRemaining');
        if (daysRemainingEl) {
            daysRemainingEl.textContent = diffDays > 0 ? diffDays : 0;
        }

        // Render Calendar Grid
        const grid = document.getElementById('adventGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // December has 31 days
        // We want to render 1 to 31
        // Logic:
        // 1-25: 
        //    If date < current (and in Dec): Red
        //    If date == current (and in Dec): Red
        //    If date > current: White
        // 26-31: Gray

        // NOTE: Since we are in Nov 2025, strictly speaking, NO days are passed.
        // But if we are testing, we might want to see it.
        // I will implement strict logic:
        // If month < 11 (Nov), all white (future).
        // If month == 11 (Dec), check dates.

        const isDecember = currentMonth === 11;

        for (let i = 1; i <= 31; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;

            if (i > 25) {
                dayEl.classList.add('future-month'); // Grayed out
            } else {
                // Days 1-25
                if (isDecember && currentDate >= i) {
                    dayEl.classList.add('active'); // Red
                } else {
                    // Default white
                }
            }

            grid.appendChild(dayEl);
        }

        // Snow Animation
        const snowContainer = document.querySelector('.snow-container');
        if (snowContainer && snowContainer.children.length === 0) {
            const snowflakeCount = 20;
            for (let i = 0; i < snowflakeCount; i++) {
                const snowflake = document.createElement('div');
                snowflake.classList.add('snowflake');
                snowflake.textContent = '❄';
                snowflake.style.left = Math.random() * 100 + '%';
                const duration = Math.random() * 3 + 2; // 2-5s
                snowflake.style.animationDuration = duration + 's';
                // Negative delay to start mid-animation
                snowflake.style.animationDelay = -Math.random() * duration + 's';
                snowflake.style.fontSize = Math.random() * 10 + 10 + 'px'; // 10-20px
                snowflake.style.opacity = Math.random();
                snowContainer.appendChild(snowflake);
            }
        }
    }
    const closeScheduleModal = document.getElementById('closeScheduleModal');
    const fontSelect = document.getElementById('fontSelect');
    const weightSelect = document.getElementById('weightSelect');
    const backgroundSelect = document.getElementById('backgroundSelect');
    const forceSyncBtn = document.getElementById('forceSync');

    const infoContent = document.querySelector('#infoModal p');
    if (infoContent) {
        infoContent.innerHTML = 'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' + 'Sincronizzato per garantire la massima precisione.' + '<br><br>' + 'Creato da <a href="https://lollo.dpdns.org/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v3.1';
    }
    if (githubIcon) githubIcon.addEventListener('click', () => window.open('https://github.com/lollo21x/clock', '_blank'));
    if (backIcon) backIcon.addEventListener('click', () => window.location.href = 'https://hub4d.lollo.dpdns.org');

    // Creazione Pillola e Widget
    let statusPill = document.createElement('div');
    statusPill.id = 'status-pill';
    // Rimosso stile inline, verrà gestito da style.css
    document.body.appendChild(statusPill);

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'widget-container';
    statusPill.appendChild(widgetContainer);

    const syncWidget = document.createElement('div');
    syncWidget.id = 'sync-widget';
    syncWidget.className = 'widget-content'; // Inizia non attivo, gestito sotto
    syncWidget.innerHTML = '<div id="pulse-indicator" class="pulse" style="display: none;"><div class="pulse-inner"></div><div class="pulse-fixed"></div><div class="pulse-content"></div></div><div id="sync-status" style="font-size: 0.8rem; color: #999; transition: opacity 0.3s ease;">Sincronizzazione in corso...</div>';
    widgetContainer.appendChild(syncWidget);

    const scheduleWidget = document.createElement('div');
    scheduleWidget.id = 'schedule-widget';
    scheduleWidget.className = 'widget-content';
    scheduleWidget.innerHTML = `<div class="schedule-info"><span id="materia-nome"></span><span id="materia-percentuale"></span></div><div class="progress-bar-container"><div id="materia-progress"></div></div>`;
    widgetContainer.appendChild(scheduleWidget);

    // Gestore per alternare i widget con animazione di dissolvenza
    let currentWidgetIndex = 0;

    // Imposta lo stato iniziale
    syncWidget.classList.add('active');
    statusPill.classList.add('sync-view');
    scheduleWidget.classList.remove('active');

    setInterval(() => {
        const widgets = [syncWidget, scheduleWidget];
        const isScheduleVisible = scheduleWidget.dataset.visible === 'true';
        const isScheduleEnabled = localStorage.getItem('showSchedule') !== 'false';

        // Determina se è necessario cambiare vista
        const shouldSwitch = isScheduleVisible && isScheduleEnabled;
        if (!shouldSwitch && currentWidgetIndex === 0) {
            return; // Se non si deve cambiare e siamo già su sync, non fare nulla
        }

        // 1. Dissolvi l'intera pillola
        statusPill.style.opacity = '0';

        // 2. Attendi la fine della dissolvenza per cambiare il contenuto
        setTimeout(() => {
            let nextWidgetIndex = currentWidgetIndex;
            if (shouldSwitch) {
                nextWidgetIndex = (currentWidgetIndex + 1) % widgets.length;
            } else {
                nextWidgetIndex = 0; // Se l'orario non è più disponibile, forza la vista sync
            }

            // Aggiorna le classi per contenuto e dimensione
            widgets[currentWidgetIndex].classList.remove('active');
            widgets[nextWidgetIndex].classList.add('active');

            if (nextWidgetIndex === 0) {
                statusPill.classList.add('sync-view');
            } else {
                statusPill.classList.remove('sync-view');
            }

            currentWidgetIndex = nextWidgetIndex;

            // 3. Fai riapparire la pillola (la transizione CSS su larghezza e opacità farà il resto)
            statusPill.style.opacity = '1';

        }, 400); // Deve corrispondere alla durata della transizione in CSS

    }, 30000);

    // Caricamento Impostazioni
    const savedFont = localStorage.getItem('clockFont') || 'Montserrat';
    const savedWeight = localStorage.getItem('clockWeight') || '400';
    const savedBackground = localStorage.getItem('clockBackground') || 'automatico';
    const showOffset = localStorage.getItem('showOffset') === 'true';
    const showSchedule = localStorage.getItem('showSchedule') !== 'false';
    applyFont(savedFont, savedWeight);
    applyBackground(savedBackground);
    if (fontSelect) fontSelect.value = savedFont;
    if (weightSelect) weightSelect.value = savedWeight;
    if (backgroundSelect) backgroundSelect.value = savedBackground;
    const showOffsetToggle = document.getElementById('showOffsetToggle');
    if (showOffsetToggle) showOffsetToggle.checked = showOffset;
    const showScheduleToggle = document.getElementById('showScheduleToggle');
    if (showScheduleToggle) showScheduleToggle.checked = showSchedule;

    toggleWeightSelect(savedFont);

    if (scheduleIcon) scheduleIcon.addEventListener('click', () => openModal(scheduleModal));
    if (settingsIcon) settingsIcon.addEventListener('click', () => openModal(settingsModal));
    if (infoIcon) infoIcon.addEventListener('click', () => openModal(infoModal));

    function openModal(modal) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }

    function closeModal(modal) {
        overlay.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
            overlay.style.opacity = '';
            modal.style.opacity = '';
            modal.style.transform = '';
        }, 400);
    }

    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => {
            localStorage.setItem('clockFont', fontSelect.value);
            localStorage.setItem('clockWeight', weightSelect.value);
            const selectedBackground = backgroundSelect.value;
            localStorage.setItem('clockBackground', selectedBackground);
            applyBackground(selectedBackground);
            closeModal(settingsModal);
        });
    }

    if (closeScheduleModal) closeScheduleModal.addEventListener('click', () => closeModal(scheduleModal));
    if (closeInfoModal) closeInfoModal.addEventListener('click', () => closeModal(infoModal));
    overlay.addEventListener('click', () => {
        if (settingsModal.style.display === 'block') closeModal(settingsModal);
        else if (infoModal.style.display === 'block') closeModal(infoModal);
        else if (scheduleModal.style.display === 'block') closeModal(scheduleModal);
        else if (calendarModal && calendarModal.style.display === 'block') closeModal(calendarModal);
    });

    if (fontSelect) {
        fontSelect.addEventListener('change', function () {
            toggleWeightSelect(this.value);
            const weight = this.value === 'Montserrat' ? '400' : weightSelect.value;
            applyFont(this.value, weight);
        });
    }
    if (weightSelect) weightSelect.addEventListener('change', () => applyFont(fontSelect.value, weightSelect.value));
    if (forceSyncBtn) forceSyncBtn.addEventListener('click', () => { closeModal(settingsModal); syncTimeWithServer(); });

    // Gestione Toggles
    if (showOffsetToggle) {
        showOffsetToggle.addEventListener('change', (e) => {
            localStorage.setItem('showOffset', e.target.checked);
            // Se siamo in modalità natalizia o stranger things, aggiorna il colore del toggle
            if ((currentBackgroundMode === 'natale' || currentBackgroundMode === 'stranger_things') && eventThemes[currentBackgroundMode]) {
                const toggle = e.target.nextElementSibling;
                const activeColor = currentBackgroundMode === 'natale' ? '#dc2626' : '#800000';
                if (toggle && e.target.checked) {
                    toggle.style.backgroundColor = activeColor;
                } else if (toggle) {
                    toggle.style.backgroundColor = '#ccc';
                }
            }
        });
    }
    if (showScheduleToggle) {
        showScheduleToggle.addEventListener('change', (e) => {
            localStorage.setItem('showSchedule', e.target.checked);
            // Se siamo in modalità natalizia o stranger things, aggiorna il colore del toggle
            if ((currentBackgroundMode === 'natale' || currentBackgroundMode === 'stranger_things') && eventThemes[currentBackgroundMode]) {
                const toggle = e.target.nextElementSibling;
                const activeColor = currentBackgroundMode === 'natale' ? '#dc2626' : '#800000';
                if (toggle && e.target.checked) {
                    toggle.style.backgroundColor = activeColor;
                } else if (toggle) {
                    toggle.style.backgroundColor = '#ccc';
                }
            }
        });
    }

    function applyFont(font, weight = '400') {
        const clock = document.querySelector('.clock');
        const date = document.querySelector('.date');
        const fontFamily = font === 'Montserrat' ? '' : font + ', sans-serif';
        const fontWeight = font === 'Montserrat' ? '' : weight;
        if (clock) { clock.style.fontFamily = fontFamily; clock.style.fontWeight = fontWeight; }
        if (date) { date.style.fontFamily = fontFamily; date.style.fontWeight = fontWeight; }
    }

    function toggleWeightSelect(font) {
        if (weightSelect) weightSelect.style.display = font === 'Montserrat' ? 'none' : 'block';
    }

    // Evidenzia il giorno corrente nella tabella orario
    const currentDay = new Date().getDay(); // 0=dom, 1=lun, ..., 6=sab
    if (currentDay >= 1 && currentDay <= 6) {
        const ths = document.querySelectorAll('#scheduleTable th');
        ths[currentDay - 1].classList.add('current-day');
    }

    syncTimeWithServer();
    updateClock();
    setInterval(updateClock, 1000);

    setInterval(function () {
        if (!isSyncing && lastSyncTime > 0) {
            const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
            const showOffset = localStorage.getItem('showOffset') === 'true';
            const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
            updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync}s fa${offsetText}`, timeSinceSync > 900);
        }
    }, 5000);
});
