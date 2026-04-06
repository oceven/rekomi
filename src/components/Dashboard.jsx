import { useState, useEffect, useRef } from 'react';
import { saveMediaItem } from '../services/mediaServices';
import { getPopularMovies, searchMovies } from '../services/tmdbService';
import { getPopularAnime, searchAnime } from '../services/animeService';
import { getPopularBooks, searchBooks } from '../services/bookService';
import { getPopularManga, searchManga } from '../services/mangaService';
import { TMDB_IMAGE_BASE, PLACEHOLDER_IMAGE } from '../constants';
import useUserProfile from '../hooks/useUserProfile';
import Sidebar from './Sidebar';
import Header from './ui/Header';
import Toast from './ui/Toast';
import PreviewModal from './ui/PreviewModal';

// ============================================
// Media Card Component
// ============================================
const MediaCard = ({ item, onAdd, onPreview }) => {
    // Handle both TMDB (path) and Jikan (full URL) poster formats
    const posterUrl = item.poster_path
        ? item.poster_path.startsWith('http')
            ? item.poster_path
            : `${TMDB_IMAGE_BASE}${item.poster_path}`
        : PLACEHOLDER_IMAGE;

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date)?.split('-')[0] || '';
    // Render card with hover actions
    return (
        <div
            onClick={() => onPreview(item)}
            className="flex-shrink-0 w-36 cursor-pointer group"
        >
            <div className="relative overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-blue-500 transition-all">
                <img
                    src={posterUrl}
                    className="w-full aspect-[2/3] object-cover"
                    alt={title}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        className="absolute top-2 right-2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold hover:bg-blue-500 transition-colors shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd(item);
                        }}
                    >
                        +
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white text-sm font-semibold leading-tight line-clamp-2">{title}</h4>
                        {year && <p className="text-slate-400 text-xs mt-1">{year}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Media Section Component
// ============================================
const MediaSection = ({ title, subtitle, items, onAdd, onPreview }) => {
    return (
        <section className="mb-10">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {items.map((item) => (
                    <MediaCard key={item.id} item={item} onAdd={onAdd} onPreview={onPreview} />
                ))}
                {items.length === 0 && (
                    <div className="text-slate-600 text-sm py-8">
                        Search to discover content...
                    </div>
                )}
            </div>
        </section>
    );
};

// ============================================
// Dashboard Component
// ============================================
const Dashboard = ({ session }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [movieResults, setMovieResults] = useState([]);
    const [animeResults, setAnimeResults] = useState([]);
    const [mangaResults, setMangaResults] = useState([]);
    const [bookResults, setBookResults] = useState([]);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedMediaType, setSelectedMediaType] = useState('movie');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { username, avatar_url } = useUserProfile(session);

    // Track if initial load has happened
    const [initialLoaded, setInitialLoaded] = useState(false);
    const previousSearchQuery = useRef('');

    // Small delay helper to avoid Jikan rate limits
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fetch trending content on mount
    useEffect(() => {
        let isCancelled = false;

        const loadContent = async () => {
            try {
                // Fetch movies first (TMDB - no rate limit issues)
                const movies = await getPopularMovies(10);
                if (isCancelled) return;
                setMovieResults(movies);

                // Fetch books (Open Library - no rate limit issues)
                const books = await getPopularBooks(10);
                if (isCancelled) return;
                setBookResults(books);

                // Fetch anime (Jikan API)
                const anime = await getPopularAnime(10);
                if (isCancelled) return;
                setAnimeResults(anime);

                // Wait 1 second before next Jikan call to avoid rate limit
                await delay(1000);

                // Fetch manga (Jikan API)
                if (isCancelled) return;
                const manga = await getPopularManga(10);
                if (isCancelled) return;
                setMangaResults(manga);

                setInitialLoaded(true);
            } catch (error) {
                console.error('Error loading content:', error);
            }
        };

        loadContent();

        return () => {
            isCancelled = true;
        };
    }, []);

    // Search with debounce (only runs when searchQuery actually changes)
    useEffect(() => {
        // Skip if initial load hasn't completed yet
        if (!initialLoaded) return;

        // Skip if searchQuery hasn't actually changed (prevents running on initialLoaded change)
        if (searchQuery === previousSearchQuery.current) return;
        previousSearchQuery.current = searchQuery;

        if (searchQuery.length === 0) {
            const loadTrending = async () => {
                const movies = await getPopularMovies(10);
                setMovieResults(movies);

                const books = await getPopularBooks(10);
                setBookResults(books);

                const anime = await getPopularAnime(10);
                setAnimeResults(anime);

                await delay(1000);

                const manga = await getPopularManga(10);
                setMangaResults(manga);
            };
            loadTrending();
            return;
        }

        if (searchQuery.length < 3) return;

        const timer = setTimeout(async () => {
            const movies = await searchMovies(searchQuery, 10);
            setMovieResults(movies);

            const books = await searchBooks(searchQuery, 10);
            setBookResults(books);

            const anime = await searchAnime(searchQuery, 10);
            setAnimeResults(anime);

            await delay(1000);

            const manga = await searchManga(searchQuery, 10);
            setMangaResults(manga);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, initialLoaded]);

    const handleAddToLibrary = async (item, type = 'movie') => {
        const { error, duplicate } = await saveMediaItem(session.user.id, item, type);
        if (duplicate) {
            setToast({ isVisible: true, message: `"${item.title || item.name}" is already in your library`, type: 'error' });
        } else if (error) {
            setToast({ isVisible: true, message: 'Failed to add to library', type: 'error' });
        } else {
            setToast({ isVisible: true, message: `Added "${item.title || item.name}" to your library!`, type: 'success' });
        }
    };

    const handlePreview = (item, mediaType = 'movie') => {
        setSelectedItem(item);
        setSelectedMediaType(mediaType);
        setIsPreviewOpen(true);
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
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />

            <PreviewModal
                item={selectedItem}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onAdd={(item) => handleAddToLibrary(item, selectedMediaType)}
                mediaType={selectedMediaType}
                session={session}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    username={username}
                    avatar_url={avatar_url}
                    session={session}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchPlaceholder="Search movies, anime, books..."
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 scrollbar-hide">
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-white mb-1">Explore</h2>
                        <p className="text-slate-500">Add your all-time favorites to your list</p>
                    </div>

                    <MediaSection
                        title="Movies"
                        subtitle="Top trending films"
                        items={movieResults}
                        onAdd={(item) => handleAddToLibrary(item, 'movie')}
                        onPreview={(item) => handlePreview(item, 'movie')}
                    />

                    <MediaSection
                        title="Anime"
                        subtitle="Top rated anime"
                        items={animeResults}
                        onAdd={(item) => handleAddToLibrary(item, 'anime')}
                        onPreview={(item) => handlePreview(item, 'anime')}
                    />

                    <MediaSection
                        title="Manga"
                        subtitle="Top rated manga"
                        items={mangaResults}
                        onAdd={(item) => handleAddToLibrary(item, 'manga')}
                        onPreview={(item) => handlePreview(item, 'manga')}
                    />

                    <MediaSection
                        title="Books"
                        subtitle="Popular fiction"
                        items={bookResults}
                        onAdd={(item) => handleAddToLibrary(item, 'book')}
                        onPreview={(item) => handlePreview(item, 'book')}
                    />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;