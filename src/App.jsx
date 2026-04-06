import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

const Welcome = lazy(() => import('./components/Welcome'));
const Login = lazy(() => import('./components/Login'));
const SignUp = lazy(() => import('./components/SignUp'));
const ConfirmEmail = lazy(() => import('./components/ConfirmEmail'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Library = lazy(() => import('./components/Library'));
const Friends = lazy(() => import('./components/Friends'));
const Profile = lazy(() => import('./components/Profile'));
const Notifications = lazy(() => import('./components/Notifications'));
const SharedLists = lazy(() => import('./components/SharedLists'));
const SharedListDetail = lazy(() => import('./components/SharedListDetail'));

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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public route for email confirmation - accessible regardless of auth state */}
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          
          {/* Unauthenticated routes */}
          <Route path="/" element={!session ? <Welcome /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
          
          {/* Authenticated routes */}
          <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
          <Route path="/library" element={session ? <Library session={session} /> : <Navigate to="/login" />} />
          <Route path="/friends" element={session ? <Friends session={session} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={session ? <Notifications session={session} /> : <Navigate to="/login" />} />
          <Route path="/profile/:userId" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
          <Route path="/shared-lists" element={session ? <SharedLists session={session} /> : <Navigate to="/login" />} />
          <Route path="/shared-lists/:listId" element={session ? <SharedListDetail session={session} /> : <Navigate to="/login" />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;