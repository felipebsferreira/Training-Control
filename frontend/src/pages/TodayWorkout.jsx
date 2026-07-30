import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkouts, logWorkoutCompletion, WEEKDAYS } from "../api/client.js";
import ExerciseRunCard from "../components/ExerciseRunCard.jsx";

export default function TodayWorkout() {
  const [workouts, setWorkouts] = useState(null);
  const [error, setError] = useState(null);
  const [loggingId, setLoggingId] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());

  const today = WEEKDAYS[new Date().getDay()];

  useEffect(() => {
    listWorkouts(today.value)
      .then(setWorkouts)
      .catch(() => setError("Não foi possível carregar o treino de hoje"));
  }, [today.value]);

  async function handleComplete(workoutId) {
    setLoggingId(workoutId);
    try {
      await logWorkoutCompletion(workoutId);
      setCompletedIds((prev) => new Set(prev).add(workoutId));
    } catch {
      setError("Não foi possível registrar o treino como concluído");
    } finally {
      setLoggingId(null);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!workouts) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Hoje · {today.fullLabel}</h1>

      {workouts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-slate-500">Nenhum treino agendado para hoje. Dia de descanso 💤</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {workouts.map((workout) => {
            const completed = completedIds.has(workout.id);
            return (
              <div key={workout.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-semibold text-slate-700">{workout.name}</h2>
                  <Link to={`/workouts/${workout.id}`} className="text-sm text-indigo-600 hover:underline">
                    Ver treino completo
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {workout.exercises.map((exercise) => (
                    <ExerciseRunCard key={exercise.id} exercise={exercise} />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleComplete(workout.id)}
                    disabled={loggingId === workout.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loggingId === workout.id ? "Registrando..." : "✅ Concluir treino"}
                  </button>
                  {completed && <span className="text-sm text-emerald-600 font-medium">Treino registrado ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
