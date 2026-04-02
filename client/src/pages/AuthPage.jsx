import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/auth.jsx';

export default function AuthPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode') || 'login';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    const redirectTo = import.meta.env.VITE_REDIRECT_URL || window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      justifyContent: 'center',
      backgroundColor: 'var(--surface)',
      padding: '24px'
    }}>
      <main className="animate-fade-in" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px' }}>
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="logo-ledger mb-4" style={{ margin: '0 auto', width: '64px', height: '64px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--on-primary-container)' }}>scale</span>
            </div>
            <h1 className="font-headline" style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '4px' }}>
              Smart Food
            </h1>
            <p className="text-on-surface-variant text-sm opacity-60">
              {mode === 'register' ? 'Create your Living Ledger' : 'Welcome back to your Ledger'}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            className="btn-outline mb-6"
            onClick={handleGoogle}
            style={{ gap: '12px' }}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
            <span style={{ fontWeight: '600' }}>Continue with Google</span>
          </button>

          {/* Divider — No lines, just tonal text */}
          <div className="text-center mb-6">
            <span className="text-label-sm opacity-40">OR CONTINUE WITH EMAIL</span>
          </div>

          {/* Email Form */}
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
            <div>
              <label htmlFor="auth-email">Email Address</label>
              <div className="input-container">
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="auth-password">Password</label>
                {mode === 'login' && (
                  <a href="#" className="text-label-sm" style={{
                    color: 'var(--secondary)',
                    textDecoration: 'none',
                    marginBottom: '4px',
                    marginRight: '16px'
                  }}>Forgot?</a>
                )}
              </div>
              <div className="input-container">
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn-primary mt-2" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Error Toast */}
          {error && (
            <div className="flex items-center gap-2 mt-4" style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(156, 65, 61, 0.08)',
              borderRadius: 'var(--radius-xl)',
              color: 'var(--tertiary)',
              fontSize: '0.75rem'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch */}
          <div className="text-center mt-6">
            <p className="text-sm text-on-surface-variant">
              {mode === 'register' ? 'Already have an account?' : 'New to Smart Food?'}{' '}
              <span
                className="text-primary font-bold"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/auth?mode=${mode === 'register' ? 'login' : 'register'}`)}
              >
                {mode === 'register' ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center" style={{ padding: '16px', opacity: 0.4 }}>
        <p className="text-label-sm">© 2026 Smart Food Weight Tracker</p>
      </footer>
    </div>
  );
}
