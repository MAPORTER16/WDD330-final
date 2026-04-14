/* ========================================
   MediaClub – Clubs Module
   Handles club CRUD, club detail page,
   discussion posts, comments, events,
   and media recommendations.
   ======================================== */
import { showToast, escapeHTML, timeAgo, clubCardHTML, addCardListeners } from './app.js';
import { getCurrentUser, updateCurrentUser, requireAuth } from './auth.js';
import { addNotification } from './notifications.js';
import { searchBooks, searchGames, searchMovies } from './api.js';

const CLUBS_KEY = 'mediaclub_clubs';

// ---------- Storage ----------

/** @returns {Array<Object>} All club objects from localStorage. */
export function getClubs() {
    return JSON.parse(localStorage.getItem(CLUBS_KEY) || '[]');
}

/** Persist clubs array to localStorage. @param {Array<Object>} clubs */
function saveClubs(clubs) {
    localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
}

/**
 * Find a club by its unique ID.
 * @param {string} id - Club ID.
 * @returns {Object|null} The club object, or null if not found.
 */
export function getClubById(id) {
    return getClubs().find(c => c.id === id) || null;
}

/**
 * Merge updates into a club record and persist.
 * @param {string} id - Club ID.
 * @param {Object} updates - Key/value pairs to merge.
 */
function updateClub(id, updates) {
    const clubs = getClubs();
    const idx = clubs.findIndex(c => c.id === id);
    if (idx === -1) return;
    Object.assign(clubs[idx], updates);
    saveClubs(clubs);
}

// ---------- Seed Data ----------

