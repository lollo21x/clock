// Utilizziamo direttamente l'API di timeapi.io che supporta JSONP (funziona anche in ambiente locale)
let serverTimeOffset = 0;
let lastSyncTime = 0;

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
    if (currentTime - lastSyncTime > 3600000) { // 1 ora in millisecondi
        syncTimeWithServer();
    }
}

// Funzione per sincronizzare l'ora con il server utilizzando timeapi.io via JSONP
function syncTimeWithServer() {
    // Crea un elemento script per la richiesta JSONP
    const script = document.createElement('script');
    script.src = 'https://timeapi.io/api/Time/current/zone?timeZone=Europe/Rome&callback=processTimeResponse';
    document.body.appendChild(script);
    
    // Dopo che lo script è stato utilizzato, lo rimuoviamo
    script.onload = function() {
        document.body.removeChild(script);
    };
    
    // Aggiorna l'ultimo tempo di sincronizzazione
    lastSyncTime = Date.now();
}

// Questa funzione sarà chiamata dalla risposta JSONP
window.processTimeResponse = function(data) {
    try {
        // Creiamo un oggetto data dal timestamp server
        const localTime = new Date();
        const serverTime = new Date(data.dateTime);
        
        // Calcoliamo l'offset
        serverTimeOffset = serverTime.getTime() - localTime.getTime();
        
        console.log('Sincronizzazione completata. Offset:', serverTimeOffset, 'ms');
        console.log('Ora server:', serverTime.toLocaleTimeString('it-IT'));
        console.log('Ora locale:', localTime.toLocaleTimeString('it-IT'));
        
        // Aggiorna immediatamente l'orologio con il nuovo offset
        updateClock();
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error);
    }
};

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
            'Sincronizzato con TimeAPI.io per garantire la massima precisione.' +
            '<br><br>' +
            'Creato da <a href="https://lollo.framer.website" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v1.1';
    }
    
    if (githubIcon) {
        githubIcon.addEventListener('click', function() {
            window.open('https://github.com/lollo21x/clock', '_blank');
        });
    }
    
    if (backIcon) {
        backIcon.addEventListener('click', function() {
            window.location.href = 'https://lollo21x.github.io/hub3d/';
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
    
    // Sincronizza subito l'ora con il server
    syncTimeWithServer();
    
    // Avvia l'orologio comunque (verrà aggiornato appena arriva la risposta del server)
    updateClock();
    setInterval(updateClock, 1000);
    
    // Aggiungi indicatore di stato per debug
    const clockContainer = document.querySelector('.clock-container');
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'sync-status';
    statusIndicator.style.fontSize = '0.8rem';
    statusIndicator.style.color = '#999';
    statusIndicator.style.marginTop = '10px';
    statusIndicator.innerHTML = 'Sincronizzazione in corso...';
    clockContainer.appendChild(statusIndicator);
    
    // Aggiorna l'indicatore ogni 5 secondi
    setInterval(function() {
        const status = document.getElementById('sync-status');
        if (status) {
            const timeSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
            if (serverTimeOffset !== 0) {
                status.innerHTML = `Ultimo aggiornamento: ${timeSinceSync} secondi fa (offset: ${serverTimeOffset}ms)`;
                status.style.color = timeSinceSync > 3600 ? '#ff6b6b' : '#52b788';
            } else {
                status.innerHTML = 'Sincronizzazione in corso...';
                status.style.color = '#ffa500';
            }
        }
    }, 5000);
});
