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
  
    // 2. AUTHENTICATION
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (authError) return { error: authError.message };
  
    // 3. Add new user to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, username: cleanUsername }]);
  
    if (profileError) {
      // If this fails, the user exists in Auth but not Profiles.
      // We should alert the user.
      console.error("Profile sync failed:", profileError.message);
      return { error: "Account created, but profile setup failed. Please contact support." };
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
    return { data, error: null };
  };