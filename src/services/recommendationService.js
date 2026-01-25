import { supabase } from '../lib/supabaseClient';
import { normalizeExternalId } from './mediaServices';

/**
 * Sends a recommendation to a friend
 * @param {string} senderId - The user sending the recommendation
 * @param {string} receiverId - The user receiving the recommendation
 * @param {object} mediaObj - Complete media object with all necessary fields
 */
export const sendRecommendation = async (senderId, receiverId, mediaObj) => {
  const mediaType = mediaObj.media_type || 'movie';
  
  // Normalize the ID to match what's stored in the database
  const normalizedId = normalizeExternalId(mediaObj.id, mediaType);
  
  // Ensure we're storing ALL fields the PreviewModal needs
  const completeMediaData = {
    media_id: normalizedId, // Store the NORMALIZED ID
    title: mediaObj.title || mediaObj.name,
    poster_path: mediaObj.poster_path,
    media_type: mediaType,
    // These fields are critical for the modal to show year/genre/synopsis
    release_date: mediaObj.release_date,
    first_air_date: mediaObj.first_air_date,
    overview: mediaObj.overview,
    genres: mediaObj.genres
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        type: 'recommendation',
        is_read: false,
        data: completeMediaData
      }
    ]);

  if (error) {
    console.error('Error sending recommendation:', error);
    return { error };
  }

  return { data };
};

/**
 * Fetches all recommendations received by the user
 */
export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select(`
      *,
      sender:profiles!sender_id (username)
    `)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * Marks a specific notification as seen
 */
export const markAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('recommendations')
    .update({ is_read: true })
    .eq('id', notificationId);
  return { data, error };
};