// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
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

    // Update API URLs
    const AUTH_API_URL = `${API_BASE_URL}/auth`;
    const POSTS_API_URL = `${API_BASE_URL}/posts`;
    const FEED_API_URL = `${API_BASE_URL}/feed`;

    // --- Password Toggle Functionality ---
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            const isPassword = passwordInput.type === 'password';
            
            // Toggle password visibility
            passwordInput.type = isPassword ? 'text' : 'password';
            
            // Toggle button state
            button.classList.toggle('showing');
        });
    });

    // --- Login/Register Page Logic ---
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authMessage = document.getElementById('authMessage');

    // --- Validation Functions ---
    function isValidEmail(email) {
        // Basic regex for email format validation
        return /^[\w.-]+@[\w.-]+\.\w+$/.test(email);
    }

    function isValidPassword(password) {
        // Min 8 chars, max 25 chars, at least one uppercase letter, at least one number
        const minLength = 8;
        const maxLength = 25;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (password.length < minLength) {
            return 'Password must be at least 8 characters long.';
        }
        if (password.length > maxLength) {
            return 'Password must be no more than 25 characters long.';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one capital letter.';
        }
        if (!hasNumber) {
            return 'Password must contain at least one number.';
        }
        return true; // Password is valid
    }

    if (showLoginBtn && showRegisterBtn && loginForm && registerForm) {
        showLoginBtn.addEventListener('click', () => {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            showLoginBtn.classList.add('active');
            showRegisterBtn.classList.remove('active');
            authMessage.textContent = '';
        });

        showRegisterBtn.addEventListener('click', () => {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            showRegisterBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
            authMessage.textContent = '';
        });

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = loginForm.elements.email.value;
            const password = loginForm.elements.password.value;

            try {
                const response = await fetch(`${AUTH_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('isLoggedIn', 'true');
                    authMessage.textContent = `Login successful as ${data.user.role}!`;
                    authMessage.style.color = 'green';
                    setTimeout(() => { window.location.href = 'feed.html'; }, 1000);
                } else {
                    authMessage.textContent = data.message || 'Login failed.';
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Login error:', error);
                authMessage.textContent = 'An error occurred during login.';
                authMessage.style.color = 'red';
            }
        });

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const firstName = registerForm.elements.firstName.value.trim();
            const lastName = registerForm.elements.lastName.value.trim();
            const email = registerForm.elements.email.value.trim();
            const password = registerForm.elements.password.value;

            // Client-side validation
            if (!isValidEmail(email)) {
                authMessage.textContent = 'Please enter a valid email address.';
                authMessage.style.color = 'red';
                return;
            }

            const passwordValidationResult = isValidPassword(password);
            if (passwordValidationResult !== true) {
                authMessage.textContent = passwordValidationResult;
                authMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch(`${AUTH_API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('isLoggedIn', 'true');
                    authMessage.textContent = `Account created! You are now logged in.`;
                    authMessage.style.color = 'green';
                    setTimeout(() => { window.location.href = 'feed.html'; }, 1000);
                } else {
                    authMessage.textContent = data.message || 'Registration failed.';
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Registration error:', error);
                authMessage.textContent = 'An error occurred during registration.';
                authMessage.style.color = 'red';
            }
        });

        // Redirect if already logged in (on login page)
        if (localStorage.getItem('isLoggedIn') === 'true' && window.location.pathname.endsWith('login.html')) {
            window.location.href = 'feed.html';
        }
    }

    // --- Feed Page Logic ---
    const adminPostSection = document.getElementById('adminPostSection');
    const logoutBtn = document.getElementById('logoutBtn');
    const feedPostsContainer = document.getElementById('feedPosts'); // New: Container for dynamic posts

    // Get admin dashboard links from both index.html and feed.html
    const adminDashboardLinkIndex = document.getElementById('adminDashboardLink');
    const adminDashboardLinkFeed = document.getElementById('adminDashboardLinkFeed');

    // Admin Post Type Switcher
    const showGeneralPostFormBtn = document.getElementById('showGeneralPostForm');
    const showPolledPostFormBtn = document.getElementById('showPolledPostForm');
    const generalPostForm = document.getElementById('generalPostForm');
    const polledPostForm = document.getElementById('polledPostForm');
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    const addPollOptionBtn = document.getElementById('addPollOptionBtn');

    // Admin Forms Toggle
    const toggleAdminFormsBtn = document.getElementById('toggleAdminFormsBtn');
    const adminFormsContainer = document.getElementById('adminFormsContainer');

    // Group Settings Toggle
    const toggleGroupSettingsBtn = document.getElementById('toggleGroupSettingsBtn');
    const groupSettingsContainer = document.getElementById('groupSettingsContainer');

    // New: Admin Buttons Container (for visibility control)
    const adminButtonsContainer = document.querySelector('.admin-buttons-container');

    // New: User Role Management Elements
    const userSelect = document.getElementById('userSelect');
    const roleUserRadio = document.getElementById('roleUser');
    const roleAdminRadio = document.getElementById('roleAdmin');
    const updateRoleBtn = document.getElementById('updateRoleBtn');
    const roleUpdateMessage = document.getElementById('roleUpdateMessage');

    let allUsers = []; // Store fetched users globally within this scope

    // Function to fetch users and populate the dropdown
    async function fetchAndPopulateUsers() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found for fetching users.');
            return;
        }

        try {
            const response = await fetch(`${AUTH_API_URL}/admin/users`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (response.ok) {
                allUsers = data; // Store all users
                userSelect.innerHTML = '<option value="">-- Select a user --</option>'; // Clear and add default
                allUsers.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.email;
                    userSelect.appendChild(option);
                });
                // Clear role selection and message when users are re-fetched
                roleUserRadio.checked = false;
                roleAdminRadio.checked = false;
                roleUpdateMessage.textContent = '';
            } else {
                console.error('Failed to fetch users:', data.message);
                roleUpdateMessage.textContent = data.message || 'Failed to load users.';
                roleUpdateMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            roleUpdateMessage.textContent = 'An error occurred while fetching users.';
            roleUpdateMessage.style.color = 'red';
        }
    }

    // Event listener for user selection dropdown
    if (userSelect) {
        userSelect.addEventListener('change', () => {
            const selectedUserId = parseInt(userSelect.value);
            const selectedUser = allUsers.find(user => user.id === selectedUserId);

            if (selectedUser) {
                if (selectedUser.role === 'user') {
                    roleUserRadio.checked = true;
                } else if (selectedUser.role === 'admin') {
                    roleAdminRadio.checked = true;
                }
            } else {
                roleUserRadio.checked = false;
                roleAdminRadio.checked = false;
            }
            roleUpdateMessage.textContent = ''; // Clear message on new selection
        });
    }

    // Event listener for Update Role button
    if (updateRoleBtn) {
        updateRoleBtn.addEventListener('click', async () => {
            const selectedUserId = parseInt(userSelect.value);
            const selectedRole = document.querySelector('input[name="userRoleAssign"]:checked')?.value;

            if (!selectedUserId) {
                roleUpdateMessage.textContent = 'Please select a user.';
                roleUpdateMessage.style.color = 'red';
                return;
            }
            if (!selectedRole) {
                roleUpdateMessage.textContent = 'Please select a role.';
                roleUpdateMessage.style.color = 'red';
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                roleUpdateMessage.textContent = 'Authentication token missing.';
                roleUpdateMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch(`${AUTH_API_URL}/admin/users/${selectedUserId}/role`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ role: selectedRole })
                });

                const data = await response.json();

                if (response.ok) {
                    roleUpdateMessage.textContent = data.message;
                    roleUpdateMessage.style.color = 'green';
                    fetchAndPopulateUsers(); // Re-fetch users to update dropdown with new roles
                } else {
                    roleUpdateMessage.textContent = data.message || 'Failed to update role.';
                    roleUpdateMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Error updating role:', error);
                roleUpdateMessage.textContent = 'An error occurred while updating the role.';
                roleUpdateMessage.style.color = 'red';
            }
        });
    }

    if (showGeneralPostFormBtn && showPolledPostFormBtn && generalPostForm && polledPostForm && toggleAdminFormsBtn && adminFormsContainer && toggleGroupSettingsBtn && groupSettingsContainer && adminButtonsContainer) {
        // Existing form switcher logic
        showGeneralPostFormBtn.addEventListener('click', () => {
            generalPostForm.classList.add('active');
            polledPostForm.classList.remove('active');
            showGeneralPostFormBtn.classList.add('active');
            showPolledPostFormBtn.classList.remove('active');
        });

        showPolledPostFormBtn.addEventListener('click', () => {
            polledPostForm.classList.add('active');
            generalPostForm.classList.remove('active');
            showPolledPostFormBtn.classList.add('active');
            showGeneralPostFormBtn.classList.remove('active');
        });

        // Dynamic Poll Options
        if (addPollOptionBtn && pollOptionsContainer) {
            let optionCount = 2;
            addPollOptionBtn.addEventListener('click', () => {
                optionCount++;
                const newOptionInput = document.createElement('input');
                newOptionInput.type = 'text';
                newOptionInput.classList.add('poll-option-input');
                newOptionInput.placeholder = `Option ${optionCount}`;
                newOptionInput.required = true;
                pollOptionsContainer.appendChild(newOptionInput);
            });
        }

        // Toggle admin forms visibility
        toggleAdminFormsBtn.addEventListener('click', () => {
            // Toggle visibility of the forms container
            adminFormsContainer.classList.toggle('active');
            // Ensure group settings are hidden when forms are shown
            if (adminFormsContainer.classList.contains('active')) {
                groupSettingsContainer.classList.remove('active');
            }
            // Adjust admin section margin only if neither forms nor settings are active
            updateAdminSectionMargin();
            toggleAdminFormsBtn.textContent = adminFormsContainer.classList.contains('active') ? 'x' : '+';
        });

        // Toggle group settings visibility
        toggleGroupSettingsBtn.addEventListener('click', () => {
            // Toggle visibility of the settings container
            groupSettingsContainer.classList.toggle('active');
            // Ensure post forms are hidden when settings are shown
            if (groupSettingsContainer.classList.contains('active')) {
                adminFormsContainer.classList.remove('active');
                toggleAdminFormsBtn.textContent = '+'; // Reset button text
            }
            // Adjust admin section margin only if neither forms nor settings are active
            updateAdminSectionMargin();

            // Fetch users when group settings are shown
            if (groupSettingsContainer.classList.contains('active')) {
                fetchAndPopulateUsers();
            }
        });

        // Function to update admin section margin based on active content
        function updateAdminSectionMargin() {
            if (adminFormsContainer.classList.contains('active') || groupSettingsContainer.classList.contains('active')) {
                adminPostSection.classList.add('has-active-content'); // Add a class when content is active
            } else {
                adminPostSection.classList.remove('has-active-content');
            }
        }

        // Initial call to set margin correctly on load if admin forms are active by default
        updateAdminSectionMargin();

    }

    if (adminPostSection && logoutBtn && feedPostsContainer) {
        const userRole = localStorage.getItem('userRole');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const token = localStorage.getItem('token'); // Get the stored token

        // Show admin dashboard links if user is admin
        if (userRole === 'admin') {
            if (adminDashboardLinkIndex) adminDashboardLinkIndex.style.display = 'block';
            if (adminDashboardLinkFeed) adminDashboardLinkFeed.style.display = 'block';
        } else {
            if (adminDashboardLinkIndex) adminDashboardLinkIndex.style.display = 'none';
            if (adminDashboardLinkFeed) adminDashboardLinkFeed.style.display = 'none';
        }

        // Check login status and role to display admin section and toggle buttons
        if (isLoggedIn === 'true' && userRole === 'admin') {
            adminPostSection.style.display = 'block';
            adminButtonsContainer.style.display = 'flex'; // Show the container of buttons
        } else {
            adminPostSection.style.display = 'none';
            if (adminButtonsContainer) adminButtonsContainer.style.display = 'none';
        }

        // Function to fetch and display feed posts
        async function fetchAndDisplayFeed() {
            try {
                // Include Authorization header for protected routes later if needed
                const response = await fetch(FEED_API_URL, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token // Send token for authentication on feed
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    const posts = data;
                    // Clear existing placeholder posts if any
                    feedPostsContainer.innerHTML = '';

                    // Render posts dynamically
                    posts.forEach(post => {
                        const postCard = document.createElement('div');
                        postCard.classList.add('post-card');

                        let postContent = `
                            <h3>${post.title}</h3>
                            <p>${post.content || ''}</p>
                        `;

                        if (post.type === 'general') {
                            if (post.imageUrl) {
                                postContent += `<img src="${post.imageUrl}" alt="Post Image" class="post-image">`;
                            }
                            if (post.videoUrl) {
                                postContent += `<video controls class="post-video"><source src="${post.videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
                            }
                        } else if (post.type === 'polled') {
                            postContent = `
                                <h3>${post.question}</h3>
                                <div class="poll-options" data-post-id="${post.id}">
                            `;
                            post.options.forEach((option, index) => {
                                postContent += `
                                    <div class="poll-option-item">
                                        ${userRole === 'admin' ? `<button class="poll-vote-btn" data-option-index="${index}">${option.text}</button>` : `<span>${option.text}</span>`}
                                        ${userRole === 'admin' ? `<span class="vote-count">(${option.votes} votes)</span>` : ''}
                                    </div>
                                `;
                            });
                            postContent += `</div>`;
                            if (userRole === 'admin') {
                                postContent += `<button class="view-results-btn" data-post-id="${post.id}">View Poll Results</button>`;
                            }
                        } else if (post.type === 'polled' && userRole !== 'admin') {
                            // For non-admins, just show poll question and options without voting or counts
                            postContent = `
                                <h3>${post.question}</h3>
                                <div class="poll-options" data-post-id="${post.id}">
                            `;
                            post.options.forEach((option) => {
                                postContent += `<p>${option.text}</p>`; // Show options, but no vote button
                            });
                            postContent += `</div>`;
                        }

                        postCard.innerHTML = `
                            ${postContent}
                            <span class="post-meta">Posted by ${post.author} on <span class="post-date">${new Date(post.date).toLocaleString()}</span></span>
                        `;

                        // Add delete button for admins
                        if (userRole === 'admin') {
                            const deleteButton = document.createElement('button');
                            deleteButton.classList.add('delete-post-btn');
                            deleteButton.innerHTML = 'Delete';
                            deleteButton.dataset.postId = post.id; // Store post ID
                            deleteButton.addEventListener('click', async () => {
                                if (confirm('Are you sure you want to delete this post?')) {
                                    try {
                                        const deleteResponse = await fetch(`${POSTS_API_URL}/${post.id}` , {
                                            method: 'DELETE',
                                            headers: {
                                                'x-auth-token': token
                                            }
                                        });
                                        const deleteData = await deleteResponse.json();
                                        if (deleteResponse.ok) {
                                            alert(deleteData.message);
                                            fetchAndDisplayFeed(); // Refresh feed after deletion
                                        } else {
                                            alert(deleteData.message || 'Failed to delete post.');
                                        }
                                    } catch (error) {
                                        console.error('Error deleting post:', error);
                                        alert('An error occurred while deleting the post.');
                                    }
                                }
                            });
                            postCard.appendChild(deleteButton); // Add delete button at the end
                        }
                        feedPostsContainer.appendChild(postCard);

                        // Add event listeners for poll voting buttons - only if user is NOT admin and post is polled
                        if (post.type === 'polled' && userRole !== 'admin') {
                            postCard.querySelectorAll('.poll-vote-btn').forEach(button => {
                                button.addEventListener('click', async (e) => {
                                    const postId = e.target.closest('.poll-options').dataset.postId;
                                    const optionIndex = e.target.dataset.optionIndex;
                                    try {
                                        const voteResponse = await fetch(`${POSTS_API_URL}/${postId}/vote`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'x-auth-token': token
                                            },
                                            body: JSON.stringify({ optionIndex })
                                        });
                                        const voteData = await voteResponse.json();
                                        if (voteResponse.ok) {
                                            alert(voteData.message);
                                            fetchAndDisplayFeed(); // Refresh feed to show updated vote counts
                                        } else {
                                            alert(voteData.message || 'Failed to cast vote.');
                                        }
                                    } catch (error) {
                                        console.error('Error casting vote:', error);
                                        alert('An error occurred while voting.');
                                    }
                                });
                            });
                        } else if (post.type === 'polled' && userRole === 'admin') { /* Moved from inside initial polled check */
                            // Add event listener for view results button (admin only)
                            postCard.querySelector('.view-results-btn').addEventListener('click', async (e) => {
                                const postId = e.target.dataset.postId;
                                try {
                                    const resultsResponse = await fetch(`${POSTS_API_URL}/${postId}/results`, {
                                        method: 'GET',
                                        headers: {
                                            'x-auth-token': token
                                        }
                                    });
                                    const resultsData = await resultsResponse.json();
                                    if (resultsResponse.ok) {
                                        let resultsText = `Poll Results for "${resultsData.question}"\nTotal Votes: ${resultsData.totalVotes}\n\n`;
                                        resultsData.options.forEach(option => {
                                            resultsText += `${option.text}: ${option.votes} votes\n`;
                                        });
                                        alert(resultsText);
                                    } else {
                                        alert(resultsData.message || 'Failed to fetch poll results.');
                                    }
                                } catch (error) {
                                    console.error('Error fetching poll results:', error);
                                    alert('An error occurred while fetching poll results.');
                                }
                            });
                        }
                    });

                } else {
                    console.error('Failed to fetch feed posts:', data.message);
                    feedPostsContainer.innerHTML = '<p>Failed to load posts. Please try again later.</p>';
                }
            } catch (error) {
                console.error('Error fetching feed:', error);
                feedPostsContainer.innerHTML = '<p>Error connecting to the feed. Is the backend running?</p>';
            }
        }

        // Fetch and display feed posts when on the feed page
        if (window.location.pathname.endsWith('feed.html')) {
            fetchAndDisplayFeed();
        }

        // Handle General Post Form Submission
        if (generalPostForm) {
            generalPostForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const title = event.target.generalPostTitle.value;
                const content = event.target.generalPostContent.value;
                const imageUrl = event.target.generalPostImage.value;
                const videoUrl = event.target.generalPostVideo.value;

                try {
                    const response = await fetch(POSTS_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token // Include token for admin authorization
                        },
                        body: JSON.stringify({
                            type: 'general',
                            title,
                            content,
                            imageUrl,
                            videoUrl
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        event.target.reset();
                        adminFormsContainer.classList.remove('active'); // Hide forms after successful post
                        updateAdminSectionMargin(); // Adjust margin after hiding
                        toggleAdminFormsBtn.textContent = '+'; // Reset button text
                        fetchAndDisplayFeed(); // Refresh feed after new post
                    } else {
                        alert(data.message || 'Failed to create general post.');
                    }
                } catch (error) {
                    console.error('Error creating general post:', error);
                    alert('An error occurred while creating the general post.');
                }
            });
        }

        // Handle Polled Post Form Submission
        if (polledPostForm) {
            polledPostForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const question = event.target.pollQuestion.value;
                const options = Array.from(event.target.querySelectorAll('.poll-option-input'))
                                .map(input => input.value)
                                .filter(value => value.trim() !== '');

                if (options.length < 2) {
                    alert('Please provide at least two poll options.');
                    return;
                }

                try {
                    const response = await fetch(POSTS_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token // Include token for admin authorization
                        },
                        body: JSON.stringify({
                            type: 'polled',
                            title: question, // Use question as title for polled post
                            question,
                            options
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        event.target.reset();
                        // Reset dynamic options by clearing and re-adding initial ones
                        pollOptionsContainer.innerHTML = `
                            <label>Poll Options</label>
                            <input type="text" class="poll-option-input" placeholder="Option 1" required>
                            <input type="text" class="poll-option-input" placeholder="Option 2" required>
                        `;
                        adminFormsContainer.classList.remove('active'); // Hide forms after successful post
                        updateAdminSectionMargin(); // Adjust margin after hiding
                        toggleAdminFormsBtn.textContent = '+'; // Reset button text
                        fetchAndDisplayFeed(); // Refresh feed after new post
                    } else {
                        alert(data.message || 'Failed to create polled post.');
                    }
                } catch (error) {
                    console.error('Error creating polled post:', error);
                    alert('An error occurred while creating the polled post.');
                }
            });
        }

        // Logout logic
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.clear(); // Clear all simulated login data
            window.location.href = 'login.html';
        });

        // Redirect to login if not logged in (on feed page)
        if (isLoggedIn !== 'true' && window.location.pathname.endsWith('feed.html')) {
            window.location.href = 'login.html';
        }
    }
}); 