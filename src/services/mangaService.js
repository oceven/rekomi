const JIKAN_URL = 'https://api.jikan.moe/v4';

//Map Jikan manga data to our normalized structure
const normalizeManga = (manga) => ({
  id: manga.mal_id,
  title: manga.title,
  name: manga.title,
  poster_path: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url,
  release_date: manga.published?.from,
  first_air_date: manga.published?.from,
  overview: manga.synopsis,
  genres: manga.genres?.map(g => g.name) || [],
  score: manga.score,
  chapters: manga.chapters,
  volumes: manga.volumes,
  status: manga.status,
  authors: manga.authors?.map(a => a.name) || [],
});


// Get popular manga
export const getPopularManga = async (limit = 10) => {
  try {
    const res = await fetch(`${JIKAN_URL}/top/manga?limit=${limit}&sfw=true`);
    
    if (!res.ok) {
      console.error('Jikan API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    return (data.data || []).map(normalizeManga);
  } catch (err) {
    console.error('Failed to fetch popular manga:', err);
    return [];
  }
};

// Search manga by query
export const searchManga = async (query, limit = 10) => {
  try {
    const res = await fetch(
      `${JIKAN_URL}/manga?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`
    );
    
    if (!res.ok) {
      console.error('Jikan API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    return (data.data || []).map(normalizeManga);
  } catch (err) {
    console.error('Search manga failed:', err);
    return [];
  }
};

// Get manga details by ID
export const getMangaDetails = async (mangaId) => {
  try {
    const res = await fetch(`${JIKAN_URL}/manga/${mangaId}/full`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const manga = data.data;
    
    if (!manga) return null;
    
    return {
      id: manga.mal_id,
      title: manga.title,
      poster_path: manga.images?.jpg?.large_image_url,
      release_date: manga.published?.from,
      overview: manga.synopsis,
      genres: manga.genres?.map(g => ({ id: g.mal_id, name: g.name })) || [],
      score: manga.score,
      chapters: manga.chapters,
      volumes: manga.volumes,
      status: manga.status,
      authors: manga.authors?.map(a => a.name) || [],
    };
  } catch (err) {
    console.error('Failed to fetch manga details:', err);
    return null;
  }
};