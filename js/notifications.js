/* ========================================
   MediaClub – Notifications Module
   In-app notification system with badge
   count and a slide-out panel.
   ======================================== */
import { getCurrentUser } from './auth.js';
import { escapeHTML, timeAgo } from './app.js';

const NOTIF_KEY = 'mediaclub_notifications';

/** @returns {Array<Object>} All notification objects from localStorage. */
function getNotifications() {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
}

/** Persist notifications array. @param {Array<Object>} notifs */
function saveNotifications(notifs) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

/**
 * Add a notification for a specific user.
 * @param {string} userId - Target user ID.
 * @param {string} message - Notification text.
 */
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

/** Update the notification badge count in the navbar. */
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

/** Initialize the notifications panel and mark-as-read behaviour. */
export function initNotifications() {
    const user = getCurrentUser();
    if (!user) return;

    updateBadge();

    const notifList = document.getElementById('notifList');
    const notifPanel = document.getElementById('notifPanel');
    const notifLink = document.getElementById('notifLink');

    if (notifLink) {
        notifLink.addEventListener('click', () => {
            if (notifPanel) notifPanel.classList.toggle('open');
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
