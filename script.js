// Variabili globali per gestire l'offset e la sincronizzazione
let serverTimeOffset = 0;
let lastSyncTime = 0;
let isSyncing = false;

// Funzione per aggiornare l'orologio
function updateClock() {
    // Ottieni l'ora corrente con l'offset applicato (se disponibile)
    const now = new Date(Date.now() + serverTimeOffset);

    // Estrai le componenti dell'ora
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Aggiorna l'orologio
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;

    // Aggiorna la data
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const dateStr = now.toLocaleDateString('it-IT', dateOptions);
    document.getElementById('date').textContent = dateStr;
    
    // Verifica se è necessario risincronizzare (ogni 15 minuti)
    const currentTime = Date.now();
    if (currentTime - lastSyncTime > 900000 && !isSyncing) { // 15 minuti in millisecondi
        syncTimeWithServer();
    }
}

// Ottieni l'orario dal server utilizzando l'API time.is
async function syncWithTimeis() {
    try {
        updateSyncStatus('Sincronizzazione con time.is...');
        const requestStartTime = Date.now();
        
        // Utilizziamo un proxy CORS per accedere a time.is
        const response = await fetch('https://cors-anywhere.herokuapp.com/https://time.is/');
        
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        const requestEndTime = Date.now();
        
        // Estraiamo il timestamp dalla risposta HTML usando regex
        const match = text.match(/<div id="clock" data-time="(\d+)"/);
        if (match && match[1]) {
            const serverTimestamp = parseInt(match[1]) * 1000; // converte in millisecondi
            const latency = (requestEndTime - requestStartTime) / 2;
            
            // Calcola l'offset
            const localTime = new Date();
            serverTimeOffset = serverTimestamp - localTime.getTime() + latency;
            
            console.log('Sincronizzazione time.is completata. Offset:', serverTimeOffset, 'ms');
            console.log('Latenza stimata:', latency, 'ms');
            
            return true;
        }
        throw new Error('Impossibile estrarre l\'orario da time.is');
    } catch (error) {
        console.error('Errore durante la sincronizzazione con time.is:', error);
        return false;
    }
}



// Funzione principale per sincronizzare l'ora, con diversi metodi
async function syncTimeWithServer() {
    if (isSyncing) return;
    isSyncing = true;
    updateSyncStatus('Sincronizzazione in corso...');

    try {
        // Prova prima con timeapi.io
        const success = await syncWithTimeApi();

        if (success) {
            lastSyncTime = Date.now();
            const showOffset = localStorage.getItem('showOffset') === 'true';
            const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
            updateSyncStatus(`Sincronizzato con il server${offsetText}`);
            const pulse = document.getElementById('pulse-indicator');
            if (pulse) pulse.style.display = 'inline-block';
        } else {
            // Se fallisce, prova con time.is
            const timeIsSuccess = await syncWithTimeis();

            if (timeIsSuccess) {
                lastSyncTime = Date.now();
                const showOffset = localStorage.getItem('showOffset') === 'true';
                const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
                updateSyncStatus(`Sincronizzato con time.is${offsetText}`);
                const pulse = document.getElementById('pulse-indicator');
                if (pulse) pulse.style.display = 'inline-block';
            } else {
                // Se entrambi falliscono, aggiorna il messaggio di errore
                updateSyncStatus('Errore di sincronizzazione. Mantenendo orario precedente.', true);
            }
        }
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error);
        updateSyncStatus('Errore di sincronizzazione. Mantenendo orario precedente.', true);
    } finally {
        isSyncing = false;
    }
}

// Sincronizzazione con timeapi.io usando fetch
async function syncWithTimeApi() {
    try {
        updateSyncStatus('Sincronizzazione con il server...');
        const requestStartTime = Date.now();
        
        // Utilizziamo timeapi.io con fetch invece di JSONP
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Europe/Rome', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const requestEndTime = Date.now();
        
        // Tempo di latenza stimato
        const latency = (requestEndTime - requestStartTime) / 2;
        
        // Calcoliamo l'ora del server
        const serverTime = new Date(data.dateTime);
        const localTime = new Date();
        
        // Calcoliamo l'offset tenendo conto della latenza
        serverTimeOffset = serverTime.getTime() - localTime.getTime() + latency;
        
        console.log('Sincronizzazione con il server completata. Offset:', serverTimeOffset, 'ms');
        console.log('Ora server:', serverTime.toLocaleTimeString('it-IT'));
        console.log('Ora locale:', localTime.toLocaleTimeString('it-IT'));
        console.log('Latenza stimata:', latency, 'ms');
        
        return true;
    } catch (error) {
        console.error('Errore durante la sincronizzazione con il server:', error);
        return false;
    }
}

