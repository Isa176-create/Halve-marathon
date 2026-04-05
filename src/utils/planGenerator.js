// ============================================================
// MARATHON COACH - Plan Generator
// Strikte, persoonsgebonden opbouw op basis van gebruikersinput
// ============================================================

// Helper: Aantal weken tussen twee datums
function calculateWeeksBetween(d1, d2) {
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
}

// Helper: Seconden naar "m:ss" formaat
function formatPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Bereken volumetoename per week op basis van stijl en huidig niveau
function getWeeklyIncrement(style, currentWeeklyKm) {
    // Veiligheidsprioriteit: lagere belastbaarheid = kleinere stappen
    if (currentWeeklyKm < 15) return style === 'ambitious' ? 1.07 : 1.05;
    if (currentWeeklyKm < 30) return style === 'cautious' ? 1.05 : (style === 'ambitious' ? 1.10 : 1.08);
    return style === 'cautious' ? 1.05 : (style === 'ambitious' ? 1.10 : 1.08);
}

// ============================================================
// HOOFDFUNCTIE: Genereer trainingsplan
// ============================================================
export function generateTrainingPlan(userProfile) {
    const START_DATE = new Date();
    const RACE_DATE = new Date(userProfile.goal.raceDate);
    const totalWeeks = calculateWeeksBetween(START_DATE, RACE_DATE);

    const level = userProfile.currentLevel;
    const prefs = userProfile.preferences;
    const medical = userProfile.medical;
    const goal = userProfile.goal;

    // ============================================================
    // STAP 1: ANALYSEER STARTNIVEAU (op basis van jouw harde regels)
    // Prioriteit: weekKm > recente max afstand > comfortabele duurloop > trainDays
    // ============================================================

    // Startvolume: begin ALTIJD op of net onder het huidige niveau
    // Nooit hoger starten dan wat iemand in de afgelopen 4 weken gemiddeld liep
    let currentVolumeKm = Math.max(level.weeklyKm * 0.95, 5); // 5% onder actueel niveau als veilige start

    // Startafstand lange duurloop: gebaseerd op recente langste run, NIET de ooit gelopen afstand
    // Recente data weegt zwaarder dan een oude prestatie
    let currentLongRun = Math.min(level.longestRun, level.weeklyKm * 0.4);
    // Als de langste run hoger is dan 40% van weekvolume, cappen we het voor veiligheid
    currentLongRun = Math.max(currentLongRun, 3);

    // Maximaal volume afhankelijk van startniveau (nooit te ambitieus)
    const MAX_VOLUME = Math.min(60, level.weeklyKm * 2.5);

    // Blessuregevoeligheid verhoogt voorzichtigheid
    const isInjuryRisk = medical.injuries === true || medical.injuries === 'true';

    // Stijl aanpassen bij blessurerisico
    const effectiveStyle = isInjuryRisk ? 'cautious' : (prefs.style || 'balanced');

    // ============================================================
    // STAP 2: TEMPO-ZONES op basis van huidig comfortabel tempo
    // ============================================================
    const avgPaceSec = level.avgPaceSeconds || 420; // Fallback: 7:00 min/km
    // Easy = 30-45 seconden langzamer dan gemiddeld tempo (echt rustig)
    const easyPaceSec = avgPaceSec + (isInjuryRisk ? 45 : 30);
    const longRunPaceSec = easyPaceSec + 30; // Lange duurloop nóg rustiger
    const tempoPaceSec = avgPaceSec - 15;   // Tempoloop: iets sneller dan gemiddeld
    const intervalPaceSec = avgPaceSec - 30; // Intervals: duidelijk sneller

    const easyPace = formatPace(easyPaceSec);
    const longRunPace = formatPace(longRunPaceSec);
    const tempoPace = formatPace(tempoPaceSec);
    const intervalPace = formatPace(intervalPaceSec);

    // ============================================================
    // STAP 3: DAGEN VERDELEN
    // ============================================================
    let availableDays = [...(prefs.preferredDays || [])];
    if (availableDays.length === 0) {
        availableDays = [1, 3, 6].slice(0, prefs.trainDays); // Fallback: Ma, Wo, Za
    }
    while (availableDays.length < prefs.trainDays) {
        for (let i = 0; i < 7; i++) {
            if (!availableDays.includes(i)) { availableDays.push(i); break; }
        }
    }
    availableDays.sort();
    const trainDays = Math.min(prefs.trainDays, availableDays.length);

    // ============================================================
    // STAP 4: WEKEN OPBOUWEN
    // ============================================================
    const plan = { generatedAt: new Date().toISOString(), weeks: [] };
    let weekStartDate = new Date(START_DATE);
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1);

    // Speciale wens-detectie (breed opgezet zodat verschillende formuleringen werken)
    const specialRequest = (prefs.specialRequest || '').toLowerCase();

    // Wil gebruiker 21km ALLEEN op de wedstrijddag? Dan max 18km vooraf.
    const wantsOnlyRaceDay21 = (
        specialRequest.includes('op de dag zelf') ||
        specialRequest.includes('wedstrijddag') ||
        specialRequest.includes('op de race dag') ||
        specialRequest.includes('alleen op de marathon') ||
        specialRequest.includes('alleen op de wedstrijd') ||
        specialRequest.includes('pas op de dag') ||
        specialRequest.includes('voor het eerst 21') ||
        specialRequest.includes('eerste keer 21')
    );

    // Wil gebruiker 21km twee weken voor de race?
    const wants21kmTwoWeeksBefore = (
        !wantsOnlyRaceDay21 && (
            specialRequest.includes('2 weken') ||
            specialRequest.includes('twee weken')
        ) && (
            specialRequest.includes('21km') ||
            specialRequest.includes('21 km')
        )
    );

    // Bepaal de absolute max voor de lange duurloop vóór de wedstrijd
    // Meestal lopen we als langste duurloop ~85-95% van de wedstrijd, afhankelijk van afstand
    const MAX_LONG_RUN_BEFORE_RACE = wantsOnlyRaceDay21 ? Math.min(goal.raceDistance * 0.85, goal.raceDistance - 3) : Math.min(goal.raceDistance, 35);

    for (let w = 1; w <= totalWeeks; w++) {
        const weeksLeft = totalWeeks - w;
        const isTaper = weeksLeft < 2;
        const isRaceWeek = w === totalWeeks;
        const isDeload = (w % 4 === 0) && !isTaper && !isRaceWeek;

        // Fase bepalen
        let phase = 'Base';
        if (w > totalWeeks * 0.35) phase = 'Build';
        if (w > totalWeeks * 0.65) phase = 'Specific';
        if (isTaper) phase = 'Taper';

        // ---- VOLUME BEREKENING MET VEILIGHEIDSCHECKS ----
        if (w > 1) {
            if (isDeload) {
                currentVolumeKm *= 0.7; // Herstelweek: 30% minder
            } else if (isTaper) {
                currentVolumeKm *= weeksLeft === 1 ? 0.5 : 0.65;
            } else {
                const increment = getWeeklyIncrement(effectiveStyle, currentVolumeKm);
                currentVolumeKm = Math.min(currentVolumeKm * increment, MAX_VOLUME);
            }
        }
        currentVolumeKm = Math.round(currentVolumeKm * 10) / 10;

        // ---- LANGE DUURLOOP PROGRESSIE ----
        let longRunThisWeek;
        if (isRaceWeek) {
            longRunThisWeek = goal.raceDistance; // Wedstrijd
        } else if (isTaper) {
            longRunThisWeek = weeksLeft === 1 ? Math.max(goal.raceDistance * 0.35, 3) : Math.max(goal.raceDistance * 0.55, 5); // Taperweken: licht
        } else if (isDeload) {
            longRunThisWeek = Math.max(3, currentLongRun * 0.7);
        } else {
            // STRIKTE OPBOUW:
            // - Max 8% toename ÉN max 1.5 km absoluut per week
            // - Zo kan de lange run NOOIT met grote sprongen omhoog
            const pctMax = effectiveStyle === 'cautious' ? 0.05 : 0.08;
            const absoluteMaxStep = effectiveStyle === 'cautious' ? 1.0 : 1.5; // km per week
            const byPct = currentLongRun * (1 + pctMax);
            const byAbsolute = currentLongRun + absoluteMaxStep;
            // Neem altijd het LAAGSTE van de twee (veiligste opbouw)
            longRunThisWeek = Math.min(byPct, byAbsolute, MAX_LONG_RUN_BEFORE_RACE);
        }
        longRunThisWeek = Math.round(longRunThisWeek * 10) / 10;

        // Speciale wens: wedstrijdafstand twee weken voor de race
        if (wants21kmTwoWeeksBefore && weeksLeft === 2 && !isTaper) {
            longRunThisWeek = goal.raceDistance;
        }

        // Update tracker
        if (!isDeload && !isTaper) currentLongRun = longRunThisWeek;

        // ---- TRAININGEN AANMAKEN ----
        const workouts = [];

        for (let i = 0; i < trainDays; i++) {
            const dayOffset = availableDays[i];
            const workoutDate = new Date(weekStartDate);
            workoutDate.setDate(workoutDate.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

            let workoutType, distance, targetPace, coachNote;

            const isLastDay = i === trainDays - 1;
            const isFirstDay = i === 0;

            // ---- WEDSTRIJD ----
            if (isRaceWeek && isLastDay) {
                workoutType = `🏁 WEDSTRIJD: ${goal.raceName || 'Jouw Doel'}`;
                distance = goal.raceDistance;
                targetPace = goal.targetTimeMinutes
                    ? formatPace((goal.targetTimeMinutes * 60) / goal.raceDistance)
                    : easyPace;
                coachNote = `Dit is jouw moment! Vertrouw op je training, loop de eerste km's rustig in en geniet van de sfeer. Succes! 🧡`;
            }
            // ---- LANGE DUURLOOP ----
            else if (isLastDay && !isRaceWeek) {
                const isSpecialWeek = wants21kmTwoWeeksBefore && weeksLeft === 2 && longRunThisWeek >= goal.raceDistance;
                workoutType = isSpecialWeek
                    ? `⭐ Lange Duurloop (Speciale Wens: ${goal.raceDistance}km!)`
                    : wantsOnlyRaceDay21
                        ? `Lange Duurloop (max ${Math.round(MAX_LONG_RUN_BEFORE_RACE)} km voor race)`
                        : 'Lange Duurloop';
                distance = longRunThisWeek;
                targetPace = longRunPace;
                coachNote = isDeload
                    ? 'Herstelweek: loop lekker rustig, geniet van de beweging. Geen prestatiedruk.'
                    : 'Loop rustig in je eigen tempo. Je moet de hele tijd kunnen praten. Doel = tijd op de benen.';
            }
            // ---- KWALITEITSTRAINING (alleen in Build/Specific, niet in deload/taper, en min 3 trainingen per week) ----
            else if (isFirstDay && (phase === 'Build' || phase === 'Specific') && !isDeload && !isTaper && trainDays >= 3) {
                if (phase === 'Specific') {
                    workoutType = 'Tempoloop';
                    distance = Math.round((currentVolumeKm * 0.18) * 10) / 10;
                    targetPace = tempoPace;
                    coachNote = `Loop ${Math.round(distance * 0.6)} km op temposnelheid (${tempoPace} min/km). Warm 10 min op en koel 10 min af. Vervelend maar vol te houden.`;
                } else {
                    workoutType = 'Intervaltraining';
                    distance = Math.round((currentVolumeKm * 0.15) * 10) / 10;
                    targetPace = intervalPace;
                    coachNote = `Warm 10 min rustig op. Daarna 4-6x 3 minuten op ${intervalPace} min/km met 2 min wandelpauze. Koel daarna 10 min af.`;
                }
            }
            // ---- RUSTIGE DUURLOOP / HERSTELRUN ----
            else {
                const restKm = Math.max(0, currentVolumeKm - longRunThisWeek);
                const otherRuns = trainDays - 1;
                let rawDistance = Math.round((restKm / otherRuns) * 10) / 10;

                // HARDE REGEL: een rustige duurloop mag NOOIT langer zijn dan de lange duurloop
                // Cap op (longRunThisWeek - 1km) zodat de lange duurloop altijd de langste is
                const maxEasyDistance = Math.max(3, longRunThisWeek - 1);
                distance = Math.min(rawDistance, maxEasyDistance);

                if (distance <= 4 || isDeload) {
                    workoutType = 'Herstelrun';
                    targetPace = formatPace(easyPaceSec + 30);
                    coachNote = 'Heel rustig lopen om je spieren te activeren. Geen prestatiedrang, gewoon bewegen.';
                } else {
                    workoutType = 'Rustige Duurloop';
                    targetPace = easyPace;
                    coachNote = 'Loop rustig in zone 2. Je moet makkelijk een gesprek kunnen voeren.';
                }
            }

            // Minimum 3 km per training, maximum logisch voor de fase
            distance = parseFloat(Math.max(distance, 3).toFixed(1));

            workouts.push({
                id: `w${w}-${i}`,
                date: workoutDate.toISOString(),
                type: workoutType,
                distanceKm: distance.toFixed(1),
                targetPace,
                coachNote,
                completed: false,
                feedback: null,
            });
        }

        // ---- COACH ANALYSE (in de eerste week) ----
        const weekNotes = w === 1 ? [
            `📊 Startniveau: ${currentVolumeKm.toFixed(0)} km/week | Langste run: ${currentLongRun.toFixed(1)} km`,
            `📌 Schema gebouwd op: recente km/week (${level.weeklyKm} km) en langste loop (${level.longestRun} km).`,
            isInjuryRisk ? '⚠️ Extra voorzichtig schema ivm blessurerisico.' : '',
            effectiveStyle === 'cautious' ? '🐌 Opbouw max 5% per week.' : (effectiveStyle === 'ambitious' ? '🚀 Opbouw max 10% per week.' : '✅ Standaard opbouw ~8% per week.'),
        ].filter(Boolean) : [];

        plan.weeks.push({
            weekNumber: w,
            phase,
            isDeload,
            weeklyVolumeKm: currentVolumeKm.toFixed(1),
            weekNotes,
            workouts,
        });

        // Advance to next week
        weekStartDate.setDate(weekStartDate.getDate() + 7);

        // Na herstelweek: herstel referentievolume voor juiste opbouw
        if (isDeload && !isTaper) {
            currentVolumeKm = currentVolumeKm / 0.7;
            currentLongRun = currentLongRun / 0.7;
        }
    }

    return plan;
}
