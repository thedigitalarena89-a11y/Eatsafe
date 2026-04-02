let dailyTimeout = null;
let dailyInterval = null;
let customTimeout = null;

export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body });
}

export function scheduleDaily({ hour, minute, onFire }) {
  clearDaily();

  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next.getTime() - now.getTime();
  dailyTimeout = setTimeout(async () => {
    await onFire();
    dailyInterval = setInterval(onFire, 24 * 60 * 60 * 1000);
  }, delay);
}

export function clearDaily() {
  if (dailyTimeout) clearTimeout(dailyTimeout);
  if (dailyInterval) clearInterval(dailyInterval);
  dailyTimeout = null;
  dailyInterval = null;
}

export function scheduleCustom({ date, onFire }) {
  clearCustom();
  const now = new Date();
  if (date <= now) return;
  const delay = date.getTime() - now.getTime();
  customTimeout = setTimeout(onFire, delay);
}

export function clearCustom() {
  if (customTimeout) clearTimeout(customTimeout);
  customTimeout = null;
}
