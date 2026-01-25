import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Welcome from './components/Welcome';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import Friends from './components/Friends'; 
import Profile from './components/Profile'; 
import Notifications from './components/Notifications';
import SharedLists from './components/SharedLists';
import SharedListDetail from './components/SharedListDetail';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        {!session ? (
          // --- UNAUTHENTICATED ROUTES ---
          <>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          // --- AUTHENTICATED ROUTES ---
          <>
            <Route path="/" element={<Dashboard session={session} />} />
            <Route path="/dashboard" element={<Dashboard session={session} />} />
            <Route path="/library" element={<Library session={session} />} />
            <Route path="/friends" element={<Friends session={session} />} />
            <Route path="/profile" element={<Profile session={session} />} />
            <Route path="/notifications" element={<Notifications session={session} />} />
            <Route path="/profile/:userId" element={<Profile session={session} />} />
            <Route path="/shared-lists" element={<SharedLists session={session} />} />
            <Route path="/shared-lists/:listId" element={<SharedListDetail session={session} />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;