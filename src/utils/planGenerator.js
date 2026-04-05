// ============================================================
// MARATHON COACH - AI Plan Client
// Haalt het wekelijkse schema op via de /api/generate-week API
// ============================================================

const DAYS_MAP = {
    'ma': 1, 'di': 2, 'wo': 3, 'do': 4, 'vr': 5, 'za': 6, 'zo': 0,
    'maa': 1, 'din': 2, 'woe': 3, 'don': 4, 'vri': 5, 'zat': 6, 'zon': 0
};

function getNextDateForDay(baseDate, targetDayStr) {
    const targetDay = DAYS_MAP[targetDayStr.toLowerCase().substring(0,2)] ?? 0;
    const currentDay = baseDate.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) {
        diff += 7;
    }
    const result = new Date(baseDate);
    result.setDate(result.getDate() + diff);
    return result;
}

export async function generateTrainingPlanWeek(profile, weekNumber = 1, previousWeek = null) {
    // We send the profile and context to the API Route
    const response = await fetch('/api/generate-week', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...profile,
            weekNumber,
            previousWeek
        })
    });

    if (!response.ok) {
        let errorMsg = 'Failed to generate plan';
        try {
            const errResult = await response.json();
            errorMsg = errResult.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    const aiData = await response.json();

    // Mapping AI JSON to internal App state format
    const baseDate = new Date();
    // Start of the week (Monday)
    baseDate.setDate(baseDate.getDate() - (baseDate.getDay() || 7) + 1);

    const workouts = aiData.trainingen.map((t, idx) => {
        const workoutDate = getNextDateForDay(baseDate, t.dag);
        
        return {
            id: `w${aiData.week}-${idx}`,
            date: workoutDate.toISOString(),
            type: t.type,
            distanceKm: parseFloat(t.afstand_km).toFixed(1),
            targetPace: t.pace_doel,
            coachNote: `${t.uitleg} (Inspanning: ${t.inspanning})`,
            completed: false,
            feedback: null
        };
    });

    return {
        generatedAt: new Date().toISOString(),
        weeks: [
            {
                weekNumber: parseInt(aiData.week, 10),
                phase: "AI Schema",
                isDeload: false,
                weeklyVolumeKm: parseFloat(aiData.totaal_km).toFixed(1),
                weekNotes: [aiData.coach_notitie],
                workouts: workouts
            }
        ]
    };
}

