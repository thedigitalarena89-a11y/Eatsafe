import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/auth.jsx';
import {
  clearDaily,
  clearCustom,
  scheduleDaily,
  scheduleCustom,
  showNotification
} from '../lib/notifications.js';

/**
 * Global component that manages the persistent background timers for reminders.
 * It stays mounted even when navigating between pages.
 */
export default function ReminderManager() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState(null);
  const [customData, setCustomData] = useState(null);

  // 1. Fetch current reminder settings on mount/auth
  useEffect(() => {
    const fetchReminders = async () => {
      if (!user) {
        clearDaily();
        clearCustom();
        return;
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching reminders:', error);
        return;
      }

      const daily = data.find((item) => item.type === 'daily');
      const custom = data.find((item) => item.type === 'custom');

      setDailyData(daily || null);
      setCustomData(custom || null);
    };

    fetchReminders();

    // Set up a real-time subscription to update reminders immediately when changed in DataPage
    const channel = supabase
      .channel('reminder-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user?.id}` },
        () => fetchReminders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. Schedule Daily Summary
  useEffect(() => {
    if (!user || !dailyData || !dailyData.enabled) {
      clearDaily();
      return;
    }

    const [hour, minute] = (dailyData.daily_time || '20:00').split(':').map(Number);
    
    scheduleDaily({
      hour: hour || 20,
      minute: minute || 0,
      onFire: async () => {
        // Fetch logs for the current local day to build summary
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString());

        const message = buildDailySummary(data || [], dailyData.food_names || []);
        showNotification('Daily Summary', message);
      }
    });
  }, [user, dailyData]);

  // 3. Schedule Custom Reminder
  useEffect(() => {
    if (!user || !customData || !customData.enabled || !customData.custom_datetime) {
      clearCustom();
      return;
    }

    scheduleCustom({
      date: new Date(customData.custom_datetime),
      onFire: () => {
        const foodList = customData.food_names || [];
        const suffix = foodList.length ? ` for ${foodList.join(', ')}` : '';
        showNotification('Custom Reminder', `${customData.message || 'Time to log your food!'}${suffix}`);
      }
    });
  }, [user, customData]);

  // Helper moved from DataPage
  const buildDailySummary = (items, selectedFoods) => {
    if (!items || items.length === 0) return 'No food logged today.';
    const filtered = selectedFoods.length ? items.filter((item) => selectedFoods.includes(item.food_name)) : items;
    if (filtered.length === 0) return selectedFoods.length ? `No ${selectedFoods.join(', ')} logged today.` : 'No food logged today.';
    
    const totals = filtered.reduce((acc, item) => {
      const key = item.food_name || 'Unknown';
      acc[key] = (acc[key] || 0) + (item.weight_grams || 0);
      return acc;
    }, {});

    const lines = Object.entries(totals)
      .map(([food, grams]) => {
        if (!grams) return null;
        return `${(grams / 1000).toFixed(2)}kg ${food}`;
      })
      .filter(Boolean);

    return lines.length ? `Today you used ${lines.join(', ')}` : 'No food logged today.';
  };

  return null; // Side-effect only component
}
