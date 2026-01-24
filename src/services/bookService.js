const OPENLIBRARY_URL = 'https://openlibrary.org';
const COVER_URL = 'https://covers.openlibrary.org/b';

/**
 * Normalize book data to match our app's structure
 */
const normalizeBook = (book) => {
  // Cover image: use cover_i (cover ID) or first ISBN
  let posterPath = null;
  if (book.cover_i) {
    posterPath = `${COVER_URL}/id/${book.cover_i}-L.jpg`;
  } else if (book.isbn?.[0]) {
    posterPath = `${COVER_URL}/isbn/${book.isbn[0]}-L.jpg`;
  }

  return {
    id: book.key?.replace('/works/', '') || book.cover_i || Math.random().toString(),
    title: book.title,
    name: book.title,
    poster_path: posterPath,
    release_date: book.first_publish_year?.toString(),
    first_air_date: book.first_publish_year?.toString(),
    overview: null, // Open Library search doesn't include description
    genres: book.subject?.slice(0, 3) || [],
    author: book.author_name?.[0] || 'Unknown Author',
    authors: book.author_name || [],
  };
};

/**
 * Search books by query
 */
export const searchBooks = async (query, limit = 10) => {
  try {
    const res = await fetch(
      `${OPENLIBRARY_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!res.ok) {
      console.error('Open Library API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    return (data.docs || []).map(normalizeBook);
  } catch (err) {
    console.error('Search books failed:', err);
    return [];
  }
};

/**
 * Get popular/trending books (using a curated subject)
 */
export const getPopularBooks = async (limit = 10) => {
  try {
    // Use "popular" subject or trending list
    const res = await fetch(
      `${OPENLIBRARY_URL}/subjects/fiction.json?limit=${limit}`
    );
    
    if (!res.ok) {
      console.error('Open Library API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    
    // Subject endpoint has different structure
    return (data.works || []).map(work => ({
      id: work.key?.replace('/works/', '') || Math.random().toString(),
      title: work.title,
      name: work.title,
      poster_path: work.cover_id ? `${COVER_URL}/id/${work.cover_id}-L.jpg` : null,
      release_date: work.first_publish_year?.toString(),
      first_air_date: work.first_publish_year?.toString(),
      overview: null,
      genres: [],
      author: work.authors?.[0]?.name || 'Unknown Author',
      authors: work.authors?.map(a => a.name) || [],
    }));
  } catch (err) {
    console.error('Failed to fetch popular books:', err);
    return [];
  }
};

/**
 * Get book details by work ID
 */
export const getBookDetails = async (workId) => {
  try {
    const res = await fetch(`${OPENLIBRARY_URL}/works/${workId}.json`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Get description (can be string or object)
    let description = '';
    if (typeof data.description === 'string') {
      description = data.description;
    } else if (data.description?.value) {
      description = data.description.value;
    }
    
    return {
      id: workId,
      title: data.title,
      overview: description,
      genres: data.subjects?.slice(0, 5)?.map(s => ({ name: s })) || [],
      release_date: data.first_publish_date,
    };
  } catch (err) {
    console.error('Failed to fetch book details:', err);
    return null;
  }
};