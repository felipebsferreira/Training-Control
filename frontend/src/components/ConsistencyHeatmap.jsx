import { useMemo, useState } from "react";

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function colorForCount(count) {
  if (count === 0) return "#e2e8f0";
  if (count === 1) return "#a5b4fc";
  return "#4f46e5";
}

export default function ConsistencyHeatmap({ data, weeks = 16 }) {
  const [hover, setHover] = useState(null);

  const countByDate = useMemo(() => {
    const map = new Map();
    data.forEach((d) => map.set(d.date, d.count));
    return map;
  }, [data]);

  const columns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    const cols = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(endOfWeek);
        date.setDate(endOfWeek.getDate() - w * 7 - (6 - d));
        const key = localDateKey(date);
        days.push({ date, key, count: countByDate.get(key) ?? 0, isFuture: date > today });
      }
      cols.push(days);
    }
    return cols;
  }, [countByDate, weeks]);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((day, di) => (
                <div
                  key={di}
                  onMouseEnter={() => !day.isFuture && setHover(day)}
                  onMouseLeave={() => setHover(null)}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: day.isFuture ? "transparent" : colorForCount(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 h-5">
        <span className="text-xs text-slate-500">
          {hover
            ? `${hover.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} — ${hover.count} treino${hover.count === 1 ? "" : "s"}`
            : ""}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>Menos</span>
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorForCount(0) }} />
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorForCount(1) }} />
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorForCount(2) }} />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
