import { Link, useLocation } from 'react-router-dom';
import { Home, Library } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-16 border-r border-slate-800 flex flex-col items-center py-6 bg-slate-950 h-screen sticky top-0">
      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-4 mt-4">
        <Link
          to="/"
          className={`p-3 rounded-xl transition-colors ${
            isActive('/') 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
          }`}
          title="Explore"
        >
          <Home size={22} />
        </Link>

        <Link
          to="/library"
          className={`p-3 rounded-xl transition-colors ${
            isActive('/library')
              ? 'bg-slate-800 text-white' 
              : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
          }`}
          title="Library"
        >
          <Library size={22} />
        </Link>
      </nav>

      {/* Blue accent line on the right */}
      <div className="absolute right-0 top-0 w-0.5 h-full bg-blue-500" />
    </aside>
  );
};

export default Sidebar;