// Toggle plus one section visibility
function togglePlusOne() {
    const plusOneSelect = document.getElementById('plusOne');
    const plusOneSection = document.getElementById('plusOneSection');
    const plusOneName = document.getElementById('plusOneName');

    if (plusOneSelect.value === 'yes') {
        plusOneSection.style.display = 'block';
        plusOneName.required = true;
    } else {
        plusOneSection.style.display = 'none';
        plusOneName.required = false;
        plusOneName.value = '';
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        guestName: formData.get('guestName'),
        guestEmail: formData.get('guestEmail'),
        hasPlusOne: formData.get('plusOne') === 'yes',
        plusOneName: formData.get('plusOneName'),
        response: formData.get('response'),
        timestamp: new Date().toISOString()
    };

    try {
        // Google Apps Script Web App URL
        const response = await fetch('https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        alert('Thank you for your RSVP! We will be in touch soon.');
        event.target.reset();
        document.getElementById('plusOneSection').style.display = 'none';
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('There was an error submitting your RSVP. Please try again.');
    }

    return false;
} 