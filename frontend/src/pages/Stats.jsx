import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStatsSummary,
  getProfile,
  getWeightHistory,
  listWorkouts,
  getExerciseLoadHistory,
  calculateAge,
  calculateBMI,
  classifyBMI,
  calculateBMR,
  formatDuration,
} from "../api/client.js";
import LineChart from "../components/LineChart.jsx";

const COLORS = {
  weight: "#4f46e5",
  bmi: "#d97706",
  bmr: "#7c3aed",
  load: "#0d9488",
};

function KpiCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

export default function Stats() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weightHistory, setWeightHistory] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [loadHistory, setLoadHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getStatsSummary(), getProfile(), getWeightHistory(), listWorkouts()])
      .then(([summaryData, profileData, weightData, workoutsData]) => {
        setSummary(summaryData);
        setProfile(profileData);
        setWeightHistory(weightData);
        setWorkouts(workoutsData);

        const firstExercise = workoutsData.flatMap((w) => w.exercises)[0];
        if (firstExercise) setSelectedExerciseId(firstExercise.id);
      })
      .catch(() => setError("Não foi possível carregar as estatísticas"));
  }, []);

  useEffect(() => {
    if (!selectedExerciseId) return;
    getExerciseLoadHistory(selectedExerciseId)
      .then(setLoadHistory)
      .catch(() => setError("Não foi possível carregar o histórico de carga"));
  }, [selectedExerciseId]);

  const weightSeries = useMemo(
    () => (weightHistory ?? []).map((e) => ({ x: new Date(e.recordedAt), y: e.weightKg })),
    [weightHistory]
  );

  const canComputeBmi = profile?.heightCm != null;
  const bmiSeries = useMemo(() => {
    if (!canComputeBmi) return [];
    return weightSeries.map((e) => ({ x: e.x, y: calculateBMI(e.y, profile.heightCm) }));
  }, [weightSeries, canComputeBmi, profile?.heightCm]);

  const canComputeBmr = profile?.heightCm != null && profile?.birthDate != null && profile?.biologicalSex != null;
  const bmrSeries = useMemo(() => {
    if (!canComputeBmr) return [];
    return weightSeries.map((e) => ({
      x: e.x,
      y: calculateBMR(e.y, profile.heightCm, calculateAge(profile.birthDate, e.x), profile.biologicalSex),
    }));
  }, [weightSeries, canComputeBmr, profile?.heightCm, profile?.birthDate, profile?.biologicalSex]);

  const loadSeries = useMemo(
    () => (loadHistory ?? []).map((e) => ({ x: new Date(e.recordedAt), y: e.load })),
    [loadHistory]
  );

  const exerciseOptions = useMemo(
    () => (workouts ?? []).map((w) => ({ workoutName: w.name, exercises: w.exercises })),
    [workouts]
  );

  const currentBmi = bmiSeries.length ? bmiSeries[bmiSeries.length - 1].y : null;
  const currentBmr = bmrSeries.length ? bmrSeries[bmrSeries.length - 1].y : null;

  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary || !workouts) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Estatísticas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Treinos essa semana" value={summary.workoutsThisWeek} />
        <KpiCard
          label="Sequência atual"
          value={`${summary.currentStreakDays} dia${summary.currentStreakDays === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Duração média"
          value={summary.averageDurationMinutes != null ? formatDuration(summary.averageDurationMinutes) : "—"}
        />
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3">Composição corporal</h2>

      {!profile ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center mb-6">
          <p className="text-slate-500 mb-3">
            Complete seu perfil e registre seu peso para acompanhar peso, IMC e TMB aqui.
          </p>
          <Link to="/profile" className="text-sm text-indigo-600 hover:underline font-medium">
            Ir para o perfil
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-400">Peso</p>
            <p className="text-xl font-semibold text-slate-800 mt-1 mb-2">
              {weightSeries.length ? `${weightSeries[weightSeries.length - 1].y} kg` : "—"}
            </p>
            <LineChart data={weightSeries} color={COLORS.weight} formatValue={(v) => `${v}kg`} height={140} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-400">IMC</p>
            {canComputeBmi ? (
              <>
                <p className="text-xl font-semibold text-slate-800 mt-1">
                  {currentBmi != null ? currentBmi.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-slate-400 mb-2">{currentBmi != null ? classifyBMI(currentBmi) : ""}</p>
                <LineChart data={bmiSeries} color={COLORS.bmi} formatValue={(v) => v.toFixed(1)} height={140} />
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-2">
                Informe a altura no{" "}
                <Link to="/profile" className="text-indigo-600 hover:underline">
                  perfil
                </Link>
                .
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-400">TMB</p>
            {canComputeBmr ? (
              <>
                <p className="text-xl font-semibold text-slate-800 mt-1 mb-2">
                  {currentBmr != null ? `${Math.round(currentBmr)} kcal/dia` : "—"}
                </p>
                <LineChart data={bmrSeries} color={COLORS.bmr} formatValue={(v) => Math.round(v)} height={140} />
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-2">
                Complete altura, data de nascimento e sexo no{" "}
                <Link to="/profile" className="text-indigo-600 hover:underline">
                  perfil
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-800 mb-3">Progressão de carga</h2>

      {exerciseOptions.every((g) => g.exercises.length === 0) ? (
        <p className="text-slate-500">Nenhum exercício cadastrado ainda.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <select
            value={selectedExerciseId ?? ""}
            onChange={(e) => setSelectedExerciseId(Number(e.target.value))}
            className="w-full sm:w-64 border border-slate-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {exerciseOptions.map((group) =>
              group.exercises.length === 0 ? null : (
                <optgroup key={group.workoutName} label={group.workoutName}>
                  {group.exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}
          </select>

          <LineChart
            data={loadSeries}
            color={COLORS.load}
            formatValue={(v) => `${v}${loadHistory?.[0]?.loadUnit ?? "kg"}`}
          />
        </div>
      )}
    </div>
  );
}
