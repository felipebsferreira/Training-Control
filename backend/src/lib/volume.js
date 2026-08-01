import { repsToCount } from "./reps.js";

// Most techniques use one load for the whole exercise (set.load is null,
// falls back to the session/exercise-level load). Pyramid techniques set
// load per set instead, so each set can carry its own weight.
export function sessionExerciseVolume(sessionExercise) {
  return sessionExercise.sets.reduce((sum, set) => {
    const load = set.load ?? sessionExercise.load ?? 0;
    return sum + load * repsToCount(set.reps);
  }, 0);
}
