import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listWorkouts,
  startWorkout,
  finishWorkout,
  cancelWorkout,
  getActiveWorkoutLog,
  formatDuration,
  WEEKDAYS,
} from "../api/client.js";
import ExerciseRunCard from "../components/ExerciseRunCard.jsx";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function toReadOnlySessionExercise(exercise) {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    technique: exercise.technique,
    restSecondsMin: exercise.restSecondsMin,
    restSecondsMax: exercise.restSecondsMax,
    load: exercise.currentLoad,
    loadUnit: exercise.loadUnit,
    sets: exercise.sets,
  };
}

export default function TodayWorkout() {
  const [workouts, setWorkouts] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeLog, setActiveLog] = useState(null);
  const [lastFinished, setLastFinished] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [completedExerciseIds, setCompletedExerciseIds] = useState(new Set());

  function toggleCompleted(exerciseId) {
    const next = new Set(completedExerciseIds);
    if (next.has(exerciseId)) {
      next.delete(exerciseId);
    } else {
      next.add(exerciseId);
    }
    setCompletedExerciseIds(next);

    if (activeLog && next.size === activeLog.sessionExercises.length) {
      handleFinish();
    }
  }

  const today = WEEKDAYS[new Date().getDay()];

  useEffect(() => {
    Promise.all([listWorkouts(), getActiveWorkoutLog()])
      .then(([workoutsData, active]) => {
        setWorkouts(workoutsData);
        setActiveLog(active);
        if (active) {
          setSelectedId(active.workoutId);
        } else {
          const scheduled = workoutsData.find((w) => w.daysOfWeek.includes(today.value));
          setSelectedId(scheduled ? scheduled.id : null);
        }
      })
      .catch(() => setError("Não foi possível carregar os treinos"));
  }, [today.value]);

  const scheduledWorkout = useMemo(
    () => workouts?.find((w) => w.daysOfWeek.includes(today.value)) ?? null,
    [workouts, today.value]
  );
  const selectedWorkout = workouts?.find((w) => w.id === selectedId) ?? null;
  const sessionActive = Boolean(activeLog);

  const orderedSessionExercises = useMemo(() => {
    if (!activeLog) return [];
    const pending = activeLog.sessionExercises.filter((se) => !completedExerciseIds.has(se.exerciseId));
    const done = activeLog.sessionExercises.filter((se) => completedExerciseIds.has(se.exerciseId));
    return [...pending, ...done];
  }, [activeLog, completedExerciseIds]);

  async function handleStart() {
    if (!selectedWorkout) return;
    setBusy(true);
    setError(null);
    try {
      const log = await startWorkout(selectedWorkout.id);
      setActiveLog(log);
      setLastFinished(null);
      setCompletedExerciseIds(new Set());
    } catch {
      setError("Não foi possível iniciar o treino");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    if (!activeLog) return;
    setBusy(true);
    setError(null);
    try {
      const log = await finishWorkout(activeLog.id);
      setLastFinished({ workoutId: log.workoutId, durationMinutes: log.durationMinutes });
      setActiveLog(null);
      setCompletedExerciseIds(new Set());
    } catch {
      setError("Não foi possível concluir o treino");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!activeLog) return;
    if (!confirm("Cancelar este treino? O que já foi feito não será registrado no histórico.")) return;
    setBusy(true);
    setError(null);
    try {
      await cancelWorkout(activeLog.id);
      setActiveLog(null);
      setLastFinished(null);
      setCompletedExerciseIds(new Set());
    } catch {
      setError("Não foi possível cancelar o treino");
    } finally {
      setBusy(false);
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
              disabled={sessionActive}
              className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {!scheduledWorkout && <option value="">Selecione um treino</option>}
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {sessionActive ? (
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Treino em andamento, iniciado às {formatTime(activeLog.startedAt)}. Conclua para trocar de treino.
              </p>
            ) : (
              <>
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
              </>
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
              <div className="flex items-center gap-3 mb-4">
                {sessionActive ? (
                  <>
                    <button
                      onClick={handleFinish}
                      disabled={busy}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busy ? "Registrando..." : "✅ Concluir treino"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={busy}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Cancelar treino
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? "Iniciando..." : "▶️ Iniciar treino"}
                  </button>
                )}
                {lastFinished?.workoutId === selectedWorkout.id && (
                  <span className="text-sm text-emerald-600 font-medium">
                    Treino registrado ✓ ({formatDuration(lastFinished.durationMinutes)})
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {sessionActive
                  ? orderedSessionExercises.map((se) => (
                      <ExerciseRunCard
                        key={se.exerciseId}
                        sessionExercise={se}
                        logId={activeLog.id}
                        completed={completedExerciseIds.has(se.exerciseId)}
                        onToggleCompleted={() => toggleCompleted(se.exerciseId)}
                      />
                    ))
                  : selectedWorkout.exercises.map((exercise) => (
                      <ExerciseRunCard
                        key={exercise.id}
                        sessionExercise={toReadOnlySessionExercise(exercise)}
                        readOnly
                      />
                    ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
