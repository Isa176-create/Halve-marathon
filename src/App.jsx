import React, { useState, useEffect } from 'react';
import IntakeForm from './components/IntakeForm';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import { generateTrainingPlanWeek } from './utils/planGenerator';

// Context
export const UserContext = React.createContext();
export const PlanContext = React.createContext();

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [view, setView] = useState('welcome'); // welcome, intake, generating, dashboard
  const [generateError, setGenerateError] = useState(null);

  // Initial load
  useEffect(() => {
    const savedProfile = localStorage.getItem('marathon_coach_profile');
    const savedPlan = localStorage.getItem('marathon_coach_plan');

    if (savedProfile && savedPlan) {
      setUserProfile(JSON.parse(savedProfile));
      setTrainingPlan(JSON.parse(savedPlan));
      setView('dashboard');
    }
  }, []);

  const handleIntakeComplete = async () => {
    setView('generating');
    setGenerateError(null);

    try {
      const profileStr = localStorage.getItem('marathon_coach_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        // Genereer week 1 asynchrone AI call
        const plan = await generateTrainingPlanWeek(profile, 1, null);

        setTrainingPlan(plan);
        localStorage.setItem('marathon_coach_plan', JSON.stringify(plan));
        setView('dashboard');
      }
    } catch (err) {
      console.error(err);
      setGenerateError(err.message || 'Er is een fout opgetreden bij het verbinden met de API.');
      // Fallback: stay on generating view but show error, maybe a button to retry
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      <PlanContext.Provider value={{ trainingPlan, setTrainingPlan }}>
        <div className="page-container">
          {view === 'welcome' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <h1 className="title-gradient" style={{ marginBottom: '1rem' }}>
                Marathon Coach
              </h1>
              <p style={{ marginBottom: '2rem' }}>
                Jouw persoonlijke, slimme hardloopschema richting jouw doel.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setView('intake')}
              >
                Start Intake
              </button>
            </div>
          )}

          {view === 'intake' && (
            <IntakeForm onComplete={handleIntakeComplete} />
          )}

          {view === 'generating' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              {!generateError ? (
                  <>
                    <div className="pulse" style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'var(--primary)', marginBottom: '1rem' }}></div>
                    <h2 className="title-gradient">Schema berekenen...</h2>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 1rem' }}>
                      Je schema wordt razendsnel berekend via onze offline trainingslogica...
                    </p>
                  </>
              ) : (
                  <>
                    <h2 style={{ color: 'var(--danger)' }}>Fout bij genereren</h2>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 1rem' }}>
                      {generateError}
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => setView('intake')}>
                      Terug naar intake
                    </button>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleIntakeComplete}>
                      Probeer opnieuw
                    </button>
                  </>
              )}
            </div>
          )}

          {view === 'dashboard' && (
            <MainLayout />
          )}
        </div>
      </PlanContext.Provider>
    </UserContext.Provider>
  );
}

export default App;
