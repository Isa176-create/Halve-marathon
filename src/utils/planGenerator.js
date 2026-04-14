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
    
    const goalKm = goal.raceDistance;
    const weeklyNow = currentLevel.weeklyKm || 15;
    const currentLong = currentLevel.longestRun || 5;

    // Stap 1 - Limieten bepalen
    const maxTrainingLong = goalKm * 0.90;
    const targetWeekly = maxTrainingLong / 0.30;
    const taperWeeks = 2;
    const buildWeeks = Math.max(1, totalWeeks - taperWeeks);

    // Stap 2 - Benodigde wekelijkse stijging
    const linearNeeded = (targetWeekly - weeklyNow) / buildWeeks;

    let prevWeekVol = weeklyNow;
    let lastBuildVol = weeklyNow;

    let weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() - (weekStartDate.getDay() || 7) + 1);

    for (let w = 1; w <= totalWeeks; w++) {
        const isRaceWeek = w === totalWeeks;
        const isTaper = w > totalWeeks - taperWeeks;
        let isDeload = false;
        let weekVol = 0;

        // Stap 3 - Weekvolume per week berekenen
        if (isTaper) {
            let taperWeekNumber = w - (totalWeeks - taperWeeks);
            if (taperWeekNumber === 1 && taperWeeks >= 1) {
                weekVol = lastBuildVol * 0.80;
            } else if (taperWeekNumber === 2 && taperWeeks >= 2) {
                weekVol = lastBuildVol * 0.65;
            } else {
                weekVol = lastBuildVol * 0.65;
            }
        } else if (w % 4 === 0) {
            isDeload = true;
            weekVol = prevWeekVol * 0.80;
        } else {
            let stijging = Math.min(linearNeeded, prevWeekVol * 0.15);
            weekVol = Math.min(prevWeekVol + stijging, targetWeekly);
            lastBuildVol = weekVol;
        }

        prevWeekVol = weekVol;

        // Stap 4 - Sessieverdeling per week
        let runs = [];
        let daysPerWeek = targetDaysPerWeek;
        let longRun = Math.min(weekVol * 0.30, goalKm * 0.90);
        let otherSessionsCount = Math.max(1, daysPerWeek - 1);
        let sessionKm = Math.min((weekVol - longRun) / otherSessionsCount, goalKm);
        
        let werkelijkWeekVol = longRun + (sessionKm * otherSessionsCount);

        // Stap 5 - Race day vs Normale week
        if (isRaceWeek) {
            runs.push({
                type: `🏁 WEDSTRIJD: ${goal.raceName || 'Jouw Doel'}`,
                distanceKm: goalKm,
                targetPace: hasTimeGoal ? formatPace((goal.targetTimeMinutes * 60) / goalKm) : easyPace,
                coachNote: `Dit is jouw moment! Vertrouw op je training en geniet. Succes! 🧡`,
                isHard: true
            });
        } else {
            runs.push({
                type: 'Lange Duurloop',
                distanceKm: longRun,
                targetPace: longRunPace,
                coachNote: `De langste run van de week. Tijd op je benen doorbrengen is het doel, niet de snelheid.`,
                isHard: true
            });

            for (let i = 0; i < otherSessionsCount; i++) {
                let runType = 'Ontspannen duurloop';
                let tPace = easyPace;
                let cNote = `Rustig tempo, 70-75% inspanning. Comfortabel blijven ademen.`;
                let isHard = false;
                
                if (i === 0 && targetDaysPerWeek >= 3 && !isDeload && !isTaper) {
                    runType = hasTimeGoal ? 'Tempoloop' : 'Middellange Duurloop (Vlot)';
                    tPace = hasTimeGoal ? tempoPace : vlotPace;
                    cNote = hasTimeGoal 
                        ? `Loop op temposnelheid om te wennen aan je sub-doel tijd.` 
                        : `Iets vlotter dan normaal (${vlotPace}) voor conditionele prikkel.`;
                    isHard = true;
                }
                
                runs.push({
                    type: runType,
                    distanceKm: sessionKm,
                    targetPace: tPace,
                    coachNote: cNote,
                    isHard: isHard
                });
            }
        }

        const workouts = [];
        let dayIndices = [...availableDays];
        
        for (let i = 0; i < runs.length; i++) {
            let dayOffset = dayIndices[i % dayIndices.length];
            let workoutDate = new Date(weekStartDate);
            workoutDate.setDate(workoutDate.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

            // Zorg dat de wedstrijd exact op de raceDate valt
            if (isRaceWeek && runs[i].type.includes('WEDSTRIJD')) {
                workoutDate = new Date(raceDate);
            }

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

        let weekNotes = [];
        if (isRaceWeek) {
            weekNotes.push("Het is zover! Focus op rust voor de grote dag.");
        } else {
            weekNotes.push(`Lange run deze week: ${longRun.toFixed(1)} km.`);
        }
        
        if (w === 1 && (linearNeeded > (weeklyNow * 0.15))) {
            weekNotes.push("⚠️ Schema is ambitieus, overweeg meer weken of lagere startbasis");
        }

        weeksData.push({
            weekNumber: w,
            phase: phase,
            isDeload: isDeload,
            weeklyVolumeKm: totaal_km.toFixed(1),
            weekNotes: weekNotes,
            workouts: workouts
        });

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

