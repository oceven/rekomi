const JIKAN_URL = 'https://api.jikan.moe/v4';

//Map Jikan anime data to our normalized structure
const normalizeAnime = (anime) => ({
  id: anime.mal_id,
  title: anime.title,
  name: anime.title,
  poster_path: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
  release_date: anime.aired?.from,
  first_air_date: anime.aired?.from,
  overview: anime.synopsis,
  genres: anime.genres?.map(g => g.name) || [],
  score: anime.score,
  episodes: anime.episodes,
  status: anime.status,
});

// Get popular anime
export const getPopularAnime = async (limit = 10) => {
  try {
    const res = await fetch(`${JIKAN_URL}/top/anime?limit=${limit}&sfw=true`);
    
    if (!res.ok) {
      console.error('Jikan API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    return (data.data || []).map(normalizeAnime);
  } catch (err) {
    console.error('Failed to fetch popular anime:', err);
    return [];
  }
};

// Search anime by query
export const searchAnime = async (query, limit = 10) => {
  try {
    const res = await fetch(
      `${JIKAN_URL}/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`
    );
    const data = await res.json();
    
    return (data.data || []).map(normalizeAnime);
  } catch (err) {
    console.error('Search anime failed:', err);
    return [];
  }
};


// Get anime details by ID
export const getAnimeDetails = async (animeId) => {
  try {
    const res = await fetch(`${JIKAN_URL}/anime/${animeId}/full`);
    const data = await res.json();
    const anime = data.data;
    
    if (!anime) return null;
    
    return {
      id: anime.mal_id,
      title: anime.title,
      poster_path: anime.images?.jpg?.large_image_url,
      release_date: anime.aired?.from,
      overview: anime.synopsis,
      genres: anime.genres?.map(g => ({ id: g.mal_id, name: g.name })) || [],
      score: anime.score,
      episodes: anime.episodes,
      status: anime.status,
      studios: anime.studios?.map(s => s.name) || [],
    };
  } catch (err) {
    console.error('Failed to fetch anime details:', err);
    return null;
  }
};