import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/auth.jsx';

const BUCKET = 'food-images';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, imageUrl } = location.state || {};

  const [foodName, setFoodName] = useState(result?.food?.name || '');
  const [weightDisplay, setWeightDisplay] = useState(result?.weight?.display || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const weightGrams = useMemo(() => {
    const match = weightDisplay.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g)/);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2];
    if (Number.isNaN(value)) return null;
    return unit === 'kg' ? Math.round(value * 1000) : Math.round(value);
  }, [weightDisplay]);

  /* Empty state */
  if (!result) {
    return (
      <div className="page" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: 'var(--surface)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-container-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--outline-variant)',
          marginBottom: '24px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>search_off</span>
        </div>
        <h3 style={{ marginBottom: '8px' }}>No analysis found</h3>
        <p className="text-on-surface-variant text-sm opacity-60 mb-6">Please initiate a scan to see results.</p>
        <button className="btn-primary" onClick={() => navigate('/scan')} style={{ maxWidth: '200px' }}>
          Go to Scan
        </button>
      </div>
    );
  }

  const uploadImage = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError('');
    if (!user) { setError('Please log in before submitting.'); return; }
    if (!foodName || !weightDisplay) { setError('Please verify food name and weight.'); return; }

    setSubmitting(true);
    try {
      const imagePublicUrl = await uploadImage();
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: user.id,
        food_name: foodName,
        weight_display: weightDisplay,
        weight_grams: weightGrams,
        image_url: imagePublicUrl
      });
      if (insertError) throw insertError;
      navigate('/data');
    } catch (err) {
      setError(err.message || 'Failed to save to Ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Header — glass, no border */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(249, 249, 254, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <button onClick={() => navigate('/scan')} style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--on-surface)',
          cursor: 'pointer',
          width: '44px',
          height: '44px'
        }}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="font-headline" style={{ fontSize: '1rem' }}>Verify Scan</span>
        <div style={{ width: '44px' }} />
      </header>

      {/* Image Preview */}
      <main style={{ paddingTop: '64px', paddingBottom: '40px' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Captured food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Confidence chip */}
          {result.confidence && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'var(--primary-container)',
              color: 'var(--on-primary-container)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-ambient)',
              letterSpacing: '0.02em'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
              {Math.round(result.confidence * 100)}% CONFIDENCE
            </div>
          )}
        </div>

        {/* Data Card — overlapping image */}
        <div style={{ padding: '0 16px' }}>
          <div className="card animate-fade-in" style={{ marginTop: '-40px', position: 'relative', zIndex: 1, padding: '32px 24px' }}>
            <p className="text-label-sm opacity-40 mb-6">IDENTIFIED DATA</p>

            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div>
                <label htmlFor="result-food">Food Item</label>
                <div className="input-container">
                  <input
                    id="result-food"
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    style={{ fontSize: '1.125rem', fontWeight: '700' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="result-weight">Weight Detected</label>
                <div className="input-container">
                  <input
                    id="result-weight"
                    type="text"
                    value={weightDisplay}
                    onChange={(e) => setWeightDisplay(e.target.value)}
                    style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary)' }}
                    required
                  />
                </div>
              </div>

              {/* Nutrition hint — tonal card, no borders */}
              {result.calories && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-xl)'
                }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-container-lowest)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      <span className="material-symbols-outlined">nutrition</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Estimated Calories</p>
                      <p className="text-xs opacity-60">~ {result.calories} kcal for this portion</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-2">
                <button className="btn-outline" type="button" onClick={() => navigate('/scan')} style={{ flex: 1 }}>
                  Retake
                </button>
                <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 2 }}>
                  {submitting ? 'Syncing...' : 'Log to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Error toast */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          right: '16px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'rgba(156, 65, 61, 0.08)',
          color: 'var(--tertiary)',
          boxShadow: 'var(--shadow-ambient)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}
    </div>
  );
}
