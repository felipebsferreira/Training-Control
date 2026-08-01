import { formatReps } from "../api/client.js";

const PYRAMID_TECHNIQUES = ["Pirâmide Crescente", "Pirâmide Decrescente"];

export default function ExerciseCard({ exercise, onEdit, onDelete }) {
  const isPyramid = PYRAMID_TECHNIQUES.includes(exercise.technique);
  const allReps = exercise.sets.map((s) => s.reps);
  const repsSummary = new Set(allReps).size === 1 ? formatReps(allReps[0]) : allReps.map(formatReps).join(" / ");
  const loadSummary = exercise.sets.map((s) => s.load ?? "—").join(" / ");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{exercise.name}</h3>
          {exercise.technique && (
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {exercise.technique}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="text-sm text-slate-500 hover:text-indigo-600 px-2 py-1"
            aria-label="Editar exercício"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-sm text-slate-500 hover:text-red-600 px-2 py-1"
            aria-label="Excluir exercício"
          >
            🗑️
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mt-1">
        <div>
          <dt className="text-slate-400">Séries</dt>
          <dd className="font-medium text-slate-700">{exercise.setsCount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Repetições</dt>
          <dd className="font-medium text-slate-700">{repsSummary}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{isPyramid ? "Carga por série" : "Carga atual"}</dt>
          <dd className="font-medium text-slate-700">
            {isPyramid
              ? `${loadSummary} ${exercise.loadUnit}`
              : exercise.currentLoad != null
              ? `${exercise.currentLoad} ${exercise.loadUnit}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Descanso</dt>
          <dd className="font-medium text-slate-700">
            {exercise.restSecondsMin}–{exercise.restSecondsMax}s
          </dd>
        </div>
      </dl>
    </div>
  );
}
