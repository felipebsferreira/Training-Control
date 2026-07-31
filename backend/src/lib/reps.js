// reps is free text (e.g. "12" or, for Drop Set, "15+10+8"). Volume/stats
// need a numeric rep count per set: sum any "+"-separated numeric parts,
// ignoring parts that aren't plain numbers (e.g. "até a falha" contributes 0
// instead of breaking the calculation).
export function repsToCount(reps) {
  return String(reps)
    .split("+")
    .reduce((sum, part) => {
      const n = Number(part.trim());
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
}

export function isValidReps(reps) {
  return typeof reps === "string" && reps.trim().length > 0 && reps.trim().length <= 100;
}
