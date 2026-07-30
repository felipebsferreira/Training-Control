import { WEEKDAYS } from "../api/client.js";

export default function WeekdaySelector({ value, onChange }) {
  function toggle(day) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort());
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((day) => {
        const selected = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            aria-pressed={selected}
            className={[
              "px-3 py-2 rounded-full text-sm font-medium border transition-colors min-w-[3.5rem]",
              selected
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400",
            ].join(" ")}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