/** Populate localStorage with sample clubs if none exist or if outdated. */
export function seedClubs() {
    const existing = getClubs();
    // Re-seed if the seed clubs are missing images (outdated data)
    const seedIds = ['club_1', 'club_2', 'club_3', 'club_4', 'club_5', 'club_6', 'club_7', 'club_8', 'club_9'];
    const seedClubsExist = seedIds.every(id => existing.some(c => c.id === id && c.image));
    if (existing.length > 0 && seedClubsExist) return;

    // Preserve any user-created clubs (non-seed)
    const userClubs = existing.filter(c => !seedIds.includes(c.id));
    localStorage.removeItem(CLUBS_KEY);
    const seed = [
        {
            id: 'club_1', name: 'Lord of the Rings Club',
            description: 'One ring to rule them all. Discuss Tolkien\'s epic saga, the films, and everything Middle-earth.',
            category: 'book',
            image: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s1', title: 'Best book in the trilogy?', content: 'I\'m team Return of the King — the Battle of Pelennor Fields gives me chills every time. What\'s everyone else\'s pick?', author: 'Gandalf_Fan', authorId: 'system', comments: [{ id: 'com_s1', text: 'Two Towers for me. Helm\'s Deep is peak Tolkien!', author: 'RohanRider', authorId: 'system', createdAt: Date.now() - 3600000 }], createdAt: Date.now() - 86400000 }
            ],
            events: [
                { id: 'evt_s1', title: 'Extended Edition Marathon', description: 'All three extended editions back to back — snacks provided!', date: '2026-04-15', time: '10:00', createdBy: 'system', createdAt: Date.now() }
            ],
            recommendations: [
                { id: 'rec_s1', title: 'The Silmarillion', description: 'Tolkien\'s deeper mythology — essential for any LOTR fan.', rating: 5, addedBy: 'Gandalf_Fan', createdAt: Date.now() },
                { id: 'rec_s2', title: 'The Hobbit', description: 'Where it all began. A lighter, cozy adventure.', rating: 4, addedBy: 'RohanRider', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 10
        },
        {
            id: 'club_2', name: 'Halo Fan Club',
            description: 'Finish the fight! Everything Halo — games, lore, multiplayer strategies, and Spartan builds.',
            category: 'game',
            image: 'https://media.rawg.io/media/games/e1f/e1ffbeb1bac25b19749ad285ca29e158.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s2', title: 'Halo Infinite - still playing?', content: 'Season 5 brought some great maps. Who\'s still grinding ranked?', author: 'MasterChief117', authorId: 'system', comments: [], createdAt: Date.now() - 86400000 * 2 }
            ],
            events: [
                { id: 'evt_s2', title: 'Halo 3 Custom Games Night', description: 'Fat Kid, Jenga, Trash Compactor — the classics.', date: '2026-04-12', time: '19:00', createdBy: 'system', createdAt: Date.now() }
            ],
            recommendations: [
                { id: 'rec_s3', title: 'Halo: The Fall of Reach', description: 'The novel that started the expanded universe. Must-read for lore fans.', rating: 5, addedBy: 'MasterChief117', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 8
        },
        {
            id: 'club_3', name: 'Marvel Cinematic Universe',
            description: 'Discuss every MCU film, series, and theory. From Iron Man to the Multiverse Saga.',
            category: 'movie',
            image: 'https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s3', title: 'Top 5 MCU films?', content: 'Mine: 1. Endgame 2. Infinity War 3. Winter Soldier 4. Guardians Vol 1 5. No Way Home. Fight me.', author: 'AvengersAssemble', authorId: 'system', comments: [{ id: 'com_s2', text: 'Ragnarok deserves a spot!', author: 'Thor_Odinson', authorId: 'system', createdAt: Date.now() - 7200000 }], createdAt: Date.now() - 86400000 * 3 }
            ],
            events: [
                { id: 'evt_s3', title: 'MCU Phase 7 Discussion', description: 'Breaking down all the new announcements and what they mean.', date: '2026-04-20', time: '18:00', createdBy: 'system', createdAt: Date.now() }
            ],
            recommendations: [
                { id: 'rec_s4', title: 'Avengers: Endgame', description: 'The culmination of 22 films. An absolute masterpiece.', rating: 5, addedBy: 'AvengersAssemble', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 14
        },
        {
            id: 'club_4', name: 'Harry Potter Society',
            description: 'Welcome to Hogwarts! Spells, houses, fan theories, and J.K. Rowling\'s Wizarding World.',
            category: 'book',
            image: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s4', title: 'Which house are you?', content: 'Proud Ravenclaw here 🦅 Drop your house and why!', author: 'LunaLovegood', authorId: 'system', comments: [{ id: 'com_s3', text: 'Hufflepuff! Loyalty above all.', author: 'CedricD', authorId: 'system', createdAt: Date.now() - 1800000 }], createdAt: Date.now() - 86400000 }
            ],
            events: [],
            recommendations: [
                { id: 'rec_s5', title: 'Fantastic Beasts and Where to Find Them', description: 'The textbook, not the movie — a fun companion read.', rating: 4, addedBy: 'LunaLovegood', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 6
        },
        {
            id: 'club_5', name: 'Zelda Quest Guild',
            description: 'From Ocarina of Time to Tears of the Kingdom — all things Legend of Zelda.',
            category: 'game',
            image: 'https://media.rawg.io/media/games/556/55684bfd048706f4266d331d70050b37.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s5', title: 'TOTK vs BOTW', content: 'Tears of the Kingdom added so much depth but I still love the discovery feeling of Breath of the Wild. Thoughts?', author: 'HyruleHero', authorId: 'system', comments: [], createdAt: Date.now() - 86400000 * 4 }
            ],
            events: [
                { id: 'evt_s5', title: 'Speedrun Challenge', description: 'Any% BOTW race — stream links in the discussion board.', date: '2026-04-18', time: '20:00', createdBy: 'system', createdAt: Date.now() }
            ],
            recommendations: [
                { id: 'rec_s6', title: 'Okami', description: 'If you love Zelda, Okami scratches the same itch beautifully.', rating: 5, addedBy: 'HyruleHero', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 5
        },
        {
            id: 'club_6', name: 'Studio Ghibli Fans',
            description: 'The magical worlds of Miyazaki and Studio Ghibli. Films, art, and soundtracks.',
            category: 'movie',
            image: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s6', title: 'Most underrated Ghibli film?', content: 'Everyone talks about Spirited Away and Totoro, but Porco Rosso is criminally underrated. What\'s yours?', author: 'TotoroFriend', authorId: 'system', comments: [{ id: 'com_s4', text: 'The Wind Rises is beautiful and heartbreaking.', author: 'KikiDelivery', authorId: 'system', createdAt: Date.now() - 5400000 }], createdAt: Date.now() - 86400000 * 2 }
            ],
            events: [
                { id: 'evt_s6', title: 'Ghibli Movie Marathon', description: 'Spirited Away → Howl\'s Moving Castle → Princess Mononoke. Bring blankets!', date: '2026-04-25', time: '14:00', createdBy: 'system', createdAt: Date.now() }
            ],
            recommendations: [
                { id: 'rec_s7', title: 'Spirited Away', description: 'The crown jewel of Ghibli. A masterpiece of animation.', rating: 5, addedBy: 'TotoroFriend', createdAt: Date.now() },
                { id: 'rec_s8', title: 'Princess Mononoke', description: 'Miyazaki\'s epic environmental fantasy.', rating: 5, addedBy: 'KikiDelivery', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 12
        },
        {
            id: 'club_7', name: 'Dune Chronicles',
            description: 'The spice must flow. Frank Herbert\'s epic and the Villeneuve films.',
            category: 'book',
            image: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [],
            events: [],
            recommendations: [
                { id: 'rec_s9', title: 'Dune: Part Two', description: 'Villeneuve\'s adaptation is stunning — possibly better than the book.', rating: 5, addedBy: 'MuadDib', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 3
        },
        {
            id: 'club_8', name: 'The Witcher World',
            description: 'Toss a coin! The Witcher games, books by Sapkowski, and the Netflix series.',
            category: 'game',
            image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s8', title: 'Books vs Games vs Show', content: 'Which version of The Witcher is the definitive experience? I say the games — Witcher 3 is a masterpiece.', author: 'GeraltOfRivia', authorId: 'system', comments: [], createdAt: Date.now() - 86400000 }
            ],
            events: [],
            recommendations: [
                { id: 'rec_s10', title: 'The Last Wish', description: 'Start here if you want to read the books. Short stories that introduce Geralt perfectly.', rating: 5, addedBy: 'GeraltOfRivia', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 7
        },
        {
            id: 'club_9', name: 'Christopher Nolan Films',
            description: 'Inception, Interstellar, The Dark Knight, Oppenheimer — dissecting cinema\'s greatest mind-benders.',
            category: 'movie',
            image: 'https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
            isPrivate: false, ownerId: 'system', members: ['system'],
            posts: [
                { id: 'post_s9', title: 'Nolan\'s best soundtrack moment?', content: 'The docking scene in Interstellar with Hans Zimmer\'s organ... nothing beats it.', author: 'NolanHead', authorId: 'system', comments: [{ id: 'com_s5', text: 'Time from Inception. That brass hit at the end! 🎺', author: 'DreamArchitect', authorId: 'system', createdAt: Date.now() - 3600000 }], createdAt: Date.now() - 86400000 * 2 }
            ],
            events: [],
            recommendations: [
                { id: 'rec_s11', title: 'Interstellar', description: 'A love letter to space, time, and humanity. Bring tissues.', rating: 5, addedBy: 'NolanHead', createdAt: Date.now() }
            ],
            createdAt: Date.now() - 86400000 * 9
        }
    ];
    saveClubs([...seed, ...userClubs]);
}

// ---------- Clubs List Page ----------

/** Initialize the clubs listing page: render, search, filter, and create club. */
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

    // Create club — multi-step wizard
    if (createClubBtn) {
        createClubBtn.addEventListener('click', () => {
            createClubModal.style.display = 'flex';
            // Reset to step 1
            showStep(1);
        });
    }
    if (createClubClose) {
        createClubClose.addEventListener('click', () => {
            createClubModal.style.display = 'none';
        });
    }

    // Step navigation
    let selectedImage = null;

    const step1 = document.getElementById('createStep1');
    const step2 = document.getElementById('createStep2');
    const step3 = document.getElementById('createStep3');
    const toStep2Btn = document.getElementById('toStep2');
    const toStep3Btn = document.getElementById('toStep3');
    const backToStep1Btn = document.getElementById('backToStep1');
    const backToStep2Btn = document.getElementById('backToStep2');

    /** Show a specific wizard step (1, 2, or 3). @param {number} n */
    function showStep(n) {
        if (step1) step1.style.display = n === 1 ? 'block' : 'none';
        if (step2) step2.style.display = n === 2 ? 'block' : 'none';
        if (step3) step3.style.display = n === 3 ? 'block' : 'none';
    }

    if (toStep2Btn) {
        toStep2Btn.addEventListener('click', () => {
            const name = document.getElementById('clubName').value.trim();
            const desc = document.getElementById('clubDescription').value.trim();
            if (!name) { showToast('Please enter a club name.', 'error'); return; }
            if (!desc) { showToast('Please enter a description.', 'error'); return; }
            showStep(2);
            // Auto-populate search with club name
            const searchInput = document.getElementById('imageSearchInput');
            if (searchInput && !searchInput.value) searchInput.value = name;
        });
    }
    if (backToStep1Btn) backToStep1Btn.addEventListener('click', () => showStep(1));

    if (toStep3Btn) {
        toStep3Btn.addEventListener('click', () => {
            // Check for custom URL if no image selected
            const customUrl = document.getElementById('customImageUrl');
            if (!selectedImage && customUrl && customUrl.value.trim()) {
                selectedImage = customUrl.value.trim();
            }
            populatePreview();
            showStep(3);
        });
    }
    if (backToStep2Btn) backToStep2Btn.addEventListener('click', () => showStep(2));

    // Image search
    const imageSearchBtn = document.getElementById('imageSearchBtn');
    const imageResults = document.getElementById('imageResults');

    if (imageSearchBtn) {
        imageSearchBtn.addEventListener('click', () => doImageSearch());
    }
    const imageSearchInput = document.getElementById('imageSearchInput');
    if (imageSearchInput) {
        imageSearchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); doImageSearch(); }
        });
    }

    /** Search the appropriate API for images based on selected category. */
    async function doImageSearch() {
        const query = document.getElementById('imageSearchInput').value.trim();
        if (!query) { showToast('Enter a search term.', 'error'); return; }
        const category = document.getElementById('clubCategory').value;

        if (imageResults) imageResults.innerHTML = '<p class="image-results-hint"><span class="loading-spinner"></span> Searching...</p>';

        let results = [];
        try {
            if (category === 'book') {
                results = (await searchBooks(query)).map(r => ({ title: r.title, image: r.cover, sub: r.author }));
            } else if (category === 'game') {
                results = (await searchGames(query)).map(r => ({ title: r.title, image: r.image, sub: r.rating ? `★ ${r.rating}` : '' }));
            } else {
                results = (await searchMovies(query)).map(r => ({ title: r.title, image: r.image, sub: r.year }));
            }
        } catch (_err) {
            // continue
        }

        results = results.filter(r => r.image);
        if (!results.length) {
            if (imageResults) imageResults.innerHTML = '<p class="image-results-hint">No images found. Try a different search or paste a URL below.</p>';
            return;
        }

        if (imageResults) {
            imageResults.innerHTML = results.map(r => `
                <button type="button" class="image-result-item" data-image="${escapeHTML(r.image)}">
                    <img src="${escapeHTML(r.image)}" alt="${escapeHTML(r.title)}" loading="lazy">
                    <span class="image-result-info">
                        <strong>${escapeHTML(r.title)}</strong>
                        ${r.sub ? `<small>${escapeHTML(r.sub)}</small>` : ''}
                    </span>
                </button>
            `).join('');

            imageResults.querySelectorAll('.image-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectImage(item.dataset.image);
                    imageResults.querySelectorAll('.image-result-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                });
            });
        }
    }

    /** Select an image to use as the club cover. @param {string} url */
    function selectImage(url) {
        selectedImage = url;
        const previewArea = document.getElementById('imagePreviewArea');
        const previewImg = document.getElementById('imagePreview');
        if (previewArea && previewImg) {
            previewImg.src = url;
            previewArea.style.display = 'flex';
        }
    }

    const clearImageBtn = document.getElementById('clearImage');
    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', () => {
            selectedImage = null;
            const previewArea = document.getElementById('imagePreviewArea');
            if (previewArea) previewArea.style.display = 'none';
            if (imageResults) imageResults.querySelectorAll('.image-result-item').forEach(i => i.classList.remove('selected'));
        });
    }

    /** Populate the step 3 preview card. */
    function populatePreview() {
        const name = document.getElementById('clubName').value.trim();
        const desc = document.getElementById('clubDescription').value.trim();
        const category = document.getElementById('clubCategory').value;
        const icon = category === 'book' ? '📚 Book Club' : category === 'game' ? '🎮 Game Club' : '🎬 Movie Club';

        const previewName = document.getElementById('previewName');
        const previewDesc = document.getElementById('previewDesc');
        const previewBadge = document.getElementById('previewBadge');
        const previewImage = document.getElementById('previewImage');

        if (previewName) previewName.textContent = name;
        if (previewDesc) previewDesc.textContent = desc;
        if (previewBadge) {
            previewBadge.textContent = icon;
            previewBadge.className = `club-card-badge club-card-badge--${category}`;
        }
        if (previewImage) {
            previewImage.innerHTML = selectedImage
                ? `<img src="${escapeHTML(selectedImage)}" alt="Club cover preview" loading="lazy">`
                : `<div class="club-card-icon" aria-hidden="true">${category === 'book' ? '📚' : category === 'game' ? '🎮' : '🎬'}</div>`;
        }
    }

    // Description character count
    const descTextarea = document.getElementById('clubDescription');
    const descCharCount = document.getElementById('descCharCount');
    if (descTextarea && descCharCount) {
        descTextarea.addEventListener('input', () => {
            descCharCount.textContent = `${descTextarea.value.length}/300`;
        });
    }

    if (createClubForm) {
        createClubForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = getCurrentUser();

            const name = document.getElementById('clubName').value.trim();
            const description = document.getElementById('clubDescription').value.trim();
            const category = document.getElementById('clubCategory').value;
            const isPrivate = document.getElementById('clubPrivate').checked;

            // Use the user-selected image, or try auto-fetch as fallback
            let image = selectedImage;
            if (!image) {
                try {
                    if (category === 'book') {
                        const results = await searchBooks(name);
                        if (results.length && results[0].cover) image = results[0].cover;
                    } else if (category === 'game') {
                        const results = await searchGames(name);
                        if (results.length && results[0].image) image = results[0].image;
                    } else if (category === 'movie') {
                        const results = await searchMovies(name);
                        if (results.length && results[0].image) image = results[0].image;
                    }
                } catch (_err) {
                    // Image fetch is best-effort; continue without image
                }
            }

            const clubs = getClubs();
            const newClub = {
                id: 'club_' + Date.now(),
                name,
                description,
                category,
                image,
                isPrivate,
                ownerId: user ? user.id : 'guest',
                members: user ? [user.id] : [],
                posts: [],
                events: [],
                recommendations: [],
                createdAt: Date.now()
            };
            clubs.push(newClub);
            saveClubs(clubs);

            // Add club to user's clubs if logged in
            if (user) {
                const userClubs = user.clubs || [];
                userClubs.push(newClub.id);
                updateCurrentUser({ clubs: userClubs });
            }

            showToast('Club created!', 'success');
            createClubModal.style.display = 'none';
            createClubForm.reset();
            selectedImage = null;
            render();
        });
    }
}

