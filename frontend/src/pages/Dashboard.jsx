import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkouts, listWorkoutLogs, formatDuration, WEEKDAYS } from "../api/client.js";

function todayIndex() {
  return new Date().getDay();
}

function formatLogDate(isoString) {
  const date = new Date(isoString);
  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    listWorkouts()
      .then(setWorkouts)
      .catch(() => setError("Não foi possível carregar os treinos"));
    listWorkoutLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!workouts) return <p className="text-slate-500">Carregando...</p>;

  const today = todayIndex();

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Sua semana</h1>

      {workouts.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-slate-500 mb-3">Nenhum treino cadastrado ainda.</p>
          <Link
            to="/workouts/new"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Criar primeiro treino
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {WEEKDAYS.map((day) => {
          const dayWorkouts = workouts.filter((w) => w.daysOfWeek.includes(day.value));
          const isToday = day.value === today;

          return (
            <div
              key={day.value}
              className={[
                "rounded-xl border p-3 flex flex-col gap-2",
                isToday ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{day.fullLabel}</span>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Hoje</span>
                )}
              </div>

              {dayWorkouts.length === 0 ? (
                <span className="text-xs text-slate-400">Descanso</span>
              ) : (
                <ul className="flex flex-col gap-1">
                  {dayWorkouts.map((w) => (
                    <li key={w.id}>
                      <Link
                        to={`/workouts/${w.id}`}
                        className="block text-sm rounded-lg px-2 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700"
                      >
                        <span className="font-medium">{w.name}</span>
                        <span className="block text-xs text-slate-400">
                          {w.exerciseCount} exercício{w.exerciseCount === 1 ? "" : "s"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Histórico de treinos realizados</h2>

        {logs === null ? (
          <p className="text-slate-500">Carregando...</p>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">
            <p className="text-slate-500">Nenhum treino registrado ainda.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <span className="font-medium text-slate-700">{log.workoutName}</span>
                <span className="text-right">
                  <span className="block text-sm text-slate-400">{formatLogDate(log.startedAt)}</span>
                  <span className="block text-xs text-slate-400">{formatDuration(log.durationMinutes)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
