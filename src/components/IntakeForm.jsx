import React, { useState, useContext } from 'react';
import { UserContext } from '../App';

const IntakeForm = ({ onComplete }) => {
    const { setUserProfile } = useContext(UserContext);
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Physical
        height: '',
        weight: '',
        age: '',
        gender: 'onbekend',

        // Step 2: Level
        runsPerWeek: '',
        weeklyKm: '',
        longestRunEver: '',
        recentMaxRun: '',
        avgPaceMin: '',
        avgPaceSec: '00',

        // Step 3: Goal
        raceName: '',
        raceDistance: '21.1',
        raceDate: '2026-10-18',
        targetTimeHour: 2,
        targetTimeMin: 0,

        // Step 4: Schedule
        targetDaysPerWeek: 3,
        maxTimePerDay: 60,
        preferredDays: {
            1: true, // Mon
            2: false, // Tue
            3: true,  // Wed
            4: false, // Thu
            5: false, // Fri
            6: true,  // Sat
            0: false, // Sun
        },
        trainingStyle: 'balanced',
        specialRequest: '',

        // Step 5: Medical
        injuries: false,
        injuryDetails: '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDayChange = (day) => {
        setFormData(prev => ({
            ...prev,
            preferredDays: {
                ...prev.preferredDays,
                [day]: !prev.preferredDays[day]
            }
        }));
    };

    const nextStep = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const submitForm = () => {
        const profile = {
            physical: {
                height: Number(formData.height),
                weight: Number(formData.weight),
                age: Number(formData.age),
                gender: formData.gender,
                weightHistory: [{ date: new Date().toISOString(), weight: Number(formData.weight) }]
            },
            currentLevel: {
                runsPerWeek: Number(formData.runsPerWeek),
                weeklyKm: Number(formData.weeklyKm),
                longestRunEver: Number(formData.longestRunEver),   // Ooit gelopen
                longestRun: Number(formData.recentMaxRun),         // Afgelopen 4 weken (zwaarder gewogen)
                recentMaxRun: Number(formData.recentMaxRun),       // Zelfde, voor duidelijkheid in generator
                avgPaceSeconds: Number(formData.avgPaceMin) * 60 + Number(formData.avgPaceSec),
                recentRace: formData.recentRace,
            },
            goal: {
                raceName: formData.raceName || 'Mijn Wedstrijd',
                raceDistance: Number(formData.raceDistance),
                raceDate: new Date(formData.raceDate).toISOString(),
                targetTimeMinutes: Number(formData.targetTimeHour) * 60 + Number(formData.targetTimeMin),
            },
            preferences: {
                trainDays: Number(formData.targetDaysPerWeek),
                maxTimePerDay: Number(formData.maxTimePerDay),
                preferredDays: Object.keys(formData.preferredDays).filter(d => formData.preferredDays[d]).map(Number),
                style: formData.trainingStyle,
                specialRequest: formData.specialRequest,
            },
            medical: {
                injuries: formData.injuries,
                injuryDetails: formData.injuryDetails
            }
        };

        localStorage.setItem('marathon_coach_profile', JSON.stringify(profile));
        setUserProfile(profile);
        onComplete();
    };

    return (
        <div className="glass-panel" style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="title-gradient">Stap {step} van {totalSteps}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {step === 1 && "Fysieke Basis"}
                    {step === 2 && "Huidig Niveau"}
                    {step === 3 && "Het Doel"}
                    {step === 4 && "Agenda & Voorkeur"}
                    {step === 5 && "Veiligheid"}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem' }}>

                {/* STEP 1: PHYSICAL */}
                {step === 1 && (
                    <div className="fade-in">
                        <div className="input-group">
                            <label className="input-label">Lengte (cm)</label>
                            <input type="number" name="height" className="input-field" value={formData.height} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Gewicht (kg)</label>
                            <input type="number" name="weight" className="input-field" value={formData.weight} onChange={handleChange} step="0.1" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Leeftijd</label>
                            <input type="number" name="age" className="input-field" value={formData.age} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Geslacht (Optioneel)</label>
                            <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
                                <option value="onbekend">Zeg ik liever niet</option>
                                <option value="man">Man</option>
                                <option value="vrouw">Vrouw</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 2: LEVEL */}
                {step === 2 && (
                    <div className="fade-in">
                        <div className="input-group">
                            <label className="input-label">Gemiddeld km per week (afgelopen 4 weken) *</label>
                            <input
                                type="number"
                                name="weeklyKm"
                                className="input-field"
                                value={formData.weeklyKm}
                                onChange={handleChange}
                                placeholder="bijv. 15"
                                min="0"
                                max="150"
                            />
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Dit is de belangrijkste waarde voor je schema.</small>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Aantal runs per week (afgelopen 4 weken) *</label>
                            <input type="number" name="runsPerWeek" className="input-field" value={formData.runsPerWeek} onChange={handleChange} min="0" max="7" placeholder="bijv. 3" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Langste run afgelopen 4 weken (km) *</label>
                            <input type="number" name="recentMaxRun" className="input-field" value={formData.recentMaxRun} onChange={handleChange} step="0.5" placeholder="bijv. 8" />
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>⚠️ Dit bepaalt waar je langste duurloop in week 1 begint.</small>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Langste run ooit (km)</label>
                            <input type="number" name="longestRunEver" className="input-field" value={formData.longestRunEver} onChange={handleChange} step="0.5" placeholder="bijv. 12 (optioneel)" />
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Minder belangrijk — de recente afstand weegt zwaarder.</small>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Comfortabel hardlooptempo (min : sec per km) *</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input type="number" name="avgPaceMin" className="input-field" value={formData.avgPaceMin} onChange={handleChange} min="3" max="15" style={{ flex: 1 }} placeholder="min" />
                                <span style={{ fontWeight: 'bold' }}>:</span>
                                <input type="number" name="avgPaceSec" className="input-field" value={formData.avgPaceSec} onChange={handleChange} min="0" max="59" style={{ flex: 1 }} placeholder="sec" />
                            </div>
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Bijv. 7:30 = 7 minuten en 30 seconden per km.</small>
                        </div>
                    </div>
                )}

                {/* STEP 3: GOAL */}
                {step === 3 && (
                    <div className="fade-in">
                        <div className="input-group">
                            <label className="input-label">Naam evenement / Doel (optioneel)</label>
                            <input type="text" name="raceName" className="input-field" value={formData.raceName} onChange={handleChange} placeholder="bijv. Marathon van Rotterdam" />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Te lopen afstand (km) *</label>
                            <select name="raceDistance" className="input-field" value={formData.raceDistance} onChange={handleChange}>
                                <option value="5">5 km</option>
                                <option value="10">10 km</option>
                                <option value="15">15 km</option>
                                <option value="16.1">10 Engelse Mijl (16.1 km)</option>
                                <option value="21.1">Halve Marathon (21.1 km)</option>
                                <option value="42.2">Marathon (42.2 km)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Datum evenement *</label>
                            <input type="date" name="raceDate" className="input-field" value={formData.raceDate} onChange={handleChange} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Gewenste eindtijd</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select name="targetTimeHour" className="input-field" value={formData.targetTimeHour} onChange={handleChange} style={{ flex: 1 }}>
                                    <option value="1">1 uur</option>
                                    <option value="2">2 uur</option>
                                    <option value="3">3 uur</option>
                                </select>
                                <select name="targetTimeMin" className="input-field" value={formData.targetTimeMin} onChange={handleChange} style={{ flex: 1 }}>
                                    <option value="0">00 min</option>
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="50">50 min</option>
                                </select>
                            </div>
                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
                                We evalueren of dit realistisch is op basis van je huidige niveau.
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 4: SCHEDULE */}
                {step === 4 && (
                    <div className="fade-in">
                        <div className="input-group">
                            <label className="input-label">Aantal trainingen per week (doel)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input type="range" name="targetDaysPerWeek" min="2" max="6" value={formData.targetDaysPerWeek} onChange={handleChange} />
                                <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{formData.targetDaysPerWeek}x</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Voorkeursdagen</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat'].map((day, idx) => (
                                    <button
                                        key={day}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: formData.preferredDays[idx] ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                            backgroundColor: formData.preferredDays[idx] ? 'var(--primary-glow)' : 'transparent',
                                            color: formData.preferredDays[idx] ? '#fff' : 'var(--text-secondary)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleDayChange(idx)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>


                        <div className="input-group">
                            <label className="input-label">Trainingsstijl</label>
                            <select name="trainingStyle" className="input-field" value={formData.trainingStyle} onChange={handleChange}>
                                <option value="cautious">Voorzichtig (risico mijdend)</option>
                                <option value="balanced">Gebalanceerd (standaard)</option>
                                <option value="ambitious">Ambitieus (meer focus op snelheid)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Speciale wensen voor de coach?</label>
                            <textarea 
                                name="specialRequest" 
                                className="input-field" 
                                value={formData.specialRequest} 
                                onChange={handleChange} 
                                rows="3" 
                                placeholder="Bijv. 'Ik wil 2 weken voor de race 21km rennen' of 'Geen training op maandag'..."
                            />
                        </div>
                    </div>
                )}

                {/* STEP 5: MEDICAL */}
                {step === 5 && (
                    <div className="fade-in">
                        <div className="input-group">
                            <label className="input-label" style={{ color: 'var(--warning)' }}>Heb je actuele pijntjes of een blessuregeschiedenis?</label>
                            <select name="injuries" className="input-field" value={formData.injuries} onChange={handleChange}>
                                <option value={false}>Nee, ik ben helemaal fit</option>
                                <option value={true}>Ja, daar moet rekening mee gehouden worden</option>
                            </select>
                        </div>

                        {String(formData.injuries) === "true" && (
                            <div className="input-group">
                                <label className="input-label">Toelichting</label>
                                <textarea
                                    name="injuryDetails"
                                    className="input-field"
                                    value={formData.injuryDetails}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Bijv. shin splints, lopersknie eerdere revalidatie..."
                                />
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                <strong>Let op:</strong> Dit is een geautomatiseerde coach en is geen vervanging voor medisch advies. Bij aanhoudende pijn, consulteer een fysio. Pas je schema aan wanneer nodig.
                            </p>
                        </div>
                    </div>
                )}

            </div>

            {/* Button Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <button
                    className={`btn ${step === 1 ? 'btn-disabled' : 'btn-secondary'}`}
                    onClick={prevStep}
                    disabled={step === 1}
                >
                    Terug
                </button>

                {step < totalSteps ? (
                    <button className="btn btn-primary" onClick={nextStep}>
                        Volgende
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={submitForm}>
                        Genereer Schema
                    </button>
                )}
            </div>

        </div>
    );
};

export default IntakeForm;
