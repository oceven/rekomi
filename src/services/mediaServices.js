import { supabase } from '../lib/supabaseClient';

/**
 * Saves a movie, anime, or book to the user's personal list.
 * Returns { data, error, duplicate } - duplicate is true if item already exists
 */
export const saveMediaItem = async (userId, item, type) => {
  // Check if item already exists in user's library
  const { data: existing } = await supabase
    .from('media_items')
    .select('id')
    .eq('user_id', userId)
    .eq('external_id', item.id.toString())
    .eq('media_type', type) 
    .single();

  if (existing) {
    return { data: null, error: null, duplicate: true };
  }

  // Handle poster URL - anime has full URL, movies need TMDB base
  let posterUrl = null;
  if (item.poster_path) {
    posterUrl = item.poster_path.startsWith('http') 
      ? item.poster_path 
      : `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  }

  // Insert new media item
  const { data, error } = await supabase
    .from('media_items')
    .insert([
      {
        user_id: userId,
        title: item.title || item.name,
        media_type: type,
        external_id: item.id.toString(),
        poster_url: posterUrl,
        year: (item.release_date || item.first_air_date)?.split('-')[0] || null,
        status: 'later',
      }
    ]);

  return { data, error, duplicate: false };
};

/**
 * Fetches the user's saved items based on category (movie, anime, book, manga)
 */
export const getLibraryItems = async (userId, type) => {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', type)
    .order('created_at', { ascending: false });

  return { data, error };
};