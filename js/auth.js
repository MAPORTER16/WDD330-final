/* ========================================
   MediaClub – Authentication Module
   Handles user registration, login, logout,
   and session management via localStorage.
   ======================================== */
import { showToast, escapeHTML } from './app.js';

const USERS_KEY = 'mediaclub_users';
const SESSION_KEY = 'mediaclub_session';

// ---------- Storage Helpers ----------

/** @returns {Array<Object>} All registered user objects from localStorage. */
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

/** Persist the users array to localStorage. @param {Array<Object>} users */
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Get the currently logged-in user from the session.
 * @returns {Object|null} User object or null if not logged in.
 */
export function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const { userId } = JSON.parse(session);
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

/**
 * Update fields on the currently logged-in user record.
 * @param {Object} updates - Key/value pairs to merge into the user object.
 */
export function updateCurrentUser(updates) {
    const user = getCurrentUser();
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    Object.assign(users[idx], updates);
    saveUsers(users);
}

/** Store the active session user ID. @param {string} userId */
function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

/** Clear the active session (log out). */
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ---------- Validation ----------

/**
 * Basic email format validation.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Init Auth UI ----------

/**
 * Initialize the authentication UI: show/hide auth modal,
 * handle registration and login form submissions, and logout.
 */
export function initAuth() {
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const modalClose = document.getElementById('modalClose');
    const loginFormEl = document.getElementById('loginFormEl');
    const registerFormEl = document.getElementById('registerFormEl');

    if (!authModal) return;

    const user = getCurrentUser();

    // If not logged in, show auth modal (unless it's the home page, allow browsing)
    if (!user) {
        authModal.style.display = 'flex';
    } else {
        authModal.style.display = 'none';
        updateNavForUser(user);
    }

    // Toggle forms
    if (showRegister) {
        showRegister.addEventListener('click', e => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', e => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // Close modal (allow guests to explore)
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    // Close modal when clicking on the overlay background
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // Continue as Guest buttons
    const guestLoginBtn = document.getElementById('guestLoginBtn');
    const guestRegisterBtn = document.getElementById('guestRegisterBtn');
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.style.display = 'none';
        });
    }
    if (guestRegisterBtn) {
        guestRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.style.display = 'none';
        });
    }

    // Show/hide password toggles
    initPasswordToggles();

    // Password strength indicator
    initPasswordStrength();

    // Avatar color picker
    let selectedAvatarColor = '#2D6CDF';
    const avatarPicker = document.getElementById('avatarPicker');
    if (avatarPicker) {
        avatarPicker.addEventListener('click', (e) => {
            const btn = e.target.closest('.avatar-option');
            if (!btn) return;
            avatarPicker.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedAvatarColor = btn.dataset.color;
        });
    }

    // Register
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', e => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regPasswordConfirm');
            const confirm = confirmPassword ? confirmPassword.value : password;

            // Remove previous errors
            registerFormEl.querySelectorAll('.form-error').forEach(el => el.remove());

            if (username.length < 3) {
                appendError(registerFormEl, 'Username must be at least 3 characters.');
                return;
            }
            if (!validateEmail(email)) {
                appendError(registerFormEl, 'Please enter a valid email.');
                return;
            }
            if (password.length < 6) {
                appendError(registerFormEl, 'Password must be at least 6 characters.');
                return;
            }
            if (password !== confirm) {
                appendError(registerFormEl, 'Passwords do not match.');
                return;
            }

            const users = getUsers();
            if (users.some(u => u.email === email)) {
                appendError(registerFormEl, 'An account with this email already exists.');
                return;
            }

            const newUser = {
                id: 'user_' + Date.now(),
                username,
                email,
                password, // In a real app this would be hashed server-side
                avatarColor: selectedAvatarColor,
                favBook: '',
                favGame: '',
                favMovie: '',
                clubs: [],
                createdAt: Date.now()
            };

            users.push(newUser);
            saveUsers(users);
            setSession(newUser.id);
            showToast('Account created! Welcome!', 'success');
            authModal.style.display = 'none';
            updateNavForUser(newUser);
            // Reload page to render content for logged in user
            window.location.reload();
        });
    }

    // Login
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            loginFormEl.querySelectorAll('.form-error').forEach(el => el.remove());

            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                appendError(loginFormEl, 'Invalid email or password.');
                return;
            }

            setSession(user.id);
            showToast(`Welcome back, ${escapeHTML(user.username)}!`, 'success');
            authModal.style.display = 'none';
            updateNavForUser(user);
            window.location.reload();
        });
    }

    // Logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            showToast('Logged out.', '');
            setTimeout(() => {
                window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            }, 500);
        });
    }
}

/** Append an error message paragraph inside a form. @param {HTMLFormElement} form @param {string} message */
function appendError(form, message) {
    const p = document.createElement('p');
    p.className = 'form-error';
    p.textContent = message;
    form.appendChild(p);
}

/** Update the navigation bar to show the logged-in user's name. @param {Object} user */
function updateNavForUser(user) {
    // Update profile link text if needed
    const profileLinks = document.querySelectorAll('.nav-links a');
    profileLinks.forEach(a => {
        if (a.textContent.trim() === 'Profile') {
            a.textContent = user.username;
        }
    });
}

/**
 * Ensure a user is logged in; show an error toast if not.
 * @returns {Object|null} The current user object, or null.
 */
export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please log in first.', 'error');
        return null;
    }
    return user;
}

// ---------- Password Helpers ----------

/** Set up show/hide password toggle buttons. */
function initPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.textContent = showing ? '👁️' : '🙈';
            btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        });
    });
}

/** Set up the password strength meter on the registration form. */
function initPasswordStrength() {
    const passInput = document.getElementById('regPassword');
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!passInput || !fill || !label) return;

    passInput.addEventListener('input', () => {
        const val = passInput.value;
        const { score, text, color } = getPasswordStrength(val);
        fill.style.width = `${score}%`;
        fill.style.background = color;
        label.textContent = val.length ? text : '';
        label.style.color = color;
    });
}

/**
 * Calculate a simple password strength score.
 * @param {string} pw - Password string.
 * @returns {{score: number, text: string, color: string}}
 */
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 6) score += 20;
    if (pw.length >= 10) score += 20;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 20;
    if (/\d/.test(pw)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 20;

    if (score <= 20) return { score, text: 'Weak', color: '#e74c3c' };
    if (score <= 40) return { score, text: 'Fair', color: '#FF9F43' };
    if (score <= 60) return { score, text: 'Good', color: '#f1c40f' };
    if (score <= 80) return { score, text: 'Strong', color: '#2ecc71' };
    return { score, text: 'Very Strong', color: '#27ae60' };
}
