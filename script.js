function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Europe/Rome' };
    
    const hours = now.toLocaleString('it-IT', { ...options, hour: '2-digit' });
    const minutes = String(now.toLocaleString('it-IT', { ...options, minute: 'numeric' })).padStart(2, '0');
    const seconds = String(now.toLocaleString('it-IT', { ...options, second: 'numeric' })).padStart(2, '0');
    
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Europe/Rome'
    };
    
    const dateStr = now.toLocaleDateString('it-IT', dateOptions);
    document.getElementById('date').textContent = dateStr;
}

document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    const githubIcon = document.getElementById('githubIcon');
    const infoIcon = document.getElementById('infoIcon');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    
    const infoContent = document.querySelector('#infoModal p');
    if (infoContent) {
        infoContent.innerHTML = 
            'Questo orologio digitale mostra l\'ora esatta di Roma (Italia) con precisione al secondo. ' +
            'Utilizza il fuso orario Europe/Rome e si aggiorna automaticamente.' +
            '<br><br>' +
            'Creato da <a href="https://lollo.framer.website" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">lollo21</a> - v1.0';
    }
    
    if (githubIcon) {
        githubIcon.addEventListener('click', function() {
            window.open('https://github.com/lollo21x/clock', '_blank');
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
});

updateClock();
setInterval(updateClock, 1000);
