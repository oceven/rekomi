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
          {/* Public route for email confirmation */}
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          
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
      </Suspense>
    </Router>
  );
}

export default App;