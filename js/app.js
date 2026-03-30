/* ========================================
   MediaClub – Main Application Entry
   ======================================== */
import { initAuth, getCurrentUser } from './auth.js';
import { initClubs, seedClubs } from './clubs.js';
import { initProfile } from './profile.js';
import { initNotifications } from './notifications.js';

// ---------- Global Helpers ----------
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

export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(+h, +m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

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

// ---------- Notifications Panel Toggle ----------
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
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('clubs.html')) return 'clubs';
    if (path.includes('club.html')) return 'club';
    if (path.includes('profile.html')) return 'profile';
    return 'home';
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
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
    const recommended = filtered.filter(c => !featuredIds.has(c.id)).slice(0, 4);

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

function clubCardHTML(club) {
    const icon = club.category === 'book' ? '📚' : club.category === 'game' ? '🎮' : '🎬';
    const memberCount = club.members ? club.members.length : 0;
    return `
    <div class="club-card" data-club-id="${escapeHTML(club.id)}">
      <div class="club-card-icon">${icon}</div>
      <h3>${escapeHTML(club.name)}</h3>
      <p>${escapeHTML(club.description || '')}</p>
      <div class="club-card-meta">
        <span>${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
      </div>
    </div>`;
}

function addCardListeners(container, pathPrefix = '') {
    container.querySelectorAll('.club-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.clubId;
            window.location.href = `${pathPrefix}club.html?id=${encodeURIComponent(id)}`;
        });
    });
}

// ---------- Club Detail Page Init ----------
async function initClubPage() {
    const { initClubDetail } = await import('./clubs.js');
    initClubDetail();
}

// Re-export for use in other modules
export { clubCardHTML, addCardListeners };
