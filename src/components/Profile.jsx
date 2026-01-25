import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import { Mail, Film, Users } from 'lucide-react';

const Profile = ({ session }) => {
    const { username } = useUserProfile(session);
    const [stats, setStats] = useState({ totalItems: 0, friends: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.user?.id) return;

            // Fetch total media items
            const { count: mediaCount } = await supabase
                .from('media_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id);

            // Fetch total accepted friends
            const { count: friendCount } = await supabase
                .from('friendships')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'accepted')
                .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

            setStats({ totalItems: mediaCount || 0, friends: friendCount || 0 });
        };
        fetchStats();
    }, [session]);

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header username={username} showSearch={false} />
                <main className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
                    <div className="max-w-4xl mx-auto">

                        {/* Profile header */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-slate-800">
                                    {username?.charAt(0).toUpperCase() || 'U'}
                                </div>

                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold mb-2">@{username}</h2>
                                    <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                                        <Mail size={16} /> {session?.user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Library Stat */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 group hover:border-purple-500/30 transition-colors">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                    <Film size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.totalItems}</p>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Items in Library</p>
                                </div>
                            </div>

                            {/* Friends Circle Stat */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 group hover:border-blue-500/30 transition-colors">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.friends}</p>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Friends in Circle</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;