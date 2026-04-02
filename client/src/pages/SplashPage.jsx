import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/onboarding', { replace: true }), 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--surface)',
      padding: 0,
      textAlign: 'center',
      gap: '0'
    }}>
      {/* Ambient glow behind logo */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-container)',
        opacity: 0.08,
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }} className="animate-fade-in">
        <div className="logo-ledger mb-6" style={{ margin: '0 auto 24px' }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '36px',
            color: 'var(--on-primary-container)'
          }}>scale</span>
        </div>

        <h1 className="font-headline" style={{
          fontSize: '2rem',
          color: 'var(--primary)',
          letterSpacing: '-0.03em',
          marginBottom: '8px'
        }}>Smart Food</h1>

        <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
          The Living Ledger
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: '48px' }}>
        <p className="text-label-sm opacity-40">Precision Nutrition</p>
      </div>
    </div>
  );
}
