import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Users, Bell, LogOut } from 'lucide-react';

const Header = ({
  username,
  avatar_url,
  session,
  children,
  showSearch = true,
  setSearchQuery,
  searchQuery,
  searchPlaceholder = 'Search...'
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
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
      {/* Logo with blue underline only on "mi" */}
      <h1
        onClick={() => navigate('/')}
        className="text-xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors"
      >
        reko<span className="border-b-2 border-blue-500 pb-0.5">mi</span>
      </h1>

      <div className="flex-1 max-w-xl mx-8">
        {children || (showSearch && setSearchQuery && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-11 pr-5 text-sm outline-none focus:border-blue-500 transition-all text-white placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/friends"
          className={`p-2 transition-colors ${location.pathname === '/friends' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          <Users size={20} />
        </Link>

        {/* Bell Button - Navigates to page, no dropdown */}
        <button
          onClick={() => navigate('/notifications')}
          className={`p-2 transition-colors relative ${location.pathname === '/notifications' ? 'text-blue-500' : 'text-slate-400 hover:text-white'
            }`}
        >
          <Bell size={20} />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>

        <Link
          to="/profile"
          className="w-9 h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
        >
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;