export default function SetsEditor({ sets, onChange }) {
  function updateReps(index, reps) {
    const next = sets.slice();
    next[index] = { reps };
    onChange(next);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Repetições por série
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {sets.map((set, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-xs text-slate-500 mb-1">Série {index + 1}</span>
            <input
              type="number"
              min={1}
              value={set.reps}
              onChange={(e) => updateReps(index, Number(e.target.value))}
              className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
