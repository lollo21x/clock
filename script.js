// Variabili globali per gestire l'offset e la sincronizzazione
let serverTimeOffset = 0;
let lastSyncTime = 0;
let isSyncing = false;
let syncRetries = 0;
const MAX_RETRIES = 3;

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
    
    // Verifica se è necessario risincronizzare (ogni ora)
    const currentTime = Date.now();
    if (currentTime - lastSyncTime > 3600000 && !isSyncing) { // 1 ora in millisecondi
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

// Metodo fallback che utilizza l'ora del browser corretta
function useLocalTimeFallback() {
    console.log('Utilizzando l\'ora locale come fallback');
    serverTimeOffset = 0;
    updateSyncStatus('Ora locale in uso (no sincronizzazione server)', true);
    lastSyncTime = Date.now();
    syncRetries = 0;
    return true;
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
            syncRetries = 0;
            updateSyncStatus(`Sincronizzato con il server (offset: ${serverTimeOffset}ms)`);
        } else {
            // Se fallisce, prova con time.is
            const timeIsSuccess = await syncWithTimeis();
            
            if (timeIsSuccess) {
                lastSyncTime = Date.now();
                syncRetries = 0;
                updateSyncStatus(`Sincronizzato con time.is (offset: ${serverTimeOffset}ms)`);
            } else {
                // Se entrambi falliscono, incrementa i tentativi
                syncRetries++;
                
                if (syncRetries >= MAX_RETRIES) {
                    // Dopo troppi tentativi, usa l'ora locale
                    useLocalTimeFallback();
                } else {
                    // Riprova tra poco
                    updateSyncStatus(`Errore di sincronizzazione. Tentativo ${syncRetries}/${MAX_RETRIES}. Riprovo tra 10 secondi...`, true);
                    setTimeout(syncTimeWithServer, 10000);
                }
            }
        }
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error);
        syncRetries++;
        
        if (syncRetries >= MAX_RETRIES) {
            useLocalTimeFallback();
        } else {
            updateSyncStatus(`Errore di sincronizzazione. Tentativo ${syncRetries}/${MAX_RETRIES}. Riprovo tra 10 secondi...`, true);
            setTimeout(syncTimeWithServer, 10000);
        }
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

// Funzione per aggiornare lo stato della sincronizzazione nell'UI
function updateSyncStatus(message, isError = false) {
    const status = document.getElementById('sync-status');
    if (status) {
        status.innerHTML = message;
        status.style.color = isError ? '#ff6b6b' : '#52b788';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    const githubIcon = document.getElementById('githubIcon');
    const backIcon = document.getElementById('backIcon');
    const infoIcon = document.getElementById('infoIcon');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    
    const infoContent = document.querySelector('#infoModal p');
    if (infoContent) {
        infoContent.innerHTML = 
            'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' +
            'Sincronizzato per garantire la massima precisione.' +
            '<br><br>' +
            'Creato da <a href="https://lollo.dpdns.org/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v1.1';
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
    
    if (infoIcon) {
        infoIcon.addEventListener('click', function() {
            overlay.style.display = 'block';
            infoModal.style.display = 'block';
        });
    }
    
    if (closeInfoModal) {
        closeInfoModal.addEventListener('click', function() {
            overlay.style.display = 'none';
            infoModal.style.display = 'none';
        });
    }
    
    overlay.addEventListener('click', function() {
        overlay.style.display = 'none';
        infoModal.style.display = 'none';
    });
    
    // Crea indicatore di stato se non esiste
    const clockContainer = document.querySelector('.clock-container');
    let statusIndicator = document.getElementById('sync-status');
    
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'sync-status';
        statusIndicator.style.fontSize = '0.8rem';
        statusIndicator.style.color = '#999';
        statusIndicator.style.marginTop = '10px';
        statusIndicator.innerHTML = 'Sincronizzazione in corso...';
        clockContainer.appendChild(statusIndicator);
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
                updateSyncStatus(`Ultimo aggiornamento: ${timeSinceSync} secondi fa (offset: ${serverTimeOffset}ms)`, timeSinceSync > 3600);
            }
        }
    }, 5000);
    
    // Refresh automatico della pagina ogni 30 minuti (1800000 millisecondi)
    setInterval(function() {
        window.location.reload();
    }, 900000);
});
