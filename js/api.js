/* ========================================
   MediaClub – API Integration Module
   Connects to three external APIs:
   1. Open Library (books) – no key required
   2. RAWG (video games) – API key required
   3. TMDB (movies) – API key required
   ======================================== */

// ---------- Open Library (Books) ----------

/**
 * Search Open Library for books matching a query.
 * @param {string} query - Search term.
 * @returns {Promise<Array<{title: string, author: string, cover: string|null, year: string}>>}
 */
export async function searchBooks(query) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.docs || []).map(doc => ({
            title: doc.title || 'Unknown',
            author: doc.author_name ? doc.author_name[0] : 'Unknown',
            cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
            year: doc.first_publish_year || ''
        }));
    } catch (_err) {
        return [];
    }
}

// ---------- RAWG (Games) ----------
const RAWG_KEY = 'f904bc7c192b433c92b8c4a39d9156a5';

/**
 * Search RAWG for video games matching a query.
 * @param {string} query - Search term.
 * @returns {Promise<Array<{title: string, image: string|null, rating: number}>>}
 */
export async function searchGames(query) {
    if (!RAWG_KEY) {
        // Fallback: return query as result so the field still works
        return [{ title: query }];
    }
    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_KEY)}&search=${encodeURIComponent(query)}&page_size=5`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || []).map(g => ({
            title: g.name || 'Unknown',
            image: g.background_image || null,
            rating: g.rating || 0
        }));
    } catch (_err) {
        return [];
    }
}

// ---------- TMDB (Movies) ----------
const TMDB_KEY = '7aa3052f920e734d11d4bc911ea9f472';

/**
 * Search TMDB for movies matching a query.
 * @param {string} query - Search term.
 * @returns {Promise<Array<{title: string, description: string, image: string|null, year: string}>>}
 */
export async function searchMovies(query) {
    if (!TMDB_KEY) {
        return [{ title: query }];
    }
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(TMDB_KEY)}&query=${encodeURIComponent(query)}&page=1`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || []).map(m => ({
            title: m.title || 'Unknown',
            description: m.overview || '',
            image: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null,
            year: m.release_date ? m.release_date.substring(0, 4) : ''
        }));
    } catch (_err) {
        return [];
    }
}
