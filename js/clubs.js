/* ========================================
   MediaClub – Clubs Module
   ======================================== */
import { showToast, escapeHTML, timeAgo, clubCardHTML, addCardListeners } from './app.js';
import { getCurrentUser, updateCurrentUser, requireAuth } from './auth.js';
import { addNotification } from './notifications.js';

const CLUBS_KEY = 'mediaclub_clubs';

// ---------- Storage ----------
export function getClubs() {
    return JSON.parse(localStorage.getItem(CLUBS_KEY) || '[]');
}

function saveClubs(clubs) {
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
}

export function getClubById(id) {
    return getClubs().find(c => c.id === id) || null;
}

function updateClub(id, updates) {
    const clubs = getClubs();
    const idx = clubs.findIndex(c => c.id === id);
    if (idx === -1) return;
    Object.assign(clubs[idx], updates);
    saveClubs(clubs);
}

// ---------- Seed Data ----------
export function seedClubs() {
    const existing = getClubs();
    if (existing.length > 0) return;
    const seed = [
        { id: 'club_1', name: 'Sci-Fi Book Lovers', description: 'Discuss your favorite science fiction novels and discover new ones.', category: 'book', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 * 5 },
        { id: 'club_2', name: 'Indie Game Explorers', description: 'Share and discover indie games that push boundaries.', category: 'game', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 * 3 },
        { id: 'club_3', name: 'Classic Cinema Club', description: 'A club for fans of films from the golden age of cinema.', category: 'movie', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 * 7 },
        { id: 'club_4', name: 'Fantasy Readers Guild', description: 'Epic fantasy, urban fantasy, and everything in between.', category: 'book', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 * 2 },
        { id: 'club_5', name: 'RPG Masters', description: 'For fans of role-playing games old and new.', category: 'game', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 },
        { id: 'club_6', name: 'Horror Movie Nights', description: 'Weekly horror movie watch parties and discussions.', category: 'movie', isPrivate: false, ownerId: 'system', members: ['system'], posts: [], events: [], recommendations: [], createdAt: Date.now() - 86400000 * 4 },
    ];
    saveClubs(seed);
}

// ---------- Clubs List Page ----------
export function initClubs() {
    seedClubs();

    const clubsList = document.getElementById('clubsList');
    const searchInput = document.getElementById('clubSearchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const createClubBtn = document.getElementById('createClubBtn');
    const createClubModal = document.getElementById('createClubModal');
    const createClubClose = document.getElementById('createClubClose');
    const createClubForm = document.getElementById('createClubForm');

    let currentCategory = 'all';

    function render() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let clubs = getClubs();

        if (currentCategory !== 'all') {
            clubs = clubs.filter(c => c.category === currentCategory);
        }
        if (query) {
            clubs = clubs.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query)
            );
        }

        if (clubsList) {
            clubsList.innerHTML = clubs.length
                ? clubs.map(c => clubCardHTML(c)).join('')
                : '<p style="color:#999; grid-column:1/-1;">No clubs found.</p>';
            addCardListeners(clubsList);
        }
    }

    render();

    if (searchInput) searchInput.addEventListener('input', render);

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            render();
        });
    });

    // Create club
    if (createClubBtn) {
        createClubBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            createClubModal.style.display = 'flex';
        });
    }
    if (createClubClose) {
        createClubClose.addEventListener('click', () => {
            createClubModal.style.display = 'none';
        });
    }
    if (createClubForm) {
        createClubForm.addEventListener('submit', e => {
            e.preventDefault();
            const user = requireAuth();
            if (!user) return;

            const name = document.getElementById('clubName').value.trim();
            const description = document.getElementById('clubDescription').value.trim();
            const category = document.getElementById('clubCategory').value;
            const isPrivate = document.getElementById('clubPrivate').checked;

            const clubs = getClubs();
            const newClub = {
                id: 'club_' + Date.now(),
                name,
                description,
                category,
                isPrivate,
                ownerId: user.id,
                members: [user.id],
                posts: [],
                events: [],
                recommendations: [],
                createdAt: Date.now()
            };
            clubs.push(newClub);
            saveClubs(clubs);

            // Add club to user's clubs
            const userClubs = user.clubs || [];
            userClubs.push(newClub.id);
            updateCurrentUser({ clubs: userClubs });

            showToast('Club created!', 'success');
            createClubModal.style.display = 'none';
            createClubForm.reset();
            render();
        });
    }
}

