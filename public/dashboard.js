// Dashboard Handler
let charts = {};

// Finnish labels mapping
const labelMappings = {
    age: {
        'alle-18': 'Alle 18',
        '18-24': '18-24',
        '25-34': '25-34',
        '35-44': '35-44',
        '45-54': '45-54',
        '55-64': '55-64',
        '65+': '65+'
    },
    gender: {
        'mies': 'Mies',
        'nainen': 'Nainen',
        'muu': 'Muu',
        'en-halua-vastata': 'En halua vastata'
    },
    education: {
        'peruskoulu': 'Peruskoulu',
        'toinen-aste': 'Toinen aste',
        'korkeakoulu': 'Korkeakoulu'
    },
    interface: {
        'kosketusnaytto': 'Kosketusnäyttö',
        'aaniohjaus': 'Ääniohjaus',
        'kehonkieli': 'Kehonkieli',
        'muu': 'Muu'
    },
    visitFrequency: {
        'paivittain': 'Päivittäin',
        'viikoittain': 'Viikoittain',
        'kuukausittain': 'Kuukausittain',
        'harvemmin': 'Harvemmin'
    },
    infoSearch: {
        'tuote': 'Tuotetta',
        'palvelu': 'Palvelua',
        'liike': 'Tiettyä liikettä',
        'aukioloaika': 'Aukioloaikaa',
        'tarjous-tietty': 'Tarjous tietystä tuotteesta',
        'tarjous-paras': 'Parhaimmat tarjoukset',
        'tapahtuma': 'Tapahtumaa',
        'neuvonta': 'Neuvontaa',
        'oheispalvelu': 'Oheispalvelua (WC, hissi...)',
        'pysakointi': 'Pysäköintipaikkaa',
        'muu': 'Muuta'
    },
    infoSource: {
        'nettisivut': 'Kauppakeskuksen nettisivut',
        'mobiilisovellus': 'Mobiilisovellus',
        'infonaytot': 'Infonäytöt',
        'asiakaspalvelu': 'Asiakaspalvelu',
        'henkilokunta': 'Henkilökunta',
        'liike-nettisivut': 'Liikkeiden nettisivut',
        'muu': 'Muualta'
    },
    aiServices: {
        'haku-tuote': 'Haku tuotteen nimellä',
        'haku-liike': 'Haku liikkeen nimellä',
        'paivan-tarjoukset': 'Päivän tarjoukset',
        'raataloidyt-tarjoukset': 'Räätälöidyt tarjoukset',
        'ruokalista': 'Ruokalista',
        'ajanviete': 'Ajanviete',
        'kartta': 'Kauppakeskuksen kartta',
        'muu': 'Muu'
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentUser = document.getElementById('currentUser');

    // Check if already authenticated
    const authStatus = await checkAuthStatus();
    if (authStatus.authenticated) {
        showDashboard(authStatus.username);
    }

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const result = await response.json();
                showDashboard(result.username);
                loginError.style.display = 'none';
            } else {
                const error = await response.json();
                loginError.textContent = 'Virheelliset tunnukset. Yritä uudelleen.';
                loginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Kirjautumisvirhe. Yritä uudelleen.';
            loginError.style.display = 'block';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async function() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth-status');
            return await response.json();
        } catch (error) {
            console.error('Auth status error:', error);
            return { authenticated: false };
        }
    }

    async function showDashboard(username) {
        loginScreen.style.display = 'none';
        dashboardScreen.classList.add('active');
        currentUser.textContent = `Käyttäjä: ${username}`;
        await loadDashboardData();
    }

    async function loadDashboardData() {
        const dashboardLoading = document.getElementById('dashboardLoading');
        const dashboardData = document.getElementById('dashboardData');

        try {
            const response = await fetch('/api/analytics');
            if (!response.ok) throw new Error('Failed to fetch analytics');

            const analytics = await response.json();

            // Update total responses
            document.getElementById('totalResponses').textContent = analytics.total;

            // Create charts
            createAgeChart(analytics.demographics.age);
            createGenderChart(analytics.demographics.gender);
            createEducationChart(analytics.demographics.education);
            createInterfaceChart(analytics.interfacePreference);
            createVisitFrequencyChart(analytics.visitFrequency);
            createInfoSearchChart(analytics.infoSearch);
            createInfoSourceChart(analytics.infoSource);
            createAIServicesChart(analytics.aiServices);

            // Load responses table
            await loadResponsesTable();

            // Load correlation analysis
            await loadCorrelationAnalysis();

            dashboardLoading.style.display = 'none';
            dashboardData.style.display = 'block';
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            dashboardLoading.textContent = 'Virhe ladattaessa dataa. Yritä päivittää sivu.';
        }
    }

    async function loadResponsesTable() {
        try {
            const response = await fetch('/api/responses');
            if (!response.ok) throw new Error('Failed to fetch responses');

            const responses = await response.json();
            const tbody = document.getElementById('responsesTableBody');
            tbody.innerHTML = '';

            responses.slice(0, 50).forEach(resp => {
                const row = document.createElement('tr');
                const timestamp = new Date(resp.timestamp).toLocaleString('fi-FI');

                row.innerHTML = `
                    <td>${resp.id}</td>
                    <td>${labelMappings.age[resp.age] || resp.age}</td>
                    <td>${labelMappings.gender[resp.gender] || resp.gender}</td>
                    <td>${labelMappings.education[resp.education] || resp.education}</td>
                    <td>${resp.occupation}</td>
                    <td>${labelMappings.interface[resp.interface_preference] || resp.interface_preference}</td>
                    <td>${timestamp}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading responses table:', error);
        }
    }

    function createAgeChart(data) {
        const labels = Object.keys(data).map(key => labelMappings.age[key] || key);
        const values = Object.values(data);

        const ctx = document.getElementById('ageChart');
        charts.age = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vastaajien määrä',
                    data: values,
                    backgroundColor: 'rgba(37, 99, 235, 0.8)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function createGenderChart(data) {
        const labels = Object.keys(data).map(key => labelMappings.gender[key] || key);
        const values = Object.values(data);

        const ctx = document.getElementById('genderChart');
        charts.gender = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function createEducationChart(data) {
        const labels = Object.keys(data).map(key => labelMappings.education[key] || key);
        const values = Object.values(data);

        const ctx = document.getElementById('educationChart');
        charts.education = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function createInterfaceChart(data) {
        const labels = Object.keys(data).map(key => labelMappings.interface[key] || key);
        const values = Object.values(data);

        const ctx = document.getElementById('interfaceChart');
        charts.interface = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vastaajien määrä',
                    data: values,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function createVisitFrequencyChart(data) {
        const labels = Object.keys(data).map(key => labelMappings.visitFrequency[key] || key);
        const values = Object.values(data);

        const ctx = document.getElementById('visitFrequencyChart');
        charts.visitFrequency = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function createInfoSearchChart(data) {
        // Sort by count and get top 10
        const sorted = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = sorted.map(([key]) => labelMappings.infoSearch[key] || key);
        const values = sorted.map(([, value]) => value);

        const ctx = document.getElementById('infoSearchChart');
        charts.infoSearch = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valittu kertaa',
                    data: values,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function createInfoSourceChart(data) {
        const sorted = Object.entries(data)
            .sort((a, b) => b[1] - a[1]);

        const labels = sorted.map(([key]) => labelMappings.infoSource[key] || key);
        const values = sorted.map(([, value]) => value);

        const ctx = document.getElementById('infoSourceChart');
        charts.infoSource = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valittu kertaa',
                    data: values,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function createAIServicesChart(data) {
        // Sort by count
        const sorted = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const labels = sorted.map(([key]) => labelMappings.aiServices[key] || key);
        const values = sorted.map(([, value]) => value);

        const ctx = document.getElementById('aiServicesChart');
        charts.aiServices = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valittu kertaa',
                    data: values,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Correlation Analysis Functions
    async function loadCorrelationAnalysis() {
        try {
            const response = await fetch('/api/correlations');
            if (!response.ok) throw new Error('Failed to fetch correlations');

            const correlations = await response.json();

            // Generate insights
            generateInsights(correlations);

            // Create correlation charts
            createAgeVsInterfaceChart(correlations.ageVsInterface);
            createEducationVsInterfaceChart(correlations.educationVsInterface);
            createVisitVsInterfaceChart(correlations.visitFrequencyVsInterface);
            createAgeVsVisitChart(correlations.ageVsVisitFrequency);

            // Display occupation patterns
            displayOccupationPatterns(correlations.occupationPatterns);

        } catch (error) {
            console.error('Error loading correlation analysis:', error);
            document.getElementById('insightsContent').innerHTML =
                '<div style="color: var(--error-color); padding: 20px;">Virhe ladattaessa korrelaatioanalyysiä.</div>';
        }
    }

    function generateInsights(correlations) {
        const insights = [];

        // Analyze occupation patterns for top insights
        const occupations = correlations.occupationPatterns;
        const sortedOccupations = Object.entries(occupations)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);

        sortedOccupations.forEach(([occupation, data]) => {
            if (data.count < 2) return; // Skip if too few responses

            // Find most preferred interface
            const topInterface = Object.entries(data.interface || {})
                .sort((a, b) => b[1] - a[1])[0];

            if (topInterface) {
                const percentage = Math.round((topInterface[1] / data.count) * 100);
                if (percentage >= 50) {
                    insights.push({
                        text: `${percentage}% "${occupation}" -vastaajista valitsee "${labelMappings.interface[topInterface[0]] || topInterface[0]}" käyttöliittymän`,
                        type: 'interface',
                        strength: percentage
                    });
                }
            }

            // Find top AI service preference
            const topAI = Object.entries(data.aiServices || {})
                .sort((a, b) => b[1] - a[1])[0];

            if (topAI && topAI[1] >= data.count * 0.4) {
                const percentage = Math.round((topAI[1] / data.count) * 100);
                insights.push({
                    text: `"${occupation}" -ryhmä hakee erityisesti: ${labelMappings.aiServices[topAI[0]] || topAI[0]} (${percentage}%)`,
                    type: 'service',
                    strength: percentage
                });
            }

            // Find visit frequency pattern
            const topVisit = Object.entries(data.visitFrequency || {})
                .sort((a, b) => b[1] - a[1])[0];

            if (topVisit && topVisit[1] >= data.count * 0.4) {
                const percentage = Math.round((topVisit[1] / data.count) * 100);
                insights.push({
                    text: `"${occupation}" -vastaajista ${percentage}% asioi ${labelMappings.visitFrequency[topVisit[0]].toLowerCase()}`,
                    type: 'visit',
                    strength: percentage
                });
            }
        });

        // Age vs Interface insights
        Object.entries(correlations.ageVsInterface).forEach(([age, interfaces]) => {
            const total = Object.values(interfaces).reduce((sum, val) => sum + val, 0);
            const topInterface = Object.entries(interfaces)
                .sort((a, b) => b[1] - a[1])[0];

            if (topInterface && total >= 3) {
                const percentage = Math.round((topInterface[1] / total) * 100);
                if (percentage >= 60) {
                    insights.push({
                        text: `${labelMappings.age[age] || age} -vuotiaat suosivat erityisesti "${labelMappings.interface[topInterface[0]] || topInterface[0]}" -käyttöliittymää (${percentage}%)`,
                        type: 'age',
                        strength: percentage
                    });
                }
            }
        });

        // Education vs Interface insights
        Object.entries(correlations.educationVsInterface).forEach(([edu, interfaces]) => {
            const total = Object.values(interfaces).reduce((sum, val) => sum + val, 0);
            const topInterface = Object.entries(interfaces)
                .sort((a, b) => b[1] - a[1])[0];

            if (topInterface && total >= 3) {
                const percentage = Math.round((topInterface[1] / total) * 100);
                if (percentage >= 60) {
                    insights.push({
                        text: `${labelMappings.education[edu] || edu} -koulutustason vastaajista ${percentage}% valitsee "${labelMappings.interface[topInterface[0]] || topInterface[0]}"`,
                        type: 'education',
                        strength: percentage
                    });
                }
            }
        });

        // Sort by strength and display top insights
        const topInsights = insights
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 8);

        const insightsHTML = topInsights.length > 0
            ? topInsights.map(insight => `
                <div style="padding: 12px 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; border-radius: 6px; font-size: 0.95rem;">
                    <strong style="color: #0369a1;">📌</strong> ${insight.text}
                </div>
            `).join('')
            : '<div style="padding: 20px; color: var(--text-secondary);">Ei tarpeeksi dataa merkittävien löydösten tunnistamiseen (tarvitaan vähintään 10 vastausta).</div>';

        document.getElementById('insightsContent').innerHTML = insightsHTML;
    }

    function createAgeVsInterfaceChart(data) {
        const ageGroups = Object.keys(data);
        const interfaceTypes = [...new Set(Object.values(data).flatMap(obj => Object.keys(obj)))];

        const datasets = interfaceTypes.map((interfaceType, index) => {
            const colors = [
                'rgba(37, 99, 235, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ];

            return {
                label: labelMappings.interface[interfaceType] || interfaceType,
                data: ageGroups.map(age => data[age][interfaceType] || 0),
                backgroundColor: colors[index % colors.length]
            };
        });

        const ctx = document.getElementById('ageVsInterfaceChart');
        charts.ageVsInterface = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ageGroups.map(age => labelMappings.age[age] || age),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function createEducationVsInterfaceChart(data) {
        const educationLevels = Object.keys(data);
        const interfaceTypes = [...new Set(Object.values(data).flatMap(obj => Object.keys(obj)))];

        const datasets = interfaceTypes.map((interfaceType, index) => {
            const colors = [
                'rgba(37, 99, 235, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ];

            return {
                label: labelMappings.interface[interfaceType] || interfaceType,
                data: educationLevels.map(edu => data[edu][interfaceType] || 0),
                backgroundColor: colors[index % colors.length]
            };
        });

        const ctx = document.getElementById('educationVsInterfaceChart');
        charts.educationVsInterface = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: educationLevels.map(edu => labelMappings.education[edu] || edu),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function createVisitVsInterfaceChart(data) {
        const visitFreqs = Object.keys(data);
        const interfaceTypes = [...new Set(Object.values(data).flatMap(obj => Object.keys(obj)))];

        const datasets = interfaceTypes.map((interfaceType, index) => {
            const colors = [
                'rgba(37, 99, 235, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ];

            return {
                label: labelMappings.interface[interfaceType] || interfaceType,
                data: visitFreqs.map(freq => data[freq][interfaceType] || 0),
                backgroundColor: colors[index % colors.length]
            };
        });

        const ctx = document.getElementById('visitVsInterfaceChart');
        charts.visitVsInterface = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: visitFreqs.map(freq => labelMappings.visitFrequency[freq] || freq),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function createAgeVsVisitChart(data) {
        const ageGroups = Object.keys(data);
        const visitFreqs = [...new Set(Object.values(data).flatMap(obj => Object.keys(obj)))];

        const datasets = visitFreqs.map((visitFreq, index) => {
            const colors = [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(148, 163, 184, 0.8)'
            ];

            return {
                label: labelMappings.visitFrequency[visitFreq] || visitFreq,
                data: ageGroups.map(age => data[age][visitFreq] || 0),
                backgroundColor: colors[index % colors.length]
            };
        });

        const ctx = document.getElementById('ageVsVisitChart');
        charts.ageVsVisit = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ageGroups.map(age => labelMappings.age[age] || age),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function displayOccupationPatterns(occupationPatterns) {
        const sortedOccupations = Object.entries(occupationPatterns)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10); // Show top 10 occupations

        if (sortedOccupations.length === 0) {
            document.getElementById('occupationPatternsContent').innerHTML =
                '<div style="padding: 20px; color: var(--text-secondary);">Ei ammattitietoja saatavilla.</div>';
            return;
        }

        const patternsHTML = sortedOccupations.map(([occupation, data]) => {
            // Top interface preference
            const topInterface = Object.entries(data.interface || {})
                .sort((a, b) => b[1] - a[1])[0];
            const interfaceText = topInterface
                ? `${labelMappings.interface[topInterface[0]] || topInterface[0]} (${topInterface[1]}/${data.count})`
                : 'Ei dataa';

            // Top AI service
            const topAI = Object.entries(data.aiServices || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2);
            const aiText = topAI.length > 0
                ? topAI.map(([service, count]) =>
                    `${labelMappings.aiServices[service] || service} (${count})`
                  ).join(', ')
                : 'Ei dataa';

            // Top visit frequency
            const topVisit = Object.entries(data.visitFrequency || {})
                .sort((a, b) => b[1] - a[1])[0];
            const visitText = topVisit
                ? `${labelMappings.visitFrequency[topVisit[0]] || topVisit[0]} (${topVisit[1]}/${data.count})`
                : 'Ei dataa';

            // Most common age group
            const topAge = Object.entries(data.ageGroups || {})
                .sort((a, b) => b[1] - a[1])[0];
            const ageText = topAge
                ? `${labelMappings.age[topAge[0]] || topAge[0]} (${topAge[1]}/${data.count})`
                : 'Ei dataa';

            return `
                <div style="padding: 18px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="color: var(--text-primary); font-size: 1rem; margin: 0;">${occupation}</h4>
                        <span style="background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${data.count} vastaajaa</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9rem;">
                        <div>
                            <strong style="color: var(--text-secondary);">Suosituin käyttöliittymä:</strong><br>
                            <span style="color: var(--text-primary);">${interfaceText}</span>
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary);">Asiointitiheys:</strong><br>
                            <span style="color: var(--text-primary);">${visitText}</span>
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary);">Yleisin ikäryhmä:</strong><br>
                            <span style="color: var(--text-primary);">${ageText}</span>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <strong style="color: var(--text-secondary);">Suosituimmat AI-palvelut:</strong><br>
                            <span style="color: var(--text-primary);">${aiText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('occupationPatternsContent').innerHTML = patternsHTML;
    }
});
