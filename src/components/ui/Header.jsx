import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Users, Bell, LogOut, Check } from 'lucide-react';
import { getNotifications, markAsRead } from '../../services/recommendationService';

/**
 * Shared Header component used across all pages
 */
const Header = ({
  username,
  session,
  searchQuery,
  setSearchQuery,
  searchPlaceholder = 'Search...',
  showSearch = true,
  children // For custom search implementations (like dropdown)
}) => {
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Load notifications
  const loadNotifications = async () => {
    if (!session?.user?.id) return;
    const { data } = await getNotifications(session.user.id);
    setNotifications(data || []);
  };

  // On mount, load notifications
  useEffect(() => {
    loadNotifications();
  }, [session]);

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Mark notification as read
  const handleMarkRead = async (id) => {
    await handleMarkRead(id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
      {/* Logo */}
      <h1
        onClick={() => navigate('/')}
        className="text-xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors"
      >
        rekomi
      </h1>

      {/* Search Section */}
      <div className="flex-1 max-w-xl mx-8">
        {children || (showSearch && setSearchQuery && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-11 pr-5 text-sm outline-none focus:border-blue-500 transition-all text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4">
        {/* Friends */}
        <Link to="/friends" className="p-2 text-slate-400 hover:text-white transition-colors" title="Friends">
          <Users size={20} />
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className={`p-2 transition-colors ${unreadCount > 0 ? 'text-blue-500' : 'text-slate-400'} hover:text-white`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border transition-all ${n.is_read ? 'bg-slate-800/20 border-transparent' : 'bg-slate-800 border-slate-700 hover:border-blue-500/50'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <span className="font-bold text-white">@{n.sender?.username}</span> recommended
                          <span className="italic text-blue-400"> "{n.media_title}"</span>
                        </p>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 hover:bg-blue-500/20 rounded text-blue-500"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) : (
                    <div className="py-10 text-center">
                      <p className="text-slate-600 text-xs italic">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <Link
          to="/profile"
          className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white hover:bg-blue-500 transition-colors"
        >
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </Link>

        {/* Logout */}
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