// ---------- Club Detail Page ----------
export function initClubDetail() {
    seedClubs();

    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id');
    if (!clubId) {
        showToast('Club not found.', 'error');
        return;
    }

    const club = getClubById(clubId);
    if (!club) {
        showToast('Club not found.', 'error');
        return;
    }

    const user = getCurrentUser();

    // --- Render club info ---
    document.title = `MediaClub - ${club.name}`;
    const titleEl = document.getElementById('clubTitle');
    const badgeEl = document.getElementById('clubCategoryBadge');
    const joinBtn = document.getElementById('joinBtn');

    if (titleEl) titleEl.textContent = club.name;
    if (badgeEl) {
        const icon = club.category === 'book' ? '📚 Book' : club.category === 'game' ? '🎮 Game' : '🎬 Movie';
        badgeEl.textContent = icon;
    }

    // --- Join / Leave ---
    function updateJoinBtn() {
        if (!joinBtn || !user) return;
        const c = getClubById(clubId);
        const isMember = c.members.includes(user.id);
        joinBtn.textContent = isMember ? 'Leave' : 'Join';
        joinBtn.className = isMember ? 'btn btn-danger' : 'btn btn-secondary';
    }
    updateJoinBtn();

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const u = requireAuth();
            if (!u) return;
            const c = getClubById(clubId);
            const isMember = c.members.includes(u.id);
            if (isMember) {
                c.members = c.members.filter(m => m !== u.id);
                const userClubs = (u.clubs || []).filter(cid => cid !== clubId);
                updateCurrentUser({ clubs: userClubs });
                showToast('You left the club.', '');
            } else {
                c.members.push(u.id);
                const userClubs = u.clubs || [];
                userClubs.push(clubId);
                updateCurrentUser({ clubs: userClubs });
                showToast('You joined the club!', 'success');
            }
            updateClub(clubId, { members: c.members });
            updateJoinBtn();
            renderMembers();
        });
    }

    // --- Members ---
    function renderMembers() {
        const membersEl = document.getElementById('membersList');
        if (!membersEl) return;
        const c = getClubById(clubId);
        const users = JSON.parse(localStorage.getItem('mediaclub_users') || '[]');
        membersEl.innerHTML = c.members.map(mid => {
            const mu = users.find(u => u.id === mid);
            const initial = mu ? mu.username.charAt(0).toUpperCase() : '?';
            const color = mu ? (mu.avatarColor || '#6C4AB6') : '#6C4AB6';
            return `<div class="member-avatar" style="background-color:${escapeHTML(color)}" title="${escapeHTML(mu ? mu.username : 'Unknown')}">${escapeHTML(initial)}</div>`;
        }).join('');
    }
    renderMembers();

    // --- Discussion Board ---
    function renderPosts() {
        const postsEl = document.getElementById('postsList');
        if (!postsEl) return;
        const c = getClubById(clubId);
        const posts = (c.posts || []).sort((a, b) => b.createdAt - a.createdAt);
        if (!posts.length) {
            postsEl.innerHTML = '<p style="color:#999;">No posts yet. Start the conversation!</p>';
            return;
        }
        postsEl.innerHTML = posts.map(p => `
      <div class="post" data-post-id="${escapeHTML(p.id)}">
        <div class="post-header">
          <div>
            <h4>${escapeHTML(p.title)}</h4>
            <span class="post-meta">${escapeHTML(p.author)} · ${timeAgo(p.createdAt)}</span>
          </div>
        </div>
        <p class="post-content">${escapeHTML(p.content)}</p>
        <div class="post-actions">
          <button class="post-action-btn comment-btn" data-post-id="${escapeHTML(p.id)}">💬 Comments (${(p.comments || []).length})</button>
        </div>
      </div>
    `).join('');

        // Comment buttons
        postsEl.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', () => openComments(btn.dataset.postId));
        });
    }
    renderPosts();

    // Submit post
    const submitPost = document.getElementById('submitPost');
    if (submitPost) {
        submitPost.addEventListener('click', () => {
            const u = requireAuth();
            if (!u) return;
            const c = getClubById(clubId);
            if (!c.members.includes(u.id)) {
                showToast('Join the club to post.', 'error');
                return;
            }
            const titleInput = document.getElementById('newPostTitle');
            const contentInput = document.getElementById('newPostContent');
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            if (!title || !content) {
                showToast('Please fill in title and content.', 'error');
                return;
            }
            const posts = c.posts || [];
            posts.push({
                id: 'post_' + Date.now(),
                title,
                content,
                author: u.username,
                authorId: u.id,
                comments: [],
                createdAt: Date.now()
            });
            updateClub(clubId, { posts });
            titleInput.value = '';
            contentInput.value = '';
            showToast('Post created!', 'success');
            renderPosts();

            // Notify club members
            c.members.forEach(mid => {
                if (mid !== u.id) {
                    addNotification(mid, `${u.username} posted in ${c.name}: "${title}"`);
                }
            });
        });
    }

    // --- Comments ---
    let currentPostId = null;

    function openComments(postId) {
        currentPostId = postId;
        const c = getClubById(clubId);
        const post = c.posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('commentModal');
        const list = document.getElementById('commentsList');
        modal.style.display = 'flex';

        const comments = post.comments || [];
        list.innerHTML = comments.length
            ? comments.map(cm => `
        <div class="comment">
          <span class="comment-author">${escapeHTML(cm.author)}</span>
          <span class="comment-time">${timeAgo(cm.createdAt)}</span>
          <p class="comment-text">${escapeHTML(cm.text)}</p>
        </div>`).join('')
            : '<p style="color:#999;">No comments yet.</p>';
    }

    const commentModalClose = document.getElementById('commentModalClose');
    if (commentModalClose) {
        commentModalClose.addEventListener('click', () => {
            document.getElementById('commentModal').style.display = 'none';
        });
    }

    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', e => {
            e.preventDefault();
            const u = requireAuth();
            if (!u || !currentPostId) return;
            const text = document.getElementById('commentContent').value.trim();
            if (!text) return;

            const c = getClubById(clubId);
            const post = c.posts.find(p => p.id === currentPostId);
            if (!post) return;

            post.comments = post.comments || [];
            post.comments.push({
                id: 'com_' + Date.now(),
                text,
                author: u.username,
                authorId: u.id,
                createdAt: Date.now()
            });
            updateClub(clubId, { posts: c.posts });
            document.getElementById('commentContent').value = '';
            openComments(currentPostId);
            renderPosts();

            // Notify post author
            if (post.authorId !== u.id) {
                addNotification(post.authorId, `${u.username} replied to your post "${post.title}"`);
            }
        });
    }

    // --- Events ---
    function renderEvents() {
        const eventsEl = document.getElementById('eventsList');
        if (!eventsEl) return;
        const c = getClubById(clubId);
        const events = (c.events || []).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        const upcoming = events.filter(ev => new Date(ev.date + 'T' + ev.time) >= new Date());
        eventsEl.innerHTML = upcoming.length
            ? upcoming.map(ev => `
        <div class="event-card">
          <h4>${escapeHTML(ev.title)}</h4>
          <p>${escapeHTML(ev.date)} at ${escapeHTML(ev.time)}</p>
          ${ev.description ? `<p style="margin-top:4px;font-size:0.84rem;">${escapeHTML(ev.description)}</p>` : ''}
        </div>`).join('')
            : '<p style="color:#999;">No upcoming events.</p>';
    }
    renderEvents();

    // Create event
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const eventModalClose = document.getElementById('eventModalClose');
    const eventForm = document.getElementById('eventForm');

    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            eventModal.style.display = 'flex';
        });
    }
    if (eventModalClose) {
        eventModalClose.addEventListener('click', () => {
            eventModal.style.display = 'none';
        });
    }
    if (eventForm) {
        eventForm.addEventListener('submit', e => {
            e.preventDefault();
            const u = requireAuth();
            if (!u) return;
            const c = getClubById(clubId);
            const title = document.getElementById('eventTitle').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;

            const events = c.events || [];
            events.push({
                id: 'evt_' + Date.now(),
                title,
                description,
                date,
                time,
                createdBy: u.id,
                createdAt: Date.now()
            });
            updateClub(clubId, { events });
            showToast('Event created!', 'success');
            eventModal.style.display = 'none';
            eventForm.reset();
            renderEvents();

            // Notify members
            c.members.forEach(mid => {
                if (mid !== u.id) {
                    addNotification(mid, `New event in ${c.name}: "${title}" on ${date}`);
                }
            });
        });
    }

    // Events button scroll
    const eventsBtn = document.getElementById('eventsBtn');
    if (eventsBtn) {
        eventsBtn.addEventListener('click', () => {
            document.getElementById('eventsList')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- Recommendations ---
    function renderRecommendations() {
        const recEl = document.getElementById('recommendationsList');
        if (!recEl) return;
        const c = getClubById(clubId);
        const recs = (c.recommendations || []).sort((a, b) => b.rating - a.rating);
        recEl.innerHTML = recs.length
            ? recs.map(r => `
        <div class="recommendation-card">
          <div>
            <h4>${escapeHTML(r.title)}</h4>
            <p>${escapeHTML(r.description || '')}</p>
          </div>
          <span class="recommendation-rating">${'⭐'.repeat(r.rating)}</span>
        </div>`).join('')
            : '<p style="color:#999;">No recommendations yet.</p>';
    }
    renderRecommendations();

    const addRecBtn = document.getElementById('addRecommendationBtn');
    const recModal = document.getElementById('recModal');
    const recModalClose = document.getElementById('recModalClose');
    const recForm = document.getElementById('recForm');

    if (addRecBtn) {
        addRecBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            recModal.style.display = 'flex';
        });
    }
    if (recModalClose) {
        recModalClose.addEventListener('click', () => {
            recModal.style.display = 'none';
        });
    }
    if (recForm) {
        recForm.addEventListener('submit', e => {
            e.preventDefault();
            const u = requireAuth();
            if (!u) return;
            const title = document.getElementById('recTitle').value.trim();
            const description = document.getElementById('recDescription').value.trim();
            const rating = parseInt(document.getElementById('recRating').value, 10);

            const c = getClubById(clubId);
            const recs = c.recommendations || [];
            recs.push({
                id: 'rec_' + Date.now(),
                title,
                description,
                rating,
                addedBy: u.username,
                createdAt: Date.now()
            });
            updateClub(clubId, { recommendations: recs });
            showToast('Recommendation added!', 'success');
            recModal.style.display = 'none';
            recForm.reset();
            renderRecommendations();
        });
    }

    // Hide post composer if not a member
    const postComposer = document.getElementById('postComposer');
    if (postComposer && user) {
        const c = getClubById(clubId);
        if (!c.members.includes(user.id)) {
            postComposer.style.display = 'none';
        }
    }
}
