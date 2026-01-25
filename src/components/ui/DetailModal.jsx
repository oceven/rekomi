import { useState, useEffect } from 'react';
import { X, Star, Send, ChevronRight, Share2 } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../../constants';
import { getMovieDetails } from '../../services/tmdbService';
import { getAnimeDetails } from '../../services/animeService';
import { getBookDetails } from '../../services/bookService';
import { getMangaDetails } from '../../services/mangaService';
import { getMySocialCircle } from '../../services/friendServices';
import { sendRecommendation } from '../../services/recommendationService';
import Toast from './Toast';

const DetailModal = ({ item, isOpen, onClose, onSave, onDelete, session, mediaType = 'movie' }) => {
    const [status, setStatus] = useState(item?.status || 'later');
    const [rating, setRating] = useState(item?.rating || 0);
    const [comment, setComment] = useState(item?.comment || '');
    const [isShared, setIsShared] = useState(item?.is_shared || false); // New Showcase state
    const [saving, setSaving] = useState(false);
    const [externalData, setExternalData] = useState(null);

    // Recommendation States
    const [showFriendPicker, setShowFriendPicker] = useState(false);
    const [friends, setFriends] = useState([]);
    const [sendingRec, setSendingRec] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    // Fetch Friends List with Avatar support
    const handleOpenRecommend = async () => {
        setShowFriendPicker(true);
        if (!session?.user?.id) return;

        try {
            const response = await getMySocialCircle(session.user.id);
            const rawData = response.data || response;

            if (!Array.isArray(rawData)) return;

            const accepted = rawData
                .filter(f => f.status === 'accepted')
                .map(f => {
                    const friendData = f.user_id === session.user.id ? f.receiver : f.initiator;
                    return {
                        id: friendData.id,
                        username: friendData.username,
                        avatar_url: friendData.avatar_url
                    };
                });

            setFriends(accepted);
        } catch (error) {
            console.error("Error loading friends:", error);
        }
    };

    useEffect(() => {
        if (item) {
            setStatus(item.status || 'later');
            setRating(item.rating || 0);
            setComment(item.comment || '');
            setIsShared(item.is_shared || false); // Sync sharing state
            setShowFriendPicker(false);
        }
    }, [item]);

    useEffect(() => {
        if (!item?.external_id) return;
        const fetchExternalData = async () => {
            let data = null;
            if (mediaType === 'movie') data = await getMovieDetails(item.external_id);
            else if (mediaType === 'anime') data = await getAnimeDetails(item.external_id);
            else if (mediaType === 'manga') data = await getMangaDetails(item.external_id);
            else if (mediaType === 'book') data = await getBookDetails(item.external_id);
            setExternalData(data);
        };
        fetchExternalData();
    }, [item?.external_id, mediaType]);

    const handleSave = async () => {
        setSaving(true);
        // Include is_shared in the update object
        await onSave(item.id, {
            status,
            rating: rating || null,
            comment: comment || null,
            is_shared: isShared
        });
        setSaving(false);
        onClose();
    };

    const handleDelete = () => {
        onDelete(item.id);
        onClose();
    };

    const handleSendRec = async (friendId) => {
        setSendingRec(true);
        const friend = friends.find(f => f.id === friendId);

        const mediaObj = {
            id: item.external_id || item.id,
            media_type: mediaType,
            title: item.title,
            poster_path: item.poster_url
        };

        const { error } = await sendRecommendation(session.user.id, friendId, mediaObj);
        setSendingRec(false);

        if (error) {
            setToast({ isVisible: true, message: 'Failed to send recommendation', type: 'error' });
        } else {
            setToast({
                isVisible: true,
                message: `Recommended "${item.title}" to @${friend?.username || 'friend'}!`,
                type: 'success'
            });
            setShowFriendPicker(false);
        }
    };

    if (!isOpen || !item) return null;

    const year = item.year || externalData?.release_date?.split('-')[0] || 'N/A';
    const genre = item.genre || externalData?.genres?.map(g => g.name).join(', ') || '';
    const synopsis = item.synopsis || externalData?.overview || '';

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
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs font-bold uppercase text-white">
                                                            {friend.username?.charAt(0)}
                                                        </div>
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

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10">
                        <X size={20} />
                    </button>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col sm:flex-row gap-6 p-6">
                            <div className="flex-shrink-0 mx-auto sm:mx-0">
                                <img
                                    src={item.poster_url || PLACEHOLDER_IMAGE}
                                    alt={item.title}
                                    className="w-40 aspect-[2/3] object-cover rounded-xl shadow-lg"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white mb-1">{item.title}</h2>
                                <p className="text-slate-500 text-sm mb-3">
                                    {year} {genre && `• ${genre}`}
                                </p>

                                {synopsis && (
                                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{synopsis}</p>
                                )}

                                <div className="mb-4">
                                    <label className="text-xs text-slate-500 mb-1 block">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 py-2 px-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                    >
                                        <option value="later">Later</option>
                                        <option value="current">Current</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="mb-4">
                                <label className="text-xs text-slate-500 mb-1 block">Your Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(rating === star ? 0 : star)}
                                            className="p-1"
                                        >
                                            <Star
                                                size={24}
                                                className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs text-slate-500 mb-1 block">Your Notes</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add your thoughts..."
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 py-2 px-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </div>

                            {/* Showcase Toggle Section */}
                            <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={isShared}
                                            onChange={(e) => setIsShared(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-10 h-6 bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Share2 size={16} className={isShared ? 'text-blue-400' : 'text-slate-500'} />
                                        <span className={`text-sm font-medium transition-colors ${isShared ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {isShared ? 'Shared to Showcase' : 'Share to Profile Showcase'}
                                        </span>
                                    </div>
                                </label>
                                <p className="text-[10px] text-slate-500 mt-2 ml-13 italic">
                                    Shared items will appear on your profile for friends to see.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
                            >
                                Remove
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        <button
                            onClick={handleOpenRecommend}
                            className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
                        >
                            <Send size={14} /> Recommend to a friend
                        </button>
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

export default DetailModal;