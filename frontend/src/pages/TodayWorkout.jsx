import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkouts, logWorkoutCompletion, WEEKDAYS } from "../api/client.js";
import ExerciseRunCard from "../components/ExerciseRunCard.jsx";

export default function TodayWorkout() {
  const [workouts, setWorkouts] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const [loggingId, setLoggingId] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());

  const today = WEEKDAYS[new Date().getDay()];

  useEffect(() => {
    listWorkouts()
      .then((data) => {
        setWorkouts(data);
        const scheduled = data.find((w) => w.daysOfWeek.includes(today.value));
        setSelectedId(scheduled ? scheduled.id : null);
      })
      .catch(() => setError("Não foi possível carregar os treinos"));
  }, [today.value]);

  const scheduledWorkout = useMemo(
    () => workouts?.find((w) => w.daysOfWeek.includes(today.value)) ?? null,
    [workouts, today.value]
  );
  const selectedWorkout = workouts?.find((w) => w.id === selectedId) ?? null;

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
          <p className="text-slate-500 mb-3">Nenhum treino cadastrado ainda.</p>
          <Link
            to="/workouts/new"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Criar primeiro treino
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Treino a executar</label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {!scheduledWorkout && <option value="">Selecione um treino</option>}
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {scheduledWorkout && selectedId !== scheduledWorkout.id && (
              <p className="text-xs text-slate-400 mt-1">
                Treino agendado para hoje: {scheduledWorkout.name}. A troca vale só para hoje — a agenda semanal não muda.
              </p>
            )}
            {!scheduledWorkout && (
              <p className="text-xs text-slate-400 mt-1">
                Nenhum treino agendado para hoje. Escolha um acima para executar mesmo assim.
              </p>
            )}
          </div>

          {!selectedWorkout ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <p className="text-slate-500">Dia de descanso 💤</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-semibold text-slate-700">{selectedWorkout.name}</h2>
                <Link to={`/workouts/${selectedWorkout.id}`} className="text-sm text-indigo-600 hover:underline">
                  Ver treino completo
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {selectedWorkout.exercises.map((exercise) => (
                  <ExerciseRunCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => handleComplete(selectedWorkout.id)}
                  disabled={loggingId === selectedWorkout.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loggingId === selectedWorkout.id ? "Registrando..." : "✅ Concluir treino"}
                </button>
                {completedIds.has(selectedWorkout.id) && (
                  <span className="text-sm text-emerald-600 font-medium">Treino registrado ✓</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
