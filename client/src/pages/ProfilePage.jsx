import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabaseClient.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/auth?mode=login');
  };

  if (loading) {
    return (
      <div className="page" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--surface)'
      }}>
        <div className="logo-ledger mb-4">
          <span className="material-symbols-outlined animate-spin" style={{ color: 'var(--on-primary-container)' }}>sync</span>
        </div>
        <p className="text-on-surface-variant text-sm opacity-60">Loading Profile...</p>
      </div>
    );
  }

  const displayName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="page" style={{ paddingBottom: '120px', backgroundColor: 'var(--surface)' }}>
      {/* Header — tonal, no borders */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        backgroundColor: 'var(--surface)',
        zIndex: 50
      }}>
        <span className="font-headline" style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>Profile</span>
      </header>

      <main style={{ marginTop: '80px' }}>
        {/* Asymmetrical title — Spacing 10 left per DESIGN.md */}
        <section className="mb-8 ml-spacing-10">
          <p className="text-label-sm opacity-40 mb-1">ACCOUNT DETAILS</p>
          <h1 className="text-display-lg" style={{ fontSize: '2rem', lineHeight: '1.1', color: 'var(--on-surface)' }}>
            Settings
          </h1>
        </section>

        <section className="flex flex-col gap-6">
          <div className="card text-center" style={{ padding: '32px 24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-container)',
              color: 'var(--on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-headline)',
              margin: '0 auto 16px',
              boxShadow: 'var(--shadow-ambient)'
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-title-md" style={{ color: 'var(--on-surface)', marginBottom: '4px' }}>
              {displayName}
            </h2>
            <p className="text-sm opacity-60">
              {user?.email}
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <p className="text-label-sm opacity-40 mb-4">PREFERENCES</p>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-container-low)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-surface-variant)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications</span>
                </div>
                <span className="text-sm font-bold">Push Notifications</span>
              </div>
              <span className="text-xs opacity-60">Manage in Ledger</span>
            </div>
          </div>

          <button
            className="btn-outline"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: 'rgba(156, 65, 61, 0.08)',
              color: 'var(--tertiary)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
