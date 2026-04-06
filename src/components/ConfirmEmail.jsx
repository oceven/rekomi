import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle } from 'lucide-react';

const ConfirmEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const createProfileIfNeeded = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          // Create profile from metadata
          const username = user.user_metadata?.username || user.email.split('@')[0];
          await supabase
            .from('profiles')
            .insert([{ id: user.id, username: username }]);
        }
      }
    };

    createProfileIfNeeded();
  }, []);

  const handleLogin = () => {
    // Sign out first to ensure clean login
    supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">
          Email Confirmed!
        </h2>
        
        <p className="text-slate-300 mb-6">
          Your email has been successfully verified. Please log in to continue.
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default ConfirmEmail;
