import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabaseClient.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setDataLoading(true);
      
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setLogs(data);
      }
      setDataLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const displayName = user?.email?.split('@')[0] || 'there';

  // Derived statistics
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    let sumTodayGrams = 0;
    const foodCountsWeek = {};
    let topFoodCount = 0;
    let topFoodName = 'None';

    const lastScanned = logs.length > 0 ? logs[0] : null;

    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      
      // Today aggregation
      if (logDate >= todayStart) {
        sumTodayGrams += (log.weight_grams || 0);
      }

      // Week aggregation (Top Food)
      if (logDate >= weekStart && log.food_name) {
        foodCountsWeek[log.food_name] = (foodCountsWeek[log.food_name] || 0) + 1;
        if (foodCountsWeek[log.food_name] > topFoodCount) {
          topFoodCount = foodCountsWeek[log.food_name];
          topFoodName = log.food_name;
        }
      }
    });

    const sumTodayKg = sumTodayGrams / 1000;
    // Assume daily goal is 3kg (3000g)
    let progressRatio = sumTodayKg / 3.0;
    if (progressRatio > 1) progressRatio = 1;
    if (progressRatio < 0) progressRatio = 0;

    return {
      sumTodayKg,
      progressRatio,
      lastScanned,
      topFoodName,
      topFoodCount
    };
  }, [logs]);

  if (authLoading || dataLoading) {
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
        <p className="text-on-surface-variant text-sm opacity-60">Syncing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: '120px', backgroundColor: 'var(--surface)' }}>
      {/* Header — tonal gradient, no borders */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--surface)',
        zIndex: 50
      }}>
        <div className="flex items-center gap-2">
          <div className="logo-ledger" style={{ width: '32px', height: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-primary-container)' }}>scale</span>
          </div>
          <span className="font-headline" style={{ fontSize: '1rem', color: 'var(--primary)' }}>Smart Food</span>
        </div>
        <div className="profile-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ marginTop: '80px' }}>
        {/* Asymmetrical title — Spacing 10 left per DESIGN.md */}
        <section className="mb-8 ml-spacing-10">
          <p className="text-label-sm opacity-40 mb-1">Welcome back</p>
          <h1 style={{ fontSize: '2rem', lineHeight: '1.1', color: 'var(--on-surface)' }}>
            Hello, {displayName}
          </h1>
        </section>

        {/* Bento Grid Dashboard */}
        <div className="bento-grid">
          {/* Card 1: Weight Arc — Full Width Hero */}
          <div className="card bento-full" style={{
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
              <p className="text-label-sm mb-4 opacity-60">TODAY'S PROGRESS</p>

              {/* Weight Arc — SVG Semi-circle Gauge */}
              <div className="weight-arc-container">
                <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%' }}>
                  {/* Background arc — secondary */}
                  <path
                    d="M 20,100 A 80,80 0 0,1 180,100"
                    fill="none"
                    stroke="var(--secondary-container)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    opacity="0.15"
                  />
                  {/* Progress arc — primary */}
                  <path
                    d="M 20,100 A 80,80 0 0,1 180,100"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset={251 * (1 - stats.progressRatio)}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                {/* Center Value */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center'
                }}>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-headline" style={{ fontSize: '2.5rem', color: 'var(--on-surface)' }}>
                      {stats.sumTodayKg.toFixed(1)}
                    </span>
                    <span className="text-label-sm text-primary">KG</span>
                  </div>
                </div>
              </div>

              <p className="text-label-sm mt-4 opacity-40">{Math.round(stats.progressRatio * 100)}% OF DAILY GOAL</p>
            </div>
            {/* Ambient glow */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: 'rgba(32, 201, 61, 0.04)',
              filter: 'blur(50px)'
            }} />
          </div>

          {/* Card 2: Last Scanned */}
          <div className="card" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div style={{
                  padding: '8px',
                  backgroundColor: 'rgba(76, 74, 202, 0.08)',
                  color: 'var(--secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>barcode_scanner</span>
                </div>
                <span className="text-label-sm opacity-40">
                  {stats.lastScanned 
                    ? new Date(stats.lastScanned.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'
                  }
                </span>
              </div>
              <p className="text-label-sm opacity-40 mb-1">LAST SCANNED</p>
              <h3 className="text-title-md line-clamp-1" style={{ color: 'var(--on-surface)' }}>
                {stats.lastScanned ? stats.lastScanned.food_name : 'No items yet'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              {stats.lastScanned ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>scale</span>
                  <span>{stats.lastScanned.weight_display}</span>
                </>
              ) : (
                <span>- -</span>
              )}
            </div>
          </div>

          {/* Card 3: Top Food */}
          <div className="card" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div style={{
                  padding: '8px',
                  backgroundColor: 'rgba(0, 110, 26, 0.08)',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>star</span>
                </div>
                <span className="text-label-sm opacity-40">THIS WEEK</span>
              </div>
              <p className="text-label-sm opacity-40 mb-1">TOP FOOD ITEM</p>
              <h3 className="text-title-md line-clamp-1" style={{ color: 'var(--on-surface)' }}>
                {stats.topFoodName}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--secondary)' }}>
              {stats.topFoodCount > 0 ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
                  <span>{stats.topFoodCount} entries</span>
                </>
              ) : (
                <span>- -</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
