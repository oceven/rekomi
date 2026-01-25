import { useState, useEffect } from 'react';
import { X, Plus, Send, ChevronRight } from 'lucide-react';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE } from '../../constants';
import { getMovieDetails } from '../../services/tmdbService';
import { getAnimeDetails } from '../../services/animeService';
import { getBookDetails } from '../../services/bookService';
import { getMangaDetails } from '../../services/mangaService';
import { getMySocialCircle } from '../../services/friendServices';
import { sendRecommendation } from '../../services/recommendationService';
import Toast from './Toast';

/**
 * Preview Modal for exploring media (movies, anime, books, manga)
 * Shows: poster, title, year, genre, synopsis, Add to Library, and Recommend buttons
 */
const PreviewModal = ({ item, isOpen, onClose, onAdd, mediaType = 'movie', session }) => {
    const [details, setDetails] = useState(null);
    const [adding, setAdding] = useState(false);

    // Recommendation States
    const [showFriendPicker, setShowFriendPicker] = useState(false);
    const [friends, setFriends] = useState([]);
    const [sendingRec, setSendingRec] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    // Fetch Friends List
    const handleOpenRecommend = async () => {
        setShowFriendPicker(true);

        if (!session?.user?.id) {
            console.error("Session missing, cannot load friends.");
            return;
        }

        try {
            const response = await getMySocialCircle(session.user.id);
            const rawData = response.data || response;

            if (!Array.isArray(rawData)) {
                console.error("Unexpected friend data format:", rawData);
                return;
            }

            const accepted = rawData
                .filter(f => f.status === 'accepted')
                .map(f => f.user_id === session.user.id ? f.receiver : f.initiator);

            setFriends(accepted);
        } catch (error) {
            console.error("Error loading friends:", error);
        }
    };

    const handleSendRec = async (friendId) => {
        setSendingRec(true);

        const friend = friends.find(f => f.id === friendId);

        const mediaObj = {
            id: item.id,
            media_type: mediaType,
            title: item.title || item.name,
            poster_path: item.poster_path,
            release_date: item.release_date,
            first_air_date: item.first_air_date,
            overview: item.overview || details?.overview,
            genres: item.genres || details?.genres
        };

        const { error } = await sendRecommendation(session.user.id, friendId, mediaObj);
        setSendingRec(false);

        if (error) {
            setToast({
                isVisible: true,
                message: 'Failed to send recommendation',
                type: 'error'
            });
        } else {
            setToast({
                isVisible: true,
                message: `Recommended "${item.title || item.name}" to @${friend?.username || 'friend'}!`,
                type: 'success'
            });
            setShowFriendPicker(false);
        }
    };

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

    // Reset toast when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setToast({ isVisible: false, message: '', type: 'success' });
        }
    }, [isOpen]);

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
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-slate-800 shadow-2xl flex flex-col">

                    {/* Friend Picker Overlay */}
                    {showFriendPicker && (
                        <div className="absolute inset-0 bg-slate-900 z-30 flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="text-lg font-bold">Recommend to...</h3>
                                <button onClick={() => setShowFriendPicker(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                                {friends.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <p className="font-medium">No friends yet</p>
                                        <p className="text-sm mt-1">Add friends to share recommendations!</p>
                                    </div>
                                ) : (
                                    friends.map(friend => (
                                        <button
                                            key={friend.id}
                                            onClick={() => handleSendRec(friend.id)}
                                            disabled={sendingRec}
                                            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold uppercase">{friend.username?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <span className="font-medium">@{friend.username}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-600 group-hover:text-blue-500" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                    </div>

                    <div className="p-6 pt-0 flex flex-col gap-3">
                        <button
                            onClick={handleAdd}
                            disabled={adding}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                        >
                            <Plus size={18} />
                            {adding ? 'Adding...' : 'Add to Library'}
                        </button>

                        {session && (
                            <button
                                onClick={handleOpenRecommend}
                                className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700 transition-all"
                            >
                                <Send size={14} /> Recommend to a friend
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />
        </>
    );
};

export default PreviewModal;