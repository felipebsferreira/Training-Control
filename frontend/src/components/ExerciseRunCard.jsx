import { useState } from "react";
import { updateSessionExercise, formatReps } from "../api/client.js";
import SetsEditor from "./SetsEditor.jsx";

const PYRAMID_TECHNIQUES = ["Pirâmide Crescente", "Pirâmide Decrescente"];

export default function ExerciseRunCard({ sessionExercise, logId, readOnly, completed, onToggleCompleted }) {
  const isPyramid = PYRAMID_TECHNIQUES.includes(sessionExercise.technique);

  const [load, setLoad] = useState(sessionExercise.load ?? "");
  const [loadUnit, setLoadUnit] = useState(sessionExercise.loadUnit);
  const [sets, setSets] = useState(sessionExercise.sets.map((s) => ({ reps: s.reps, load: s.load ?? "" })));
  const [saved, setSaved] = useState(false);
  const [savedState, setSavedState] = useState({ load: sessionExercise.load, sets: sessionExercise.sets });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const allReps = sessionExercise.sets.map((s) => s.reps);
  const repsSummary = new Set(allReps).size === 1 ? formatReps(allReps[0]) : allReps.map(formatReps).join(" / ");
  const loadSummary = sessionExercise.sets.map((s) => s.load ?? "—").join(" / ");

  const dirty =
    String(load) !== String(savedState.load) ||
    loadUnit !== sessionExercise.loadUnit ||
    JSON.stringify(sets.map((s) => ({ reps: s.reps, load: s.load }))) !==
      JSON.stringify(savedState.sets.map((s) => ({ reps: s.reps, load: s.load })));

  const isValid = isPyramid
    ? sets.every(
        (s) =>
          String(s.reps).trim() !== "" &&
          s.load !== "" &&
          s.load != null &&
          Number.isFinite(Number(s.load)) &&
          Number(s.load) >= 0
      )
    : load !== "" &&
      Number.isFinite(Number(load)) &&
      Number(load) >= 0 &&
      sets.every((s) => String(s.reps).trim() !== "");

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSessionExercise(logId, sessionExercise.exerciseId, {
        ...(isPyramid ? {} : { load: Number(load) }),
        loadUnit,
        sets: sets.map((s) => ({
          reps: String(s.reps).trim(),
          ...(isPyramid ? { load: Number(s.load) } : {}),
        })),
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
    <div
      className={
        "border rounded-xl p-4 flex flex-col gap-3 transition-colors " +
        (completed ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={"font-semibold " + (completed ? "text-slate-500 line-through" : "text-slate-800")}>
            {sessionExercise.name}
          </h3>
          {sessionExercise.technique && (
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {sessionExercise.technique}
            </span>
          )}
        </div>
        {!readOnly && (
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(completed)}
              onChange={onToggleCompleted}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Feito
          </label>
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
            Carga:{" "}
            {isPyramid
              ? `${loadSummary} ${sessionExercise.loadUnit}`
              : sessionExercise.load != null
              ? `${sessionExercise.load} ${sessionExercise.loadUnit}`
              : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Inicie o treino para registrar suas séries.</p>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
          {!isPyramid && (
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
          )}
          {isPyramid && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
              <select
                value={loadUnit}
                onChange={(e) => setLoadUnit(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          )}

          <SetsEditor sets={sets} onChange={setSets} technique={sessionExercise.technique} loadUnit={loadUnit} />

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
