/* ========================================
   MediaClub – API Integration Module
   Open Library, RAWG, TMDB
   ======================================== */

// ---------- Open Library (Books) ----------
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
    } catch {
        return [];
    }
}

// ---------- RAWG (Games) ----------
// NOTE: RAWG requires an API key. Get a free one at https://rawg.io/apidocs
// For demo purposes, we use a fallback if the key is not set.
const RAWG_KEY = ''; // Add your key here if you have one

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
    } catch {
        return [];
    }
}

// ---------- TMDB (Movies) ----------
// NOTE: TMDB requires an API key. Get one at https://www.themoviedb.org/settings/api
const TMDB_KEY = ''; // Add your key here if you have one

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
    } catch {
        return [];
    }
}
