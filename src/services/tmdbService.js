const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Get popular movies
export const getPopularMovies = async (limit = 10) => {
  try {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results?.slice(0, limit) || [];
  } catch (err) {
    console.error('Failed to fetch popular movies:', err);
    return [];
  }
};

// Search movies by query
export const searchMovies = async (query, limit = 10) => {
  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return data.results?.slice(0, limit) || [];
  } catch (err) {
    console.error('Search movies failed:', err);
    return [];
  }
};


// Get movie details by ID
export const getMovieDetails = async (movieId) => {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch movie details:', err);
    return null;
  }
};