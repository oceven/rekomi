import { useState, useEffect } from 'react';
import { searchUsers, sendFriendRequest, getMySocialCircle, respondToRequest } from '../services/friendServices';
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import { UserPlus, Check, X as CloseIcon } from 'lucide-react';
import { deleteFriendship } from '../services/friendServices';

const Friends = ({ session }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [socialList, setSocialList] = useState([]);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const { username } = useUserProfile(session);

    // Load social circle (friends and requests)
    const loadSocial = async () => {
        const { data } = await getMySocialCircle(session.user.id);
        setSocialList(data || []);
    };

    useEffect(() => {
        if (session?.user?.id) loadSocial();
    }, [session]);

    const handleResponse = async (requestId, status) => {
        let result;

        if (status === 'declined') {
            // Instead of updating the status, we delete the row entirely
            result = await deleteFriendship(requestId);
        } else {
            // Keep the update logic for 'accepted'
            result = await respondToRequest(requestId, status);
        }

        if (result.error) {
            setToast({ isVisible: true, message: 'Failed to process request', type: 'error' });
        } else {
            const actionText = status === 'declined' ? 'removed' : 'accepted';
            setToast({ isVisible: true, message: `Request ${actionText}!`, type: 'success' });
            loadSocial(); // Refresh the list to show the change
        }
    };

    // Search users as query changes
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const { data } = await searchUsers(searchQuery, session.user.id);
            setSearchResults(data || []);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle sending friend request
    const handleRequest = async (targetUser) => {
        const { error } = await sendFriendRequest(session.user.id, targetUser.id);
        if (error) {
            setToast({ isVisible: true, message: 'Friend request already exists', type: 'error' });
        } else {
            setToast({ isVisible: true, message: `Request sent to ${targetUser.username}!`, type: 'success' });
            loadSocial();
        }
    };

    // 1. Separate the list into two categories
    const pendingRequests = socialList.filter(item => item.status === 'pending');
    const acceptedFriends = socialList.filter(item => item.status === 'accepted');

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
                <Header username={username} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchPlaceholder="Search usernames..." />

                <main className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold mb-1">Social</h2>
                        <p className="text-slate-500">Connect with others and manage your circle</p>
                    </div>

                    {/* Discovery Section (Results from Search) */}
                    {searchResults.length > 0 && (
                        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Discovery</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {searchResults.map(user => {
                                    const isAlreadyConnected = socialList.some(f => f.user_id === user.id || f.friend_id === user.id);
                                    if (isAlreadyConnected) return null;

                                    return (
                                        <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                            <span className="font-medium text-white">@{user.username}</span>
                                            <button onClick={() => handleRequest(user)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all shadow-lg">
                                                <UserPlus size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/*Pending Friend Request section*/}
                    {pendingRequests.length > 0 && (
                        <section className="mb-10">
                            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-4">Pending Requests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingRequests.map(item => {
                                    const isInitiator = item.user_id === session.user.id;
                                    const friend = isInitiator ? item.receiver : item.initiator;

                                    return (
                                        <div key={item.id} className="bg-slate-900 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-blue-400">
                                                    {friend.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">@{friend.username}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                                        {isInitiator ? 'Request Sent' : 'Wants to be friends'}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isInitiator && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleResponse(item.id, 'accepted')} className="p-2 bg-green-600/20 text-green-500 rounded-lg hover:bg-green-600 transition-colors">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => handleResponse(item.id, 'declined')} className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 transition-colors">
                                                        <CloseIcon size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Your circle (Friends) section*/}
                    <section>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Your Circle</h3>
                        {acceptedFriends.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {acceptedFriends.map(item => {
                                    const friend = item.user_id === session.user.id ? item.receiver : item.initiator;

                                    return (
                                        <div
                                            key={item.id}
                                            className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-blue-500/50 flex flex-col"
                                        >
                                            {/* Square Header Area */}
                                            <div className="aspect-square w-full bg-slate-800/50 flex items-center justify-center relative">
                                                {/* Profile Initial */}
                                                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl border-4 border-slate-900 z-10 group-hover:scale-105 transition-transform duration-300">
                                                    <span className="text-xl font-bold text-white">
                                                        {friend.username?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-[2px]">
                                                    {/* Optional: Add a 'View Profile' or 'Chat' icon here later */}
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-white truncate">@{friend.username}</p>
                                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Friend</p>
                                                </div>

                                                {/* Action Button - Always visible but styled subtly */}
                                                <button
                                                    onClick={() => handleResponse(item.id, 'declined')}
                                                    className="w-full py-2 bg-slate-800 text-slate-400 hover:bg-red-600/20 hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-transparent hover:border-red-600/30"
                                                >
                                                    Unfriend
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-16 border-2 border-dashed border-slate-900 rounded-3xl text-center">
                                <p className="text-slate-600 text-sm">No friends in your circle yet.</p>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Friends;