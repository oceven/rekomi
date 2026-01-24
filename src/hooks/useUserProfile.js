import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Fetch user profile data based on session
const useUserProfile = (session) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    //if session changes, fetch profile
    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }
        //Fetch user profile from Supabase
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session.user.id)
                .single();

            if (data) setUsername(data.username);
            setLoading(false);
        };

        fetchProfile();
    }, [session]);

    return { username, loading };
};

export default useUserProfile;