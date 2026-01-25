import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { saveMediaItem } from '../services/mediaServices';
import { searchMovies } from '../services/tmdbService';
import { searchAnime } from '../services/animeService';
import { searchBooks } from '../services/bookService';
import { searchManga } from '../services/mangaService';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE, getLibraryCategories } from '../constants';
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import PreviewModal from './ui/PreviewModal';
import { Search, X, Plus, Star, ArrowUpDown, Film, Tv, BookOpen, Book, ArrowLeft, Users, LogOut, Trash2, UserMinus, UserPlus, Check } from 'lucide-react';

// ============================================
// Media Type Tabs (Same as Library)
// ============================================
const MEDIA_TYPES = [
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'anime', label: 'Anime', icon: Tv },
    { id: 'manga', label: 'Manga', icon: Book },
    { id: 'book', label: 'Books', icon: BookOpen },
];

// ============================================
// Search Dropdown Component (Same as Library)
// ============================================
const SearchDropdown = ({ session, mediaType, onItemAdded, listId, username }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    const placeholders = {
        movie: 'Search movies to add...',
        anime: 'Search anime to add...',
        manga: 'Search manga to add...',
        book: 'Search books to add...',
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            let results = [];
            if (mediaType === 'movie') {
                results = await searchMovies(searchQuery, 6);
            } else if (mediaType === 'anime') {
                results = await searchAnime(searchQuery, 6);
            } else if (mediaType === 'manga') {
                results = await searchManga(searchQuery, 6);
            } else if (mediaType === 'book') {
                results = await searchBooks(searchQuery, 6);
            }
            setSearchResults(results);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, mediaType]);

    const handleAdd = async (item) => {
        // Check if item already exists in this shared list
        const { data: existingItems } = await supabase
            .from('shared_list_items')
            .select('id')
            .eq('list_id', listId)
            .eq('media_type', mediaType)
            .eq('media_id', String(item.id));

        if (existingItems && existingItems.length > 0) {
            onItemAdded(item.title || item.name, true, false);
            setSearchQuery('');
            setSearchResults([]);
            setIsOpen(false);
            return;
        }

        // Add to shared_list_items table
        const posterUrl = item.poster_path?.startsWith('http')
            ? item.poster_path
            : item.poster_path
                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                : PLACEHOLDER_IMAGE;

        // Store all metadata in data field for DetailModal to access
        const newItem = {
            list_id: listId,
            added_by: session.user.id,
            media_type: mediaType,
            media_id: String(item.id),
            title: item.title || item.name,
            poster_url: posterUrl,
            status: 'to_watch',
            rating: 0,
            data: {
                ...item,
                // Ensure these fields are explicitly included
                release_date: item.release_date || item.first_air_date,
                first_air_date: item.first_air_date || item.release_date,
                overview: item.overview,
                genres: item.genres || [],
                poster_path: item.poster_path,
                vote_average: item.vote_average
            }
        };

        const { error } = await supabase
            .from('shared_list_items')
            .insert([newItem]);

        if (error) {
            console.error('Error adding to shared list:', error);
            onItemAdded(item.title || item.name, true, false);
        } else {
            // Send notification to all members (optional - won't break if it fails)
            try {
                const { data: members, error: memberError } = await supabase
                    .from('shared_list_members')
                    .select('user_id')
                    .eq('list_id', listId)
                    .eq('is_approved', true)
                    .neq('user_id', session.user.id);

                if (memberError) {
                    console.error('Error fetching members for notification:', memberError);
                }

                if (members && members.length > 0) {
                    const { data: listData } = await supabase
                        .from('shared_lists')
                        .select('name')
                        .eq('id', listId)
                        .single();

                    const notifications = members.map(member => ({
                        receiver_id: member.user_id,
                        sender_id: session.user.id,
                        type: 'list_item_added',
                        message: `${username} added "${item.title || item.name}" to "${listData?.name}"`,
                        related_id: listId,
                        is_read: false
                    }));

                    const { error: notifError } = await supabase.from('notifications').insert(notifications);
                    if (notifError) {
                        console.error('Error sending notifications:', notifError);
                    } else {
                        console.log('Notifications sent successfully to', members.length, 'members');
                    }
                } else {
                    console.log('No other members to notify');
                }
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }

            onItemAdded(item.title || item.name, false, true);
        }

        setSearchQuery('');
        setSearchResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder={placeholders[mediaType]}
                    className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-11 pr-5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-30">
                    {searchResults.map((item) => {
                        const posterUrl = item.poster_path?.startsWith('http')
                            ? item.poster_path
                            : item.poster_path
                                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                                : PLACEHOLDER_IMAGE;

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors cursor-pointer"
                                onClick={() => handleAdd(item)}
                            >
                                <img
                                    src={posterUrl}
                                    alt={item.title || item.name}
                                    className="w-10 h-14 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.title || item.name}</p>
                                    <p className="text-xs text-slate-500">{(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</p>
                                </div>
                                <button className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================
// Library Card Component (Same as Library)
// ============================================
const LibraryCard = ({ item, onClick }) => {
    const posterUrl = item.poster_url || PLACEHOLDER_IMAGE;

    return (
        <div
            className="flex-shrink-0 w-36 cursor-pointer group"
            onClick={() => onClick(item)}
        >
            <div className="relative overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-blue-500 transition-all">
                <img
                    src={posterUrl}
                    className="w-full aspect-[2/3] object-cover"
                    alt={item.title}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white text-sm font-semibold leading-tight line-clamp-2">{item.title}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Sort Options
// ============================================
const SORT_OPTIONS = [
    { id: 'recent', label: 'Recently Added' },
    { id: 'rating-high', label: 'Rating: High to Low' },
    { id: 'rating-low', label: 'Rating: Low to High' },
    { id: 'title', label: 'Title: A-Z' },
];

// ============================================
// SharedListDetail Component
// ============================================
const SharedListDetail = ({ session }) => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const { username, avatar_url } = useUserProfile(session);

    const [listInfo, setListInfo] = useState(null);
    const [members, setMembers] = useState([]);
    const [items, setItems] = useState([]);
    const [mediaType, setMediaType] = useState('movie');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMembersPopup, setShowMembersPopup] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showInvitePopup, setShowInvitePopup] = useState(false);
    const [myFriends, setMyFriends] = useState([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);

    useEffect(() => {
        if (session?.user?.id && listId) {
            fetchListInfo();
            fetchMembers();
            fetchItems();
        }
    }, [session, listId, mediaType, statusFilter]);

    const fetchListInfo = async () => {
        const { data, error } = await supabase
            .from('shared_lists')
            .select('*')
            .eq('id', listId)
            .single();

        if (data) setListInfo(data);
        setLoading(false);
    };

    const fetchMembers = async () => {
        const { data: memberships, error } = await supabase
            .from('shared_list_members')
            .select('user_id, is_approved')
            .eq('list_id', listId)
            .eq('is_approved', true);

        if (error || !memberships || memberships.length === 0) {
            setMembers([]);
            return;
        }

        // Fetch profile data for each member
        const userIds = memberships.map(m => m.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

        // Combine the data
        const membersWithProfiles = memberships.map(m => ({
            user_id: m.user_id,
            is_approved: m.is_approved,
            profiles: profiles?.find(p => p.id === m.user_id) || { id: m.user_id, username: 'Unknown', avatar_url: null }
        }));

        setMembers(membersWithProfiles);
    };

    const fetchItems = async () => {
        let query = supabase
            .from('shared_list_items')
            .select('*')
            .eq('list_id', listId)
            .eq('media_type', mediaType)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
            // Flatten and map fields for PreviewModal compatibility
            const flattenedItems = data.map(item => {
                const itemData = item.data || {};
                return {
                    ...itemData,
                    ...item,
                    dbId: item.id, // Store database UUID separately for delete
                    id: itemData.id || item.media_id, // Use API ID for library operations
                    // Map API fields to PreviewModal expected fields
                    year: itemData.release_date?.split('-')[0] || itemData.first_air_date?.split('-')[0] || '',
                    genre: itemData.genres?.map(g => typeof g === 'string' ? g : g.name).join(', ') || '',
                    synopsis: itemData.overview || '',
                };
            });
            setItems(flattenedItems);
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        switch (sortBy) {
            case 'rating-high':
                return (b.rating || 0) - (a.rating || 0);
            case 'rating-low':
                return (a.rating || 0) - (b.rating || 0);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    const handleItemAdded = (title, isError = false, success = false) => {
        if (isError) {
            setToast({ isVisible: true, message: `Error adding "${title}"`, type: 'error' });
        } else if (success) {
            setToast({ isVisible: true, message: `Added "${title}" to the list!`, type: 'success' });
            fetchItems();
        }
    };

    const handleCardClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleAddToLibrary = async (item) => {
        const { error, duplicate } = await saveMediaItem(session.user.id, item, mediaType);

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

    const handleDeleteItem = async (itemId) => {
        const { error } = await supabase
            .from('shared_list_items')
            .delete()
            .eq('id', itemId);

        if (!error) {
            setItems((prev) => prev.filter((item) => item.dbId !== itemId));
            setToast({ isVisible: true, message: 'Item removed from shared list', type: 'success' });
        } else {
            console.error('Error deleting item:', error);
            setToast({ isVisible: true, message: 'Failed to remove item', type: 'error' });
        }
    };

    const handleStatusChange = async (itemId, newStatus) => {
        const { error } = await supabase
            .from('shared_list_items')
            .update({ status: newStatus })
            .eq('id', itemId);

        if (!error) {
            setItems((prev) => prev.map((item) =>
                item.dbId === itemId ? { ...item, status: newStatus } : item
            ));
            setToast({ isVisible: true, message: 'Status updated!', type: 'success' });
        } else {
            console.error('Error updating status:', error);
            setToast({ isVisible: true, message: 'Failed to update status', type: 'error' });
        }
    };

    const handleLeaveList = async () => {
        const { error } = await supabase
            .from('shared_list_members')
            .delete()
            .eq('list_id', listId)
            .eq('user_id', session.user.id);

        if (!error) {
            setToast({ isVisible: true, message: 'Left the list', type: 'success' });
            setTimeout(() => navigate('/shared-lists'), 1000);
        }
    };

    const handleDeleteList = async () => {
        const { error } = await supabase
            .from('shared_lists')
            .delete()
            .eq('id', listId);

        if (!error) {
            setToast({ isVisible: true, message: 'List deleted', type: 'success' });
            setTimeout(() => navigate('/shared-lists'), 1000);
        } else {
            setToast({ isVisible: true, message: 'Failed to delete list', type: 'error' });
        }
    };

    const fetchFriends = async () => {
        // Get accepted friends
        const { data } = await supabase
            .from('friendships')
            .select(`
        id,
        user_id,
        friend_id,
        initiator:profiles!friendships_user_id_fkey(id, username, avatar_url),
        receiver:profiles!friendships_friend_id_fkey(id, username, avatar_url)
      `)
            .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
            .eq('status', 'accepted');

        if (data) {
            const allFriends = data.map(f =>
                f.user_id === session.user.id ? f.receiver : f.initiator
            );

            // Filter out friends who are already members of this list
            const memberIds = members.map(m => m.user_id);
            const availableFriends = allFriends.filter(friend => !memberIds.includes(friend.id));

            setMyFriends(availableFriends);
        }
    };

    const handleOpenInvitePopup = () => {
        setShowInvitePopup(true);
        fetchFriends();
    };

    const toggleFriendSelection = (id) => {
        setSelectedFriendIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleInviteFriends = async () => {
        if (selectedFriendIds.length === 0) return;

        try {
            // Add friends as pending members
            const memberships = selectedFriendIds.map(friendId => ({
                list_id: listId,
                user_id: friendId,
                is_approved: false
            }));

            const { error: memError } = await supabase.from('shared_list_members').insert(memberships);
            if (memError) throw memError;

            // Send notifications
            try {
                const inviteNotifications = selectedFriendIds.map(friendId => ({
                    receiver_id: friendId,
                    sender_id: session.user.id,
                    type: 'list_invite',
                    message: `${username} invited you to join "${listInfo?.name}"`,
                    related_id: listId,
                    is_read: false
                }));

                await supabase.from('notifications').insert(inviteNotifications);
            } catch (notifError) {
                console.log('Note: Notifications not sent, but invites created successfully');
            }

            setToast({ isVisible: true, message: `Invited ${selectedFriendIds.length} friend(s)!`, type: 'success' });
            setShowInvitePopup(false);
            setSelectedFriendIds([]);
            fetchMembers(); // Refresh members list
        } catch (err) {
            setToast({ isVisible: true, message: 'Error sending invites', type: 'error' });
            console.error(err);
        }
    };

    const isCreator = listInfo?.creator_id === session?.user?.id;

    if (loading) {
        return (
            <div className="flex h-screen bg-slate-950 text-white items-center justify-center">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            <Sidebar />

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast({ isVisible: false, message: '' })}
                type={toast.type}
            />

            <PreviewModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddToLibrary}
                mediaType={mediaType}
                session={session}
                showStatusPicker={true}
                currentStatus={selectedItem?.status || 'later'}
                onStatusChange={(newStatus) => selectedItem && handleStatusChange(selectedItem.dbId, newStatus)}
                statusCategories={getLibraryCategories(mediaType)}
                onDelete={selectedItem ? () => handleDeleteItem(selectedItem.dbId) : null}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header username={username} session={session} avatar_url={avatar_url}>
                    <SearchDropdown
                        session={session}
                        mediaType={mediaType}
                        onItemAdded={handleItemAdded}
                        listId={listId}
                        username={username}
                    />
                </Header>

                <main className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
                    {/* Back button and List header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/shared-lists')}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-1">{listInfo?.name}</h2>
                                <p className="text-slate-500">Shared collection</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMembersPopup(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <Users size={18} />
                                <span className="text-sm font-medium">{members.length} {members.length === 1 ? 'Member' : 'Members'}</span>
                            </button>

                            <button
                                onClick={handleOpenInvitePopup}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
                            >
                                <UserPlus size={18} />
                                <span className="text-sm font-medium">Invite Friends</span>
                            </button>

                            {isCreator ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-sm font-medium">Delete List</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeaveList}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    <UserMinus size={18} />
                                    <span className="text-sm font-medium">Leave List</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Media Type Tabs */}
                    <div className="flex gap-2 mb-6">
                        {MEDIA_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setMediaType(type.id);
                                        setStatusFilter('all');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mediaType === type.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Status Filter and Sort */}
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                        <div className="flex gap-2 flex-wrap">
                            {getLibraryCategories(mediaType).map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setStatusFilter(category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === category.id
                                            ? 'bg-slate-700 text-white'
                                            : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-slate-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-slate-800 border border-slate-700 py-2 px-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items Grid */}
                    {sortedItems.length > 0 ? (
                        <div className="flex gap-4 flex-wrap">
                            {sortedItems.map((item) => (
                                <LibraryCard
                                    key={item.id}
                                    item={item}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 bg-slate-900 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                            <p className="text-lg mb-2">No {mediaType}s in this category yet</p>
                            <p className="text-sm">Use the search bar above to add {mediaType}s</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Members Popup */}
            {showMembersPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Members</h3>
                            <button
                                onClick={() => setShowMembersPopup(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                <X />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {members.map((member) => (
                                <div
                                    key={member.user_id}
                                    className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                                        {member.profiles.avatar_url ? (
                                            <img src={member.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                                {member.profiles.username[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">@{member.profiles.username}</p>
                                        {member.user_id === listInfo?.creator_id && (
                                            <p className="text-xs text-blue-400">Owner</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">Delete Shared List?</h3>
                        <p className="text-slate-400 mb-6">
                            This will permanently delete "{listInfo?.name}" and all its items. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteList}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-2xl font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Friends Popup */}
            {showInvitePopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Invite Friends</h3>
                            <button
                                onClick={() => {
                                    setShowInvitePopup(false);
                                    setSelectedFriendIds([]);
                                }}
                                className="text-slate-500 hover:text-white"
                            >
                                <X />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                                {myFriends.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No friends to invite</p>
                                        <p className="text-sm mt-1 text-slate-600">All your friends are already members!</p>
                                    </div>
                                ) : (
                                    myFriends.map(friend => (
                                        <div
                                            key={friend.id}
                                            onClick={() => toggleFriendSelection(friend.id)}
                                            className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${selectedFriendIds.includes(friend.id)
                                                    ? 'bg-blue-600/10 border border-blue-500/50'
                                                    : 'bg-slate-950 border border-transparent hover:border-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                                            {friend.username[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium">@{friend.username}</span>
                                            </div>
                                            {selectedFriendIds.includes(friend.id) && (
                                                <Check size={16} className="text-blue-500" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {myFriends.length > 0 && (
                                <button
                                    onClick={handleInviteFriends}
                                    disabled={selectedFriendIds.length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {selectedFriendIds.length === 0
                                        ? 'Select friends to invite'
                                        : `Invite ${selectedFriendIds.length} friend${selectedFriendIds.length > 1 ? 's' : ''}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedListDetail;