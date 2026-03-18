import React, { useContext, useEffect, useState } from 'react';
import { PlanContext, UserContext } from '../App';
import WorkoutDetail from './WorkoutDetail';
import WeatherWidget from './WeatherWidget';

const Dashboard = () => {
    const { userProfile } = useContext(UserContext);
    const { trainingPlan } = useContext(PlanContext);

    const [currentWeek, setCurrentWeek] = useState(null);
    const [nextWorkout, setNextWorkout] = useState(null);
    const [daysUntilRace, setDaysUntilRace] = useState(0);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    useEffect(() => {
        if (!trainingPlan || !userProfile) return;

        // Calculate days until race
        const raceDate = new Date(userProfile.goal.raceDate);
        const today = new Date();
        const diffTime = Math.abs(raceDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilRace(diffDays);

        // Find current active week (simplistic version based on Date)
        // In a real app we'd compare dates exactly, for now we assume week 1 is active
        const week = trainingPlan.weeks[0]; // TODO: dynamic week calculation
        setCurrentWeek(week);

        // Find next uncompleted workout
        if (week) {
            const upcoming = week.workouts.find(w => !w.completed);
            setNextWorkout(upcoming);
        }

    }, [trainingPlan, userProfile]);

    if (!trainingPlan) return <div>Laden...</div>;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '80px' }}>
            
            {selectedWorkout && (
                <WorkoutDetail 
                    workout={selectedWorkout} 
                    onBack={() => setSelectedWorkout(null)} 
                />
            )}

            {/* Header / Countdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Welkom terug!</h2>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>
                        Nog {daysUntilRace} dagen
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Doel</div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {Math.floor(userProfile.goal.targetTimeMinutes / 60)}u {userProfile.goal.targetTimeMinutes % 60}m
                    </div>
                </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Next Workout Highlight */}
            <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                    Eerstvolgende Training
                </h3>
                {nextWorkout ? (
                    <div
                        className="glass-panel"
                        style={{
                            padding: 'var(--space-4)',
                            background: 'linear-gradient(135deg, var(--bg-surface-elevated), rgba(242,79,43,0.05))',
                            borderLeft: '4px solid var(--primary)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '4rem', opacity: 0.05 }}>🏃</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {new Date(nextWorkout.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{nextWorkout.type}</h2>

                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Afstand</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{nextWorkout.distanceKm} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>km</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Pace</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{nextWorkout.targetPace} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/km</span></div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>Coach:</strong> {nextWorkout.coachNote}
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setSelectedWorkout(nextWorkout)}>
                            Start Training
                        </button>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--success)' }}>
                        Je hebt alle trainingen van deze week afgerond! 🎉
                    </div>
                )}
            </div>

            {/* Current Week Overview */}
            {currentWeek && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                            Week {currentWeek.weekNumber} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>- {currentWeek.phase} Fase</span>
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                            {currentWeek.workouts.reduce((sum, w) => sum + (w.completed ? Number(w.distanceKm) : 0), 0).toFixed(1)} / {currentWeek.workouts.reduce((sum, w) => sum + Number(w.distanceKm), 0).toFixed(1)} km
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {currentWeek.workouts.map(workout => (
                            <div
                                key={workout.id}
                                className="glass-panel"
                                style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    opacity: workout.completed ? 0.6 : 1,
                                    borderLeft: workout.completed ? '3px solid var(--success)' : (workout.id === nextWorkout?.id ? '3px solid var(--primary)' : '3px solid transparent')
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{workout.type}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        {new Date(workout.date).toLocaleDateString('nl-NL', { weekday: 'short' })} • {workout.distanceKm} km @ {workout.targetPace}
                                    </div>
                                </div>
                                <div>
                                    {workout.completed ? (
                                        <span style={{ color: 'var(--success)', fontSize: '1.25rem' }}>✓</span>
                                    ) : (
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setSelectedWorkout(workout)}>Open</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
