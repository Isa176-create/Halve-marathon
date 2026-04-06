import React, { useContext } from 'react';
import { PlanContext } from '../App';

const Schedule = () => {
    const { trainingPlan } = useContext(PlanContext);

    if (!trainingPlan) return <div>Laden...</div>;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '80px' }}>
            <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>
                Volledig Schema
            </h1>

            <p style={{ color: 'var(--text-secondary)' }}>
                Een overzicht van al je fasen en geplande trainingen richting jouw doel.
            </p>

            {trainingPlan.weeks.map(week => (
                <div key={week.weekNumber} style={{ marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                            Week {week.weekNumber} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>- {week.phase}</span>
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', backgroundColor: week.isDeload ? 'rgba(59, 130, 246, 0.2)' : 'transparent', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                            {week.isDeload && "Rustweek • "} {week.workouts.length} dagen • {week.workouts.reduce((sum, w) => sum + Number(w.distanceKm), 0).toFixed(1)} km
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {week.workouts.map(workout => (
                            <div
                                key={workout.id}
                                className="glass-panel"
                                style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderLeft: '3px solid transparent'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{workout.type}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        {new Date(workout.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} • {workout.distanceKm} km
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Schedule;
