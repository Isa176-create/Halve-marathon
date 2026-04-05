import React, { useContext, useState } from 'react';
import { PlanContext, UserContext } from '../App';
import { generateTrainingPlanWeek } from '../utils/planGenerator';

const Profile = () => {
    const { userProfile, setUserProfile } = useContext(UserContext);
    const { trainingPlan, setTrainingPlan } = useContext(PlanContext);
    const [resetting, setResetting] = useState(false);
    const [updating, setUpdating] = useState(false);

    if (!userProfile) return null;

    const handleReset = () => {
        if (confirm("Weet je zeker dat je je hele schema wilt wissen en opnieuw wilt beginnen?")) {
            setResetting(true);
            localStorage.removeItem('marathon_coach_profile');
            localStorage.removeItem('marathon_coach_plan');
            window.location.reload();
        }
    };

    const handleRegeneratePlan = async () => {
        setUpdating(true);
        try {
            const newPlan = await generateTrainingPlanWeek(userProfile, 1, null);
            setTrainingPlan(newPlan);
            localStorage.setItem('marathon_coach_plan', JSON.stringify(newPlan));
            setUpdating(false);
            alert("Je eerste AI-week is succesvol met de nieuwe coach-instructies gegenereerd!");
        } catch (e) {
            console.error(e);
            alert("Fout bij genereren: " + e.message);
            setUpdating(false);
        }
    };

    const getCompletedCount = () => {
        if (!trainingPlan) return 0;
        let count = 0;
        trainingPlan.weeks.forEach(w => {
            w.workouts.forEach(wo => {
                if (wo.completed) count++;
            });
        });
        return count;
    };

    const getTotalRuns = () => {
        if (!trainingPlan) return 0;
        let count = 0;
        trainingPlan.weeks.forEach(w => {
            count += w.workouts.length;
        });
        return count;
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '80px' }}>
            <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>
                Jouw Profiel
            </h1>

            <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Fysiek & Status</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Huidig Gewicht</span>
                    <span style={{ fontWeight: 600 }}>{userProfile.physical.weight} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Leeftijd</span>
                    <span style={{ fontWeight: 600 }}>{userProfile.physical.age} jaar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Voortgang</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{getCompletedCount()} / {getTotalRuns()} runs voltooid</span>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Jouw Doel</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Wedstrijd</span>
                    <span style={{ fontWeight: 600 }}>{userProfile.goal.raceName || 'Mijn Wedstrijd'} ({userProfile.goal.raceDistance} km)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Datum</span>
                    <span style={{ fontWeight: 600 }}>{userProfile.goal.raceDate ? new Date(userProfile.goal.raceDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '18 okt 2026'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Doeltijd</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                        {Math.floor(userProfile.goal.targetTimeMinutes / 60)}:{userProfile.goal.targetTimeMinutes % 60 === 0 ? '00' : userProfile.goal.targetTimeMinutes % 60} uur
                    </span>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleRegeneratePlan}
                    disabled={updating}
                >
                    {updating ? 'Bezig...' : 'Schema Actualiseren'}
                </button>
                
                <button
                    className="btn"
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', width: '100%', fontSize: '0.9rem' }}
                    onClick={handleReset}
                    disabled={resetting}
                >
                    {resetting ? 'Wissen...' : 'Schema & Profiel Verwijderen'}
                </button>
            </div>
        </div>
    );
};

export default Profile;
