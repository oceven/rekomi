import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Users, Layers, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <aside className="w-16 border-r border-slate-800 flex flex-col items-center py-6 bg-slate-950 h-screen sticky top-0 z-50">
            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col items-center gap-4 mt-4">
                <Link
                    to="/"
                    className={`p-3 rounded-xl transition-colors ${isActive('/')
                            ? 'bg-slate-800 text-white shadow-lg shadow-blue-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                    title="Explore"
                >
                    <Home size={22} />
                </Link>

                <Link
                    to="/library"
                    className={`p-3 rounded-xl transition-colors ${isActive('/library')
                            ? 'bg-slate-800 text-white shadow-lg shadow-blue-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                    title="Library"
                >
                    <Library size={22} />
                </Link>

                {/* Shared Lists Icon - Using Layers to distinguish from Friends */}
                <Link
                    to="/shared-lists"
                    className={`p-3 rounded-xl transition-colors ${isActive('/shared-lists')
                            ? 'bg-slate-800 text-white shadow-lg shadow-blue-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                    title="Shared Lists"
                >
                    <Layers size={22} />
                </Link>

                {/* Friends Icon - Keeping your existing Users icon */}
                <Link
                    to="/friends"
                    className={`p-3 rounded-xl transition-colors ${isActive('/friends')
                            ? 'bg-slate-800 text-white shadow-lg shadow-blue-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                    title="Friends"
                >
                    <Users size={22} />
                </Link>
            </nav>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="p-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors mb-4"
                title="Logout"
            >
                <LogOut size={22} />
            </button>

            {/* Blue accent line */}
            <div className="absolute right-0 top-0 w-0.5 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </aside>
    );
};

export default Sidebar;