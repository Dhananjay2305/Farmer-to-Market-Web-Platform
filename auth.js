// Authentication Functions

// Get current user from localStorage
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get token
function getToken() {
    return localStorage.getItem('token');
}

// Save user session
function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear session (logout)
function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Logout function
function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Redirect based on role
function redirectToDashboard(user) {
    if (user.role === 'farmer') {
        window.location.href = 'farmer-dashboard.html';
    } else {
        window.location.href = 'buyer-dashboard.html';
    }
}

// Tab switching for auth page
function switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-form__tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Initialize auth page
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const user = getUser();
    if (user && window.location.pathname.includes('auth.html')) {
        redirectToDashboard(user);
        return;
    }

    // Tab switching
    const tabs = document.querySelectorAll('.auth-form__tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Check URL hash for register
    if (window.location.hash === '#register') {
        switchTab('register');
    }

    // Role toggle
    const roleButtons = document.querySelectorAll('.role-toggle__btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('registerRole').value = btn.dataset.role;
        });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('loginPhone').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await api.post('/auth/login', { phone, password });
                saveSession(response.token, response.user);
                showToast('Login successful!', 'success');
                setTimeout(() => redirectToDashboard(response.user), 500);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('registerName').value;
            const phone = document.getElementById('registerPhone').value;
            const role = document.getElementById('registerRole').value;
            const location = document.getElementById('registerLocation').value;
            const password = document.getElementById('registerPassword').value;

            try {
                const response = await api.post('/auth/register', {
                    name, phone, role, location, password
                });
                saveSession(response.token, response.user);
                showToast('Registration successful!', 'success');
                setTimeout(() => redirectToDashboard(response.user), 500);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
});
