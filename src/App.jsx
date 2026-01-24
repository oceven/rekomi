import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import SignUp from './components/SignUp';

function App() {
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    // 1. Check current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to REKOMI</h1>
        <p className="text-slate-400 mb-8">You are logged in as {session.user.email}</p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {showLogin ? <Login /> : <SignUp />}
      
      <button 
        onClick={() => setShowLogin(!showLogin)}
        className="mt-6 text-slate-400 hover:text-white text-sm transition-colors"
      >
        {showLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </button>
    </div>
  );
}

export default App;