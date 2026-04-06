import { supabase } from '../lib/supabaseClient';


//SIGN UP USER
export const signUpUser = async (email, password, username) => {
    const cleanUsername = username.toLowerCase().trim();
  
    // 1. Check if username is taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername);
  
    // If there's data in the array, the username is taken
    if (existingUser && existingUser.length > 0) {
      return { error: "Username is already taken!" };
    }
  
    // 2. AUTHENTICATION - Store username in metadata
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername
        }
      }
    });
  
    if (authError) return { error: authError.message };
  
    // 3. Try to add user to profiles table
    // This might fail if email confirmation is required
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, username: cleanUsername }]);
  
    if (profileError) {
      console.error("Profile creation deferred (likely pending email confirmation):", profileError.message);
      // Return success with confirmation message
      return { data, error: null, needsConfirmation: true };
    }
  
    return { data, error: null };
  };


//LOGIN USER
  export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) return { error: error.message };
  
    // Check if profile exists, create if missing (handles email confirmation flow)
    if (data.user) {
      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
  
      if (!profile && !profileCheckError) {
        // Profile doesn't exist, create it from metadata
        const username = data.user.user_metadata?.username || data.user.email.split('@')[0];
        
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username: username }]);
  
        if (createError) {
          console.error("Failed to create profile on login:", createError);
        }
      }
    }
  
    return { data, error: null };
  };