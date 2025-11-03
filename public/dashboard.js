// Dashboard Handler
let charts = {};

// Question titles for charts
const questionTitles = {
    q1: 'Kuinka hyvin ymmärsit, mikä Smart-Helper on?',
    q2: 'Kuinka luontevalta tuntuisi puhua Smart-Helperille?',
    q3: 'Kuinka paljon uskoisit Smart-Helperin nopeuttavan tiedonsaantiasi?',
    q4: 'Kuinka paljon todennäköisemmin käyttäisit Smart-Helperiä?',
    q5: 'Uskoisitko Smart-Helperin parantavan asiakaskokemustasi vieraassa kauppakeskuksessa?',
    q6: 'Uskoisitko Smart-Helperin tekevän kauppakeskuksessa asioinnista mukavamman?'
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
            // Fetch analytics
            const analyticsResponse = await fetch('/api/analytics');
            const analytics = await analyticsResponse.json();

            // Fetch responses
            const responsesResponse = await fetch('/api/responses');
            const responses = await responsesResponse.json();

            // Update total responses
            document.getElementById('totalResponses').textContent = analytics.total;

            // Update average scores
            for (let i = 1; i <= 6; i++) {
                const qKey = `q${i}`;
                const avg = analytics.questionStats[qKey].avg;
                document.getElementById(`avg${qKey.toUpperCase()}`).textContent = avg;
            }

            // Create charts for each question
            for (let i = 1; i <= 6; i++) {
                const qKey = `q${i}`;
                createQuestionChart(qKey, analytics.questionStats[qKey]);
            }

            // Populate responses table
            populateResponsesTable(responses);

            // Hide loading, show data
            dashboardLoading.style.display = 'none';
            dashboardData.style.display = 'block';

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            dashboardLoading.innerHTML = '<p style="color: var(--error-color);">Virhe datan lataamisessa. Lataa sivu uudelleen.</p>';
        }
    }

    function createQuestionChart(questionKey, data) {
        const ctx = document.getElementById(`${questionKey}Chart`);

        // Destroy existing chart if it exists
        if (charts[questionKey]) {
            charts[questionKey].destroy();
        }

        const ratings = [0, 1, 2, 3, 4, 5];
        const counts = ratings.map(rating => data[rating] || 0);

        charts[questionKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0', '1', '2', '3', '4', '5'],
                datasets: [{
                    label: 'Vastausten määrä',
                    data: counts,
                    backgroundColor: [
                        'rgba(220, 38, 38, 0.7)',   // Dark red for 0
                        'rgba(239, 68, 68, 0.7)',   // Red for 1
                        'rgba(251, 146, 60, 0.7)',  // Orange for 2
                        'rgba(250, 204, 21, 0.7)',  // Yellow for 3
                        'rgba(34, 197, 94, 0.7)',   // Green for 4
                        'rgba(16, 185, 129, 0.7)'   // Dark green for 5
                    ],
                    borderColor: [
                        'rgba(220, 38, 38, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(250, 204, 21, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `Keskiarvo: ${data.avg}`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Vastausten määrä'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Arvosana'
                        }
                    }
                }
            }
        });
    }

    function populateResponsesTable(responses) {
        const tbody = document.getElementById('responsesTableBody');
        tbody.innerHTML = '';

        if (responses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Ei vastauksia vielä</td></tr>';
            return;
        }

        // Show latest 50 responses
        responses.slice(0, 50).forEach(response => {
            const row = document.createElement('tr');

            // Format timestamp
            const date = new Date(response.timestamp);
            const formattedDate = date.toLocaleDateString('fi-FI') + ' ' + date.toLocaleTimeString('fi-FI');

            row.innerHTML = `
                <td>${response.id}</td>
                <td>${response.q1}</td>
                <td>${response.q2}</td>
                <td>${response.q3}</td>
                <td>${response.q4}</td>
                <td>${response.q5}</td>
                <td>${response.q6}</td>
                <td>${formattedDate}</td>
            `;

            tbody.appendChild(row);
        });
    }
});
