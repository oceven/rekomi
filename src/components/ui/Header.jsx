import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Users, Bell, LogOut, Menu } from 'lucide-react';

const Header = ({
  username,
  avatar_url,
  session,
  children,
  showSearch = true,
  setSearchQuery,
  searchQuery,
  searchPlaceholder = 'Search...',
  onMenuClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const checkUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      setHasUnread(count > 0);
    };

    // Check immediately on mount
    checkUnread();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('header-notifs')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          setHasUnread(true);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          checkUnread();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20 gap-2 sm:gap-3 md:gap-4">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Logo with blue underline only on "mi" - Smaller on mobile */}
      <h1
        onClick={() => navigate('/')}
        className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors flex-shrink-0"
      >
        reko<span className="border-b-2 border-blue-500 pb-0.5">mi</span>
      </h1>

      <div className="flex-1 max-w-xl mx-1.5 sm:mx-3 md:mx-8">
        {children || (showSearch && setSearchQuery && (
          <div className="relative w-full">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-9 sm:pl-11 pr-3 sm:pr-5 text-sm outline-none focus:border-blue-500 transition-all text-white placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
        <Link
          to="/friends"
          className={`hidden sm:block p-1.5 sm:p-2 transition-colors ${location.pathname === '/friends' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          <Users size={17} className="sm:w-4.5 sm:h-4.5" />
        </Link>

        {/* Bell Button - Navigates to page, no dropdown */}
        <button
          onClick={() => navigate('/notifications')}
          className={`p-1.5 sm:p-2 transition-colors relative ${location.pathname === '/notifications' ? 'text-blue-500' : 'text-slate-400 hover:text-white'
            }`}
        >
          <Bell size={17} className="sm:w-4.5 sm:h-4.5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>

        <Link
          to="/profile"
          className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
        >
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="hidden sm:block p-1.5 sm:p-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={17} className="sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </header>
  );
};

export default Header;