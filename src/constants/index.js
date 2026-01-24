// TMDB API
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/500x750?text=No+Image';

// Library categories by media type (DB values: later, current, completed)
export const getLibraryCategories = (mediaType) => {
  const isReadable = mediaType === 'book' || mediaType === 'manga';
  return [
    { id: 'all', label: 'All' },
    { id: 'later', label: isReadable ? 'Read Later' : 'Watch Later' },
    { id: 'current', label: isReadable ? 'Currently Reading' : 'Currently Watching' },
    { id: 'completed', label: 'Completed' },
  ];
};

// Default categories by status
export const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'later', label: 'Watch Later' },
  { id: 'current', label: 'Currently Watching' },
  { id: 'completed', label: 'Completed' },
];