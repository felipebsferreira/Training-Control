import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkouts, deleteWorkout, WEEKDAYS } from "../api/client.js";

export default function Workouts() {
  const [workouts, setWorkouts] = useState(null);
  const [error, setError] = useState(null);

  function reload() {
    listWorkouts()
      .then(setWorkouts)
      .catch(() => setError("Não foi possível carregar os treinos"));
  }

  useEffect(reload, []);

  async function handleDelete(id, name) {
    if (!confirm(`Excluir o treino "${name}"? Essa ação não pode ser desfeita.`)) return;
    await deleteWorkout(id);
    reload();
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!workouts) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Treinos</h1>
        <Link
          to="/workouts/new"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + Novo treino
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-slate-500">Nenhum treino cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workouts.map((w) => (
            <li key={w.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/workouts/${w.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                    {w.name}
                  </Link>
                  {w.description && <p className="text-sm text-slate-500 mt-0.5">{w.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.daysOfWeek.length === 0 ? (
                      <span className="text-xs text-slate-400">Sem dia definido</span>
                    ) : (
                      w.daysOfWeek.map((d) => (
                        <span
                          key={d}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                        >
                          {WEEKDAYS[d].label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link to={`/workouts/${w.id}/edit`} className="text-sm text-slate-500 hover:text-indigo-600 px-2 py-1">
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(w.id, w.name)}
                    className="text-sm text-slate-500 hover:text-red-600 px-2 py-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