// Funzione per aggiornare lo stato della sincronizzazione nell'UI con fade
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
    const forceSyncBtn = document.getElementById('forceSync');


    
    const infoContent = document.querySelector('#infoModal p');
    if (infoContent) {
        infoContent.innerHTML =
            'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' +
            'Sincronizzato per garantire la massima precisione.' +
            '<br><br>' +
            'Creato da <a href="https://lollo.dpdns.org/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v2.0';
    }
    
    if (githubIcon) {
        githubIcon.addEventListener('click', function() {
            window.open('https://github.com/lollo21x/clock', '_blank');
        });
    }
    
    if (backIcon) {
        backIcon.addEventListener('click', function() {
            window.location.href = 'https://hub4d.lollo.dpdns.org';
        });
    }
    
    // Load saved settings
    const savedFont = localStorage.getItem('clockFont') || 'Montserrat';
    const savedWeight = localStorage.getItem('clockWeight') || '400';
    const showOffset = localStorage.getItem('showOffset') === 'true';
    applyFont(savedFont, savedWeight);
    if (fontSelect) fontSelect.value = savedFont;
    if (weightSelect) weightSelect.value = savedWeight;
    if (document.getElementById('showOffsetToggle')) document.getElementById('showOffsetToggle').checked = showOffset;

    // Toggle weight select
    toggleWeightSelect(savedFont);

    if (settingsIcon) {
        settingsIcon.addEventListener('click', function() {
            overlay.style.display = 'block';
            settingsModal.style.display = 'block';
            setTimeout(() => {
                overlay.style.opacity = '1';
                settingsModal.style.opacity = '1';
                settingsModal.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
        });
    }

    if (infoIcon) {
        infoIcon.addEventListener('click', function() {
            overlay.style.display = 'block';
            infoModal.style.display = 'block';
            setTimeout(() => {
                overlay.style.opacity = '1';
                infoModal.style.opacity = '1';
                infoModal.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
        });
    }

    function closeModal(modal) {
        overlay.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
            // Reset opacity for next open
            overlay.style.opacity = '';
            modal.style.opacity = '';
            modal.style.transform = '';
        }, 400);
    }

    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => {
            // Save current settings
            const font = fontSelect.value;
            const weight = weightSelect.value;
            localStorage.setItem('clockFont', font);
            localStorage.setItem('clockWeight', weight);
            closeModal(settingsModal);
        });
    }

    if (closeInfoModal) {
        closeInfoModal.addEventListener('click', () => closeModal(infoModal));
    }

    overlay.addEventListener('click', function() {
        if (settingsModal.style.display === 'block') {
            closeModal(settingsModal);
        } else if (infoModal.style.display === 'block') {
            closeModal(infoModal);
        }
    });

    // Settings events
    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            const font = this.value;
            toggleWeightSelect(font);
            const weight = font === 'Montserrat' ? '400' : weightSelect.value;
            applyFont(font, weight);
            localStorage.setItem('clockFont', font);
            if (font !== 'Montserrat') localStorage.setItem('clockWeight', weight);
        });
    }

    if (weightSelect) {
        weightSelect.addEventListener('change', function() {
            const font = fontSelect.value;
            const weight = this.value;
            applyFont(font, weight);
            localStorage.setItem('clockWeight', weight);
        });
    }

    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', function() {
            closeModal(settingsModal);
            syncTimeWithServer();
        });
    }

    const showOffsetToggle = document.getElementById('showOffsetToggle');
    if (showOffsetToggle) {
        showOffsetToggle.addEventListener('change', function() {
            localStorage.setItem('showOffset', this.checked);
            // Update the sync status immediately if synced
            if (lastSyncTime > 0 && !isSyncing) {
                const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
                const showOffset = this.checked;
                const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
                updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync} secondi fa${offsetText}`, timeSinceSync > 900);
            }
        });
    }

    // Also listen on the label for click to ensure it works
    const toggleLabel = document.querySelector('.toggle');
    if (toggleLabel) {
        toggleLabel.addEventListener('click', function() {
            setTimeout(() => {
                const checked = showOffsetToggle.checked;
                localStorage.setItem('showOffset', checked);
                if (lastSyncTime > 0 && !isSyncing) {
                    const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
                    const offsetText = checked ? ` (offset: ${serverTimeOffset}ms)` : '';
                    updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync} secondi fa${offsetText}`, timeSinceSync > 900);
                }
            }, 10);
        });
    }

    function applyFont(font, weight = '400') {
        const clock = document.querySelector('.clock');
        const date = document.querySelector('.date');
        if (font === 'Montserrat') {
            // Default
            if (clock) {
                clock.style.fontFamily = '';
                clock.style.fontWeight = '';
            }
            if (date) {
                date.style.fontFamily = '';
                date.style.fontWeight = '';
            }
        } else {
            if (clock) {
                clock.style.fontFamily = font + ', sans-serif';
                clock.style.fontWeight = weight;
            }
            if (date) {
                date.style.fontFamily = font + ', sans-serif';
                date.style.fontWeight = weight;
            }
        }
    }

    function toggleWeightSelect(font) {
        const weightSelect = document.getElementById('weightSelect');
        if (font === 'Montserrat') {
            weightSelect.style.display = 'none';
        } else {
            weightSelect.style.display = 'block';
        }
    }
    
    // Crea la pillola per status e pulse
    let statusPill = document.getElementById('status-pill');
    if (!statusPill) {
        statusPill = document.createElement('div');
        statusPill.id = 'status-pill';
        statusPill.style.position = 'fixed';
        statusPill.style.bottom = '20px';
        statusPill.style.left = '50%';
        statusPill.style.transform = 'translateX(-50%)';
        statusPill.style.height = '50px';
        statusPill.style.backgroundColor = 'white';
        statusPill.style.borderRadius = '25px';
        statusPill.style.display = 'flex';
        statusPill.style.alignItems = 'center';
        statusPill.style.padding = '0 20px';
        statusPill.style.transition = 'all 0.3s ease-in-out';
        statusPill.style.willChange = 'width';

        document.body.appendChild(statusPill);
    }

    // Crea l'animazione pulse se non esiste
    let pulseIndicator = document.getElementById('pulse-indicator');
    if (!pulseIndicator) {
        pulseIndicator = document.createElement('div');
        pulseIndicator.id = 'pulse-indicator';
        pulseIndicator.className = 'pulse';
        pulseIndicator.style.display = 'none'; // Nascondi inizialmente
        const pulseInner = document.createElement('div');
        pulseInner.className = 'pulse-inner';
        pulseIndicator.appendChild(pulseInner);
        const pulseFixed = document.createElement('div');
        pulseFixed.className = 'pulse-fixed';
        pulseIndicator.appendChild(pulseFixed);
        const pulseContent = document.createElement('div');
        pulseContent.className = 'pulse-content';
        pulseIndicator.appendChild(pulseContent);
        statusPill.appendChild(pulseIndicator);
    }

    // Crea indicatore di stato se non esiste
    let statusIndicator = document.getElementById('sync-status');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'sync-status';
        statusIndicator.style.fontSize = '0.8rem';
        statusIndicator.style.color = '#999';
        statusIndicator.style.transition = 'opacity 0.3s ease';
        statusIndicator.innerHTML = 'Sincronizzazione in corso...';
        statusPill.appendChild(statusIndicator);
    }
    
    // Sincronizza subito l'ora con il server
    syncTimeWithServer();
    
    // Avvia l'orologio comunque (verrà aggiornato appena arriva la risposta del server)
    updateClock();
    setInterval(updateClock, 1000);
    
    // Aggiorna l'indicatore ogni 5 secondi
    setInterval(function() {
        if (!isSyncing) {
            const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
            if (lastSyncTime > 0) {
                const showOffset = localStorage.getItem('showOffset') === 'true';
                const offsetText = showOffset ? ` (offset: ${serverTimeOffset}ms)` : '';
                updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync} secondi fa${offsetText}`, timeSinceSync > 900);
            }
        }
    }, 5000);
    

});
