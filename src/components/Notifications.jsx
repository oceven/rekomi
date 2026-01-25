import { useEffect, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { saveMediaItem } from '../services/mediaServices';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE } from '../constants';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import PreviewModal from './ui/PreviewModal';
import Toast from './ui/Toast';
import useUserProfile from '../hooks/useUserProfile';

// Helper function to format time ago
const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
};

const Notifications = ({ session }) => {
    const { username, avatar_url } = useUserProfile(session);
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    // MATCHING DASHBOARD.JSX STATES
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedMediaType, setSelectedMediaType] = useState('movie');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    // LIST INVITE POPUP
    const [showListInvitePopup, setShowListInvitePopup] = useState(false);
    const [selectedListInvite, setSelectedListInvite] = useState(null);

    const fetchNotifs = async () => {
        if (!session?.user?.id) return;
        const { data } = await supabase
            .from('notifications')
            .select('*, sender:sender_id ( username, avatar_url )')
            .eq('receiver_id', session.user.id)
            .order('created_at', { ascending: false });

        setNotifs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifs();
    }, [session]);

    const handleNotifClick = async (n) => {
        if (!n.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
            fetchNotifs();
        }

        // Handle list invite notifications
        if (n.type === 'list_invite') {
            setSelectedListInvite(n);
            setShowListInvitePopup(true);
            return;
        }

        // Handle list item added notifications (just navigate to the list)
        if (n.type === 'list_item_added') {
            // Could navigate to the shared list
            return;
        }

        // MAP DATABASE KEYS TO MODAL KEYS - INCLUDING ALL FIELDS THE MODAL NEEDS
        const mediaType = n.data?.media_type || 'movie';
        const rawId = n.data?.media_id || n.related_media_id;

        setSelectedItem({
            id: (mediaType === 'movie' || mediaType === 'anime' || mediaType === 'manga') ? Number(rawId) : rawId,
            title: n.data?.title,
            name: n.data?.title, // Some APIs use 'name' instead of 'title'
            poster_path: n.data?.poster_path,
            release_date: n.data?.release_date,
            first_air_date: n.data?.first_air_date,
            overview: n.data?.overview,
            genres: n.data?.genres
        });

        setSelectedMediaType(mediaType);
        setIsPreviewOpen(true);
    };

    const handleAddToLibrary = async (item) => {
        // Ensure the item has the correct structure for saveMediaItem
        // The item.id should already be set correctly from handleNotifClick
        const itemToSave = {
            ...item,
            // Make sure we're using the ID exactly as it was stored
            id: item.id
        };

        // Use the same saveMediaItem service as Dashboard for consistency
        const { error, duplicate } = await saveMediaItem(session.user.id, itemToSave, selectedMediaType);

        if (duplicate) {
            setToast({
                isVisible: true,
                message: `"${item.title || item.name}" is already in your library`,
                type: 'error'
            });
        } else if (error) {
            setToast({
                isVisible: true,
                message: 'Failed to add to library',
                type: 'error'
            });
        } else {
            setToast({
                isVisible: true,
                message: `Added "${item.title || item.name}" to your library!`,
                type: 'success'
            });
        }
    };

    const markAllRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', session.user.id);
        fetchNotifs();
    };

    const handleAcceptListInvite = async () => {
        if (!selectedListInvite) return;

        // Update membership to approved
        const { error } = await supabase
            .from('shared_list_members')
            .update({ is_approved: true })
            .eq('list_id', selectedListInvite.related_id)
            .eq('user_id', session.user.id);

        if (!error) {
            setToast({ isVisible: true, message: 'Joined the shared list!', type: 'success' });
            setShowListInvitePopup(false);
            setSelectedListInvite(null);
        } else {
            setToast({ isVisible: true, message: 'Error accepting invite', type: 'error' });
        }
    };

    const handleDeclineListInvite = async () => {
        if (!selectedListInvite) return;

        // Remove membership
        const { error } = await supabase
            .from('shared_list_members')
            .delete()
            .eq('list_id', selectedListInvite.related_id)
            .eq('user_id', session.user.id);

        if (!error) {
            setToast({ isVisible: true, message: 'Declined invite', type: 'success' });
            setShowListInvitePopup(false);
            setSelectedListInvite(null);
        } else {
            setToast({ isVisible: true, message: 'Error declining invite', type: 'error' });
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            <Sidebar />

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header username={username} session={session} avatar_url={avatar_url} showSearch={false} />

                <main className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-bold">Inbox</h1>
                            <button onClick={markAllRead} className="text-xs font-bold uppercase text-slate-500 hover:text-blue-400 flex items-center gap-2 transition-colors">
                                <CheckCheck size={16} /> Mark all read
                            </button>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                <p className="text-slate-500">Loading your recommendations...</p>
                            ) : notifs.length === 0 ? (
                                <div className="text-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-900/50 rounded-3xl">
                                    <p className="text-slate-500 font-medium">No recommendations yet.</p>
                                </div>
                            ) : (
                                notifs.map((n) => {
                                    // Construct poster URL properly (same logic as Dashboard)
                                    const posterUrl = n.data?.poster_path
                                        ? n.data.poster_path.startsWith('http')
                                            ? n.data.poster_path
                                            : `${TMDB_IMAGE_BASE}${n.data.poster_path}`
                                        : null;

                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotifClick(n)}
                                            className={`group p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${n.is_read ? 'bg-slate-900/40 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-800 shadow-lg shadow-blue-500/5'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold overflow-hidden">
                                                {n.sender?.avatar_url ? (
                                                    <img src={n.sender.avatar_url} alt={n.sender.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{n.sender?.username?.[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                {n.type === 'list_invite' ? (
                                                    <>
                                                        <p className="text-slate-400 text-xs">
                                                            <span className="font-bold text-white">@{n.sender?.username}</span> invited you to a shared list
                                                            <span className="text-slate-600 ml-1">• {getTimeAgo(n.created_at)}</span>
                                                        </p>
                                                        <h3 className="font-bold text-white text-lg">{n.message}</h3>
                                                    </>
                                                ) : n.type === 'list_item_added' ? (
                                                    <>
                                                        <p className="text-slate-400 text-xs">
                                                            <span className="font-bold text-white">@{n.sender?.username}</span> added to shared list
                                                            <span className="text-slate-600 ml-1">• {getTimeAgo(n.created_at)}</span>
                                                        </p>
                                                        <h3 className="font-bold text-white text-lg">{n.message}</h3>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-slate-400 text-xs">
                                                            <span className="font-bold text-white">@{n.sender?.username}</span> recommended a {n.data?.media_type}
                                                            <span className="text-slate-600 ml-1">• {getTimeAgo(n.created_at)}</span>
                                                        </p>
                                                        <h3 className="font-bold text-white text-lg">{n.data?.title}</h3>
                                                    </>
                                                )}
                                            </div>
                                            {posterUrl && (
                                                <img src={posterUrl} alt="" className="w-10 h-14 object-cover rounded-lg border border-slate-800" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* DASHBOARD-STYLE MODAL RENDER */}
            <PreviewModal
                item={selectedItem}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onAdd={(item) => handleAddToLibrary(item)}
                mediaType={selectedMediaType}
            />

            {/* LIST INVITE ACCEPT/DECLINE POPUP */}
            {showListInvitePopup && selectedListInvite && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Shared List Invite</h3>
                            <button
                                onClick={() => setShowListInvitePopup(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                <X />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-slate-400 mb-2">
                                <span className="font-bold text-white">@{selectedListInvite.sender?.username}</span> has invited you to join:
                            </p>
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <p className="text-lg font-bold text-white">{selectedListInvite.message.split('"')[1]}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDeclineListInvite}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-medium transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptListInvite}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-medium transition-colors"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;