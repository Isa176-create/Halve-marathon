// ============================================================
// MARATHON COACH - Offline Plan Generator (Hardcoded Rules)
// Genereert week-voor-week het schema op basis van wiskundige regels.
// ============================================================

function formatPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function generateTrainingPlanWeek(profile, weekNumber = 1, previousWeek = null) {
    const { currentLevel, goal, physical, preferences, medical } = profile;

    // -- Bepaal beschikbare dagen --
    let availableDays = [...(preferences.preferredDays || [])];
    if (availableDays.length === 0) availableDays = [1, 3, 6]; // Fallback ma, wo, za
    availableDays.sort();
    
    let targetDaysPerWeek = Math.min(preferences.trainDays, availableDays.length);
    
    // REGEL: Leeftijd > 45 jaar -> minimaal 1 extra hersteldag
    if (physical.age > 45 && targetDaysPerWeek > 2) {
        targetDaysPerWeek -= 1;
    }

    // -- VORIGE WEEK DATA / STARTBASIS --
    let previousVolKm = currentLevel.weeklyKm || 15;
    let previousLongRun = currentLevel.longestRun || 5;

    if (previousWeek && previousWeek.workouts) {
        previousVolKm = previousWeek.workouts.reduce((sum, w) => sum + parseFloat(w.distanceKm), 0);
        // Find longest run in previous week
        previousLongRun = Math.max(...previousWeek.workouts.map(w => parseFloat(w.distanceKm)));
    }

    // -- HERSTELWEKEN REGEL (Week 4, 8, 11) --
    const isDeload = [4, 8, 11].includes(weekNumber);

    // -- 10% VOLUME GROEI REGEL --
    let plannedVolKm;
    if (isDeload) {
        plannedVolKm = previousVolKm * 0.75; // 25% minder
    } else {
        plannedVolKm = previousVolKm * 1.10; // Max 10% erbij
    }
    
    // Voorkom te hoog volume als ze just starting out zijn
    if (weekNumber === 1) plannedVolKm = currentLevel.weeklyKm || 15;

    // -- BEREKENING TEMPO'S --
    const avgPaceSec = currentLevel.avgPaceSeconds || 420;
    const easyPace = formatPace(avgPaceSec + 40);
    const longRunPace = formatPace(avgPaceSec + 50);
    const tempoPace = formatPace(avgPaceSec - 15);
    const intervalPace = formatPace(avgPaceSec - 30);

    // Kijken naar ambities
    const hasTimeGoal = goal.targetTimeMinutes && goal.targetTimeMinutes < 120; // bijv. sub 2 op halve
    
    // -- LANGE DUURLOOP PROGRESSIE --
    let longRunKm;
    if (isDeload) {
        longRunKm = Math.max(previousLongRun * 0.8, 3);
    } else {
        longRunKm = Math.min(previousLongRun * 1.15, plannedVolKm * 0.45);
        if (weekNumber === 1) longRunKm = currentLevel.longestRun || 5; // Start baseline
    }

    // Cap langste duurloop op 90% van de race distance, behalve in de wedstijdweek.
    longRunKm = Math.min(longRunKm, goal.raceDistance * 0.90);

    // -- DAGEN VERDELEN (Minimaal 2 dg, max 4 gedefinieerd in prompt structuur) --
    let runs = [];
    const restKm = Math.max(0, plannedVolKm - longRunKm);
    
    // Dag 1: Kwaliteitstraining (mits geen deloadweek)
    if (!isDeload) {
        let qualKm = Math.max(3, restKm * 0.4);
        runs.push({
            type: hasTimeGoal ? 'Tempoloop' : 'Intervaltraining',
            distanceKm: qualKm,
            targetPace: hasTimeGoal ? tempoPace : intervalPace,
            coachNote: hasTimeGoal 
                ? `Kwaliteit! Loop op temposnelheid om te wennen aan je sub-doel tijd.` 
                : `Intervals: korte stukken snel (${intervalPace}) voor een betere conditie.`,
            isHard: true
        });
    } else {
        runs.push({
            type: 'Ontspannen duurloop',
            distanceKm: Math.max(3, restKm * 0.4),
            targetPace: easyPace,
            coachNote: `Rustweek. Geen intervallen, let vandaag alleen op techniek en ademhaling.`,
            isHard: false
        });
    }

    // Dag 2: Middellange duurloop
    runs.push({
        type: 'Middellange Duurloop',
        distanceKm: Math.max(3, restKm * 0.6),
        targetPace: easyPace,
        coachNote: `Rustig tempo, 70-75% inspanning. Je moet soepel kunnen blijven ademen.`,
        isHard: false
    });

    // Dag 3: Lange duurloop
    runs.push({
        type: 'Lange Duurloop',
        distanceKm: longRunKm,
        targetPace: longRunPace,
        coachNote: `De langste van de week. Gaat puur om de afstand en tijd op de been, niet om de snelheid.`,
        isHard: true
    });

    // Dag 4 (Optioneel, als ze 4+ dagen trainen)
    if (targetDaysPerWeek >= 4) {
        runs.push({
            type: 'Herstelloop',
            distanceKm: Math.max(3, plannedVolKm * 0.15),
            targetPace: formatPace(avgPaceSec + 60), // Zeer langzaam
            coachNote: `Bloedsomloop stimuleren, max 60% inspanning. Dit herstelt de spieren.`,
            isHard: false
        });
    }

    // Zorg ervoor dat zware dagen elkaar niet direct opvolgen (dit spreiden we over de kalender)
    const workouts = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (baseDate.getDay() || 7) + 1);

    // Selecteer logische dagen uit de 'availableDays'
    let dayIndices = [...availableDays];
    
    for (let i = 0; i < runs.length; i++) {
        // Zorg dat we genoeg targetdays over hebben, anders overschrijven we het.
        let dayOffset = dayIndices[i % dayIndices.length];
        
        // Zware check (regel: nooit twee zware dagen op elkaar)
        // Omdat availableDays door de gebruiker gekozen is, hopen we dat ze niet ma+di+wo hebben.
        // Als dag n = hard en dag n-1 was hard, skip een dag.
        
        let workoutDate = new Date(baseDate);
        workoutDate.setDate(workoutDate.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

        workouts.push({
            id: `w${weekNumber}-${i}`,
            date: workoutDate.toISOString(),
            type: runs[i].type,
            distanceKm: runs[i].distanceKm.toFixed(1),
            targetPace: runs[i].targetPace,
            coachNote: runs[i].coachNote,
            completed: false,
            feedback: null
        });
    }

    const totaal_km = workouts.reduce((s, w) => s + parseFloat(w.distanceKm), 0);

    // Mock een delay zodat het in de frontend voelt alsof hij "denkt" over de data.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                generatedAt: new Date().toISOString(),
                weeks: [
                    {
                        weekNumber: weekNumber,
                        phase: isDeload ? "Rust & Herstel" : "Actieve Opbouw",
                        isDeload: isDeload,
                        weeklyVolumeKm: totaal_km.toFixed(1),
                        weekNotes: [
                            `📊 Opgebouwd via jouw harde regels: ${isDeload ? 'Herstelweek (-25% volume).' : 'Max 10% stijging.'} `,
                            `De nadruk ligt deze week op ${runs[0].type.toLowerCase()} en de lange run van ${longRunKm.toFixed(1)} km.`
                        ],
                        workouts: workouts
                    }
                ]
            });
        }, 1200); // 1.2s delay for perfect UX
    });
}

