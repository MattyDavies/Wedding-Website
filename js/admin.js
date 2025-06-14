// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    // API Configuration
    const API_CONFIG = {
        development: {
            baseUrl: 'http://localhost:3000/api'
        },
        production: {
            baseUrl: 'https://your-backend-domain.com/api' // We'll update this when you have your backend domain
        }
    };

    // Determine environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isDevelopment ? API_CONFIG.development.baseUrl : API_CONFIG.production.baseUrl;

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // Redirect if not admin or not logged in
    if (userRole !== 'admin' || !token) {
        window.location.href = 'login.html';
        return;
    }

    const totalUsersEl = document.getElementById('totalUsers');
    const totalAdminsEl = document.getElementById('totalAdmins');
    const websiteVisitsEl = document.getElementById('websiteVisits');
    const totalTimeSpentEl = document.getElementById('totalTimeSpent');
    const pollResponsesContainer = document.getElementById('pollResponsesContainer');

    async function fetchDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();

            if (response.ok) {
                totalUsersEl.textContent = data.totalUsers;
                totalAdminsEl.textContent = data.totalAdmins;
                websiteVisitsEl.textContent = data.websiteVisits;
                totalTimeSpentEl.textContent = data.totalTimeSpent; // This will be formatted later
            } else {
                console.error('Failed to fetch dashboard stats:', data.message);
                totalUsersEl.textContent = 'Error';
                totalAdminsEl.textContent = 'Error';
                websiteVisitsEl.textContent = 'Error';
                totalTimeSpentEl.textContent = 'Error';
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            totalUsersEl.textContent = 'Error';
            totalAdminsEl.textContent = 'Error';
            websiteVisitsEl.textContent = 'Error';
            totalTimeSpentEl.textContent = 'Error';
        }
    }

    async function fetchPollResponses() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();

            if (response.ok) {
                const polledPosts = data.filter(post => post.type === 'polled');
                pollResponsesContainer.innerHTML = ''; // Clear loading message

                if (polledPosts.length === 0) {
                    pollResponsesContainer.innerHTML = '<p>No poll responses to display.</p>';
                    return;
                }

                polledPosts.forEach(post => {
                    const pollCard = document.createElement('div');
                    pollCard.classList.add('poll-response-card');
                    let optionsHtml = '';
                    post.options.forEach(option => {
                        optionsHtml += `<p>${option.text}: <strong>${option.votes} votes</strong></p>`;
                    });

                    pollCard.innerHTML = `
                        <h3>${post.question}</h3>
                        <p>Total Votes: <strong>${post.totalVotes}</strong></p>
                        <div class="poll-options-summary">
                            ${optionsHtml}
                        </div>
                        <p class="poll-meta">Posted by ${post.author} on ${new Date(post.date).toLocaleString()}</p>
                    `;
                    pollResponsesContainer.appendChild(pollCard);
                });
            } else {
                console.error('Failed to fetch poll responses:', data.message);
                pollResponsesContainer.innerHTML = '<p>Error loading poll responses.</p>';
            }
        } catch (error) {
            console.error('Error fetching poll responses:', error);
            pollResponsesContainer.innerHTML = '<p>An error occurred while loading poll responses.</p>';
        }
    }

    // Initial data fetch
    if (window.location.pathname.endsWith('admin-dashboard.html')) {
        fetchDashboardData();
        fetchPollResponses();
    }
}); 