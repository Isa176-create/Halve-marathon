import React, { useState, useEffect } from 'react';
import {
  getStravaAuthUrl,
  exchangeCodeForToken,
  saveStravaSession,
  loadStravaSession,
  clearStravaSession,
  fetchRecentRuns,
} from '../utils/strava';
import RunCharts from './RunCharts';

const StravaConnect = () => {
  const [session, setSession] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Bij laden: controleer of er al een sessie is OF een OAuth callback code in de URL
  useEffect(() => {
    const existingSession = loadStravaSession();
    if (existingSession) {
      setSession(existingSession);
      loadRuns();
      return;
    }

    // Kijk of Strava ons heeft teruggestuurd met een code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const scope = params.get('scope');
    const error = params.get('error');

    if (error) {
      setError('Strava koppeling geannuleerd.');
      // Verwijder parameters uit de URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code && scope?.includes('activity')) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    setLoading(true);
    setError(null);
    // Verwijder de code uit de URL (netjes)
    window.history.replaceState({}, '', window.location.pathname);

    try {
      const tokenData = await exchangeCodeForToken(code);
      saveStravaSession(tokenData);
      setSession(tokenData);
      await loadRuns(tokenData.access_token);
    } catch (err) {
      setError('Koppeling mislukt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRuns = async () => {
    try {
      const recentRuns = await fetchRecentRuns(15);
      setRuns(recentRuns);
    } catch (err) {
      console.error('Kon runs niet laden:', err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await loadRuns();
    } catch (err) {
      setError('Synchronisatie mislukt: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Wil je de Strava koppeling verwijderen?')) {
      clearStravaSession();
      setSession(null);
      setRuns([]);
    }
  };

  const handleConnect = () => {
    window.location.href = getStravaAuthUrl();
  };

  // --- Niet verbonden ---
  if (!session && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '80px' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>Strava</h1>

        <div
          className="glass-panel"
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(252,76,2,0.1), rgba(242,79,43,0.05))',
            borderColor: 'rgba(252,76,2,0.3)',
          }}
        >
          {/* Strava logo */}
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏃</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Verbind met Strava</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Koppel je Strava account en zie je trainingen direct in de app.
            Je schema wordt automatisch bijgehouden op basis van je echte activiteiten.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              color: '#f87171',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <button
            id="strava-connect-btn"
            className="btn btn-primary"
            style={{
              width: '100%',
              backgroundColor: '#FC4C02',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              padding: '1rem',
            }}
            onClick={handleConnect}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Verbind met Strava
          </button>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Wat kun je verwachten?</h3>
          {[
            { icon: '📊', text: 'Je laatste 15 runs worden ingeladen' },
            { icon: '✅', text: 'Voltooide trainingen worden automatisch gemarkeerd' },
            { icon: '🔒', text: 'Je wachtwoord wordt nooit gedeeld met deze app' },
            { icon: '🔗', text: 'Je kunt de koppeling altijd verbreken' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Laden (OAuth bezig) ---
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div className="pulse" style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#FC4C02' }}></div>
        <h2 className="title-gradient">Verbinden met Strava...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Even geduld</p>
      </div>
    );
  }

  // --- Verbonden ---
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>Strava</h1>
        <button
          id="strava-sync-btn"
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '⟳ Bezig...' : '⟳ Sync'}
        </button>
      </div>

      {/* Atleet info */}
      {session?.athlete && (
        <div
          className="glass-panel"
          style={{
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'linear-gradient(135deg, rgba(252,76,2,0.1), transparent)',
            borderColor: 'rgba(252,76,2,0.3)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>
              {session.athlete.firstname} {session.athlete.lastname}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#FC4C02' }}>
              Verbonden met Strava
            </div>
          </div>
          <button
            id="strava-disconnect-btn"
            onClick={handleDisconnect}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.25rem 0.5rem',
            }}
          >
            Loskoppelen
          </button>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          color: '#f87171',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* Grafieken */}
      {runs.length >= 2 && <RunCharts runs={runs} />}

      {/* Recente runs */}
      <div>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Recente Trainingen ({runs.length})
        </h3>

        {runs.length === 0 ? (
          <div className="glass-panel" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Geen runs gevonden. Heb je al activiteiten in Strava?
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {runs.map((run) => (
              <a
                key={run.id}
                href={run.stravaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="glass-panel"
                  style={{
                    padding: '1rem',
                    borderLeft: '3px solid #FC4C02',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{run.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {new Date(run.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Afstand</div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{run.distanceKm} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>km</span></div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Pace</div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{run.pacePerKm} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/km</span></div>
                      </div>
                    </div>
                  </div>
                  {run.averageHeartRate && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      ❤️ gem. {Math.round(run.averageHeartRate)} bpm &nbsp;·&nbsp; ⛰️ {run.elevationGain}m stijging
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StravaConnect;
