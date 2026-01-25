import { useState } from 'react';
import { signUpUser } from '../services/authService';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        // Call the sign-up service
        const { data, error } = await signUpUser(email, password, username);
        // Handle response
        if (error) {
            setMessage(`❌ Error: ${error}`);
        } else {
            setMessage('✅ Success! ');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Join reko<span className="underline decoration-blue-500 underline-offset-4">mi</span>
            </h2>

            <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                    <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none  placeholder:text-slate-600"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none  placeholder:text-slate-600"
                        placeholder="name@email.com"
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
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>

            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default SignUp;