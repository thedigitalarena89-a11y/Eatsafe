import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/auth.jsx';
import {
  clearCustom,
  clearDaily,
  ensureNotificationPermission,
  scheduleCustom,
  scheduleDaily,
  showNotification
} from '../lib/notifications.js';

const FILTERS = ['today', 'weekly', 'monthly'];

export default function DataPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('today');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [dailyTime, setDailyTime] = useState('20:00');
  const [dailyFoods, setDailyFoods] = useState([]);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');
  const [customMessage, setCustomMessage] = useState('Reminder to log your food weights.');
  const [customFoods, setCustomFoods] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editFood, setEditFood] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const startDate = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (filter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (filter === 'weekly') {
      start.setDate(start.getDate() - 7);
    } else {
      start.setMonth(start.getMonth() - 1);
    }
    return start;
  }, [filter]);

  const endDate = useMemo(() => {
    if (filter !== 'today') return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + 1);
    return end;
  }, [filter, startDate]);

  const foodOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((log) => { if (log.food_name) set.add(log.food_name); });
    return Array.from(set);
  }, [logs]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    let query = supabase.from('food_logs').select('*').eq('user_id', user.id).gte('created_at', startDate.toISOString()).order('created_at', { ascending: false });
    if (endDate) { query = query.lt('created_at', endDate.toISOString()); }
    const { data, error: fetchError } = await query;
    if (fetchError) { setError(fetchError.message); } else { setLogs(data || []); }
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const fetchReminders = async () => {
      if (!user) return;
      const { data, error: reminderError } = await supabase.from('reminders').select('*').eq('user_id', user.id);
      if (reminderError) { console.error(reminderError); return; }
      const daily = data.find((item) => item.type === 'daily');
      const custom = data.find((item) => item.type === 'custom');
      if (daily) { setDailyEnabled(daily.enabled); setDailyTime(daily.daily_time || '20:00'); setDailyFoods(daily.food_names || []); }
      if (custom) { setCustomEnabled(custom.enabled); setCustomDateTime(custom.custom_datetime || ''); setCustomMessage(custom.message || 'Reminder to log your food weights.'); setCustomFoods(custom.food_names || []); }
    };
    fetchReminders();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!dailyEnabled) { clearDaily(); return; }
    const [hour, minute] = dailyTime.split(':').map(Number);
    scheduleDaily({
      hour: hour || 20, minute: minute || 0,
      onFire: async () => {
        const { data } = await supabase.from('food_logs').select('*').eq('user_id', user.id).gte('created_at', startDate.toISOString());
        const message = buildDailySummary(data || [], dailyFoods);
        showNotification('Daily Summary', message);
      }
    });
  }, [dailyEnabled, dailyTime, user, startDate, dailyFoods]);

  useEffect(() => {
    if (!user) return;
    if (!customEnabled) { clearCustom(); return; }
    if (!customDateTime) return;
    scheduleCustom({
      date: new Date(customDateTime),
      onFire: () => {
        const suffix = customFoods.length ? ` for ${customFoods.join(', ')}` : '';
        showNotification('Custom Reminder', `${customMessage}${suffix}`);
      }
    });
  }, [customEnabled, customDateTime, customMessage, customFoods, user]);

  const buildDailySummary = (items, selectedFoods) => {
    if (!items || items.length === 0) return 'No food logged today.';
    const filtered = selectedFoods.length ? items.filter((item) => selectedFoods.includes(item.food_name)) : items;
    if (filtered.length === 0) return selectedFoods.length ? `No ${selectedFoods.join(', ')} logged today.` : 'No food logged today.';
    const totals = filtered.reduce((acc, item) => { const key = item.food_name || 'Unknown'; acc[key] = (acc[key] || 0) + (item.weight_grams || 0); return acc; }, {});
    const lines = Object.entries(totals).map(([food, grams]) => { if (!grams) return null; return `${(grams / 1000).toFixed(2)} kg ${food}`; }).filter(Boolean);
    return lines.length ? `Today you used ${lines.join(', ')}` : 'No food logged today.';
  };

  const parseWeightToGrams = (display) => {
    if (!display) return null;
    const match = display.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g)/);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2];
    if (Number.isNaN(value)) return null;
    return unit === 'kg' ? Math.round(value * 1000) : Math.round(value);
  };

  const upsertReminder = async (payload) => {
    if (!user) return;
    await supabase.from('reminders').upsert({ user_id: user.id, ...payload });
  };

  const handleDailyToggle = async (enabled) => {
    const allowed = enabled ? await ensureNotificationPermission() : true;
    if (!allowed) return;
    setDailyEnabled(enabled);
    await upsertReminder({ type: 'daily', enabled, daily_time: dailyTime, custom_datetime: null, message: null, food_names: dailyFoods.length ? dailyFoods : null });
  };

  const handleDailyTimeChange = async (value) => {
    setDailyTime(value);
    await upsertReminder({ type: 'daily', enabled: dailyEnabled, daily_time: value, custom_datetime: null, message: null, food_names: dailyFoods.length ? dailyFoods : null });
  };

  const handleCustomToggle = async (enabled) => {
    const allowed = enabled ? await ensureNotificationPermission() : true;
    if (!allowed) return;
    setCustomEnabled(enabled);
    await upsertReminder({ type: 'custom', enabled, daily_time: null, custom_datetime: customDateTime ? new Date(customDateTime).toISOString() : null, message: customMessage, food_names: customFoods.length ? customFoods : null });
  };

  const handleCustomDateChange = async (value) => {
    setCustomDateTime(value);
    await upsertReminder({ type: 'custom', enabled: customEnabled, daily_time: null, custom_datetime: value ? new Date(value).toISOString() : null, message: customMessage, food_names: customFoods.length ? customFoods : null });
  };

  const handleCustomMessageChange = async (value) => {
    setCustomMessage(value);
    await upsertReminder({ type: 'custom', enabled: customEnabled, daily_time: null, custom_datetime: customDateTime ? new Date(customDateTime).toISOString() : null, message: value, food_names: customFoods.length ? customFoods : null });
  };

  const handleEdit = (log) => { setEditingId(log.id); setEditFood(log.food_name || ''); setEditWeight(log.weight_display || ''); };
  const handleSave = async () => {
    if (!editingId) return;
    const wg = parseWeightToGrams(editWeight);
    const { error: updateError } = await supabase.from('food_logs').update({ food_name: editFood, weight_display: editWeight, weight_grams: wg }).eq('id', editingId);
    if (updateError) { setError(updateError.message); return; }
    setLogs((prev) => prev.map((log) => log.id === editingId ? { ...log, food_name: editFood, weight_display: editWeight, weight_grams: wg } : log));
    setEditingId(null); setEditFood(''); setEditWeight('');
    await fetchLogs();
  };
  const handleCancel = () => { setEditingId(null); setEditFood(''); setEditWeight(''); };
  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this log from history?')) return;
    const { error: deleteError } = await supabase.from('food_logs').delete().eq('id', logId);
    if (deleteError) { setError(deleteError.message); return; }
    setLogs((prev) => prev.filter((log) => log.id !== logId));
    await fetchLogs();
  };

  /* Custom toggle switch component */
  const Toggle = ({ enabled, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: enabled ? 'var(--primary)' : 'var(--surface-container-high)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        flexShrink: 0
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '3px',
        left: enabled ? '23px' : '3px',
        transition: 'left 0.3s ease',
        boxShadow: 'var(--shadow-ambient)'
      }} />
    </div>
  );

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
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--surface)',
        zIndex: 50
      }}>
        <div className="flex items-center gap-2">
          <div className="logo-ledger" style={{ width: '32px', height: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-primary-container)' }}>history</span>
          </div>
          <span className="font-headline" style={{ fontSize: '1rem', color: 'var(--primary)' }}>Ledger</span>
        </div>
        <div className="profile-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {user?.email?.split('@')[0].charAt(0).toUpperCase() || 'U'}
        </div>
      </header>

      <main style={{ marginTop: '80px' }}>
        {/* Reminders Section */}
        <section className="card mb-6" style={{ padding: '24px' }}>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>notifications_active</span>
            <p className="text-label-sm" style={{ fontWeight: '800' }}>REMINDERS</p>
          </div>

          <div className="flex flex-col gap-6">
            {/* Daily */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>Daily Summary</span>
                <Toggle enabled={dailyEnabled} onToggle={() => handleDailyToggle(!dailyEnabled)} />
              </div>
              <div className="input-container" style={{ opacity: dailyEnabled ? 1 : 0.4 }}>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => handleDailyTimeChange(e.target.value)}
                  disabled={!dailyEnabled}
                  style={{ fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Tonal separator — not a line, a background shift */}
            <div style={{ height: '2px', backgroundColor: 'var(--surface-container-low)', borderRadius: '1px' }} />

            {/* Custom */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>Custom Reminder</span>
                <Toggle enabled={customEnabled} onToggle={() => handleCustomToggle(!customEnabled)} />
              </div>
              <div className="flex flex-col gap-3" style={{ opacity: customEnabled ? 1 : 0.4 }}>
                <div className="input-container">
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    disabled={!customEnabled}
                    style={{ fontWeight: '600' }}
                  />
                </div>
                <div className="input-container">
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => handleCustomMessageChange(e.target.value)}
                    placeholder="Reminder message..."
                    disabled={!customEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Chips — selection chips per DESIGN.md */}
        <section>
          <div className="flex gap-2 mb-6">
            {FILTERS.map((option) => (
              <button
                key={option}
                className={`selection-chip ${filter === option ? 'active' : ''}`}
                onClick={() => setFilter(option)}
                style={{ flex: 1 }}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="flex flex-col gap-4">
            {loading && (
              <div className="text-center" style={{ padding: '64px 0' }}>
                <div className="logo-ledger mb-4" style={{ margin: '0 auto', width: '48px', height: '48px' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '22px', color: 'var(--on-primary-container)' }}>sync</span>
                </div>
                <p className="text-on-surface-variant text-sm opacity-60">Loading entries...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2" style={{
                padding: '14px 20px',
                backgroundColor: 'rgba(156, 65, 61, 0.08)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--tertiary)',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                {error}
              </div>
            )}

            {logs.map((log) => (
              <div className="card" key={log.id} style={{ padding: '16px' }}>
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--surface-container-low)',
                    flexShrink: 0
                  }}>
                    {log.image_url ? (
                      <img src={log.image_url} alt={log.food_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', color: 'var(--outline-variant)' }}>
                        <span className="material-symbols-outlined">image_not_supported</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === log.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="input-container" style={{ padding: '8px 12px' }}>
                          <input type="text" value={editFood} onChange={(e) => setEditFood(e.target.value)} style={{ fontWeight: '700', fontSize: '0.875rem' }} />
                        </div>
                        <div className="input-container" style={{ padding: '8px 12px' }}>
                          <input type="text" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ color: 'var(--primary)', fontSize: '0.875rem' }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-title-md" style={{ color: 'var(--on-surface)', marginBottom: '2px' }}>{log.food_name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>scale</span>
                          <span className="text-sm font-bold text-primary">{log.weight_display}</span>
                        </div>
                        <p className="text-xs opacity-40 mt-1">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 justify-end">
                  {editingId === log.id ? (
                    <>
                      <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.75rem' }} onClick={handleSave}>SAVE</button>
                      <button className="btn-outline" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.75rem' }} onClick={handleCancel}>CANCEL</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(log)} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface-container-low)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--on-surface-variant)',
                        cursor: 'pointer'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button onClick={() => handleDelete(log.id)} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'rgba(156, 65, 61, 0.06)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--tertiary)',
                        cursor: 'pointer'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && user && logs.length === 0 && (
              <div className="text-center" style={{ padding: '80px 32px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-container-low)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--outline-variant)',
                  margin: '0 auto 20px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>history</span>
                </div>
                <p className="text-label-sm opacity-40 mb-2">THE LEDGER IS EMPTY</p>
                <p className="text-xs opacity-40">Scan food items to populate your records.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
