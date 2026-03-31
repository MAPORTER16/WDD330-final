/* ========================================
   MediaClub – Main Application Entry
   Handles page routing, global UI helpers,
   navigation, and homepage rendering.
   ======================================== */
import { initAuth } from './auth.js';
import { initClubs, seedClubs } from './clubs.js';
import { initProfile } from './profile.js';
import { initNotifications } from './notifications.js';

// ---------- Global Helpers ----------

/**
 * Display a temporary toast notification at the bottom-right of the screen.
 * @param {string} message - The message to show.
 * @param {string} [type=''] - Optional CSS class: 'success' or 'error'.
 */
export function showToast(message, type = '') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Escape a string for safe insertion into HTML.
 * @param {string} str - Raw string to escape.
 * @returns {string} HTML-escaped string.
 */
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Format an ISO date string to a readable short date.
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted date (e.g. "Mar 24, 2026").
 */
export function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a 24h time string ("HH:MM") to 12h locale format.
 * @param {string} timeStr - Time in "HH:MM" format.
 * @returns {string} Formatted time (e.g. "3:30 PM").
 */
export function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(+h, +m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Convert a timestamp to a human-readable relative time string.
 * @param {number} timestamp - Unix timestamp in milliseconds.
 * @returns {string} Relative time (e.g. "5m ago", "2d ago").
 */
export function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ---------- Navigation ----------

/** Initialize the mobile hamburger menu toggle and link click handling. */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            navLinks.classList.toggle('open');
        });
        // Close nav on link click (mobile)
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }
}

// ---------- Theme Toggle ----------

/** Initialize the dark/light mode toggle button with localStorage persistence. */
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const updateIcon = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    updateIcon();
    btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mediaclub_theme', next);
        updateIcon();
    });
}

// ---------- Notifications Panel Toggle ----------

/** Set up the notifications dropdown panel open/close behaviour. */
function initNotifPanel() {
    const notifLink = document.getElementById('notifLink');
    const notifPanel = document.getElementById('notifPanel');
    if (notifLink && notifPanel) {
        notifLink.addEventListener('click', e => {
            e.preventDefault();
            notifPanel.classList.toggle('open');
        });
        document.addEventListener('click', e => {
            if (!notifPanel.contains(e.target) && e.target !== notifLink && !notifLink.contains(e.target)) {
                notifPanel.classList.remove('open');
            }
        });
    }
}

// ---------- Determine Current Page ----------

/**
 * Detect which page the user is on based on the URL.
 * @returns {'home'|'clubs'|'club'|'profile'} Page identifier.
 */
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('clubs.html')) return 'clubs';
    if (path.includes('club.html')) return 'club';
    if (path.includes('profile.html')) return 'profile';
    return 'home';
}

// ---------- Init ----------

/** Bootstrap the application on DOMContentLoaded. */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initNotifPanel();
    initAuth();
    initNotifications();

    const page = getCurrentPage();
    if (page === 'home') initHome();
    if (page === 'clubs') initClubs();
    if (page === 'club') initClubPage();
    if (page === 'profile') initProfile();
});

// ---------- Homepage ----------

/** Initialize homepage: seed data, render clubs, attach search listener. */
function initHome() {
    seedClubs();
    renderHomepage();

    const searchInput = document.getElementById('clubSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            renderHomepage(query);
        });
    }
}

/**
 * Render the homepage featured and recommended club grids.
 * @param {string} [query=''] - Optional search filter string.
 */
function renderHomepage(query = '') {
    const clubs = JSON.parse(localStorage.getItem('mediaclub_clubs') || '[]');
    let filtered = clubs;
    if (query) {
        filtered = clubs.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
        );
    }

    const featuredEl = document.getElementById('featuredClubs');
    const recommendedEl = document.getElementById('recommendedClubs');

    // Featured = clubs with most members
    const featured = [...filtered].sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0)).slice(0, 3);
    // Recommended = the rest or random
    const featuredIds = new Set(featured.map(c => c.id));
    const recommended = filtered.filter(c => !featuredIds.has(c.id)).slice(0, 6);

    if (featuredEl) {
        featuredEl.innerHTML = featured.length
            ? featured.map(c => clubCardHTML(c)).join('')
            : '<p style="color:#999;">No clubs yet. <a href="pages/clubs.html">Create one!</a></p>';
        addCardListeners(featuredEl, 'pages/');
    }

    if (recommendedEl) {
        recommendedEl.innerHTML = recommended.length
            ? recommended.map(c => clubCardHTML(c)).join('')
            : featured.length
                ? '<p style="color:#999;">Join more clubs to get recommendations!</p>'
                : '';
        addCardListeners(recommendedEl, 'pages/');
    }
}

/**
 * Generate an HTML card string for a single club.
 * @param {Object} club - Club data object.
 * @returns {string} HTML string for the club card.
 */
function clubCardHTML(club) {
    const icon = club.category === 'book' ? '📚' : club.category === 'game' ? '🎮' : '🎬';
    const memberCount = club.members ? club.members.length : 0;
    const imageMarkup = club.image
        ? `<div class="club-card-image"><img src="${escapeHTML(club.image)}" alt="${escapeHTML(club.name)} cover" loading="lazy"></div>`
        : `<div class="club-card-icon" aria-hidden="true">${icon}</div>`;
    const categoryLabel = club.category === 'book' ? 'Book Club' : club.category === 'game' ? 'Game Club' : 'Movie Club';
    return `
    <div class="club-card" data-club-id="${escapeHTML(club.id)}">
      ${imageMarkup}
      <div class="club-card-body">
        <span class="club-card-badge club-card-badge--${escapeHTML(club.category)}">${icon} ${categoryLabel}</span>
        <h3>${escapeHTML(club.name)}</h3>
        <p>${escapeHTML(club.description || '')}</p>
        <div class="club-card-meta">
          <span>${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>`;
}

/**
 * Attach click listeners to club cards so they navigate to the detail page.
 * @param {HTMLElement} container - Parent element containing .club-card elements.
 * @param {string} [pathPrefix=''] - URL prefix for the club detail page.
 */
function addCardListeners(container, pathPrefix = '') {
    container.querySelectorAll('.club-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.clubId;
            window.location.href = `${pathPrefix}club.html?id=${encodeURIComponent(id)}`;
        });
    });
}

// ---------- Club Detail Page Init ----------

/** Dynamically import and initialize the club detail page module. */
async function initClubPage() {
    const { initClubDetail } = await import('./clubs.js');
    initClubDetail();
}

// Re-export for use in other modules
export { clubCardHTML, addCardListeners };
