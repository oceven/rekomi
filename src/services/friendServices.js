import { supabase } from '../lib/supabaseClient';

/**
 * Search for users in the profiles table by username
 */
export const searchUsers = async (query, currentUserId) => {
    // 1. Get all IDs of people you are already connected to
    const { data: existing } = await supabase
        .from('friendships')
        .select('id, username, avatar_url')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    const connectedIds = existing?.map(f =>
        f.user_id === currentUserId ? f.friend_id : f.user_id
    ) || [];

    // 2. Search for users, excluding yourself AND your existing connections
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId) // Not yourself
        .not('id', 'in', `(${connectedIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(5);

    return { data, error };
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (userId, friendId) => {
    const { data, error } = await supabase
        .from('friendships')
        .insert([
            {
                user_id: userId,
                friend_id: friendId,
                status: 'pending'
            }
        ]);

    return { data, error };
};

/**
 * Update the status of a friend request (accept/decline)
 */
export const respondToRequest = async (requestId, newStatus) => {
    const { data, error } = await supabase
        .from('friendships')
        .update({ status: newStatus })
        .eq('id', requestId);

    return { data, error };
};



// Fetch the user's social circle (friends and pending requests)
export const getMySocialCircle = async (userId) => {

    // Fetch friendships where user is either the requester or the receiver
    const { data, error } = await supabase
        .from('friendships')
        .select(`
        id,
        status,
        user_id,
        friend_id,
        initiator:profiles!user_id (id, username, avatar_url),
        receiver:profiles!friend_id (id, username, avatar_url)
      `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) console.error("Social Circle Error:", error);
    return { data, error };
};

/**
 * Deletes a friendship row (used for declining or unfriending)
 */
export const deleteFriendship = async (requestId) => {
    const { data, error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

    return { data, error };
};