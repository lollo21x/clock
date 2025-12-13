// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC4BeTTqlO-OC6FMDZgwCRtWf5bd87VAd8",
    authDomain: "clock-4d.firebaseapp.com",
    projectId: "clock-4d",
    storageBucket: "clock-4d.firebasestorage.app",
    messagingSenderId: "196886932100",
    appId: "1:196886932100:web:e0a6552a5295ffd7f3f0d1",
    measurementId: "G-F971VVG20Y"
};

let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Variabili globali per gestire l'offset e la sincronizzazione
let serverTimeOffset = 0;
let lastSyncTime = 0;
let isSyncing = false;
let currentBackgroundMode = 'automatico'; // 'automatico' o un valore di colore

// Event management variables
let currentEditingEventId = null;
let selectedVolunteers = [];

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
            const buttons = ['backIcon', 'scheduleIcon', 'settingsIcon', 'infoIcon', 'calendarIcon', 'eventsCalendarIcon'];
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
            const eventsCalendarIcon = document.getElementById('eventsCalendarIcon');
            if (eventsCalendarIcon) {
                eventsCalendarIcon.style.backgroundColor = '#1b912b';
                eventsCalendarIcon.style.color = 'white';
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
            const buttons = ['backIcon', 'scheduleIcon', 'settingsIcon', 'infoIcon', 'calendarIcon', 'eventsCalendarIcon'];
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
            const eventsCalendarIcon = document.getElementById('eventsCalendarIcon');
            if (eventsCalendarIcon) {
                eventsCalendarIcon.style.backgroundColor = '#1b912b';
                eventsCalendarIcon.style.color = 'white';
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
    checkExpiredEvents();
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

    // Set theme color CSS variable
    let themeColor = '#1b912b'; // Default Green
    if (color === 'natale') {
        themeColor = '#dc2626'; // Christmas Red
    } else if (color === 'stranger_things') {
        themeColor = '#800000'; // Stranger Things Dark Red
    }
    document.documentElement.style.setProperty('--theme-color', themeColor);

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

// --- FIREBASE EVENT MANAGEMENT FUNCTIONS ---

// Validate passcode based on current time
function validatePasscode(input) {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Calculate passcode: (HH - 4) and (MM + 4)
    // Subtract 4 from hours
    hours = hours - 4;

    // Handle negative hours (previous day)
    if (hours < 0) {
        hours = hours + 24;
    }

    // Add 4 to minutes (with modulo 60, but don't affect hours)
    minutes = (minutes + 4) % 60;

    // Format as 4-digit string with leading zeros
    const passcode = String(hours).padStart(2, '0') + String(minutes).padStart(2, '0');

    console.log(`Current time: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}, Expected passcode: ${passcode}, Input: ${input}`);

    return input === passcode;
}

// Save event to Firebase
async function saveEvent(eventData) {
    try {
        if (currentEditingEventId) {
            // Update existing event
            await db.collection('events').doc(currentEditingEventId).update({
                ...eventData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Event updated successfully');
        } else {
            // Create new event
            await db.collection('events').add({
                ...eventData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Event created successfully');
        }
        return true;
    } catch (error) {
        console.error('Error saving event:', error);
        return false;
    }
}

// Delete event from Firebase
async function deleteEvent(eventId) {
    try {
        await db.collection('events').doc(eventId).delete();
        console.log('Event deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        return false;
    }
}

// Get upcoming events within specified days
async function getUpcomingEvents(daysAhead = 7) {
    try {
        const now = new Date();
        const todayStr = formatDateForStorage(now);

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = formatDateForStorage(futureDate);

        console.log(`Fetching events from ${todayStr} to ${futureDateStr}`);

        const snapshot = await db.collection('events')
            .where('date', '>=', todayStr)
            .where('date', '<=', futureDateStr)
            .get();

        const events = [];
        snapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time
        events.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.timeSlot.localeCompare(b.timeSlot);
        });

        console.log(`Found ${events.length} events:`, events);
        return events;
    } catch (error) {
        console.error('Error getting events:', error);
        return [];
    }
}

// Get all events (for management view)
async function getAllEvents() {
    try {
        const now = new Date();
        const todayStr = formatDateForStorage(now);

        const snapshot = await db.collection('events')
            .where('date', '>=', todayStr)
            .get();

        const events = [];
        snapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time
        events.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.timeSlot.localeCompare(b.timeSlot);
        });

        return events;
    } catch (error) {
        console.error('Error getting all events:', error);
        return [];
    }
}

// Check for expired events and delete them immediately
async function checkExpiredEvents() {
    const now = new Date();
    const todayStr = formatDateForStorage(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    try {
        // Get events for today
        const snapshot = await db.collection('events')
            .where('date', '==', todayStr)
            .get();

        if (snapshot.empty) return;

        const batch = db.batch();
        let hasDeletions = false;

        snapshot.docs.forEach(doc => {
            const event = doc.data();
            const timeSlot = event.timeSlot;
            if (timeSlot) {
                const endTime = parseTimeSlotEndTime(timeSlot);
                if (endTime && currentMinutes > endTime) {
                    console.log(`Event ${event.subject} expired at ${Math.floor(endTime / 60)}:${endTime % 60}. Deleting...`);
                    batch.delete(doc.ref);
                    hasDeletions = true;
                }
            }
        });

        if (hasDeletions) {
            await batch.commit();
            console.log('Expired events deleted.');
            // Update UI if needed
            updateEventsWidget();
        }
    } catch (error) {
        console.error('Error checking expired events:', error);
    }
}

function parseTimeSlotEndTime(timeSlot) {
    try {
        // Format: "8:15-9:15"
        const parts = timeSlot.split('-');
        if (parts.length !== 2) return null;

        const endPart = parts[1].trim();
        const [hours, minutes] = endPart.split(':').map(Number);

        return hours * 60 + minutes;
    } catch (e) {
        return null;
    }
}

// Cleanup old events (before today)
async function cleanupOldEvents() {
    try {
        const now = new Date();
        const todayStr = formatDateForStorage(now);

        console.log(`Cleaning up events before ${todayStr}...`);

        const snapshot = await db.collection('events')
            .where('date', '<', todayStr)
            .get();

        if (snapshot.empty) {
            console.log('No old events to clean up.');
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Successfully deleted ${snapshot.size} old events.`);
    } catch (error) {
        console.error('Error cleaning up old events:', error);
    }
}

// Format date for storage (YYYY-MM-DD)
function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display with relative day labels
function formatEventDisplay(event) {
    const eventDate = new Date(event.date + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel;
    if (eventDate.getTime() === today.getTime()) {
        dayLabel = 'oggi';
    } else if (eventDate.getTime() === tomorrow.getTime()) {
        dayLabel = 'domani';
    } else {
        const daysOfWeek = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
        dayLabel = daysOfWeek[eventDate.getDay()];
    }

    const typeLabel = event.type === 'interrogazione' ? 'Interrogazione' : 'Verifica';
    return `${typeLabel} di ${event.subject.toLowerCase()} ${dayLabel}`;
}

// Get relative day label for grouping
function getRelativeDayLabel(dateStr) {
    const eventDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (eventDate.getTime() === today.getTime()) {
        return 'Oggi';
    } else if (eventDate.getTime() === tomorrow.getTime()) {
        return 'Domani';
    } else {
        const daysOfWeek = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        return daysOfWeek[eventDate.getDay()];
    }
}

// Render events list in management modal
async function renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    const events = await getAllEvents();

    if (events.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nessun evento programmato</p>';
        return;
    }

    // Group events by day
    const eventsByDay = {};
    events.forEach(event => {
        const dayLabel = getRelativeDayLabel(event.date);
        if (!eventsByDay[dayLabel]) {
            eventsByDay[dayLabel] = [];
        }
        eventsByDay[dayLabel].push(event);
    });

    // Render grouped events
    eventsList.innerHTML = '';
    Object.keys(eventsByDay).forEach(dayLabel => {
        const dayGroup = document.createElement('div');
        dayGroup.className = 'event-day-group';

        const dayLabelEl = document.createElement('div');
        dayLabelEl.className = 'event-day-label';
        dayLabelEl.textContent = dayLabel;
        dayGroup.appendChild(dayLabelEl);

        eventsByDay[dayLabel].forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.onclick = () => openEventForm(event.id, event);

            eventItem.innerHTML = `
                <div class="event-item-type">${event.type}</div>
                <div class="event-item-subject">${event.subject}</div>
                <div class="event-item-details">${event.timeSlot}${event.volunteers && event.volunteers.length > 0 ? ` • ${event.volunteers.length} volontari` : ''}</div>
        `;

            dayGroup.appendChild(eventItem);
        });

        eventsList.appendChild(dayGroup);
    });
}

// Update events widget in pill
async function updateEventsWidget() {
    const eventsWidget = document.getElementById('events-widget');
    if (!eventsWidget) return;

    const events = await getUpcomingEvents(7);

    if (events.length === 0) {
        eventsWidget.innerHTML = '<div class="event-pill-summary">Nessuna verifica a breve</div>';
    } else {
        const nextEvent = events[0];
        const summary = formatEventDisplay(nextEvent);
        eventsWidget.innerHTML = `<div class="event-pill-summary">${summary}</div>`;
    }
}

// Update expanded events view
async function updateExpandedEventsView() {
    const eventsWidget = document.getElementById('events-widget');
    if (!eventsWidget) return;

    const events = await getUpcomingEvents(7);
    const displayEvents = events.slice(0, 3); // Max 3 events

    if (displayEvents.length === 0) {
        eventsWidget.innerHTML = '<div class="event-pill-summary">Nessuna verifica a breve</div>';
        return;
    }

    // Group events by day
    const eventsByDay = {};
    displayEvents.forEach(event => {
        const dayLabel = getRelativeDayLabel(event.date);
        if (!eventsByDay[dayLabel]) {
            eventsByDay[dayLabel] = [];
        }
        eventsByDay[dayLabel].push(event);
    });

    // Sort events within each day by timeSlot (chronological order)
    Object.keys(eventsByDay).forEach(dayLabel => {
        eventsByDay[dayLabel].sort((a, b) => {
            // Extract start time from timeSlot (format: "8:15-9:15")
            const getStartTime = (timeSlot) => {
                const startTime = timeSlot.split('-')[0]; // Get "8:15"
                const [hours, minutes] = startTime.split(':').map(Number);
                return hours * 60 + minutes; // Convert to minutes for comparison
            };
            return getStartTime(a.timeSlot) - getStartTime(b.timeSlot);
        });
    });

    let html = '<div class="events-expanded-list">';
    let animationDelay = 0.1;

    Object.keys(eventsByDay).forEach(dayLabel => {
        html += `<div class="event-pill-day-group">`;
        html += `<div class="event-pill-day-label">${dayLabel}</div>`;
        eventsByDay[dayLabel].forEach(event => {
            const typeClass = event.type === 'interrogazione' ? 'type-interrogazione' : 'type-verifica';
            const typeLabel = event.type === 'interrogazione' ? 'Interrogazione' : 'Verifica';

            html += `
                <div class="event-pill-item ${typeClass}" style="animation-delay: ${animationDelay}s" onclick="window.openEventPreview({id: '${event.id}', type: '${event.type}', subject: '${event.subject}', date: '${event.date}', timeSlot: '${event.timeSlot}', volunteers: ${JSON.stringify(event.volunteers || []).replace(/"/g, '&quot;')}})">
                    <div class="event-pill-item-header">
                        <div class="event-pill-item-subject">${event.subject}</div>
                        <div class="event-pill-item-type-badge">${typeLabel}</div>
                    </div>
                    <div class="event-pill-item-details">
                        <i class="far fa-clock"></i> ${event.timeSlot}
                        ${event.volunteers && event.volunteers.length > 0 ? `<span style="margin-left: 8px; font-size: 0.8rem;"><i class="fas fa-user-friends"></i> ${event.volunteers.length}</span>` : ''}
                    </div>
                </div>
            `;
            animationDelay += 0.1;
        });
        html += `</div>`;
    });

    // Add Calendar Button
    html += `<button class="open-calendar-btn" onclick="window.openMonthCalendar()">Apri calendario</button>`;

    html += '</div>';

    eventsWidget.innerHTML = html;
}



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

    const eventsCalendarIcon = document.getElementById('eventsCalendarIcon');
    if (eventsCalendarIcon) {
        eventsCalendarIcon.addEventListener('click', () => {
            window.openMonthCalendar();
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
        infoContent.innerHTML = 'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' + 'Sincronizzato per garantire la massima precisione.' + '<br><br>' + 'Creato da <a href="https://lollo.dpdns.org/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v3.3';
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

    // Create events widget (third widget for cycling)
    const eventsWidget = document.createElement('div');
    eventsWidget.id = 'events-widget';
    eventsWidget.className = 'widget-content';
    eventsWidget.innerHTML = '<div class="event-pill-summary">Caricamento eventi...</div>';
    widgetContainer.appendChild(eventsWidget);

    // Initialize events widget
    updateEventsWidget();

    // Gestore per alternare i widget con animazione di dissolvenza
    let currentWidgetIndex = 0;
    let isPillExpanded = false;

    // Imposta lo stato iniziale
    syncWidget.classList.add('active');
    statusPill.classList.add('sync-view');
    scheduleWidget.classList.remove('active');
    eventsWidget.classList.remove('active');

    // Pill click handler for expansion - FLIP Animation
    statusPill.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (!isPillExpanded) {
            isPillExpanded = true;

            // 1. Lock current dimensions & styles
            const startRect = statusPill.getBoundingClientRect();
            const startWidth = startRect.width;
            const startHeight = startRect.height;
            const startStyle = window.getComputedStyle(statusPill);
            const startBorderRadius = startStyle.borderRadius;

            statusPill.style.width = startWidth + 'px';
            statusPill.style.height = startHeight + 'px';
            statusPill.style.borderRadius = startBorderRadius;
            statusPill.style.maxWidth = 'none';
            statusPill.style.maxHeight = 'none';
            statusPill.style.minHeight = '0';
            // Disable transitions to prevent interference during setup
            statusPill.style.transition = 'none';

            // 2. Fade out content
            widgetContainer.style.transition = 'opacity 0.15s ease';
            widgetContainer.style.opacity = '0';

            setTimeout(async () => {
                // 3. Prepare target state (invisible)
                // We must disable transitions GLOBALLY on the element to measure correctly
                statusPill.style.transition = 'none';

                syncWidget.classList.remove('active');
                scheduleWidget.classList.remove('active');
                eventsWidget.classList.remove('active');
                statusPill.classList.remove('sync-view', 'schedule-view');

                statusPill.classList.add('expanded');
                eventsWidget.classList.add('active');

                await updateExpandedEventsView();

                // 4. Measure target dimensions
                // CRITICAL: Clear constraints so we measure what the CSS class actually dictates
                statusPill.style.maxWidth = '';
                statusPill.style.maxHeight = '';
                statusPill.style.minHeight = ''; // Clear min-height to allow CSS min-height to apply
                statusPill.style.width = 'auto';
                statusPill.style.height = 'auto';
                statusPill.style.borderRadius = '';

                // Force reflow to ensure we get the correct auto dimensions without transitions
                statusPill.offsetHeight;

                const targetRect = statusPill.getBoundingClientRect();
                const targetWidth = targetRect.width;
                const targetHeight = targetRect.height;
                const targetStyle = window.getComputedStyle(statusPill);
                const targetBorderRadius = targetStyle.borderRadius;

                // 5. Re-apply start dimensions immediately
                statusPill.style.width = startWidth + 'px';
                statusPill.style.height = startHeight + 'px';
                statusPill.style.borderRadius = startBorderRadius;
                statusPill.style.maxWidth = 'none';
                statusPill.style.maxHeight = 'none';
                statusPill.style.minHeight = '0'; // Re-lock min-height for animation

                // Force reflow
                statusPill.offsetHeight;

                // 6. Animate to target
                // Enable transition explicitly for the animation
                statusPill.style.transition = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                statusPill.style.width = targetWidth + 'px';
                statusPill.style.height = targetHeight + 'px';
                statusPill.style.borderRadius = targetBorderRadius;

                // 7. Fade in content
                setTimeout(() => {
                    widgetContainer.style.transition = 'opacity 0.3s ease';
                    widgetContainer.style.opacity = '1';
                }, 200);

                // 8. Cleanup after animation
                setTimeout(() => {
                    // CRITICAL: Disable transition to prevent "squash" effect when reverting to CSS
                    statusPill.style.transition = 'none';

                    // Clear all inline styles to let CSS take over
                    statusPill.style.width = '';
                    statusPill.style.height = '';
                    statusPill.style.borderRadius = '';
                    statusPill.style.maxWidth = '';
                    statusPill.style.maxHeight = '';
                    statusPill.style.minHeight = '';

                    // Force reflow to apply these changes instantly without animation
                    statusPill.offsetHeight;

                    // Restore CSS transitions for future interactions
                    statusPill.style.transition = '';
                }, 600);

            }, 150);
        }
    });

    // Click outside to collapse - FLIP Animation
    document.addEventListener('click', function (e) {
        if (isPillExpanded && !statusPill.contains(e.target)) {
            isPillExpanded = false;

            // 1. Lock current dimensions
            const startRect = statusPill.getBoundingClientRect();
            const startWidth = startRect.width;
            const startHeight = startRect.height;
            const startStyle = window.getComputedStyle(statusPill);
            const startBorderRadius = startStyle.borderRadius;

            statusPill.style.width = startWidth + 'px';
            statusPill.style.height = startHeight + 'px';
            statusPill.style.borderRadius = startBorderRadius;
            statusPill.style.maxWidth = 'none';
            statusPill.style.maxHeight = 'none';
            statusPill.style.minHeight = '0';
            statusPill.style.transition = 'none';

            // 2. Fade out content
            widgetContainer.style.transition = 'opacity 0.15s ease';
            widgetContainer.style.opacity = '0';

            setTimeout(() => {
                // 3. Prepare target state
                // Disable transitions for measurement
                statusPill.style.transition = 'none';

                const widgets = [syncWidget, scheduleWidget, eventsWidget];
                eventsWidget.classList.remove('active');
                widgets[currentWidgetIndex].classList.add('active');

                if (currentWidgetIndex === 0) {
                    statusPill.classList.add('sync-view');
                } else {
                    statusPill.classList.remove('sync-view');
                }

                if (currentWidgetIndex === 2) {
                    updateEventsWidget();
                }

                statusPill.classList.remove('expanded');

                // 4. Measure target dimensions
                statusPill.style.maxWidth = '';
                statusPill.style.maxHeight = '';
                statusPill.style.minHeight = ''; // Clear min-height to allow CSS min-height (50px) to apply
                statusPill.style.width = 'auto';
                statusPill.style.height = 'auto';
                statusPill.style.borderRadius = '';

                // Force reflow
                statusPill.offsetHeight;

                const targetRect = statusPill.getBoundingClientRect();
                const targetWidth = targetRect.width;
                // Force 50px height for collapsed state as requested
                const targetHeight = 50;
                const targetStyle = window.getComputedStyle(statusPill);
                const targetBorderRadius = targetStyle.borderRadius;

                // 5. Re-apply start dimensions
                statusPill.style.width = startWidth + 'px';
                statusPill.style.height = startHeight + 'px';
                statusPill.style.borderRadius = startBorderRadius;
                statusPill.style.maxWidth = 'none';
                statusPill.style.maxHeight = 'none';
                statusPill.style.minHeight = '0'; // Re-lock min-height for animation

                // Force reflow
                statusPill.offsetHeight;

                // 6. Animate to target
                statusPill.style.transition = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                statusPill.style.width = targetWidth + 'px';
                statusPill.style.height = targetHeight + 'px';
                statusPill.style.borderRadius = targetBorderRadius;

                // 7. Fade in content
                setTimeout(() => {
                    widgetContainer.style.transition = 'opacity 0.3s ease';
                    widgetContainer.style.opacity = '1';
                }, 200);

                // 8. Cleanup
                setTimeout(() => {
                    // CRITICAL: Disable transition to prevent "squash" effect when reverting to CSS
                    statusPill.style.transition = 'none';

                    statusPill.style.width = '';
                    statusPill.style.height = '';
                    statusPill.style.borderRadius = '';
                    statusPill.style.maxWidth = '';
                    statusPill.style.maxHeight = '';
                    statusPill.style.minHeight = '';

                    // Force reflow to apply these changes instantly without animation
                    statusPill.offsetHeight;

                    statusPill.style.transition = '';
                }, 600);

            }, 150);
        }
    });

    setInterval(() => {
        // Don't cycle if pill is expanded
        if (isPillExpanded) return;

        const widgets = [syncWidget, scheduleWidget, eventsWidget];
        const isScheduleVisible = scheduleWidget.dataset.visible === 'true';
        const isScheduleEnabled = localStorage.getItem('showSchedule') !== 'false';

        // 1. Dissolvi SOLO il contenuto (widgetContainer), la pillola resta visibile
        widgetContainer.style.opacity = '0';

        // 2. Attendi la fine della dissolvenza per cambiare il contenuto
        setTimeout(() => {
            // Determine next widget based on availability
            let nextWidgetIndex;

            if (isScheduleVisible && isScheduleEnabled) {
                // Cycle through all three widgets
                nextWidgetIndex = (currentWidgetIndex + 1) % widgets.length;
            } else {
                // Only cycle between sync and events (skip schedule)
                // If current is sync (0), next is events (2)
                // If current is events (2), next is sync (0)
                // If current is schedule (1), it should skip to events (2) or sync (0)
                if (currentWidgetIndex === 0) {
                    nextWidgetIndex = 2; // From sync to events
                } else { // currentWidgetIndex is 1 (schedule) or 2 (events)
                    nextWidgetIndex = 0; // From schedule/events to sync
                }
            }

            // Aggiorna le classi per contenuto e dimensione
            widgets.forEach((widget, index) => {
                if (index === nextWidgetIndex) {
                    widget.classList.add('active');
                } else {
                    widget.classList.remove('active');
                }
            });

            if (nextWidgetIndex === 0) {
                statusPill.classList.add('sync-view');
            } else {
                statusPill.classList.remove('sync-view');
            }

            // Update events widget if it's being shown
            if (nextWidgetIndex === 2) {
                updateEventsWidget();
            }

            currentWidgetIndex = nextWidgetIndex;

            // 3. Fai riapparire il contenuto
            widgetContainer.style.opacity = '1';

        }, 300); // Tempo per la dissolvenza del contenuto


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

    const closePreviewModal = document.getElementById('closePreviewModal');
    const eventPreviewModal = document.getElementById('eventPreviewModal');

    // Track where the preview was opened from to handle "Back" navigation
    let previewSource = null; // 'pill' or 'dayDetail'

    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', () => {
            closeModal(eventPreviewModal, previewSource === 'dayDetail'); // Keep overlay if going back to day detail
            if (previewSource === 'dayDetail') {
                openModal(dayDetailModal);
            }
        });
    }

    // Function to open event preview modal
    window.openEventPreview = function (event, source = 'pill') {
        previewSource = source;
        const modal = document.getElementById('eventPreviewModal');
        if (!modal) return;

        document.getElementById('previewSubject').textContent = event.subject;

        // Set Chip
        const chip = document.getElementById('previewTypeChip');
        chip.textContent = event.type === 'interrogazione' ? 'Interrogazione' : 'Verifica';
        chip.className = 'preview-type-chip ' + (event.type === 'interrogazione' ? 'interrogazione' : 'verifica');

        // Countdown Logic
        const now = new Date();
        const eventDate = new Date(event.date + 'T00:00:00');
        // If event has time, use it for more precision? For now, date based is safer for "days remaining"
        // But user asked for hours if today.

        // Parse timeSlot start time
        let eventTime = new Date(eventDate);
        if (event.timeSlot) {
            const startTime = event.timeSlot.split('-')[0];
            const [hours, minutes] = startTime.split(':').map(Number);
            eventTime.setHours(hours, minutes, 0, 0);
        }

        const diffMs = eventTime - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        let countdownText = '';
        if (diffDays > 1) {
            countdownText = `Mancano ${diffDays} giorni`;
        } else if (diffDays === 1) {
            countdownText = `Manca 1 giorno`;
        } else if (diffDays === 0 || (diffDays < 0 && diffHours > 0)) {
            // Today
            if (diffHours > 1) countdownText = `Mancano ${diffHours} ore`;
            else if (diffHours === 1) countdownText = `Manca 1 ora`;
            else countdownText = `Evento in corso o appena passato`;
        } else {
            countdownText = `Evento passato`;
        }

        document.getElementById('previewCountdown').textContent = countdownText;

        // Format date: "Lunedì 12 Dicembre"
        const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        document.getElementById('previewDate').textContent = eventDate.toLocaleDateString('it-IT', dateOptions);

        document.getElementById('previewTime').textContent = event.timeSlot;

        const volunteersSection = document.getElementById('previewVolunteersSection');
        const volunteersList = document.getElementById('previewVolunteersList');

        if (event.type === 'interrogazione' && event.volunteers && event.volunteers.length > 0) {
            volunteersSection.style.display = 'block';
            volunteersList.innerHTML = '';
            event.volunteers.forEach(volunteer => {
                const li = document.createElement('li');
                li.className = 'preview-volunteer-item';
                li.textContent = volunteer;
                volunteersList.appendChild(li);
            });
        } else {
            volunteersSection.style.display = 'none';
        }

        // If opening from Day Detail, we need to close Day Detail first (but keep overlay)
        if (source === 'dayDetail') {
            closeModal(dayDetailModal, true);
        }

        openModal(modal);
    };

    // --- MONTHLY CALENDAR LOGIC ---
    let currentCalendarDate = new Date();
    const monthCalendarModal = document.getElementById('monthCalendarModal');
    const closeMonthCalendarModal = document.getElementById('closeMonthCalendarModal');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    // Day Detail Modal
    const dayDetailModal = document.getElementById('dayDetailModal');
    const closeDayDetailModal = document.getElementById('closeDayDetailModal');
    const dayDetailTitle = document.getElementById('dayDetailTitle');
    const dayDetailList = document.getElementById('dayDetailList');

    if (closeDayDetailModal) {
        closeDayDetailModal.addEventListener('click', () => {
            closeModal(dayDetailModal, true); // Keep overlay
            openModal(monthCalendarModal); // Go back to calendar
        });
    }

    if (closeMonthCalendarModal) {
        closeMonthCalendarModal.addEventListener('click', () => closeModal(monthCalendarModal));
    }

    async function changeMonth(offset) {
        const grid = document.getElementById('monthCalendarGrid');
        const title = document.getElementById('calendarMonthYear');
        const calendarBody = document.querySelector('.calendar-body'); // Get container to lock height

        // Add transition if not present
        if (!grid.style.transition) grid.style.transition = 'opacity 0.2s ease';
        if (!title.style.transition) title.style.transition = 'opacity 0.2s ease';
        // Add height transition to body
        if (!calendarBody.style.transition) calendarBody.style.transition = 'height 0.2s ease';

        // 1. Lock current height
        const oldHeight = calendarBody.offsetHeight;
        calendarBody.style.height = oldHeight + 'px';
        calendarBody.style.overflow = 'hidden'; // Prevent scrollbar jump

        // 2. Fade out
        grid.style.opacity = '0';
        title.style.opacity = '0';

        // Wait for fade out
        await new Promise(r => setTimeout(r, 200));

        // 3. Update date and render (invisible but takes up space)
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
        await renderMonthCalendar();

        // 4. Measure new height
        // Temporarily unlock height to measure natural height
        calendarBody.style.height = 'auto';
        const newHeight = calendarBody.offsetHeight;
        // Re-lock to old height immediately
        calendarBody.style.height = oldHeight + 'px';

        // Force reflow
        calendarBody.offsetHeight;

        // 5. Animate to new height using requestAnimationFrame for robustness
        requestAnimationFrame(() => {
            calendarBody.style.height = newHeight + 'px';
        });

        // 6. Fade in
        grid.style.opacity = '1';
        title.style.opacity = '1';

        // 7. Unlock height after transition
        // Wait slightly longer than transition to be safe
        setTimeout(() => {
            calendarBody.style.height = '';
            calendarBody.style.overflow = '';
            calendarBody.style.transition = ''; // Clean up transition
        }, 250);
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
    }

    window.openMonthCalendar = function () {
        currentCalendarDate = new Date(); // Reset to today
        renderMonthCalendar();
        openModal(monthCalendarModal);
    };

    async function renderMonthCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        // Update Header
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;

        const grid = document.getElementById('monthCalendarGrid');
        grid.innerHTML = '';

        // Get events for this month
        // Note: getAllEvents fetches everything from today onwards. 
        // We might need to fetch ALL events or filter client side if we have them.
        // For simplicity, let's assume getAllEvents returns enough, or we fetch specifically.
        // Actually, getAllEvents filters '>= today'. So past events in current month might be missing.
        // Let's modify getAllEvents to just get everything or accept a range?
        // For now, let's just use what we have.
        const events = await getAllEvents();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Adjust for Monday start (0 = Sunday, 1 = Monday)
        let startDay = firstDay.getDay();
        if (startDay === 0) startDay = 7; // Make Sunday 7

        // Empty cells before first day
        for (let i = 1; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day-cell empty';
            grid.appendChild(emptyCell);
        }

        // Days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.className = 'calendar-day-cell';
            cell.textContent = day;

            // Check if today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = new Date(year, month, day);

            // Check if past (before today)
            if (cellDate < today) {
                cell.classList.add('disabled');
            }

            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                cell.classList.add('today');
            }

            // Find events for this day
            const dayEvents = events.filter(e => e.date === dateStr);

            if (dayEvents.length > 0) {
                // Add indicator if not disabled (or even if disabled? User said "fino allo ieri... disabilitati". 
                // Usually past events are still interesting, but user said "disabilitati, quindi non premibili".
                // So if disabled, maybe no dots? Or dots but no click?
                // Let's keep dots but no click if disabled.

                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'event-dots-container';

                const hasInterrogazione = dayEvents.some(e => e.type === 'interrogazione');
                const hasVerifica = dayEvents.some(e => e.type === 'verifica');

                if (hasInterrogazione) {
                    const dot = document.createElement('div');
                    dot.className = 'event-dot interrogazione';
                    dotsContainer.appendChild(dot);
                }
                if (hasVerifica) {
                    const dot = document.createElement('div');
                    dot.className = 'event-dot verifica';
                    dotsContainer.appendChild(dot);
                }
                cell.appendChild(dotsContainer);

                // Click handler only if not disabled
                if (cellDate >= today) {
                    cell.classList.add('has-events');
                    cell.onclick = () => {
                        openDayDetailModal(cellDate, dayEvents);
                    };
                }
            }

            grid.appendChild(cell);
        }
    }

    function openDayDetailModal(date, events) {
        // Format date title: "12 Dicembre 2025" (No weekday)
        const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        dayDetailTitle.textContent = date.toLocaleDateString('it-IT', dateOptions);

        dayDetailList.innerHTML = '';

        // Sort events by time
        events.sort((a, b) => {
            const getStartTime = (timeSlot) => {
                const startTime = timeSlot.split('-')[0];
                const [hours, minutes] = startTime.split(':').map(Number);
                return hours * 60 + minutes;
            };
            return getStartTime(a.timeSlot) - getStartTime(b.timeSlot);
        });

        events.forEach(event => {
            const typeLabel = event.type === 'interrogazione' ? 'Interrogazione' : 'Verifica';
            const typeClass = event.type === 'interrogazione' ? 'type-interrogazione' : 'type-verifica';

            const item = document.createElement('div');
            item.className = `day-detail-item ${typeClass}`;
            item.onclick = () => {
                // Open preview with source 'dayDetail'
                window.openEventPreview({
                    id: event.id,
                    type: event.type,
                    subject: event.subject,
                    date: event.date,
                    timeSlot: event.timeSlot,
                    volunteers: event.volunteers || []
                }, 'dayDetail');
            };

            item.innerHTML = `
                <div class="event-pill-item-header">
                    <div class="event-pill-item-subject">${event.subject}</div>
                    <div class="event-pill-item-type-badge">${typeLabel}</div>
                </div>
                <div class="event-pill-item-details">
                    <i class="far fa-clock"></i> ${event.timeSlot}
                    ${event.volunteers && event.volunteers.length > 0 ? `<span style="margin-left: 8px; font-size: 0.8rem;"><i class="fas fa-user-friends"></i> ${event.volunteers.length}</span>` : ''}
                </div>
            `;

            dayDetailList.appendChild(item);
        });

        // Close calendar (keep overlay) and open day detail
        closeModal(monthCalendarModal, true);
        openModal(dayDetailModal);
    }

    function openModal(modal) {
        overlay.style.display = 'block';

        // Set initial state for smooth animation
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';

        modal.style.display = 'block';
        // Force reflow to ensure transition works if display changed from none
        modal.offsetHeight;

        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }

    function closeModal(modal, keepOverlay = false) {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';

        if (!keepOverlay) {
            overlay.style.opacity = '0';
        }

        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '';
            modal.style.transform = '';

            if (!keepOverlay) {
                overlay.style.display = 'none';
                overlay.style.opacity = '';
            }
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
        else if (eventPreviewModal && eventPreviewModal.style.display === 'block') {
            closeModal(eventPreviewModal, previewSource === 'dayDetail');
            if (previewSource === 'dayDetail') {
                openModal(dayDetailModal);
            }
        }
        else if (monthCalendarModal && monthCalendarModal.style.display === 'block') closeModal(monthCalendarModal);
        else if (passcodeModal && passcodeModal.style.display === 'block') closeModal(passcodeModal);
        else if (eventManagementModal && eventManagementModal.style.display === 'block') closeModal(eventManagementModal);
        else if (eventFormModal && eventFormModal.style.display === 'block') closeModal(eventFormModal);
        else if (dayDetailModal && dayDetailModal.style.display === 'block') {
            closeModal(dayDetailModal, true);
            openModal(monthCalendarModal);
        }
        else if (volunteersModal && volunteersModal.style.display === 'block') closeModal(volunteersModal);
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

    // --- EVENT MANAGEMENT MODAL HANDLERS ---

    const editEventsBtn = document.getElementById('editEventsBtn');
    const passcodeModal = document.getElementById('passcodeModal');
    const passcodeInput = document.getElementById('passcodeInput');
    const passcodeError = document.getElementById('passcodeError');
    const submitPasscode = document.getElementById('submitPasscode');
    const cancelPasscode = document.getElementById('cancelPasscode');

    const eventManagementModal = document.getElementById('eventManagementModal');
    const newEventBtn = document.getElementById('newEventBtn');
    const closeEventManagement = document.getElementById('closeEventManagement');

    const eventFormModal = document.getElementById('eventFormModal');
    const eventFormTitle = document.getElementById('eventFormTitle');
    const typeOptions = document.querySelectorAll('.type-option');
    const eventSubject = document.getElementById('eventSubject');
    const eventDate = document.getElementById('eventDate');
    const eventTimeSlot = document.getElementById('eventTimeSlot');
    const volunteersGroup = document.getElementById('volunteersGroup');
    const selectVolunteersBtn = document.getElementById('selectVolunteersBtn');
    const selectedVolunteersList = document.getElementById('selectedVolunteersList');
    const saveEventBtn = document.getElementById('saveEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');

    const volunteersModal = document.getElementById('volunteersModal');
    const cancelVolunteers = document.getElementById('cancelVolunteers');
    const confirmVolunteers = document.getElementById('confirmVolunteers');

    // Open passcode modal when clicking "Modifica eventi"
    if (editEventsBtn) {
        editEventsBtn.addEventListener('click', () => {
            closeModal(settingsModal);
            setTimeout(() => {
                // Bypass passcode
                openEventManagementModal();
                // openModal(passcodeModal);
                // passcodeInput.value = '';
                // passcodeError.style.display = 'none';
                // setTimeout(() => passcodeInput.focus(), 100);
            }, 400);
        });
    }

    // Submit passcode
    if (submitPasscode) {
        submitPasscode.addEventListener('click', () => {
            const inputValue = passcodeInput.value.trim();
            if (validatePasscode(inputValue)) {
                closeModal(passcodeModal);
                setTimeout(() => {
                    openEventManagementModal();
                }, 400);
            } else {
                passcodeError.style.display = 'block';
                passcodeInput.value = '';
                passcodeInput.focus();
            }
        });
    }

    // Allow Enter key to submit passcode
    if (passcodeInput) {
        passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitPasscode.click();
            }
        });

        // Only allow numbers
        passcodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }

    if (cancelPasscode) {
        cancelPasscode.addEventListener('click', () => {
            closeModal(passcodeModal);
        });
    }

    // Open event management modal
    async function openEventManagementModal() {
        await renderEventsList();
        openModal(eventManagementModal);
    }

    // Close event management modal
    if (closeEventManagement) {
        closeEventManagement.addEventListener('click', () => {
            closeModal(eventManagementModal);
        });
    }

    // Open new event form
    if (newEventBtn) {
        newEventBtn.addEventListener('click', () => {
            openEventForm();
        });
    }

    // Open event form (create or edit mode)
    function openEventForm(eventId = null, eventData = null) {
        currentEditingEventId = eventId;
        selectedVolunteers = [];

        if (eventId && eventData) {
            // Edit mode
            eventFormTitle.textContent = 'Modifica Evento';
            deleteEventBtn.style.display = 'block';

            // Set form values
            typeOptions.forEach(option => {
                if (option.dataset.type === eventData.type) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            eventSubject.value = eventData.subject || '';
            eventDate.value = eventData.date || '';
            eventTimeSlot.value = eventData.timeSlot || '';

            if (eventData.type === 'interrogazione') {
                volunteersGroup.style.display = 'block';
                selectedVolunteers = eventData.volunteers || [];
                updateSelectedVolunteersDisplay();
            } else {
                volunteersGroup.style.display = 'none';
            }
        } else {
            // Create mode
            eventFormTitle.textContent = 'Nuovo Evento';
            deleteEventBtn.style.display = 'none';

            // Reset form
            typeOptions.forEach(option => {
                if (option.dataset.type === 'interrogazione') {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            eventSubject.value = '';
            eventDate.value = '';
            eventTimeSlot.value = '';
            volunteersGroup.style.display = 'block';
            selectedVolunteers = [];
            updateSelectedVolunteersDisplay();
        }

        closeModal(eventManagementModal);
        setTimeout(() => {
            openModal(eventFormModal);
        }, 400);
    }

    // Make openEventForm available globally for event item clicks
    window.openEventForm = openEventForm;

    // Type toggle handler
    typeOptions.forEach(option => {
        option.addEventListener('click', () => {
            typeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            if (option.dataset.type === 'interrogazione') {
                volunteersGroup.style.display = 'block';
            } else {
                volunteersGroup.style.display = 'none';
            }
        });
    });

    // Open volunteers selection modal
    if (selectVolunteersBtn) {
        selectVolunteersBtn.addEventListener('click', () => {
            // Populate checkboxes with current selection
            const checkboxes = volunteersModal.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectedVolunteers.includes(checkbox.value);
            });

            // Close event form modal and open volunteers modal
            closeModal(eventFormModal);
            setTimeout(() => {
                openModal(volunteersModal);
            }, 400);
        });
    }

    // Confirm volunteers selection
    if (confirmVolunteers) {
        confirmVolunteers.addEventListener('click', () => {
            const checkboxes = volunteersModal.querySelectorAll('input[type="checkbox"]:checked');
            selectedVolunteers = Array.from(checkboxes).map(cb => cb.value);
            updateSelectedVolunteersDisplay();

            // Close volunteers modal and reopen event form
            closeModal(volunteersModal);
            setTimeout(() => {
                openModal(eventFormModal);
            }, 400);
        });
    }

    // Cancel volunteers selection
    if (cancelVolunteers) {
        cancelVolunteers.addEventListener('click', () => {
            // Close volunteers modal and reopen event form
            closeModal(volunteersModal);
            setTimeout(() => {
                openModal(eventFormModal);
            }, 400);
        });
    }

    // Cancel event form
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', () => {
            closeModal(eventFormModal);
        });
    }

    // Update selected volunteers display
    function updateSelectedVolunteersDisplay() {
        if (selectedVolunteers.length === 0) {
            selectedVolunteersList.innerHTML = '';
            if (selectVolunteersBtn) {
                selectVolunteersBtn.textContent = 'Seleziona volontari...';
            }
        } else {
            if (selectVolunteersBtn) {
                selectVolunteersBtn.textContent = `${selectedVolunteers.length} volontari selezionati`;
            }
            selectedVolunteersList.innerHTML = selectedVolunteers.map(name => {
                return `<div class="volunteer-tag">${name}</div>`;
            }).join('');
        }
    }

    // Save event
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', async () => {
            // Validate form
            const selectedType = document.querySelector('.type-option.active').dataset.type;
            const subject = eventSubject.value;
            const date = eventDate.value;
            const timeSlot = eventTimeSlot.value;

            if (!subject || !date || !timeSlot) {
                alert('Per favore compila tutti i campi obbligatori');
                return;
            }

            // Prepare event data
            const eventData = {
                type: selectedType,
                subject: subject,
                date: date,
                timeSlot: timeSlot,
                volunteers: selectedType === 'interrogazione' ? selectedVolunteers : []
            };

            // Save to Firebase
            const success = await saveEvent(eventData);

            if (success) {
                closeModal(eventFormModal);
                setTimeout(async () => {
                    await openEventManagementModal();
                    updateEventsWidget(); // Refresh pill display
                }, 400);
            } else {
                alert('Errore durante il salvataggio dell\'evento. Riprova.');
            }
        });
    }

    // Delete event
    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', async () => {
            if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                const success = await deleteEvent(currentEditingEventId);

                if (success) {
                    closeModal(eventFormModal);
                    setTimeout(async () => {
                        await openEventManagementModal();
                        updateEventsWidget(); // Refresh pill display
                    }, 400);
                } else {
                    alert('Errore durante l\'eliminazione dell\'evento. Riprova.');
                }
            }
        });
    }

    syncTimeWithServer();
    updateClock();
    setInterval(updateClock, 1000);

    // Auto-cleanup old events
    cleanupOldEvents();

    setInterval(function () {
        if (!isSyncing && lastSyncTime > 0) {
            const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
            const showOffset = localStorage.getItem('showOffset') === 'true';
            const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
            updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync}s fa${offsetText} `, timeSinceSync > 900);
        }
    }, 5000);
});
