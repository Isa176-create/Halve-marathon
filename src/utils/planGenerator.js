// ============================================================
// MARATHON COACH - Offline Plan Generator (Hardcoded Rules)
// Genereert het VOLLEDIGE schema tot aan de marathon volgens vaste regels.
// ============================================================

function formatPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function generateTrainingPlanWeek(profile) {
    const { currentLevel, goal, physical, preferences } = profile;

    const startDate = new Date();
    const raceDate = new Date(goal.raceDate);
    const diffTime = Math.abs(raceDate - startDate);
    const totalWeeks = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));

    // -- Bepaal beschikbare dagen --
    let availableDays = [...(preferences.preferredDays || [])];
    if (availableDays.length === 0) availableDays = [1, 3, 6]; // Fallback ma, wo, za
    availableDays.sort();
    
    let targetDaysPerWeek = Math.min(preferences.trainDays, availableDays.length);
    
    // REGEL: Leeftijd > 45 jaar -> minimaal 1 extra hersteldag
    if (physical.age > 45 && targetDaysPerWeek > 2) {
        targetDaysPerWeek -= 1;
    }

    const avgPaceSec = currentLevel.avgPaceSeconds || 420;
    const easyPace = formatPace(avgPaceSec + 40);
    const longRunPace = formatPace(avgPaceSec + 50);
    const tempoPace = formatPace(avgPaceSec - 15);
    const vlotPace = formatPace(avgPaceSec - 25);

    const hasTimeGoal = goal.targetTimeMinutes && goal.targetTimeMinutes < 120;

    const weeksData = [];
    let currentVolKm = currentLevel.weeklyKm || 15;
    let currentLongRun = currentLevel.longestRun || 5;

    let weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() - (weekStartDate.getDay() || 7) + 1);

    for (let w = 1; w <= totalWeeks; w++) {
        const isTaper = w >= totalWeeks - 1;
        const isRaceWeek = w === totalWeeks;
        const isDeload = [4, 8, 11].includes(w) && !isTaper && !isRaceWeek;

        // ++ VOLUME BEREKENEN ++
        if (w > 1) {
            if (isRaceWeek) {
                currentVolKm = currentVolKm * 0.5;
            } else if (isTaper) {
                currentVolKm = currentVolKm * 0.7;
            } else if (isDeload) {
                currentVolKm = currentVolKm * 0.75;
            } else {
                currentVolKm = currentVolKm * 1.10; // Max 10% erbij
                currentVolKm = Math.min(60, currentVolKm); // Veilige cap
            }
        }
        
        let targetVolKm = currentVolKm;

        // ++ LANGE DUURLOOP BEREKENEN ++
        let longRunKm;
        if (isRaceWeek) {
            longRunKm = goal.raceDistance;
        } else if (isTaper) {
            longRunKm = Math.max(goal.raceDistance * 0.4, 5);
        } else if (isDeload) {
            longRunKm = Math.max(currentLongRun * 0.8, 3);
        } else {
            longRunKm = Math.min(currentLongRun * 1.15, targetVolKm * 0.45);
            if (w === 1) longRunKm = currentLevel.longestRun || 5; 
            longRunKm = Math.min(longRunKm, goal.raceDistance * 0.90);
            currentLongRun = longRunKm;
        }

        const restKm = Math.max(0, targetVolKm - longRunKm);
        let runs = [];

        // BOUW DE TRAINGINGEN OP BASIS VAN HET GEWENSTE AANTAL DAGEN
        
        // Dag 1: Lange Duurloop of Wedstrijd (Hoogste prioriteit)
        if (isRaceWeek) {
            runs.push({
                type: `🏁 WEDSTRIJD: ${goal.raceName || 'Jouw Doel'}`,
                distanceKm: goal.raceDistance,
                targetPace: hasTimeGoal ? formatPace((goal.targetTimeMinutes * 60) / goal.raceDistance) : easyPace,
                coachNote: `Dit is jouw moment! Vertrouw op je training en geniet. Succes! 🧡`,
                isHard: true
            });
        } else {
            runs.push({
                type: 'Lange Duurloop',
                distanceKm: longRunKm,
                targetPace: longRunPace,
                coachNote: `De langste run van de week. Tijd op je benen doorbrengen is het doel, niet de snelheid.`,
                isHard: true
            });
        }

        // Dag 2: Middellange duurloop (Altijd aanwezig tenzij men 1 dag per week traint)
        if (targetDaysPerWeek >= 2) {
            runs.push({
                type: 'Ontspannen duurloop',
                distanceKm: Math.max(3, restKm * (isRaceWeek ? 1.0 : 0.6)),
                targetPace: easyPace,
                coachNote: `Rustig tempo, 70-75% inspanning. Comfortabel blijven ademen.`,
                isHard: false
            });
        }

        // Dag 3: Vlotte prikkel (mits geen deload/taper)
        if (targetDaysPerWeek >= 3) {
            if (!isDeload && !isTaper && !isRaceWeek) {
                let qualKm = Math.max(3, restKm * 0.4);
                runs.push({
                    type: hasTimeGoal ? 'Tempoloop' : 'Middellange Duurloop (Vlot)',
                    distanceKm: qualKm,
                    targetPace: hasTimeGoal ? tempoPace : vlotPace,
                    coachNote: hasTimeGoal 
                        ? `Loop op temposnelheid om te wennen aan je sub-doel tijd.` 
                        : `Iets vlotter dan normaal (${vlotPace}) voor conditionele prikkel.`,
                    isHard: true
                });
            } else if (!isRaceWeek) {
                runs.push({
                    type: 'Ontspannen duurloop',
                    distanceKm: Math.max(3, restKm * 0.4),
                    targetPace: easyPace,
                    coachNote: `Rustweek of taper. Let alleen op techniek en ademhaling.`,
                    isHard: false
                });
            }
        }

        // Dag 4 t/m limiet (Optionele Herstellopen)
        if (targetDaysPerWeek >= 4 && !isRaceWeek) {
            const extraDays = targetDaysPerWeek - 3;
            for (let e = 0; e < extraDays; e++) {
                runs.push({
                    type: 'Herstelloop',
                    distanceKm: Math.max(2.5, targetVolKm * 0.10),
                    targetPace: formatPace(avgPaceSec + 60), 
                    coachNote: `Bloedsomloop stimuleren, max 60% inspanning. Dit herstelt de spieren.`,
                    isHard: false
                });
            }
        }

        const workouts = [];
        let dayIndices = [...availableDays];
        
        for (let i = 0; i < runs.length; i++) {
            let dayOffset = dayIndices[i % dayIndices.length];
            let workoutDate = new Date(weekStartDate);
            workoutDate.setDate(workoutDate.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

            workouts.push({
                id: `w${w}-${i}`,
                date: workoutDate.toISOString(),
                type: runs[i].type,
                distanceKm: runs[i].distanceKm.toFixed(1),
                targetPace: runs[i].targetPace,
                coachNote: runs[i].coachNote,
                completed: false,
                feedback: null
            });
        }

        const totaal_km = workouts.reduce((s, wk) => s + parseFloat(wk.distanceKm), 0);

        let phase = isDeload ? "Rust & Herstel" : "Actieve Opbouw";
        if (isTaper) phase = "Taper / Afbouwen";
        if (isRaceWeek) phase = "Wedstrijdweek";

        weeksData.push({
            weekNumber: w,
            phase: phase,
            isDeload: isDeload,
            weeklyVolumeKm: totaal_km.toFixed(1),
            weekNotes: [
                isRaceWeek ? "Het is zover! Focus op rust voor de grote dag." : `Lange run deze week: ${longRunKm.toFixed(1)} km.`
            ],
            workouts: workouts
        });

        // Herstel volume berekening voor correcte start van volgende block na deload
        if (isDeload) {
            currentVolKm = currentVolKm / 0.75; 
        }

        // Verzet weekdatum
        weekStartDate.setDate(weekStartDate.getDate() + 7);
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                generatedAt: new Date().toISOString(),
                weeks: weeksData
            });
        }, 1200); 
    });
}

