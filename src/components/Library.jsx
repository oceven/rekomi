import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { saveMediaItem } from '../services/mediaServices';
import { searchMovies } from '../services/tmdbService';
import { searchAnime } from '../services/animeService';
import { searchBooks } from '../services/bookService';
import { searchManga } from '../services/mangaService';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE, getLibraryCategories } from '../constants';
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import DetailModal from './ui/DetailModal';
import { Search, X, Plus, Star, ArrowUpDown, Film, Tv, BookOpen, Book } from 'lucide-react';

// ============================================
// Media Type Tabs
// ============================================
const MEDIA_TYPES = [
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'anime', label: 'Anime', icon: Tv },
    { id: 'manga', label: 'Manga', icon: Book },
    { id: 'book', label: 'Books', icon: BookOpen },
];

// ============================================
// Search Dropdown Component
// ============================================
const SearchDropdown = ({ session, mediaType, onItemAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    const placeholders = {
        movie: 'Search movies to add...',
        anime: 'Search anime to add...',
        manga: 'Search manga to add...',
        book: 'Search books to add...',
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            let results = [];
            if (mediaType === 'movie') {
                results = await searchMovies(searchQuery, 6);
            } else if (mediaType === 'anime') {
                results = await searchAnime(searchQuery, 6);
            } else if (mediaType === 'manga') {
                results = await searchManga(searchQuery, 6);
            } else if (mediaType === 'book') {
                results = await searchBooks(searchQuery, 6);
            }
            setSearchResults(results);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, mediaType]);

    const handleAdd = async (item) => {
        const { error, duplicate } = await saveMediaItem(session.user.id, item, mediaType);
        onItemAdded(item.title || item.name, duplicate);
        setSearchQuery('');
        setSearchResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder={placeholders[mediaType]}
                    className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-11 pr-5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-30">
                    {searchResults.map((item) => {
                        // Handle both TMDB (path) and Jikan (full URL) poster formats
                        const posterUrl = item.poster_path?.startsWith('http')
                            ? item.poster_path
                            : item.poster_path
                                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                                : PLACEHOLDER_IMAGE;

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors cursor-pointer"
                                onClick={() => handleAdd(item)}
                            >
                                <img
                                    src={posterUrl}
                                    alt={item.title || item.name}
                                    className="w-10 h-14 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.title || item.name}</p>
                                    <p className="text-xs text-slate-500">{(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</p>
                                </div>
                                <button className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================
// Library Card Component
// ============================================
const LibraryCard = ({ item, onClick }) => {
    const posterUrl = item.poster_url || PLACEHOLDER_IMAGE;

    return (
        <div
            className="flex-shrink-0 w-28 sm:w-32 md:w-36 cursor-pointer group"
            onClick={() => onClick(item)}
        >
            <div className="relative overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-blue-500 transition-all">
                <img
                    src={posterUrl}
                    className="w-full aspect-[2/3] object-cover"
                    alt={item.title}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white text-sm font-semibold leading-tight line-clamp-2">{item.title}</h4>
                        {item.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-xs text-slate-400">{item.rating}/5</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Sort Options
// ============================================
const SORT_OPTIONS = [
    { id: 'recent', label: 'Recently Added' },
    { id: 'rating-high', label: 'Rating: High to Low' },
    { id: 'rating-low', label: 'Rating: Low to High' },
    { id: 'title', label: 'Title: A-Z' },
];

// ============================================
// Library Component
// ============================================
const Library = ({ session }) => {
    const [mediaType, setMediaType] = useState('movie');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ isVisible: false, message: '' });
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { username, avatar_url } = useUserProfile(session);

    const fetchItems = async () => {
        if (!session) return;
        setLoading(true);

        let query = supabase
            .from('media_items')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('media_type', mediaType)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error) {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, [mediaType, statusFilter, session]);

    const sortedItems = [...items].sort((a, b) => {
        switch (sortBy) {
            case 'rating-high':
                return (b.rating || 0) - (a.rating || 0);
            case 'rating-low':
                return (a.rating || 0) - (b.rating || 0);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    const handleItemAdded = (title, isDuplicate = false) => {
        if (isDuplicate) {
            setToast({ isVisible: true, message: `"${title}" is already in your library` });
        } else {
            setToast({ isVisible: true, message: `Added "${title}" to your library!` });
            fetchItems();
        }
    };

    const handleCardClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleSave = async (itemId, updates) => {
        const { error } = await supabase
            .from('media_items')
            .update(updates)
            .eq('id', itemId);

        if (!error) {
            setToast({ isVisible: true, message: 'Changes saved!' });
            fetchItems();
        } else {
            setToast({ isVisible: true, message: 'Failed to save changes' });
        }
    };

    const handleDelete = async (itemId) => {
        const { error } = await supabase
            .from('media_items')
            .delete()
            .eq('id', itemId);

        if (!error) {
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            setToast({ isVisible: true, message: 'Item removed from library' });
        }
    };

    // Page titles based on media type
    const pageTitles = {
        movie: { title: 'My Movies', subtitle: 'Your personal movie collection' },
        anime: { title: 'My Anime', subtitle: 'Your personal anime collection' },
        manga: { title: 'My Manga', subtitle: 'Your personal manga collection' },
        book: { title: 'My Books', subtitle: 'Your personal book collection' },
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast({ isVisible: false, message: '' })}
            />

            <DetailModal
                item={selectedItem}
                isOpen={isModalOpen}
                session={session}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                mediaType={mediaType}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    username={username} 
                    session={session} 
                    avatar_url={avatar_url}
                    onMenuClick={() => setIsSidebarOpen(true)}
                >
                    <SearchDropdown
                        session={session}
                        mediaType={mediaType}
                        onItemAdded={handleItemAdded}
                    />
                </Header>

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 scrollbar-hide">
                    {/* Page Title */}
                    <div className="mb-4 sm:mb-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{pageTitles[mediaType].title}</h2>
                        <p className="text-xs sm:text-sm text-slate-500">{pageTitles[mediaType].subtitle}</p>
                    </div>

                    {/* Media Type Tabs */}
                    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {MEDIA_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setMediaType(type.id);
                                        setStatusFilter('all');
                                    }}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${mediaType === type.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Icon size={14} className="sm:w-4 sm:h-4" />
                                    <span className="whitespace-nowrap">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Status Filters and Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {getLibraryCategories(mediaType).map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setStatusFilter(category.id)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${statusFilter === category.id
                                            ? 'bg-slate-700 text-white'
                                            : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ArrowUpDown size={14} className="text-slate-500 sm:w-4 sm:h-4" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-slate-800 border border-slate-700 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
                    ) : sortedItems.length > 0 ? (
                        <div className="flex gap-4 flex-wrap">
                            {sortedItems.map((item) => (
                                <LibraryCard key={item.id} item={item} onClick={handleCardClick} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 bg-slate-900 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                            <p className="text-lg mb-2">No {mediaType}s in this category yet</p>
                            <p className="text-sm">Use the search bar above to add {mediaType}s</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Library;