import { supabase } from '../lib/supabaseClient';

// Helper to ensure IDs are consistent across services
export const normalizeExternalId = (id) => {
    if (!id) return null;
    return id.toString();
};

export const saveMediaItem = async (userId, item, type) => {
    try {
        const cleanId = normalizeExternalId(item.id || item.external_id); //

        // 1. Check if the item already exists
        const { data: existing, error: fetchError } = await supabase
            .from('media_items')
            .select('id')
            .eq('user_id', userId)
            .eq('external_id', cleanId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            return { duplicate: true };
        }

        // 2. Prepare data for insert
        const mediaData = {
            user_id: userId,
            external_id: cleanId,
            title: item.title || item.name,
            poster_url: item.poster_path?.startsWith('http')
                ? item.poster_path
                : `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            media_type: type,
            status: 'later',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('media_items')
            .insert([mediaData])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error in saveMediaItem:', error);
        return { data: null, error };
    }
};