import { useState } from "react";
import { TECHNIQUE_PRESETS } from "../api/client.js";
import SetsEditor from "./SetsEditor.jsx";

function buildInitialState(exercise) {
  if (exercise) {
    return {
      name: exercise.name,
      technique: TECHNIQUE_PRESETS.includes(exercise.technique) ? exercise.technique : "Outro",
      customTechnique: TECHNIQUE_PRESETS.includes(exercise.technique) ? "" : exercise.technique || "",
      setsCount: exercise.setsCount,
      sets: exercise.sets.map((s) => ({ reps: s.reps })),
      currentLoad: exercise.currentLoad ?? "",
      loadUnit: exercise.loadUnit || "kg",
      restSecondsMin: exercise.restSecondsMin,
      restSecondsMax: exercise.restSecondsMax,
    };
  }
  return {
    name: "",
    technique: "Normal",
    customTechnique: "",
    setsCount: 3,
    sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
    currentLoad: "",
    loadUnit: "kg",
    restSecondsMin: 60,
    restSecondsMax: 90,
  };
}

export default function ExerciseForm({ exercise, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => buildInitialState(exercise));
  const [error, setError] = useState(null);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setSetsCount(count) {
    const clamped = Math.max(1, Math.min(20, count));
    setForm((f) => {
      const nextSets = Array.from({ length: clamped }, (_, i) => f.sets[i] || { reps: f.sets.at(-1)?.reps ?? 12 });
      return { ...f, setsCount: clamped, sets: nextSets };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Informe o nome do exercício");
    if (Number(form.restSecondsMin) > Number(form.restSecondsMax)) {
      return setError("Descanso mínimo não pode ser maior que o máximo");
    }

    const technique = form.technique === "Outro" ? form.customTechnique.trim() : form.technique;

    onSubmit({
      name: form.name.trim(),
      technique: technique || null,
      setsCount: form.setsCount,
      sets: form.sets.map((s) => ({ reps: Number(s.reps) })),
      currentLoad: form.currentLoad === "" ? null : Number(form.currentLoad),
      loadUnit: form.loadUnit,
      restSecondsMin: Number(form.restSecondsMin),
      restSecondsMax: Number(form.restSecondsMax),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do exercício</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Ex: Supino Reto"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Técnica / método</label>
          <select
            value={form.technique}
            onChange={(e) => setField("technique", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TECHNIQUE_PRESETS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="Outro">Outro...</option>
          </select>
        </div>
        {form.technique === "Outro" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descreva a técnica</label>
            <input
              type="text"
              value={form.customTechnique}
              onChange={(e) => setField("customTechnique", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Séries</label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.setsCount}
            onChange={(e) => setSetsCount(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Carga atual</label>
          <input
            type="number"
            min={0}
            step="0.5"
            value={form.currentLoad}
            onChange={(e) => setField("currentLoad", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
          <select
            value={form.loadUnit}
            onChange={(e) => setField("loadUnit", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Descanso entre séries (segundos)
        </label>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            min={0}
            value={form.restSecondsMin}
            onChange={(e) => setField("restSecondsMin", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400">até</span>
          <input
            type="number"
            min={0}
            value={form.restSecondsMax}
            onChange={(e) => setField("restSecondsMax", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SetsEditor sets={form.sets} onChange={(sets) => setField("sets", sets)} />

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Salvar exercício"}
        </button>
      </div>
    </form>
  );
}
