import { supabase } from '../lib/supabaseClient';

// Send a recommendation to a friend
export const sendRecommendation = async (senderId, receiverId, media) => {
  const { data, error } = await supabase
    .from('recommendations')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        media_id: media.id.toString(),
        media_type: media.media_type || 'movie',
        media_title: media.title,
        media_poster: media.poster_path || media.poster_url,
      }
    ]);
  return { data, error };
};

//Fetch notifications for a user
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

//Mark a recommendation as read
export const markAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('recommendations')
    .update({ is_read: true })
    .eq('id', notificationId);
  return { data, error };
};