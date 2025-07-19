// Authenticator for WebPanel Setup
// Setup Part of the WebPanel project
// This script creates and handles any authenticator-related tasks
// and login creations for the setup
// This script is only for the first-time setup of WebPanel


// Account creation
let setupToken = null;

// Functyopn to be caled when a user reaches the account creation step
function initAccountCreation() {
    const nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;

    // Fetch Setup token from API server
    fetch('/api/get-setup-token', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success' && data.setupToken) {
            setupToken = data.setupToken;
            // Add event listener 
            const createBtn = document.getElementById('create-account-btn');
            if (createBtn) {
                createBtn.addEventListener('click', handleAccountCreation);
            }
        } else {
            throw new Error('Failed to fetch setup token.');
        }
    })
    .catch(error => {
        console.error('Error fetching setup token:', error);
        showNotification('is-danger', '<strong>Critical Error: </strong> Failed to fetch setup token. Please Redo the setup, and try again. (Reason: Possible Token Timeout)');
    });
}

function showNotification(type, message) {
    const notificationDiv = document.getElementById('signup-notification');
    if (notificationDiv) {
        notificationDiv.innerHTML = `
            <div class="notification ${type} is-light">
                <button class="delete"></button>
                ${message}
            </div>
        `;
        // Add an event listener to delete button
        notificationDiv.querySelector('.delete').addEventListener('click', (e) => {
            e.target.parentElement.remove();
        });
    }
}

async function handleAccountCreation() {
    if (!setupToken) {
        showNotification('is-danger', 'Setup token is Missing, Please Refresh the page. (Reason: Token Timeout)')
        return;
    }
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const repeatPasswordInput = document.getElementById('repeat-password-input');
    const createBtn = document.getElementById('create-account-btn');
    const nextBtn = document.getElementById('next-btn');

    // Trim
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const repeatPassword = repeatPasswordInput.value;

    // Validation
    if (!username || !password || !repeatPassword) {
        return showNotification('is-warning', 'Please fill in all fields.');
    }
    if (password !== repeatPassword) {
        return showNotification('is-danger', 'Passwords do not match.');
    }
    if (password.length < 8) {
        return showNotification('is-warning', 'Password must be at least 8 characters long.');
    }

    createBtn.classList.add('is-loading');
    createBtn.disabled = true;

    try {
        const response = await fetch('/api/create-admin-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${setupToken}`
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'An unknown error occured, plese report this bug...')
        };
        showNotification('is-success', `<strong>Sucess!</strong> Admin Account: <strong>${username}</strong> has been created. You can now proceed.`);
        [usernameInput, passwordInput, repeatPasswordInput].forEach(el => el.disabled = true);
        nextBtn.disabled = false;
    } catch (error) {
        console.error('Error creating admin account:', error);
        showNotification('is-danger', `<strong>Error: </strong> ${error.message}`);
        createBtn.disabled = false; // Enable the btn again since it failed
    } finally {
        createBtn.classList.remove('is-loading');
    }
    
}