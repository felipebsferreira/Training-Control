export function serializeWorkout(workout) {
  return {
    id: workout.id,
    name: workout.name,
    description: workout.description,
    daysOfWeek: workout.schedules.map((s) => s.dayOfWeek).sort(),
    exercises: workout.exercises?.map(serializeExercise),
    exerciseCount: workout.exercises?.length,
  };
}

export function serializeExercise(exercise) {
  return {
    id: exercise.id,
    workoutId: exercise.workoutId,
    name: exercise.name,
    technique: exercise.technique,
    setsCount: exercise.setsCount,
    restSecondsMin: exercise.restSecondsMin,
    restSecondsMax: exercise.restSecondsMax,
    currentLoad: exercise.currentLoad,
    loadUnit: exercise.loadUnit,
    orderIndex: exercise.orderIndex,
    sets: exercise.sets.map((s) => ({ setNumber: s.setNumber, reps: s.reps })),
  };
}
