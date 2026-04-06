import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Users, Layers, LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Sidebar = ({ isOpen = true, onClose }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleNavigation = () => {
        // Close sidebar on mobile after navigation
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && onClose && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-16 border-r border-slate-800 flex flex-col items-center py-6 bg-slate-950 h-screen z-50
                fixed md:sticky md:block
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                transition-transform duration-300 ease-in-out
                top-0 left-0
            `}>
            {/* Close button for mobile */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="md:hidden p-3 text-slate-400 hover:text-white w-full flex justify-center"
                >
                    <X size={20} />
                </button>
            )}

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col items-center gap-4 mt-4">
                <Link
                    to="/"
                    onClick={handleNavigation}
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
                    onClick={handleNavigation}
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
                    onClick={handleNavigation}
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
                    onClick={handleNavigation}
                    className={`p-3 rounded-xl transition-colors ${isActive('/friends')
                            ? 'bg-slate-800 text-white shadow-lg shadow-blue-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                    title="Friends"
                >
                    <Users size={22} />
                </Link>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="p-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors mt-2"
                    title="Logout"
                >
                    <LogOut size={22} />
                </button>
            </nav>

            {/* Blue accent line */}
            <div className="absolute right-0 top-0 w-0.5 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </aside>
        </>
    );
};

export default Sidebar;