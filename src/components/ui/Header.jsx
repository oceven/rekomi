import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Users, Bell, LogOut } from 'lucide-react';

/**
 * Shared Header component used across all pages
 * 
 * Props:
 * - username: Current user's username
 * - searchQuery: Search input value (optional)
 * - setSearchQuery: Search input handler (optional)
 * - searchPlaceholder: Placeholder text for search (optional)
 * - showSearch: Whether to show search bar (default: true)
 * - showLogo: Whether logo is clickable (default: true for non-home pages)
 */
const Header = ({ 
  username, 
  searchQuery, 
  setSearchQuery, 
  searchPlaceholder = 'Search...',
  showSearch = true,
  children // For custom search implementations (like dropdown)
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
      {/* Logo */}
      <h1 
        onClick={() => navigate('/')}
        className="text-xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors"
      >
        rekomi
      </h1>

      {/* Search - can be custom (children) or default */}
      {children ? (
        <div className="flex-1 max-w-xl mx-8">
          {children}
        </div>
      ) : showSearch && setSearchQuery ? (
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-11 pr-5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white transition-colors">
          <Users size={20} />
        </button>
        <button className="p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;