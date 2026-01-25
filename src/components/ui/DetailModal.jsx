import { useState, useEffect } from 'react';
import { X, Star, Send, ChevronRight } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../../constants';
import { getMovieDetails } from '../../services/tmdbService';
import { getAnimeDetails } from '../../services/animeService';
import { getBookDetails } from '../../services/bookService';
import { getMangaDetails } from '../../services/mangaService';

/**
 * Detail Modal for library items (movies, anime, books)
 * Shows: poster, title, year, genre, synopsis
 * Editable: status, rating (1-5 stars), personal notes
 */
const DetailModal = ({ item, isOpen, onClose, onSave, onDelete, mediaType = 'movie' }) => {
  const [status, setStatus] = useState(item?.status || 'later');
  const [rating, setRating] = useState(item?.rating || 0);
  const [comment, setComment] = useState(item?.comment || '');
  const [saving, setSaving] = useState(false);
  const [externalData, setExternalData] = useState(null);

  // Fetch additional data from external API if needed
  useEffect(() => {
    if (!item?.external_id) return;

    const fetchExternalData = async () => {
      let data = null;
      if (mediaType === 'movie') {
        data = await getMovieDetails(item.external_id);
      } else if (mediaType === 'anime') {
        data = await getAnimeDetails(item.external_id);
      } else if (mediaType === 'manga') {
        data = await getMangaDetails(item.external_id);
      } else if (mediaType === 'book') {
        data = await getBookDetails(item.external_id);
      }
      setExternalData(data);
    };

    fetchExternalData();
  }, [item?.external_id, mediaType]);

  useEffect(() => {
    if (item) {
      setStatus(item.status || 'later');
      setRating(item.rating || 0);
      setComment(item.comment || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Use DB data first, fall back to external API data
  const year = item.year || externalData?.release_date?.split('-')[0] || 'N/A';
  const genre = item.genre || externalData?.genres?.map(g => g.name).join(', ') || '';
  const synopsis = item.synopsis || externalData?.overview || '';

  // Status options based on media type
  const getStatusOptions = () => {
    if (mediaType === 'book' || mediaType === 'manga') {
      return [
        { value: 'later', label: 'Read Later' },
        { value: 'current', label: 'Currently Reading' },
        { value: 'completed', label: 'Completed' },
      ];
    }
    // Movies and Anime
    return [
      { value: 'later', label: 'Watch Later' },
      { value: 'current', label: 'Currently Watching' },
      { value: 'completed', label: 'Completed' },
    ];
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, { status, rating: rating || null, comment: comment || null });
    setSaving(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete(item.id);
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
              src={item.poster_url || PLACEHOLDER_IMAGE}
              alt={item.title}
              className="w-40 aspect-[2/3] object-cover rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-1">{item.title}</h2>
            <p className="text-slate-500 text-sm mb-3">
              {year} {genre && `• ${genre}`}
            </p>

            {synopsis && (
              <p className="text-slate-400 text-sm mb-4">{synopsis}</p>
            )}

            {/* Status */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 py-2 px-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              >
                {getStatusOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="p-1 transition-colors"
                  >
                    <Star 
                      size={24} 
                      className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Your Notes</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your thoughts..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 py-2 px-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors resize-none placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            Remove
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;