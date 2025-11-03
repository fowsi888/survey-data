// Survey Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('surveyForm');
    const successMessage = document.getElementById('successMessage');

    // Form validation and submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate GDPR Consent
        const gdprConsent = document.getElementById('gdprConsent');
        if (!gdprConsent.checked) {
            alert('Sinun täytyy hyväksyä tietosuojaseloste jatkaaksesi.');
            gdprConsent.focus();
            return;
        }

        // Validate all questions are answered
        const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
        for (const question of questions) {
            const answered = document.querySelector(`input[name="${question}"]:checked`);
            if (!answered) {
                alert('Ole hyvä ja vastaa kaikkiin kysymyksiin ennen lähettämistä.');
                return;
            }
        }

        // Collect form data
        const formData = {
            q1: document.querySelector('input[name="q1"]:checked').value,
            q2: document.querySelector('input[name="q2"]:checked').value,
            q3: document.querySelector('input[name="q3"]:checked').value,
            q4: document.querySelector('input[name="q4"]:checked').value,
            q5: document.querySelector('input[name="q5"]:checked').value,
            q6: document.querySelector('input[name="q6"]:checked').value
        };

        // Submit form
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Lähetetään...';

            const response = await fetch('/api/submit-survey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Survey submitted successfully:', result);

                // Hide form and show success message
                form.style.display = 'none';
                successMessage.style.display = 'block';

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('Failed to submit survey');
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
            alert('Virhe vastausten lähettämisessä. Yritä uudelleen.');

            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Lähetä vastaukset';
        }
    });
});
