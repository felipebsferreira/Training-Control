import { useState } from "react";
import { updateExerciseLoad } from "../api/client.js";

export default function ExerciseRunCard({ exercise }) {
  const repsSummary = exercise.sets.map((s) => s.reps).join(" / ");
  const [load, setLoad] = useState(exercise.currentLoad ?? "");
  const [loadUnit, setLoadUnit] = useState(exercise.loadUnit);
  const [savedLoad, setSavedLoad] = useState(exercise.currentLoad ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const dirty = String(load) !== String(savedLoad) || loadUnit !== exercise.loadUnit;
  const isValid = load !== "" && Number.isFinite(Number(load)) && Number(load) >= 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateExerciseLoad(exercise.id, { load: Number(load), loadUnit });
      setSavedLoad(updated.currentLoad);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Não foi possível salvar a carga");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-slate-800">{exercise.name}</h3>
        {exercise.technique && (
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {exercise.technique}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-slate-400">Séries</dt>
          <dd className="font-medium text-slate-700">{exercise.setsCount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Repetições</dt>
          <dd className="font-medium text-slate-700">{repsSummary}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Descanso</dt>
          <dd className="font-medium text-slate-700">
            {exercise.restSecondsMin}–{exercise.restSecondsMax}s
          </dd>
        </div>
      </dl>

      <div className="pt-2 border-t border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-1">Carga usada hoje</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.5"
            value={load}
            onChange={(e) => setLoad(e.target.value)}
            className="w-24 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={loadUnit}
            onChange={(e) => setLoadUnit(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
          <button
            onClick={handleSave}
            disabled={!dirty || !isValid || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar carga"}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Salvo ✓</span>}
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
