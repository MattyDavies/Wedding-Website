// Set the wedding date (July 22, 2028 at 1:00 PM)
const weddingDate = new Date('2028-07-22T13:00:00');

// Update the countdown every second
function updateCountdown() {
    const now = new Date();
    let difference = weddingDate - now;

    if (difference < 0) difference = 0;

    // Calculate years
    const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));
    const remainingAfterYears = difference - (years * 1000 * 60 * 60 * 24 * 365.25);

    // Calculate months
    const months = Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24 * 30.44));
    const remainingAfterMonths = remainingAfterYears - (months * 1000 * 60 * 60 * 24 * 30.44);

    // Calculate days
    const days = Math.floor(remainingAfterMonths / (1000 * 60 * 60 * 24));
    const remainingAfterDays = remainingAfterMonths - (days * 1000 * 60 * 60 * 24);

    // Calculate hours
    const hours = Math.floor(remainingAfterDays / (1000 * 60 * 60));
    const remainingAfterHours = remainingAfterDays - (hours * 1000 * 60 * 60);

    // Calculate minutes
    const minutes = Math.floor(remainingAfterHours / (1000 * 60));
    const remainingAfterMinutes = remainingAfterHours - (minutes * 1000 * 60);

    // Calculate seconds
    const seconds = Math.floor(remainingAfterMinutes / 1000);

    // Update the DOM
    document.getElementById('years').textContent = String(years).padStart(2, '0');
    document.getElementById('months').textContent = String(months).padStart(2, '0');
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update immediately and then every second
updateCountdown();
setInterval(updateCountdown, 1000);

// Venue slider logic
function setupVenueSlider() {
    const nextBtn = document.getElementById('venueNext');
    const prevBtn = document.getElementById('venuePrev');
    const mainPanel = document.querySelector('.venue-panel-main');
    const locationPanel = document.querySelector('.venue-panel-location');

    if (nextBtn && prevBtn && mainPanel && locationPanel) {
        nextBtn.addEventListener('click', () => {
            mainPanel.classList.remove('active');
            locationPanel.classList.add('active');
        });
        prevBtn.addEventListener('click', () => {
            locationPanel.classList.remove('active');
            mainPanel.classList.add('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', setupVenueSlider); 