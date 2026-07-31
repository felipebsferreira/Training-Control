import { useState } from "react";
import { updateSessionExercise } from "../api/client.js";
import SetsEditor from "./SetsEditor.jsx";

export default function ExerciseRunCard({ sessionExercise, logId, readOnly }) {
  const [load, setLoad] = useState(sessionExercise.load ?? "");
  const [loadUnit, setLoadUnit] = useState(sessionExercise.loadUnit);
  const [sets, setSets] = useState(sessionExercise.sets.map((s) => ({ reps: s.reps })));
  const [saved, setSaved] = useState(false);
  const [savedState, setSavedState] = useState({ load: sessionExercise.load, sets: sessionExercise.sets });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const repsSummary = sessionExercise.sets.map((s) => s.reps).join(" / ");

  const dirty =
    String(load) !== String(savedState.load) ||
    loadUnit !== sessionExercise.loadUnit ||
    JSON.stringify(sets.map((s) => s.reps)) !== JSON.stringify(savedState.sets.map((s) => s.reps));
  const isValid =
    load !== "" &&
    Number.isFinite(Number(load)) &&
    Number(load) >= 0 &&
    sets.every((s) => s.reps !== "" && Number.isInteger(Number(s.reps)) && Number(s.reps) > 0);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSessionExercise(logId, sessionExercise.exerciseId, {
        load: Number(load),
        loadUnit,
        sets: sets.map((s) => ({ reps: Number(s.reps) })),
      });
      setSavedState({ load: updated.load, sets: updated.sets });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Não foi possível registrar as séries");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-slate-800">{sessionExercise.name}</h3>
        {sessionExercise.technique && (
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {sessionExercise.technique}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-slate-400">Séries</dt>
          <dd className="font-medium text-slate-700">{sessionExercise.sets.length}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Repetições</dt>
          <dd className="font-medium text-slate-700">{repsSummary}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Descanso</dt>
          <dd className="font-medium text-slate-700">
            {sessionExercise.restSecondsMin}–{sessionExercise.restSecondsMax}s
          </dd>
        </div>
      </dl>

      {readOnly ? (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Carga: {sessionExercise.load != null ? `${sessionExercise.load} ${sessionExercise.loadUnit}` : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Inicie o treino para registrar suas séries.</p>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
          <div>
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
            </div>
          </div>

          <SetsEditor sets={sets} onChange={setSets} />

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dirty || !isValid || saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Registrar séries"}
            </button>
            {saved && <span className="text-sm text-emerald-600 font-medium">Salvo ✓</span>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
