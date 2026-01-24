import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE } from '../../constants';
import { getMovieDetails } from '../../services/tmdbService';
import { getAnimeDetails } from '../../services/animeService';
import { getBookDetails } from '../../services/bookService';
import { getMangaDetails } from '../../services/mangaService';

/**
 * Preview Modal for exploring media (movies, anime, books)
 * Shows: poster, title, year, genre, synopsis, and Add to Library button
 */
const PreviewModal = ({ item, isOpen, onClose, onAdd, mediaType = 'movie' }) => {
  const [details, setDetails] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!item?.id) return;

    const fetchDetails = async () => {
      let data = null;
      if (mediaType === 'movie') {
        data = await getMovieDetails(item.id);
      } else if (mediaType === 'anime') {
        data = await getAnimeDetails(item.id);
      } else if (mediaType === 'manga') {
        data = await getMangaDetails(item.id);
      } else if (mediaType === 'book') {
        data = await getBookDetails(item.id);
      }
      setDetails(data);
    };

    fetchDetails();
  }, [item?.id, mediaType]);

  if (!isOpen || !item) return null;

  // Handle both TMDB (path) and Jikan (full URL) poster formats
  const posterUrl = item.poster_path
    ? item.poster_path.startsWith('http')
      ? item.poster_path
      : `${TMDB_IMAGE_BASE}${item.poster_path}`
    : PLACEHOLDER_IMAGE;
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.split('-')[0] || 'N/A';
  // Handle genres - can be array of strings or array of objects with name property
  const genreList = details?.genres || item.genres || [];
  const genre = genreList.map(g => typeof g === 'string' ? g : g.name).join(', ');
  const synopsis = details?.overview || item.overview || '';

  const handleAdd = async () => {
    setAdding(true);
    await onAdd(item);
    setAdding(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide border border-slate-800 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col sm:flex-row gap-6 p-6">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <img 
              src={posterUrl}
              alt={title}
              className="w-40 aspect-[2/3] object-cover rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
            <p className="text-slate-500 text-sm mb-3">
              {year} {genre && `• ${genre}`}
            </p>

            {synopsis && (
              <p className="text-slate-400 text-sm mb-4">{synopsis}</p>
            )}
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            {adding ? 'Adding...' : 'Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;