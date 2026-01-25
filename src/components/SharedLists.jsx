import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import useUserProfile from '../hooks/useUserProfile';
import { Layers, Plus, X, Users, Check, ArrowRight } from 'lucide-react';

const SharedLists = ({ session }) => {
    const navigate = useNavigate();
    const { username, avatar_url } = useUserProfile(session);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Popup States
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [myFriends, setMyFriends] = useState([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    useEffect(() => {
        if (session?.user?.id) {
            fetchMySharedLists();
            fetchFriends();
        }
    }, [session]);

    const fetchMySharedLists = async () => {
        // Fetch lists where I am an approved member
        const { data: memberships, error: memberError } = await supabase
            .from('shared_list_members')
            .select('list_id')
            .eq('user_id', session.user.id)
            .eq('is_approved', true);

        if (memberError) {
            console.error('Error fetching memberships:', memberError);
            setLoading(false);
            return;
        }

        if (!memberships || memberships.length === 0) {
            setLists([]);
            setLoading(false);
            return;
        }

        // Fetch the actual list details
        const listIds = memberships.map(m => m.list_id);
        const { data: listsData, error: listsError } = await supabase
            .from('shared_lists')
            .select('id, name, creator_id')
            .in('id', listIds);

        if (listsData) {
            setLists(listsData);
        }
        setLoading(false);
    };

    const fetchFriends = async () => {
        // Get your accepted friends to populate the invite dropdown
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
            const cleanFriends = data.map(f =>
                f.user_id === session.user.id ? f.receiver : f.initiator
            );
            setMyFriends(cleanFriends);
        }
    };

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        try {
            // 1. Create the shared list
            const { data: listData, error: listError } = await supabase
                .from('shared_lists')
                .insert([{ name: newListName, creator_id: session.user.id }])
                .select()
                .single();

            if (listError) throw listError;

            // 2. Add yourself (approved) and friends (pending) to membership table
            const memberships = [
                { list_id: listData.id, user_id: session.user.id, is_approved: true }
            ];

            selectedFriendIds.forEach(friendId => {
                memberships.push({ list_id: listData.id, user_id: friendId, is_approved: false });
            });

            const { error: memError } = await supabase.from('shared_list_members').insert(memberships);
            if (memError) throw memError;

            // 3. Create Notifications for each friend (optional - won't break if it fails)
            if (selectedFriendIds.length > 0) {
                try {
                    const inviteNotifications = selectedFriendIds.map(friendId => ({
                        receiver_id: friendId,
                        sender_id: session.user.id,
                        type: 'list_invite',
                        message: `${username} invited you to join "${newListName}"`,
                        related_id: listData.id,
                        is_read: false
                    }));

                    await supabase.from('notifications').insert(inviteNotifications);
                } catch (notifError) {
                    console.log('Note: Notifications not sent (table needs setup), but list created successfully');
                }
            }

            setToast({ isVisible: true, message: `"${newListName}" created!`, type: 'success' });
            setIsPopupOpen(false);
            setNewListName('');
            setSelectedFriendIds([]);
            fetchMySharedLists();
        } catch (err) {
            setToast({ isVisible: true, message: 'Error creating list', type: 'error' });
            console.error(err);
        }
    };

    const toggleFriendSelection = (id) => {
        setSelectedFriendIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            <Sidebar />
            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header username={username} avatar_url={avatar_url} session={session} />

                <main className="flex-1 overflow-y-auto px-8 py-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-4xl font-bold mb-2">Shared Lists</h2>
                                <p className="text-slate-500">Collaborate on collections with your circle</p>
                            </div>
                            <button
                                onClick={() => setIsPopupOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Plus size={20} /> Create Shared List
                            </button>
                        </div>

                        {/* List Display */}
                        {loading ? (
                            <div className="text-center py-20 text-slate-500">Loading your shared lists...</div>
                        ) : lists.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                                <Layers size={48} className="mx-auto mb-4 text-slate-700" />
                                <p className="text-slate-500 font-medium">No shared lists yet</p>
                                <p className="text-slate-600 text-sm mt-2">Create one to start collaborating with friends!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lists.map(list => (
                                    <div
                                        key={list.id}
                                        onClick={() => navigate(`/shared-lists/${list.id}`)}
                                        className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group overflow-hidden"
                                    >
                                        {/* Background gradient effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Content */}
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${list.creator_id === session.user.id
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                    }`}>
                                                    {list.creator_id === session.user.id ? 'OWNER' : 'MEMBER'}
                                                </span>
                                                <ArrowRight className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                                            </div>

                                            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{list.name}</h3>
                                            <p className="text-slate-500 text-sm">Click to view details</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create List Popup */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">New Shared List</h3>
                            <button
                                onClick={() => setIsPopupOpen(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleCreateList} className="space-y-6">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest mb-2 block">
                                    List Name
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="e.g., Movie Night 🍿"
                                    className="w-full bg-slate-950 border border-slate-800 placeholder:text-slate-600 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest mb-2 block">
                                    Invite Friends
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                    {myFriends.length === 0 ? (
                                        <p className="text-slate-600 text-sm text-center py-4">
                                            No friends to invite yet
                                        </p>
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
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold transition-all"
                            >
                                Create & Send Invites
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedLists;