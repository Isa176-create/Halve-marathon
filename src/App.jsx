import React, { useState, useEffect } from 'react';
import IntakeForm from './components/IntakeForm';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import { generateTrainingPlan } from './utils/planGenerator';

// Context
export const UserContext = React.createContext();
export const PlanContext = React.createContext();

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [view, setView] = useState('welcome'); // welcome, intake, generating, dashboard

  // Initial load
  useEffect(() => {
    const savedProfile = localStorage.getItem('amsterdam_coach_profile');
    const savedPlan = localStorage.getItem('amsterdam_coach_plan');

    if (savedProfile && savedPlan) {
      setUserProfile(JSON.parse(savedProfile));
      setTrainingPlan(JSON.parse(savedPlan));
      setView('dashboard');
    }
  }, []);

  const handleIntakeComplete = () => {
    setView('generating');

    // Simulate thinking time for effect
    setTimeout(() => {
      // UserProfile is already in Context & localStorage thanks to IntakeForm
      const profileStr = localStorage.getItem('amsterdam_coach_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        const plan = generateTrainingPlan(profile);

        setTrainingPlan(plan);
        localStorage.setItem('amsterdam_coach_plan', JSON.stringify(plan));

        setView('dashboard');
      }
    }, 2000);
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
              <div className="pulse" style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'var(--primary)', marginBottom: '1rem' }}></div>
              <h2 className="title-gradient">Schema berekenen...</h2>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Coach stelt jouw slimme pad richting je doel samen.</p>
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
