export default function SetsEditor({ sets, onChange, technique }) {
  const isDropSet = technique === "Drop Set";

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
                onChange={(e) => updateReps(index, e.target.value)}
                placeholder="15+10+8"
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="number"
                min={1}
                value={set.reps}
                onChange={(e) => updateReps(index, e.target.value)}
                className="w-full text-center border border-slate-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
