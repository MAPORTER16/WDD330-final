/* ========================================
   MediaClub – Profile Module
   Handles profile display, editing,
   favorite media with live API search,
   activity feed, and user club listing.
   ======================================== */
import { showToast, escapeHTML } from './app.js';
import { getCurrentUser, updateCurrentUser } from './auth.js';
import { getClubs } from './clubs.js';
import { searchBooks, searchGames, searchMovies } from './api.js';

/** Initialize the profile page: render user data, clubs, activity, and edit modal. */
export function initProfile() {
    const user = getCurrentUser();
    if (!user) return;

    // --- Render Profile Header ---
    const usernameEl = document.getElementById('profileUsername');
    const avatarEl = document.getElementById('profileAvatar');
    const initialEl = document.getElementById('avatarInitial');

    if (usernameEl) usernameEl.textContent = user.username;
    if (avatarEl) avatarEl.style.backgroundColor = user.avatarColor || '#2D6CDF';
    if (initialEl) initialEl.textContent = user.username.charAt(0).toUpperCase();

    // --- Favorite Media ---
    const favBookEl = document.getElementById('favBook');
    const favGameEl = document.getElementById('favGame');
    const favMovieEl = document.getElementById('favMovie');

    if (favBookEl) favBookEl.textContent = user.favBook || 'Not set';
    if (favGameEl) favGameEl.textContent = user.favGame || 'Not set';
    if (favMovieEl) favMovieEl.textContent = user.favMovie || 'Not set';

    // --- My Clubs ---
    function renderMyClubs() {
        const myClubsEl = document.getElementById('myClubsList');
        if (!myClubsEl) return;
        const allClubs = getClubs();
        const userClubs = allClubs.filter(c => (user.clubs || []).includes(c.id));
        if (!userClubs.length) {
            myClubsEl.innerHTML = '<p class="clubs-empty">You haven\'t joined any clubs yet.</p>';
            return;
        }
        myClubsEl.innerHTML = userClubs.map(c => `
      <a class="my-club-item" href="club.html?id=${encodeURIComponent(c.id)}">
        <h4>${escapeHTML(c.name)}</h4>
      </a>
    `).join('');
    }
    renderMyClubs();

    // --- Activity Feed ---
    function renderActivity() {
        const feedEl = document.getElementById('activityFeed');
        if (!feedEl) return;
        const allClubs = getClubs();
        const activities = [];

        allClubs.forEach(club => {
            (club.posts || []).forEach(p => {
                if (p.authorId === user.id) {
                    activities.push({
                        text: `Posted "${p.title}" in ${club.name}`,
                        time: p.createdAt
                    });
                }
                (p.comments || []).forEach(c => {
                    if (c.authorId === user.id) {
                        activities.push({
                            text: `Commented on "${p.title}" in ${club.name}`,
                            time: c.createdAt
                        });
                    }
                });
            });
        });

        activities.sort((a, b) => b.time - a.time);
        const recent = activities.slice(0, 10);

        if (!recent.length) {
            feedEl.innerHTML = '<p class="feed-empty">No recent activity</p>';
            return;
        }

        feedEl.innerHTML = recent.map(a => {
            const d = new Date(a.time);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `
        <div class="activity-item">
          <p>${escapeHTML(a.text)}</p>
          <p class="activity-time">${dateStr}</p>
        </div>`;
        }).join('');
    }
    renderActivity();

    // --- Edit Profile ---
    const editBtn = document.getElementById('editProfileBtn');
    const editModal = document.getElementById('editProfileModal');
    const editClose = document.getElementById('editProfileClose');
    const editForm = document.getElementById('editProfileForm');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // Pre-fill form
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editAvatar').value = user.avatarColor || '#2D6CDF';
            document.getElementById('editFavBook').value = user.favBook || '';
            document.getElementById('editFavGame').value = user.favGame || '';
            document.getElementById('editFavMovie').value = user.favMovie || '';
            editModal.style.display = 'flex';
        });
    }
    if (editClose) {
        editClose.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    // --- API Suggestions for Media ---
    setupMediaSearch('editFavBook', 'bookSuggestions', searchBooks);
    setupMediaSearch('editFavGame', 'gameSuggestions', searchGames);
    setupMediaSearch('editFavMovie', 'movieSuggestions', searchMovies);

    // --- Save Profile ---
    if (editForm) {
        editForm.addEventListener('submit', e => {
            e.preventDefault();
            const newUsername = document.getElementById('editUsername').value.trim();
            const newColor = document.getElementById('editAvatar').value;
            const newBook = document.getElementById('editFavBook').value.trim();
            const newGame = document.getElementById('editFavGame').value.trim();
            const newMovie = document.getElementById('editFavMovie').value.trim();

            if (newUsername.length < 3) {
                showToast('Username must be at least 3 characters.', 'error');
                return;
            }

            updateCurrentUser({
                username: newUsername,
                avatarColor: newColor,
                favBook: newBook,
                favGame: newGame,
                favMovie: newMovie
            });

            showToast('Profile updated!', 'success');
            editModal.style.display = 'none';
            // Refresh
            window.location.reload();
        });
    }
}

// ---------- Media Search Helper ----------

/**
 * Wire up a text input to fetch API suggestions as the user types.
 * @param {string} inputId - DOM ID of the text input.
 * @param {string} suggestionsId - DOM ID of the suggestions container.
 * @param {Function} searchFn - Async search function returning array of {title} objects.
 */
function setupMediaSearch(inputId, suggestionsId, searchFn) {
    const input = document.getElementById(inputId);
    const suggestionsEl = document.getElementById(suggestionsId);
    if (!input || !suggestionsEl) return;

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (query.length < 2) {
            suggestionsEl.classList.remove('open');
            return;
        }
        debounceTimer = setTimeout(async () => {
            try {
                const results = await searchFn(query);
                if (!results.length) {
                    suggestionsEl.classList.remove('open');
                    return;
                }
                suggestionsEl.innerHTML = results.slice(0, 5).map(r =>
                    `<div class="api-suggestion-item" data-value="${escapeHTML(r.title)}">${escapeHTML(r.title)}</div>`
                ).join('');
                suggestionsEl.classList.add('open');

                suggestionsEl.querySelectorAll('.api-suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.value;
                        suggestionsEl.classList.remove('open');
                    });
                });
            } catch {
                suggestionsEl.classList.remove('open');
            }
        }, 400);
    });

    // Close suggestions on blur
    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !suggestionsEl.contains(e.target)) {
            suggestionsEl.classList.remove('open');
        }
    });
}
