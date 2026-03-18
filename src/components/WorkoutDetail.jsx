import React, { useState, useContext } from 'react';
import { PlanContext } from '../App';

const WorkoutDetail = ({ workout, onBack }) => {
    const { trainingPlan, setTrainingPlan } = useContext(PlanContext);
    const [view, setView] = useState('detail'); // detail, feedback

    // Feedback state
    const [rpe, setRpe] = useState(5);
    const [feeling, setFeeling] = useState('good'); // good, heavy, pain
    const [actualKm, setActualKm] = useState(workout.distanceKm);
    const [durationMins, setDurationMins] = useState('');

    const handleCompleteClick = () => {
        setView('feedback');
    };

    const handleSaveFeedback = () => {
        // 1. Calculate actual pace if duration is provided
        let actualPaceStr = "N/A";
        if (durationMins > 0 && actualKm > 0) {
            const totalSeconds = durationMins * 60;
            const paceSeconds = totalSeconds / actualKm;
            const mins = Math.floor(paceSeconds / 60);
            const secs = Math.floor(paceSeconds % 60);
            actualPaceStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // 2. Clone plan to mutate
        const updatedPlan = JSON.parse(JSON.stringify(trainingPlan));

        // 3. Find and update workout
        let found = false;
        for (const week of updatedPlan.weeks) {
            for (const w of week.workouts) {
                if (w.id === workout.id) {
                    w.completed = true;
                    w.actualStats = { 
                        distance: actualKm, 
                        duration: durationMins, 
                        pace: actualPaceStr 
                    };
                    w.feedback = { rpe, feeling };
                    found = true;
                    break;
                }
            }
            if (found) break;
        }

        // 4. Adaptive Logic
        let alertMsg = "";
        if (rpe >= 9 || feeling === 'pain') {
            alertMsg = "⚠️ Coach Alert: Je hebt zware inspanning of pijn geregistreerd. We verlagen het volume van je volgende training lichtjes om overbelasting te voorkomen.";
            
            let adapted = false;
            for (const week of updatedPlan.weeks) {
                for (const w of week.workouts) {
                    if (!w.completed && w.id !== workout.id) {
                        w.distanceKm = (Number(w.distanceKm) * 0.8).toFixed(1);
                        w.coachNote = "AANGEPAST: Afstand verkort na je zware feedback van de vorige sessie. Focus op herstel.";
                        adapted = true;
                        break;
                    }
                }
                if (adapted) break;
            }
        } else if (rpe <= 3 && feeling === 'good' && actualKm >= workout.distanceKm) {
            alertMsg = "🔥 Lekker bezig! Dat ging je wel heel makkelijk af. De coach zal je volgende kwaliteitstraining een klein beetje uitdagender maken.";
            // Positive adaptation could go here (e.g. slight distance increase)
        }

        if (alertMsg) alert(alertMsg);

        // 5. Save and return
        setTrainingPlan(updatedPlan);
        localStorage.setItem('amsterdam_coach_plan', JSON.stringify(updatedPlan));
        onBack();
    };

    const isCompleted = workout.completed;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-color)', zIndex: 200, padding: 'var(--space-6)', overflowY: 'auto' }}>

            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '0.5rem' }}>←</span> Terug
            </button>

            {view === 'detail' && (
                <div className="fade-in">
                    <h3 style={{ color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
                        {new Date(workout.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h3>
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-6)' }}>{workout.type}</h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                        <div className="glass-panel" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Gepland</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>{workout.distanceKm} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>km</span></div>
                        </div>
                        <div className="glass-panel" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Doel Pace</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>{workout.targetPace} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/km</span></div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-8)', borderLeft: '4px solid var(--primary)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Coach Notitie</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{workout.coachNote}</p>
                    </div>

                    {!isCompleted ? (
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }} onClick={handleCompleteClick}>
                            Training Voltooid
                        </button>
                    ) : (
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
                            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>✓ Voltooid!</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Afstand</div>
                                    <div style={{ fontWeight: 600 }}>{workout.actualStats?.distance} km</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Tempo</div>
                                    <div style={{ fontWeight: 600 }}>{workout.actualStats?.pace} /km</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'feedback' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', gap: 'var(--space-6)' }}>
                    <div>
                        <h2 style={{ marginBottom: 'var(--space-1)' }}>Hoe ging het?</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Log je prestatie voor de coach.</p>
                    </div>

                    <div className="glass-panel" style={{ padding: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Echte km's</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={actualKm} 
                                onChange={(e) => setActualKm(e.target.value)}
                                style={{ padding: '0.75rem' }}
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Tijd (minuten)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                placeholder="bijv. 45"
                                value={durationMins} 
                                onChange={(e) => setDurationMins(e.target.value)}
                                style={{ padding: '0.75rem' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Gevoelszwaarte (RPE {rpe}/10)</span>
                            <span style={{ fontSize: '1.25rem' }}>
                                {rpe <= 2 ? '😌' : rpe <= 4 ? '🙂' : rpe <= 6 ? '😐' : rpe <= 8 ? '🥵' : '💀'}
                            </span>
                        </label>
                        <input type="range" min="1" max="10" value={rpe} onChange={(e) => setRpe(Number(e.target.value))} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            <span>Heel makkelijk</span>
                            <span>Maximaal</span>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ marginBottom: '1rem' }}>Lichamelijk gevoel</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                            <button
                                onClick={() => setFeeling('good')}
                                style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: feeling === 'good' ? '2px solid var(--success)' : '1px solid var(--glass-border)', backgroundColor: feeling === 'good' ? 'rgba(5, 150, 105, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>🚀</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Sterk & Goed</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ik vloog over het asfalt!</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setFeeling('heavy')}
                                style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: feeling === 'heavy' ? '2px solid var(--warning)' : '1px solid var(--glass-border)', backgroundColor: feeling === 'heavy' ? 'rgba(217, 119, 6, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>🪵</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Zware spieren</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ging moeizaam, maar wel volbracht.</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setFeeling('pain')}
                                style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: feeling === 'pain' ? '2px solid var(--danger)' : '1px solid var(--glass-border)', backgroundColor: feeling === 'pain' ? 'rgba(220, 38, 38, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Pijntjes / Blessure?</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Last van schenen, knie of iets anders.</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '1.25rem' }} onClick={handleSaveFeedback}>
                        Prestatie Opslaan
                    </button>
                </div>
            )}


        </div>
    );
};

export default WorkoutDetail;
