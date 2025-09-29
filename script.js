// Variabili globali per gestire l'offset e la sincronizzazione
let serverTimeOffset = 0;
let lastSyncTime = 0;
let isSyncing = false;

// --- IMPOSTAZIONI ORARIO SCOLASTICO ---
const orarioScolastico = {
    1: ["Scienze", "Scienze", "Italiano", "Matematica", "Informatica", "Religione"], // Lunedì (+ Test Religione)
    2: ["Arte", "Matematica", "Matematica", "Fisica", "Inglese"],
    3: ["Informatica", "Scienze", "Italiano", "Italiano", "Storia"],
    4: ["Fisica", "Scienze", "Scienze", "Inglese", "Arte"],
    5: ["Ginnastica", "Ginnastica", "Matematica", "Italiano", "Inglese"],
    6: ["Storia", "Religione", "Fisica", "Filosofia", "Filosofia"]
};

const materiaColori = {
    "Arte": "#D81B60",
    "Ginnastica": "#8D6E63",
    "Fisica": "#43A047",
    "Informatica": "#424242",
    "Inglese": "#1E88E5",
    "Italiano": "#0D47A1",
    "Matematica": "#D32F2F",
    "Storia": "#880E4F",
    "Scienze": "#6A1B9A",
    "Filosofia": "#FB8C00",
    "Religione": "#F9A825", // Giallo Scuro
    "Ricreazione": "#757575"
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
                
                const color = materiaColori[materia] || "#000000";
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
            updateSyncStatus('Errore di sincronizzazione. Mantenendo orario precedente.', true);
        }
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error);
        updateSyncStatus('Errore di sincronizzazione. Mantenendo orario precedente.', true);
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
            status.style.color = isError ? '#ff6b6b' : '#1b912b';
            status.style.opacity = '1';
        }, 150);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    const githubIcon = document.getElementById('githubIcon');
    const backIcon = document.getElementById('backIcon');
    const settingsIcon = document.getElementById('settingsIcon');
    const infoIcon = document.getElementById('infoIcon');
    const settingsModal = document.getElementById('settingsModal');
    const infoModal = document.getElementById('infoModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const fontSelect = document.getElementById('fontSelect');
    const weightSelect = document.getElementById('weightSelect');
    const backgroundSelect = document.getElementById('backgroundSelect');
    const forceSyncBtn = document.getElementById('forceSync');
    
    const infoContent = document.querySelector('#infoModal p');
    if (infoContent) {
        infoContent.innerHTML = 'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' + 'Sincronizzato per garantire la massima precisione.' + '<br><br>' + 'Creato da <a href="https://lollo.dpdns.org/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v2.2';
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
    const savedBackground = localStorage.getItem('clockBackground') || '#f8f9fa';
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
            localStorage.setItem('clockBackground', backgroundSelect.value);
            applyBackground(backgroundSelect.value);
            closeModal(settingsModal);
        });
    }

    if (closeInfoModal) closeInfoModal.addEventListener('click', () => closeModal(infoModal));
    overlay.addEventListener('click', () => {
        if (settingsModal.style.display === 'block') closeModal(settingsModal);
        else if (infoModal.style.display === 'block') closeModal(infoModal);
    });

    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            toggleWeightSelect(this.value);
            const weight = this.value === 'Montserrat' ? '400' : weightSelect.value;
            applyFont(this.value, weight);
        });
    }
    if (weightSelect) weightSelect.addEventListener('change', () => applyFont(fontSelect.value, weightSelect.value));
    if (forceSyncBtn) forceSyncBtn.addEventListener('click', () => { closeModal(settingsModal); syncTimeWithServer(); });
    
    // Gestione Toggles
    if (showOffsetToggle) showOffsetToggle.addEventListener('change', (e) => localStorage.setItem('showOffset', e.target.checked));
    if (showScheduleToggle) showScheduleToggle.addEventListener('change', (e) => localStorage.setItem('showSchedule', e.target.checked));
    
    function applyFont(font, weight = '400') {
        const clock = document.querySelector('.clock');
        const date = document.querySelector('.date');
        const fontFamily = font === 'Montserrat' ? '' : font + ', sans-serif';
        const fontWeight = font === 'Montserrat' ? '' : weight;
        if (clock) { clock.style.fontFamily = fontFamily; clock.style.fontWeight = fontWeight; }
        if (date) { date.style.fontFamily = fontFamily; date.style.fontWeight = fontWeight; }
    }

    function applyBackground(color) {
        document.body.style.backgroundColor = color;
        const pill = document.getElementById('status-pill');
        if (pill) pill.style.backgroundColor = color === '#ffffff' ? '#f8f9fa' : 'white';
    }

    function toggleWeightSelect(font) {
        if (weightSelect) weightSelect.style.display = font === 'Montserrat' ? 'none' : 'block';
    }
    
    syncTimeWithServer();
    updateClock();
    setInterval(updateClock, 1000);
    
    setInterval(function() {
        if (!isSyncing && lastSyncTime > 0) {
            const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
            const showOffset = localStorage.getItem('showOffset') === 'true';
            const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
            updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync}s fa${offsetText}`, timeSinceSync > 900);
        }
    }, 5000);
});
