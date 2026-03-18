// Helper: Calculate weeks between two dates
function calculateWeeksBetween(d1, d2) {
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
}

// Convert min/km to readable string
function formatPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate the complete plan
export function generateTrainingPlan(userProfile) {
    const START_DATE = new Date();
    const RACE_DATE = new Date(userProfile.goal.raceDate);
    const totalWeeks = calculateWeeksBetween(START_DATE, RACE_DATE);

    const plan = {
        generatedAt: new Date().toISOString(),
        weeks: []
    };

    let currentVolumeKm = userProfile.currentLevel.weeklyKm;
    let currentLongRun = userProfile.currentLevel.longestRun;
    const prefs = userProfile.preferences;

    // Available days mapping (0 = Sunday, 1 = Monday ...)
    let availableDays = [...prefs.preferredDays];
    if (availableDays.length === 0) {
        // Fallback if user didn't select days
        availableDays = [0, 2, 4, 6].slice(0, prefs.trainDays);
    }

    // Ensure we don't have fewer available days than trainDays
    while (availableDays.length < prefs.trainDays) {
        for (let i = 0; i < 7; i++) {
            if (!availableDays.includes(i)) {
                availableDays.push(i);
                break;
            }
        }
    }

    availableDays.sort();

    // Determine Pace zones based on user's current easy pace (in seconds)
    // IMPORTANT: Adding a 30-second buffer to the user's avg pace to ensure "Easy" is actually easy.
    const basePaceSec = userProfile.currentLevel.avgPaceSeconds + 30; 
    const easyPace = formatPace(basePaceSec);
    const tempoPaceSec = basePaceSec - 30; // Closer to race pace
    const tempoPace = formatPace(tempoPaceSec);
    const intervalPaceSec = basePaceSec - 60;
    const intervalPace = formatPace(intervalPaceSec);

    // Math config
    const MAX_VOLUME = 60;
    // Strict 10% rule for distance progression
    const volumeIncrement = prefs.style === 'cautious' ? 1.05 : (prefs.style === 'ambitious' ? 1.10 : 1.08);

    // Generate weeks
    let weekStartDate = new Date(START_DATE);
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1); // Start on Monday

    for (let w = 1; w <= totalWeeks; w++) {
        const isTaper = (totalWeeks - w) < 2; // Last 2 weeks
        const isDeload = (w % 4 === 0) && !isTaper; // Every 4th week is deload

        let phase = "Base";
        if (w > totalWeeks * 0.3) phase = "Build";
        if (w > totalWeeks * 0.6) phase = "Specific";
        if (isTaper) phase = "Taper";

        // Progressions
        if (isDeload) {
            currentVolumeKm *= 0.7; // Reduce by 30%
        } else if (!isTaper && w > 1) {
            currentVolumeKm = Math.min(currentVolumeKm * volumeIncrement, MAX_VOLUME);
        } else if (isTaper) {
            currentVolumeKm *= 0.6; // Heavy reduction for taper
        }

        // Long Run Progression: Strict 10% rule
        if (!isDeload && !isTaper && w > 1) {
            const increment = (prefs.style === 'cautious' ? 0.05 : 0.10);
            currentLongRun = Math.min(21.1, currentLongRun * (1 + increment));
        } else if (isDeload) {
            currentLongRun = Math.max(5, currentLongRun * 0.7); // Light long run
        } else if (isTaper) {
            currentLongRun = w === totalWeeks ? 21.1 : 10; 
        }

        const workouts = [];

        // Distribute volume into workouts based on selected days
        for (let i = 0; i < prefs.trainDays; i++) {
            const dayOffset = availableDays[i]; 
            const workoutDate = new Date(weekStartDate);
            workoutDate.setDate(workoutDate.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

            let workoutType = "Rustige Duurloop";
            let distance = (currentVolumeKm / prefs.trainDays);
            let targetPace = easyPace;
            let coachNote = "Loop op gevoel. Je moet makkelijk kunnen praten.";

            // 1. Long Run logic
            if (i === prefs.trainDays - 1) {
                if (w === totalWeeks && isTaper) {
                    workoutType = "WEDSTRIJD: Halve Marathon";
                    distance = 21.1;
                    coachNote = "Succes! Vertrouw op je training en geniet van de sfeer in Amsterdam.";
                    targetPace = formatPace(userProfile.goal.targetTimeMinutes * 60 / 21.1); // Goal race pace
                } else {
                    workoutType = "Lange Duurloop";
                    distance = Math.round(currentLongRun * 10) / 10;
                    targetPace = formatPace(basePaceSec + 30); // 30s slower than easy for longevity
                    coachNote = "Focus op tijd op de been, niet op tempo. Het gaat om uithoudingsvermogen.";
                }
            }
            // 2. Quality Session logic
            else if (i === 0 && (phase === 'Build' || phase === 'Specific') && !isDeload) {
                workoutType = phase === 'Specific' ? "Tempoloop" : "Intervals";
                distance = Math.round((currentVolumeKm * 0.2) * 10) / 10; 
                targetPace = phase === 'Specific' ? tempoPace : intervalPace;
                coachNote = workoutType === "Tempoloop"
                    ? "Loop dit in een oncomfortabel maar vol te houden tempo. Oefen race pace."
                    : "Korte blokken op hoge intensiteit met wandelpauzes.";
            }
            // 3. Easy/Recovery logic
            else {
                distance = Math.round(((currentVolumeKm - currentLongRun) / (prefs.trainDays - 1)) * 10) / 10;
                if (distance <= 4) {
                    workoutType = "Herstelrun";
                    coachNote = "Actief herstel. Loop heel langzaam om de doorbloeding te stimuleren.";
                }
            }

            workouts.push({
                id: `w${w}-${i}`,
                date: workoutDate.toISOString(),
                type: workoutType,
                distanceKm: Math.max(distance, 3).toFixed(1),
                targetPace,
                coachNote,
                completed: false,
                feedback: null
            });
        }

        plan.weeks.push({
            weekNumber: w,
            phase,
            isDeload,
            workouts
        });

        // Advance week
        weekStartDate.setDate(weekStartDate.getDate() + 7);

        // Reset volume/long run mathematically if it was a deload (so next week builds on pre-deload volume)
        if (isDeload && !isTaper) {
            currentVolumeKm = currentVolumeKm / 0.7;
            currentLongRun = currentLongRun / 0.7;
        }
    }

    return plan;
}
