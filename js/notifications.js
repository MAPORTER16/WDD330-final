/* ========================================
   MediaClub – Notifications Module
   ======================================== */
import { getCurrentUser } from './auth.js';
import { escapeHTML, timeAgo } from './app.js';

const NOTIF_KEY = 'mediaclub_notifications';

function getNotifications() {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
}

function saveNotifications(notifs) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function addNotification(userId, message) {
    const notifs = getNotifications();
    notifs.push({
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        message,
        read: false,
        createdAt: Date.now()
    });
    saveNotifications(notifs);
    // Update badge if on page
    updateBadge();
}

function updateBadge() {
    const user = getCurrentUser();
    if (!user) return;
    const notifs = getNotifications().filter(n => n.userId === user.id && !n.read);
    const badge = document.getElementById('notifBadge');
    if (badge) {
        if (notifs.length > 0) {
            badge.style.display = 'inline';
            badge.textContent = notifs.length > 99 ? '99+' : notifs.length;
        } else {
            badge.style.display = 'none';
        }
    }
}

export function initNotifications() {
    const user = getCurrentUser();
    if (!user) return;

    updateBadge();

    const notifList = document.getElementById('notifList');
    const notifPanel = document.getElementById('notifPanel');
    const notifLink = document.getElementById('notifLink');

    if (notifLink) {
        notifLink.addEventListener('click', () => {
            renderNotifications();
            // Mark all as read
            const notifs = getNotifications();
            notifs.forEach(n => {
                if (n.userId === user.id) n.read = true;
            });
            saveNotifications(notifs);
            setTimeout(updateBadge, 500);
        });
    }

    function renderNotifications() {
        if (!notifList) return;
        const notifs = getNotifications()
            .filter(n => n.userId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20);

        if (!notifs.length) {
            notifList.innerHTML = '<p class="notif-empty">No new notifications</p>';
            return;
        }
        notifList.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <p>${escapeHTML(n.message)}</p>
        <small style="color:#999;">${timeAgo(n.createdAt)}</small>
      </div>
    `).join('');
    }
}
