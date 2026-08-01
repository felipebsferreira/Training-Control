// reps is free text: a plain number ("12"), "+"-separated numbers for Drop
// Set ("15+10+8"), or a "min-max" range for Normal technique ("12-15",
// entered as two boxes instead of one per set — see ExerciseForm). Volume/
// stats need a numeric rep count per set: sum each "+"-separated part,
// averaging a range and ignoring anything else unparseable (e.g. "até a
// falha" contributes 0) instead of breaking the calculation.
const RANGE_PATTERN = /^(\d+)-(\d+)$/;

export function repsToCount(reps) {
  return String(reps)
    .split("+")
    .reduce((sum, part) => {
      const trimmed = part.trim();
      const range = RANGE_PATTERN.exec(trimmed);
      if (range) return sum + (Number(range[1]) + Number(range[2])) / 2;
      const n = Number(trimmed);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
}

export function isValidReps(reps) {
  return typeof reps === "string" && reps.trim().length > 0 && reps.trim().length <= 100;
}