// ---------- Club Detail Page ----------

/**
 * Initialize the single-club detail page: members, posts,
 * comments, events, and recommendations.
 */
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

    // --- Club banner image ---
    const clubHeader = document.querySelector('.club-header');
    if (clubHeader && club.image) {
        const banner = document.createElement('div');
        banner.className = 'club-banner';
        banner.innerHTML = `<img src="${escapeHTML(club.image)}" alt="${escapeHTML(club.name)} banner" loading="lazy">`;
        clubHeader.parentNode.insertBefore(banner, clubHeader);
    }

    // --- Join / Leave ---
    function updateJoinBtn() {
        if (!joinBtn || !user) return;
        const c = getClubById(clubId);
        const isMember = c.members.includes(user.id);
        const isOwner = c.ownerId === user.id;
        if (isOwner) {
            joinBtn.textContent = '👑 Owner';
            joinBtn.className = 'btn btn-secondary';
            joinBtn.disabled = true;
        } else {
            joinBtn.textContent = isMember ? 'Leave Club' : 'Join Club';
            joinBtn.className = isMember ? 'btn btn-danger' : 'btn btn-secondary';
            joinBtn.disabled = false;
        }
    }
    updateJoinBtn();
    updateMemberCount();

    /** Update the member count badge in the header. */
    function updateMemberCount() {
        const badge = document.getElementById('memberCountBadge');
        if (!badge) return;
        const c = getClubById(clubId);
        const count = c.members.length;
        badge.textContent = `${count} member${count !== 1 ? 's' : ''}`;
    }

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const u = requireAuth();
            if (!u) return;
            const c = getClubById(clubId);
            if (c.ownerId === u.id) return; // Owner can't leave
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
                // Notify club owner
                if (c.ownerId && c.ownerId !== 'system') {
                    addNotification(c.ownerId, `${u.username} joined ${c.name}!`);
                }
            }
            updateClub(clubId, { members: c.members });
            updateJoinBtn();
            updateMemberCount();
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
            const name = mu ? mu.username : 'Unknown';
            const isOwner = mid === c.ownerId;
            return `<div class="member-chip" title="${escapeHTML(name)}${isOwner ? ' (Owner)' : ''}">
                <div class="member-avatar" style="background-color:${escapeHTML(color)}">${escapeHTML(initial)}</div>
                <span class="member-name">${escapeHTML(name)}</span>
                ${isOwner ? '<span class="member-role">👑</span>' : ''}
            </div>`;
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
            postsEl.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><p>No posts yet. Start the conversation!</p></div>';
            return;
        }
        postsEl.innerHTML = posts.map(p => {
            const likes = p.likes || [];
            const liked = user && likes.includes(user.id);
            const isAuthor = user && p.authorId === user.id;
            return `
      <div class="post" data-post-id="${escapeHTML(p.id)}">
        <div class="post-header">
          <div>
            <h4>${escapeHTML(p.title)}</h4>
            <span class="post-meta">${escapeHTML(p.author)} · ${timeAgo(p.createdAt)}</span>
          </div>
          ${isAuthor ? `<div class="post-owner-actions">
            <button class="post-icon-btn edit-post-btn" data-post-id="${escapeHTML(p.id)}" title="Edit post" aria-label="Edit post">✏️</button>
            <button class="post-icon-btn delete-post-btn" data-post-id="${escapeHTML(p.id)}" title="Delete post" aria-label="Delete post">🗑️</button>
          </div>` : ''}
        </div>
        <p class="post-content">${escapeHTML(p.content)}</p>
        <div class="post-actions">
          <button class="post-action-btn like-btn ${liked ? 'liked' : ''}" data-post-id="${escapeHTML(p.id)}">
            ${liked ? '❤️' : '🤍'} ${likes.length || ''}
          </button>
          <button class="post-action-btn comment-btn" data-post-id="${escapeHTML(p.id)}">💬 ${(p.comments || []).length}</button>
        </div>
      </div>`;
        }).join('');

        // Comment buttons
        postsEl.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', () => openComments(btn.dataset.postId));
        });

        // Like buttons
        postsEl.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const u = requireAuth();
                if (!u) return;
                const c = getClubById(clubId);
                const post = c.posts.find(p => p.id === btn.dataset.postId);
                if (!post) return;
                post.likes = post.likes || [];
                const idx = post.likes.indexOf(u.id);
                if (idx === -1) {
                    post.likes.push(u.id);
                } else {
                    post.likes.splice(idx, 1);
                }
                updateClub(clubId, { posts: c.posts });
                renderPosts();
            });
        });

        // Delete buttons
        postsEl.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Delete this post? This cannot be undone.')) return;
                const c = getClubById(clubId);
                c.posts = c.posts.filter(p => p.id !== btn.dataset.postId);
                updateClub(clubId, { posts: c.posts });
                showToast('Post deleted.', '');
                renderPosts();
            });
        });

        // Edit buttons
        postsEl.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = getClubById(clubId);
                const post = c.posts.find(p => p.id === btn.dataset.postId);
                if (!post) return;
                const titleInput = document.getElementById('newPostTitle');
                const contentInput = document.getElementById('newPostContent');
                titleInput.value = post.title;
                contentInput.value = post.content;
                editingPostId = post.id;
                submitPost.textContent = 'Save Edit';
                titleInput.focus();
            });
        });
    }
    renderPosts();

    // Post character count
    const postContentInput = document.getElementById('newPostContent');
    const postCharCount = document.getElementById('postCharCount');
    if (postContentInput && postCharCount) {
        postContentInput.addEventListener('input', () => {
            postCharCount.textContent = `${postContentInput.value.length}/1000`;
        });
    }

    // Submit / Edit post
    let editingPostId = null;
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

            if (editingPostId) {
                // Edit existing post
                const post = c.posts.find(p => p.id === editingPostId);
                if (post && post.authorId === u.id) {
                    post.title = title;
                    post.content = content;
                    updateClub(clubId, { posts: c.posts });
                    showToast('Post updated!', 'success');
                }
                editingPostId = null;
                submitPost.textContent = 'Post';
            } else {
                // New post
                const posts = c.posts || [];
                posts.push({
                    id: 'post_' + Date.now(),
                    title,
                    content,
                    author: u.username,
                    authorId: u.id,
                    comments: [],
                    likes: [],
                    createdAt: Date.now()
                });
                updateClub(clubId, { posts });

                // Notify club members
                c.members.forEach(mid => {
                    if (mid !== u.id) {
                        addNotification(mid, `${u.username} posted in ${c.name}: "${title}"`);
                    }
                });
                showToast('Post created!', 'success');
            }

            titleInput.value = '';
            contentInput.value = '';
            if (postCharCount) postCharCount.textContent = '0/1000';
            renderPosts();
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
        const postTitle = document.getElementById('commentPostTitle');
        modal.style.display = 'flex';

        if (postTitle) postTitle.textContent = `Re: ${post.title}`;

        const comments = post.comments || [];
        list.innerHTML = comments.length
            ? comments.map(cm => `
        <div class="comment">
          <div class="comment-header">
            <div>
              <span class="comment-author">${escapeHTML(cm.author)}</span>
              <span class="comment-time">${timeAgo(cm.createdAt)}</span>
            </div>
            ${user && cm.authorId === user.id ? `<button class="delete-comment-btn" data-comment-id="${escapeHTML(cm.id)}" title="Delete comment" aria-label="Delete comment">🗑️</button>` : ''}
          </div>
          <p class="comment-text">${escapeHTML(cm.text)}</p>
        </div>`).join('')
            : '<div class="empty-state small"><p>No comments yet. Be the first!</p></div>';

        // Delete comment handlers
        list.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Delete this comment?')) return;
                const c2 = getClubById(clubId);
                const p2 = c2.posts.find(p => p.id === currentPostId);
                if (!p2) return;
                p2.comments = (p2.comments || []).filter(cm => cm.id !== btn.dataset.commentId);
                updateClub(clubId, { posts: c2.posts });
                openComments(currentPostId);
                renderPosts();
            });
        });
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
        const pastEventsEl = document.getElementById('pastEventsList');
        const pastSection = document.getElementById('pastEventsSection');
        if (!eventsEl) return;
        const c = getClubById(clubId);
        const events = (c.events || []).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        const now = new Date();
        const upcoming = events.filter(ev => new Date(ev.date + 'T' + ev.time) >= now);
        const past = events.filter(ev => new Date(ev.date + 'T' + ev.time) < now).reverse();

        eventsEl.innerHTML = upcoming.length
            ? upcoming.map(ev => renderEventCard(ev, false)).join('')
            : '<div class="empty-state small"><span class="empty-icon">📅</span><p>No upcoming events.</p></div>';

        // Past events
        if (pastEventsEl && pastSection) {
            if (past.length) {
                pastSection.style.display = 'block';
                pastEventsEl.innerHTML = past.map(ev => renderEventCard(ev, true)).join('');
            } else {
                pastSection.style.display = 'none';
            }
        }

        // Attach event handlers
        attachEventHandlers(eventsEl);
        if (pastEventsEl) attachEventHandlers(pastEventsEl);
    }

    /** Render a single event card HTML. @param {Object} ev @param {boolean} isPast */
    function renderEventCard(ev, isPast) {
        const attendees = ev.attendees || [];
        const isAttending = user && attendees.includes(user.id);
        const isCreator = user && ev.createdBy === user.id;
        const eventDate = new Date(ev.date + 'T' + ev.time);
        const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `
        <div class="event-card ${isPast ? 'event-past' : ''}">
          <div class="event-date-badge">
            <span class="event-month">${eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span class="event-day">${eventDate.getDate()}</span>
          </div>
          <div class="event-details">
            <h4>${escapeHTML(ev.title)}</h4>
            <p class="event-datetime">📅 ${dateStr} at ${timeStr}</p>
            ${ev.location ? `<p class="event-location">📍 ${escapeHTML(ev.location)}</p>` : ''}
            ${ev.description ? `<p class="event-desc">${escapeHTML(ev.description)}</p>` : ''}
            <div class="event-footer">
              <span class="event-attendees">${attendees.length} attending</span>
              ${!isPast ? `<button class="btn btn-sm ${isAttending ? 'btn-danger' : 'btn-primary'} rsvp-btn" data-event-id="${escapeHTML(ev.id)}">${isAttending ? 'Cancel RSVP' : 'RSVP'}</button>` : ''}
              ${isCreator ? `<button class="post-icon-btn delete-event-btn" data-event-id="${escapeHTML(ev.id)}" title="Delete event" aria-label="Delete event">🗑️</button>` : ''}
            </div>
          </div>
        </div>`;
    }

    /** Attach RSVP and delete handlers to event buttons. @param {HTMLElement} container */
    function attachEventHandlers(container) {
        container.querySelectorAll('.rsvp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const u = requireAuth();
                if (!u) return;
                const c = getClubById(clubId);
                const ev = (c.events || []).find(e => e.id === btn.dataset.eventId);
                if (!ev) return;
                ev.attendees = ev.attendees || [];
                const idx = ev.attendees.indexOf(u.id);
                if (idx === -1) {
                    ev.attendees.push(u.id);
                    showToast('RSVP confirmed!', 'success');
                } else {
                    ev.attendees.splice(idx, 1);
                    showToast('RSVP cancelled.', '');
                }
                updateClub(clubId, { events: c.events });
                renderEvents();
            });
        });

        container.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Delete this event?')) return;
                const c = getClubById(clubId);
                c.events = (c.events || []).filter(e => e.id !== btn.dataset.eventId);
                updateClub(clubId, { events: c.events });
                showToast('Event deleted.', '');
                renderEvents();
            });
        });
    }

    renderEvents();

    // Past events toggle
    const pastToggle = document.getElementById('pastEventsToggle');
    const pastList = document.getElementById('pastEventsList');
    if (pastToggle && pastList) {
        pastToggle.addEventListener('click', () => {
            const isOpen = pastList.style.display !== 'none';
            pastList.style.display = isOpen ? 'none' : 'block';
            pastToggle.querySelector('.toggle-arrow').textContent = isOpen ? '▸' : '▾';
        });
    }

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
            const location = document.getElementById('eventLocation').value.trim();
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;

            const events = c.events || [];
            events.push({
                id: 'evt_' + Date.now(),
                title,
                description,
                location,
                date,
                time,
                attendees: [u.id],
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
    if (postComposer) {
        const c = getClubById(clubId);
        if (!user || !c.members.includes(user.id)) {
            postComposer.style.display = 'none';
        }
    }
}
