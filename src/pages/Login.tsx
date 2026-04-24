import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [initForm, setInitForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [initError, setInitError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      const data = await response.json();
      setIsInitialized(data.initialized);
    } catch (err) {
      console.error('Failed to check setup status', err);
      setIsInitialized(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user info in session and navigate
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitError(null);

    if (initForm.password !== initForm.confirmPassword) {
      setInitError('Passwords do not match');
      return;
    }

    if (initForm.password.length < 6) {
      setInitError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/setup/init-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: initForm.name,
          email: initForm.email,
          password: initForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Initialization failed');
      }

      setIsInitialized(true);
      setEmail(initForm.email);
      setPassword(initForm.password);
    } catch (err) {
      setInitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isInitialized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white mx-auto mb-4">
            O
          </div>
          <h1 className="text-3xl font-bold text-white">OmniBase</h1>
          <p className="text-gray-400 mt-2">Enterprise Knowledge Management</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          {!isInitialized ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Initialize Admin Account</h2>
              
              {initError && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{initError}</div>
                </div>
              )}

              <form onSubmit={handleInitialize} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={initForm.name}
                    onChange={(e) => setInitForm({ ...initForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={initForm.email}
                    onChange={(e) => setInitForm({ ...initForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="admin@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={initForm.password}
                    onChange={(e) => setInitForm({ ...initForm, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={initForm.confirmPassword}
                    onChange={(e) => setInitForm({ ...initForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Create Admin Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-gray-400 text-sm">
                This is the first-time setup. Create an admin account to proceed.
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-gray-400 text-sm">
                Secure authentication with session management
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-xs">
          <p>Enterprise Knowledge Management System</p>
          <p className="mt-1">© 2026 OmniBase. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
