// utils/strava.js
// Strava API hulpfuncties voor de Amsterdam Marathon Coach app

const STRAVA_CLIENT_ID = '219629'; // Public - veilig om te hardcoden (staat sowieso zichtbaar in de OAuth URL)
const STORAGE_KEY = 'amsterdam_coach_strava';

// Bouw de Strava OAuth redirect URL
export function getStravaAuthUrl() {
  const redirectUri = `${window.location.origin}/`;
  const scope = 'activity:read_all';
  return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&approval_prompt=auto`;
}

// Sla Strava-sessie op in localStorage
export function saveStravaSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Laad Strava-sessie uit localStorage
export function loadStravaSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Verwijder Strava-sessie
export function clearStravaSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// Controleer of het token nog geldig is (met 5 minuten buffer)
export function isTokenValid(session) {
  if (!session?.expires_at) return false;
  return session.expires_at > Date.now() / 1000 + 300;
}

// Vernieuw het access token via onze serverless function
export async function refreshAccessToken(refreshToken) {
  const response = await fetch('/api/strava/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) throw new Error('Token refresh mislukt');
  return response.json();
}

// Wissel de OAuth code in voor een access token (via serverless function)
export async function exchangeCodeForToken(code) {
  const response = await fetch('/api/strava/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Token exchange mislukt');
  }
  return response.json();
}

// Haal een geldig access token op (vernieuwt automatisch als verlopen)
export async function getValidAccessToken() {
  let session = loadStravaSession();
  if (!session) throw new Error('Niet verbonden met Strava');

  if (!isTokenValid(session)) {
    // Token verlopen: vernieuwen
    const newTokenData = await refreshAccessToken(session.refresh_token);
    session = { ...session, ...newTokenData };
    saveStravaSession(session);
  }

  return session.access_token;
}

// Haal de meest recente hardloopactiviteiten op van Strava
export async function fetchRecentRuns(perPage = 10) {
  const token = await getValidAccessToken();

  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&type=Run`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) throw new Error('Kon activiteiten niet ophalen');
  const activities = await response.json();

  // Filter alleen hardloopactiviteiten en maak ze netjes
  return activities
    .filter((a) => a.type === 'Run' || a.sport_type === 'Run')
    .map((a) => ({
      id: a.id,
      name: a.name,
      date: a.start_date_local,
      distanceKm: (a.distance / 1000).toFixed(2),
      durationMinutes: Math.round(a.moving_time / 60),
      pacePerKm: formatPace(a.moving_time, a.distance),
      averageHeartRate: a.average_heartrate || null,
      elevationGain: a.total_elevation_gain,
      stravaUrl: `https://www.strava.com/activities/${a.id}`,
    }));
}

// Helper: pace formatteren als mm:ss/km
function formatPace(movingTimeSeconds, distanceMeters) {
  if (!distanceMeters) return '—';
  const paceSeconds = (movingTimeSeconds / distanceMeters) * 1000;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
