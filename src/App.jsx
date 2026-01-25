import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import Friends from './components/Friends';
import Profile from './components/Profile';

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

  //if not logged in, show login/signup
  if (!session) {
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

  //if logged in, show dashboard
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard session={session} />} />
        <Route path="/library" element={<Library session={session} />} />
        <Route path="/friends" element={<Friends session={session} />} />
        <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;