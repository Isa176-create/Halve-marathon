export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { currentLevel, goal, physical, preferences, medical, weekNumber, previousWeek } = body;

        // Calculate total weeks to the race
        const today = new Date();
        const raceDate = new Date(goal.raceDate);
        const diffTime = Math.abs(raceDate - today);
        const totalWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        // Format target days
        const daysMap = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        const targetDays = preferences.preferredDays.map(d => daysMap[d] || d).join(', ');

        const injuriesText = medical.injuries === true || medical.injuries === 'true' 
            ? medical.injuryDetails || 'Ja, blessures aanwezig' 
            : 'Geen';

        // Prepare previous week context
        let previousWeekContext = `Eerste week. (Nog geen eerdere trainingen in dit schema).`;
        let previousWeekKm = 0;
        let previousGevoel = "n.v.t.";

        if (previousWeek && previousWeek.workouts && previousWeek.workouts.length > 0) {
            previousWeekKm = previousWeek.workouts.reduce((sum, w) => sum + parseFloat(w.distanceKm || 0), 0);
            previousWeekContext = previousWeek.workouts.map(w => `${w.type} ${w.distanceKm}km @ ${w.targetPace}`).join(', ');
            previousGevoel = previousWeek.userFeedback || "goed"; // We assume user will log feedback later, default "goed"
        } else {
            // First week: base on initial intake levels
            previousWeekContext = `(Startbasis) liep gemiddeld ${currentLevel.weeklyKm}km per week, met langste run van ${currentLevel.longestRun}km.`;
            previousWeekKm = currentLevel.weeklyKm;
            previousGevoel = "n.v.t.";
        }

        const systemPrompt = `Je bent een ervaren marathon coach. Genereer een trainingsschema voor precies 1 week, gebaseerd op onderstaande gegevens.

== GEBRUIKERSPROFIEL ==
- Leeftijd: ${physical.age}
- Geslacht: ${physical.gender}
- Huidige pace: ${Math.floor(currentLevel.avgPaceSeconds / 60)}:${(currentLevel.avgPaceSeconds % 60).toString().padStart(2, '0')} min/km
- Km gelopen dit seizoen: ${currentLevel.seasonKm || 'Onbekend'}
- Doel: ${goal.raceName} (${goal.raceDistance}km) | ${goal.targetTimeMinutes ? 'Sub ' + Math.floor(goal.targetTimeMinutes/60) + ':' + (goal.targetTimeMinutes%60).toString().padStart(2,'0') : 'finishen'}
- Beschikbare trainingsdagen: ${targetDays}
- Blessurehistorie: ${injuriesText}

== RACE CONTEXT ==
- Racedatum: ${new Date(goal.raceDate).toLocaleDateString('nl-NL')}
- Huidige week: week ${weekNumber} van ${totalWeeks}

== VORIGE WEEK ==
- Trainingen: ${previousWeekContext}
- Totaal km vorige week: ${previousWeekKm}
- Hoe voelde het: ${previousGevoel}

== VASTE REGELS ==
1. De weekkilometers mogen nooit meer dan 10% stijgen ten opzichte van vorige week.
2. Nooit twee zware trainingen op opeenvolgende dagen.
3. Week 4, 8 en 11 zijn altijd herstelweken: 20-30% minder volume, geen intervaltraining.
4. Pas intensiteit aan op leeftijd: boven 45 jaar minimaal 1 extra hersteldag per week.

== WEEKSTRUCTUUR ==
Volg altijd deze opbouw:
- Dag 1: kwaliteitstraining (interval of tempoloop)
- Dag 2: middellange duurloop (rustig, 70-75% inspanning)
- Dag 3: lange duurloop (langste van de week, opbouwend richting race)
- Optionele dag 4: herstelloop (maximaal 60% inspanning) of rust

== DOELINSTRUCTIES ==
- Finishen: focus op volume, lage intensiteit, nooit harder dan 75% hartslag
- Tijddoel sub 2:00 of sneller: 2 kwaliteitstrainingen per week, tempolopen op doelpace

== OUTPUT ==
Geef het schema EXACT terug als JSON, niets anders:
{
  "week": ${weekNumber},
  "totaal_km": getal_hier,
  "trainingen": [
    {
      "dag": "kies uit: ma, di, wo, do, vr, za, of zo. (Moet matchen met voorkeursdagen)",
      "type": "bijv. Duurloop / Interval / Rust",
      "afstand_km": getal_hier,
      "pace_doel": "mm:ss",
      "inspanning": "x%",
      "uitleg": "korte motivatie en uitleg"
    }
  ],
  "coach_notitie": "een persoonlijke boodschap van de coach"
}`;

        // OpenAI API CAll
        const openAIKey = process.env.OPENAI_API_KEY;
        if (!openAIKey) {
            throw new Error('OPENAI_API_KEY is not configured in Vercel environment variables.');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Use powerful model for accurate JSON constraints
                messages: [
                    { role: 'system', content: systemPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const generatedJSON = data.choices[0].message.content;

        // Parse JSON for safety
        const parsedData = JSON.parse(generatedJSON);

        return new Response(JSON.stringify(parsedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating week:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
