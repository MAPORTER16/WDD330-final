/* ========================================
   MediaClub – Authentication Module
   Uses localStorage for demo persistence
   ======================================== */
import { showToast, escapeHTML } from './app.js';

const USERS_KEY = 'mediaclub_users';
const SESSION_KEY = 'mediaclub_session';

// ---------- Storage Helpers ----------
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const { userId } = JSON.parse(session);
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

export function updateCurrentUser(updates) {
    const user = getCurrentUser();
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    Object.assign(users[idx], updates);
    saveUsers(users);
}

function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ---------- Validation ----------
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Init Auth UI ----------
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

    // Close modal (only if logged in)
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (getCurrentUser()) {
                authModal.style.display = 'none';
            }
        });
    }

    // Register
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', e => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

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
                avatarColor: '#2D6CDF',
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

function appendError(form, message) {
    const p = document.createElement('p');
    p.className = 'form-error';
    p.textContent = message;
    form.appendChild(p);
}

function updateNavForUser(user) {
    // Update profile link text if needed
    const profileLinks = document.querySelectorAll('.nav-links a');
    profileLinks.forEach(a => {
        if (a.textContent.trim() === 'Profile') {
            a.textContent = user.username;
        }
    });
}

export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please log in first.', 'error');
        return null;
    }
    return user;
}
