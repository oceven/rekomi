import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Fetch user profile data based on session
const useUserProfile = (session) => {
    const [username, setUsername] = useState('');
    const [avatar_url, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    //if session changes, fetch profile
    const fetchProfile = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }
        //Fetch user profile from Supabase
        const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();

        if (data) {
            setUsername(data.username);
            // Force refresh by adding a timestamp to the URL to bypass browser cache
            const timestampedUrl = data.avatar_url ? `${data.avatar_url}?t=${Date.now()}` : null;
            setAvatarUrl(timestampedUrl);
        }
        setLoading(false);
    }, [session?.user?.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const refreshProfile = () => {

        fetchProfile();
    };

    return { username, avatar_url, loading, refreshProfile };
};

export default useUserProfile;