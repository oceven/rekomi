import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { saveMediaItem } from '../services/mediaServices'; // Integrated service
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import PreviewModal from './ui/PreviewModal';
import { Mail, Library, Users, Camera, Edit2, Check, Star } from 'lucide-react';

const Profile = ({ session }) => {
    // useParams pulls the friend's ID from the URL
    const { userId } = useParams();
    const isOwnProfile = !userId || userId === session?.user?.id;

    // Header data for the current logged-in user
    const { username: ownUsername, avatar_url: ownAvatar, refreshProfile } = useUserProfile(session);

    const [profileData, setProfileData] = useState({ username: '', avatar_url: '', bio: '' });
    const [stats, setStats] = useState({ totalItems: 0, friends: 0 });
    const [sharedItems, setSharedItems] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        const fetchAllProfileData = async () => {
            // Determine if we are fetching our own data or a friend's
            const targetId = userId || session?.user?.id;
            if (!targetId) return;

            setLoading(true);
            try {
                // 1. Fetch Profile Details
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, bio')
                    .eq('id', targetId)
                    .single();

                if (profile) {
                    setProfileData(profile);
                    setBioText(profile.bio || '');
                }

                // 2. Fetch Library Stats
                const { count: mediaCount } = await supabase
                    .from('media_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', targetId);

                const { count: friendCount } = await supabase
                    .from('friendships')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'accepted')
                    .or(`user_id.eq.${targetId},friend_id.eq.${targetId}`);

                setStats({ totalItems: mediaCount || 0, friends: friendCount || 0 });

                // 3. Fetch Personal Showcase Items
                const { data: shared } = await supabase
                    .from('media_items')
                    .select('*')
                    .eq('user_id', targetId)
                    .eq('is_shared', true)
                    .order('created_at', { ascending: false });

                setSharedItems(shared || []);
            } catch (err) {
                console.error("Error fetching profile data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllProfileData();
    }, [userId, session]); // Essential: Listens for URL changes

    const handleCardClick = (item) => {
        // Convert external_id to number for TMDB API compatibility
        const itemId = (item.media_type === 'movie' || item.media_type === 'anime' || item.media_type === 'manga')
            ? Number(item.external_id)
            : item.external_id;

        setSelectedMedia({
            id: itemId,
            title: item.title,
            name: item.title,
            poster_path: item.poster_url,
            media_type: item.media_type,
            // PreviewModal will fetch the full details using the id and media_type
            year: item.year,
            release_date: item.data?.release_date,
            first_air_date: item.data?.first_air_date,
            overview: item.data?.overview,
            genres: item.data?.genres
        });
        setIsPreviewOpen(true);
    };

    // logic aligned with Dashboard.jsx to prevent duplicates
    const handleAddFromShowcase = async (media) => {
        const { error, duplicate } = await saveMediaItem(session.user.id, media, media.media_type);

        if (duplicate) {
            setToast({ isVisible: true, message: `"${media.title}" is already in your library`, type: 'error' });
        } else if (error) {
            setToast({ isVisible: true, message: 'Failed to add to library', type: 'error' });
        } else {
            setToast({ isVisible: true, message: `Added "${media.title}" to your library!`, type: 'success' });
        }
        setIsPreviewOpen(false);
    };

    const handleUpdateBio = async () => {
        await supabase.from('profiles').update({ bio: bioText }).eq('id', session.user.id);
        setProfileData(prev => ({ ...prev, bio: bioText }));
        setIsEditingBio(false);
        setToast({ isVisible: true, message: 'Bio updated!', type: 'success' });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${session.user.id}-${Date.now()}.${fileExt}`;
            await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
            setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
            if (refreshProfile) refreshProfile();
            setToast({ isVisible: true, message: 'Avatar updated!', type: 'success' });
        } catch (error) {
            setToast({ isVisible: true, message: 'Upload failed', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    if (loading && !profileData.username) {
        return (
            <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                />
                <div className="flex-1 flex flex-col bg-slate-950">
                    <Header username="" avatar_url={null} showSearch={false} session={session} onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 animate-pulse">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 h-40 sm:h-44 md:h-48" />
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
                                <div className="bg-slate-900 h-20 sm:h-22 md:h-24 rounded-xl sm:rounded-2xl" />
                                <div className="bg-slate-900 h-20 sm:h-22 md:h-24 rounded-xl sm:rounded-2xl" />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header username={ownUsername} avatar_url={ownAvatar} showSearch={false} session={session} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 scrollbar-hide animate-in fade-in duration-500">
                    <div className="max-w-4xl mx-auto">
                        {/* Profile Info Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8">
                            <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 md:gap-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800">
                                        {profileData.avatar_url ? (
                                            <img src={profileData.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-black uppercase">
                                                {profileData.username?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {isOwnProfile && (
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                            <Camera size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8" />
                                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">@{profileData.username}</h2>
                                    {isEditingBio ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                value={bioText}
                                                onChange={(e) => setBioText(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                                                rows={3}
                                            />
                                            <button onClick={handleUpdateBio} className="self-end p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <p className="text-slate-400 text-sm italic">{profileData.bio || "No bio yet."}</p>
                                            {isOwnProfile && <button onClick={() => setIsEditingBio(true)} className="text-slate-600 hover:text-blue-400"><Edit2 size={14} /></button>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 md:gap-5">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 flex-shrink-0">
                                    <Library size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-black">{stats.totalItems}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Media in Library</p>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 md:gap-5">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0">
                                    <Users size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-black">{stats.friends}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Friends in Circle</p>
                                </div>
                            </div>
                        </div>

                        {/* Showcase Section */}
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <Star className="text-yellow-500 fill-yellow-500" size={18} className="sm:w-5 sm:h-5" />
                                <h3 className="text-xl font-bold">Personal Showcase</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {sharedItems.length > 0 ? (
                                    sharedItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleCardClick(item)}
                                            className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex gap-3 sm:gap-4 md:gap-5 transition-all hover:border-blue-500/50 hover:bg-slate-800/50 cursor-pointer group overflow-hidden"
                                        >
                                            <img src={item.poster_url} className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform" />
                                            <div className="flex-1 py-1 min-w-0">
                                                <h4 className="font-bold text-white text-sm sm:text-base md:text-lg mb-1 truncate">{item.title}</h4>
                                                <div className="flex gap-1 mb-2 sm:mb-3">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} className={`sm:w-3.5 sm:h-3.5 ${i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'}`} />
                                                    ))}
                                                </div>
                                                {item.comment && (
                                                    <p className="text-xs sm:text-sm text-slate-400 italic break-words line-clamp-3 sm:line-clamp-4 leading-relaxed">
                                                        "{item.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 sm:py-16 md:py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl sm:rounded-3xl">
                                        <p className="text-xs sm:text-sm text-slate-600">No items shared in the showcase yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {/* Modal for previewing and adding items */}
            {selectedMedia && (
                <PreviewModal
                    item={selectedMedia}
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    onAdd={handleAddFromShowcase}
                    mediaType={selectedMedia.media_type}
                    session={session}
                />
            )}
        </div>
    );
};

export default Profile;