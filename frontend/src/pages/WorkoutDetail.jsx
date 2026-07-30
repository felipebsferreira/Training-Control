import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getWorkout,
  createExercise,
  updateExercise,
  deleteExercise,
  WEEKDAYS,
} from "../api/client.js";
import ExerciseCard from "../components/ExerciseCard.jsx";
import ExerciseForm from "../components/ExerciseForm.jsx";

export default function WorkoutDetail() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState(null); // null | "new" | exerciseId
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getWorkout(id)
      .then(setWorkout)
      .catch(() => setError("Não foi possível carregar o treino"));
  }

  useEffect(reload, [id]);

  async function handleCreateExercise(payload) {
    setSubmitting(true);
    try {
      await createExercise(id, payload);
      setFormMode(null);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateExercise(exerciseId, payload) {
    setSubmitting(true);
    try {
      await updateExercise(exerciseId, payload);
      setFormMode(null);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExercise(exerciseId, name) {
    if (!confirm(`Excluir o exercício "${name}"?`)) return;
    await deleteExercise(exerciseId);
    reload();
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!workout) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{workout.name}</h1>
          {workout.description && <p className="text-sm text-slate-500 mt-0.5">{workout.description}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {workout.daysOfWeek.map((d) => (
              <span key={d} className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {WEEKDAYS[d].label}
              </span>
            ))}
          </div>
        </div>
        <Link
          to={`/workouts/${id}/edit`}
          className="text-sm text-slate-500 hover:text-indigo-600 px-2 py-1 shrink-0"
        >
          ✏️ Editar treino
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {workout.exercises.map((exercise) =>
          formMode === exercise.id ? (
            <ExerciseForm
              key={exercise.id}
              exercise={exercise}
              submitting={submitting}
              onCancel={() => setFormMode(null)}
              onSubmit={(payload) => handleUpdateExercise(exercise.id, payload)}
            />
          ) : (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => setFormMode(exercise.id)}
              onDelete={() => handleDeleteExercise(exercise.id, exercise.name)}
            />
          )
        )}
      </div>

      {formMode === "new" ? (
        <div className="mt-4">
          <ExerciseForm
            submitting={submitting}
            onCancel={() => setFormMode(null)}
            onSubmit={handleCreateExercise}
          />
        </div>
      ) : (
        <button
          onClick={() => setFormMode("new")}
          className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 text-sm font-medium"
        >
          + Adicionar exercício
        </button>
      )}
    </div>
  );
}
