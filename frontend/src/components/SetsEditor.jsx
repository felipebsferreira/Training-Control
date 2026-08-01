import { parseRepsRange } from "../api/client.js";

const PYRAMID_TECHNIQUES = ["Pirâmide Crescente", "Pirâmide Decrescente"];

export default function SetsEditor({ sets, onChange, technique, loadUnit = "kg" }) {
  const isDropSet = technique === "Drop Set";
  const isPyramid = PYRAMID_TECHNIQUES.includes(technique);
  const isNormalRange = technique === "Normal";

  function updateField(index, field, value) {
    const next = sets.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  if (isNormalRange) {
    const { min, max } = parseRepsRange(sets[0]?.reps);

    function updateRange(field, value) {
      const nextMin = field === "min" ? value : min;
      const nextMax = field === "max" ? value : max;
      const reps = `${nextMin}-${nextMax}`;
      onChange(sets.map(() => ({ reps })));
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Repetições por série</label>
        <div className="flex items-center gap-2 max-w-xs">
          <span className="text-sm text-slate-500">De</span>
          <input
            type="number"
            min={1}
            value={min}
            onChange={(e) => updateRange("min", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-500">a</span>
          <input
            type="number"
            min={1}
            value={max}
            onChange={(e) => updateRange("max", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-500">repetições</span>
        </div>
      </div>
    );
  }

  if (isPyramid) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Séries: repetições e carga</label>
        <p className="text-xs text-slate-400 mb-2">
          {technique === "Pirâmide Crescente" ? "Carga aumenta a cada série" : "Carga diminui a cada série"}
        </p>
        <div className="flex flex-col gap-2">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-14 shrink-0">Série {index + 1}</span>
              <input
                type="number"
                min={1}
                value={set.reps}
                onChange={(e) => updateField(index, "reps", e.target.value)}
                placeholder="Reps"
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min={0}
                step="0.5"
                value={set.load ?? ""}
                onChange={(e) => updateField(index, "load", e.target.value)}
                placeholder="Carga"
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400 w-6 shrink-0">{loadUnit}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Repetições por série
      </label>
      {isDropSet && (
        <p className="text-xs text-slate-400 mb-2">Drop set aceita texto livre, ex: 15+10+8</p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {sets.map((set, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-xs text-slate-500 mb-1">Série {index + 1}</span>
            {isDropSet ? (
              <input
                type="text"
                value={set.reps}
                onChange={(e) => updateField(index, "reps", e.target.value)}
                placeholder="15+10+8"
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="number"
                min={1}
                value={set.reps}
                onChange={(e) => updateField(index, "reps", e.target.value)}
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
