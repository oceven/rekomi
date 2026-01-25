import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await loginUser(email, password);

    if (error) {
      setMessage(`❌ ${error}`);
    } else {
      setMessage('✅ Logged in successfully!');
      // Redirect to dashboard after successful login
      setTimeout(() => navigate('/dashboard'), 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Sign Up Link */}
      <p className="mt-6 text-slate-400 text-sm">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/signup')}
          className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;