import { generateTrainingPlanWeek } from './src/utils/planGenerator.js';

const profile = {
    physical: { height: 180, weight: 75, age: 30, gender: 'man' },
    currentLevel: {
        runsPerWeek: 3,
        weeklyKm: 25,
        seasonKm: 150,
        longestRunEver: 15,
        longestRun: 12,
        recentMaxRun: 12,
        avgPaceSeconds: 360,
    },
    goal: {
        raceName: 'Rotterdam',
        raceDistance: 42.2,
        raceDate: '2026-04-12T00:00:00.000Z',
        targetTimeMinutes: 240,
    },
    preferences: {
        trainDays: 3,
        maxTimePerDay: 60,
        preferredDays: [1, 3, 6],
        style: 'balanced',
        specialRequest: '',
    },
    medical: {
        injuries: false,
        injuryDetails: ''
    }
};

async function test() {
  try {
    const res = await generateTrainingPlanWeek(profile);
    console.log(res);
  } catch (err) {
    console.log("ERROR THROWN:", err.message);
  }
}
test();
