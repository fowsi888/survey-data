// Survey Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('surveyForm');
    const successMessage = document.getElementById('successMessage');

    // Info Search checkboxes handling (max 5)
    const infoSearchCheckboxes = document.querySelectorAll('input[name="infoSearch"]');
    const infoSearchCounter = document.getElementById('infoSearchCounter');
    const infoSearchOtherContainer = document.getElementById('infoSearchOtherContainer');
    const MAX_INFO_SEARCH = 5;

    // Info Source checkboxes handling (at least 1 required)
    const infoSourceCheckboxes = document.querySelectorAll('input[name="infoSource"]');
    const infoSourceCounter = document.getElementById('infoSourceCounter');
    const infoSourceOtherContainer = document.getElementById('infoSourceOtherContainer');

    // AI Services checkboxes handling (max 3)
    const aiServicesCheckboxes = document.querySelectorAll('input[name="aiServices"]');
    const aiServicesCounter = document.getElementById('aiServicesCounter');
    const aiServicesOtherContainer = document.getElementById('aiServicesOtherContainer');
    const MAX_AI_SERVICES = 3;

    // Interface preference other field
    const interfaceRadios = document.querySelectorAll('input[name="interfacePreference"]');
    const interfaceOtherContainer = document.getElementById('interfaceOtherContainer');

    // Update counter and enforce limits for Info Search
    function updateInfoSearchCounter() {
        const checked = Array.from(infoSearchCheckboxes).filter(cb => cb.checked);
        const count = checked.length;
        infoSearchCounter.textContent = `Valittu: ${count}/${MAX_INFO_SEARCH}`;

        if (count === MAX_INFO_SEARCH) {
            infoSearchCounter.classList.add('success');
            infoSearchCounter.classList.remove('warning');
        } else if (count > MAX_INFO_SEARCH) {
            infoSearchCounter.classList.add('warning');
            infoSearchCounter.classList.remove('success');
        } else {
            infoSearchCounter.classList.remove('success', 'warning');
        }

        // Disable unchecked boxes if limit reached
        infoSearchCheckboxes.forEach(cb => {
            if (!cb.checked && count >= MAX_INFO_SEARCH) {
                cb.disabled = true;
                cb.parentElement.style.opacity = '0.5';
            } else {
                cb.disabled = false;
                cb.parentElement.style.opacity = '1';
            }
        });

        // Show/hide "other" field
        const muuChecked = checked.find(cb => cb.value === 'muu');
        if (muuChecked) {
            infoSearchOtherContainer.style.display = 'block';
        } else {
            infoSearchOtherContainer.style.display = 'none';
        }
    }

    // Update counter for Info Source (at least 1 required)
    function updateInfoSourceCounter() {
        const checked = Array.from(infoSourceCheckboxes).filter(cb => cb.checked);
        const count = checked.length;
        infoSourceCounter.textContent = `Valittu: ${count}`;

        if (count > 0) {
            infoSourceCounter.classList.add('success');
            infoSourceCounter.classList.remove('warning');
        } else {
            infoSourceCounter.classList.remove('success', 'warning');
        }

        // Show/hide "other" field
        const muuChecked = checked.find(cb => cb.value === 'muu');
        if (muuChecked) {
            infoSourceOtherContainer.style.display = 'block';
        } else {
            infoSourceOtherContainer.style.display = 'none';
        }
    }

    // Update counter and enforce limits for AI Services
    function updateAIServicesCounter() {
        const checked = Array.from(aiServicesCheckboxes).filter(cb => cb.checked);
        const count = checked.length;
        aiServicesCounter.textContent = `Valittu: ${count}/${MAX_AI_SERVICES}`;

        if (count === MAX_AI_SERVICES) {
            aiServicesCounter.classList.add('success');
            aiServicesCounter.classList.remove('warning');
        } else if (count > MAX_AI_SERVICES) {
            aiServicesCounter.classList.add('warning');
            aiServicesCounter.classList.remove('success');
        } else {
            aiServicesCounter.classList.remove('success', 'warning');
        }

        // Disable unchecked boxes if limit reached
        aiServicesCheckboxes.forEach(cb => {
            if (!cb.checked && count >= MAX_AI_SERVICES) {
                cb.disabled = true;
                cb.parentElement.style.opacity = '0.5';
            } else {
                cb.disabled = false;
                cb.parentElement.style.opacity = '1';
            }
        });

        // Show/hide "other" field
        const muuChecked = checked.find(cb => cb.value === 'muu');
        if (muuChecked) {
            aiServicesOtherContainer.style.display = 'block';
        } else {
            aiServicesOtherContainer.style.display = 'none';
        }
    }

    // Handle interface preference "other" field
    function updateInterfaceOther() {
        const selectedValue = Array.from(interfaceRadios).find(r => r.checked)?.value;
        if (selectedValue === 'muu') {
            interfaceOtherContainer.style.display = 'block';
        } else {
            interfaceOtherContainer.style.display = 'none';
        }
    }

    // Add event listeners
    infoSearchCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateInfoSearchCounter);
    });

    infoSourceCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateInfoSourceCounter);
    });

    aiServicesCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateAIServicesCounter);
    });

    interfaceRadios.forEach(radio => {
        radio.addEventListener('change', updateInterfaceOther);
    });

    // Initialize counters
    updateInfoSearchCounter();
    updateInfoSourceCounter();
    updateAIServicesCounter();

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

        // Validate Info Search selection
        const infoSearchChecked = Array.from(infoSearchCheckboxes).filter(cb => cb.checked);
        if (infoSearchChecked.length !== MAX_INFO_SEARCH) {
            alert(`Valitse täsmälleen ${MAX_INFO_SEARCH} vaihtoehtoa tiedonhaku-osiosta.`);
            return;
        }

        // Validate Info Source selection (at least 1)
        const infoSourceChecked = Array.from(infoSourceCheckboxes).filter(cb => cb.checked);
        if (infoSourceChecked.length === 0) {
            alert('Valitse vähintään yksi vaihtoehto tietolähteet-osiosta.');
            return;
        }

        // Validate AI Services selection
        const aiServicesChecked = Array.from(aiServicesCheckboxes).filter(cb => cb.checked);
        if (aiServicesChecked.length !== MAX_AI_SERVICES) {
            alert(`Valitse täsmälleen ${MAX_AI_SERVICES} vaihtoehtoa tekoälypalvelut-osiosta.`);
            return;
        }

        // Validate "other" fields if "muu" is selected
        if (infoSearchChecked.find(cb => cb.value === 'muu')) {
            const otherValue = document.getElementById('infoSearchOther').value.trim();
            if (!otherValue) {
                alert('Kerro tarkemmin, mitä muuta tietoa etsit.');
                return;
            }
        }

        if (infoSourceChecked.find(cb => cb.value === 'muu')) {
            const otherValue = document.getElementById('infoSourceOther').value.trim();
            if (!otherValue) {
                alert('Kerro tarkemmin, mistä muualta haet tietoa.');
                return;
            }
        }

        if (aiServicesChecked.find(cb => cb.value === 'muu')) {
            const otherValue = document.getElementById('aiServicesOther').value.trim();
            if (!otherValue) {
                alert('Kerro tarkemmin, mikä muu ominaisuus kiinnostaisi.');
                return;
            }
        }

        const interfaceValue = Array.from(interfaceRadios).find(r => r.checked)?.value;
        if (interfaceValue === 'muu') {
            const otherValue = document.getElementById('interfaceOther').value.trim();
            if (!otherValue) {
                alert('Kerro tarkemmin, millainen käyttöliittymä miellyttäisi sinua.');
                return;
            }
        }

        // Collect form data
        const formData = {
            age: document.getElementById('age').value,
            gender: document.querySelector('input[name="gender"]:checked').value,
            education: document.getElementById('education').value,
            occupation: document.getElementById('occupation').value,
            visitFrequency: document.querySelector('input[name="visitFrequency"]:checked').value,
            infoSearch: infoSearchChecked.map(cb => cb.value),
            infoSearchOther: document.getElementById('infoSearchOther').value || '',
            infoSource: infoSourceChecked.map(cb => cb.value),
            infoSourceOther: document.getElementById('infoSourceOther').value || '',
            aiServices: aiServicesChecked.map(cb => cb.value),
            aiServicesOther: document.getElementById('aiServicesOther').value || '',
            interfacePreference: interfaceValue,
            interfaceOther: document.getElementById('interfaceOther').value || ''
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

    // Smooth scroll for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
