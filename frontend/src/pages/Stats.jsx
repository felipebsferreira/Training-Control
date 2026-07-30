import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStatsSummary,
  getProfile,
  getWeightHistory,
  listWorkouts,
  getExerciseLoadHistory,
  getPersonalRecords,
  getConsistency,
  getWorkoutRanking,
  getVolumeHistory,
  calculateAge,
  calculateBMI,
  classifyBMI,
  calculateBMR,
  formatDuration,
} from "../api/client.js";
import LineChart from "../components/LineChart.jsx";
import ConsistencyHeatmap from "../components/ConsistencyHeatmap.jsx";

const COLORS = {
  weight: "#4f46e5",
  bmi: "#d97706",
  bmr: "#7c3aed",
  load: "#0d9488",
  volume: "#db2777",
  ranking: "#4f46e5",
};

function KpiCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function formatDateShort(isoString) {
  return new Date(isoString).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function Stats() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weightHistory, setWeightHistory] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [loadHistory, setLoadHistory] = useState(null);
  const [personalRecords, setPersonalRecords] = useState(null);
  const [consistency, setConsistency] = useState(null);
  const [workoutRanking, setWorkoutRanking] = useState(null);
  const [volumeHistory, setVolumeHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getStatsSummary(),
      getProfile(),
      getWeightHistory(),
      listWorkouts(),
      getPersonalRecords(),
      getConsistency(),
      getWorkoutRanking(),
      getVolumeHistory(),
    ])
      .then(([summaryData, profileData, weightData, workoutsData, records, consistencyData, ranking, volume]) => {
        setSummary(summaryData);
        setProfile(profileData);
        setWeightHistory(weightData);
        setWorkouts(workoutsData);
        setPersonalRecords(records);
        setConsistency(consistencyData);
        setWorkoutRanking(ranking);
        setVolumeHistory(volume);

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

  const volumeSeries = useMemo(
    () => (volumeHistory ?? []).map((e) => ({ x: new Date(e.recordedAt), y: Math.round(e.volume) })),
    [volumeHistory]
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
        <div className="flex flex-col gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm text-slate-400">Peso</p>
              <p className="text-xl font-semibold text-slate-800">
                {weightSeries.length ? `${weightSeries[weightSeries.length - 1].y} kg` : "—"}
              </p>
            </div>
            <LineChart data={weightSeries} color={COLORS.weight} formatValue={(v) => `${v}kg`} height={220} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            {canComputeBmi ? (
              <>
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-sm text-slate-400">IMC</p>
                    {currentBmi != null && <p className="text-xs text-slate-400">{classifyBMI(currentBmi)}</p>}
                  </div>
                  <p className="text-xl font-semibold text-slate-800">
                    {currentBmi != null ? currentBmi.toFixed(1) : "—"}
                  </p>
                </div>
                <LineChart data={bmiSeries} color={COLORS.bmi} formatValue={(v) => v.toFixed(1)} height={220} />
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-2">IMC</p>
                <p className="text-sm text-slate-400">
                  Informe a altura no{" "}
                  <Link to="/profile" className="text-indigo-600 hover:underline">
                    perfil
                  </Link>
                  .
                </p>
              </>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            {canComputeBmr ? (
              <>
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm text-slate-400">TMB</p>
                  <p className="text-xl font-semibold text-slate-800">
                    {currentBmr != null ? `${Math.round(currentBmr)} kcal/dia` : "—"}
                  </p>
                </div>
                <LineChart data={bmrSeries} color={COLORS.bmr} formatValue={(v) => Math.round(v)} height={220} />
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-2">TMB</p>
                <p className="text-sm text-slate-400">
                  Complete altura, data de nascimento e sexo no{" "}
                  <Link to="/profile" className="text-indigo-600 hover:underline">
                    perfil
                  </Link>
                  .
                </p>
              </>
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

      <h2 className="text-lg font-bold text-slate-800 mb-3 mt-6">Volume total</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <LineChart data={volumeSeries} color={COLORS.volume} formatValue={(v) => `${Math.round(v)}kg`} />
        <p className="text-xs text-slate-400 mt-2">
          Soma de repetições × carga de cada série registrada por sessão concluída.
        </p>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3">Recordes pessoais</h2>
      <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden">
        {!personalRecords || personalRecords.length === 0 ? (
          <p className="text-slate-500 p-4">Nenhum recorde registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {personalRecords.map((r) => (
              <li key={r.exerciseId} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-700">{r.exerciseName}</p>
                  <p className="text-xs text-slate-400">{r.workoutName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {r.load}
                    {r.loadUnit}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateShort(r.recordedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3">Consistência</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        {!consistency ? (
          <p className="text-slate-500">Carregando...</p>
        ) : (
          <ConsistencyHeatmap data={consistency} weeks={16} />
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3">Treinos mais executados</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        {!workoutRanking || workoutRanking.length === 0 ? (
          <p className="text-slate-500">Nenhum treino concluído ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {workoutRanking.map((r) => {
              const max = Math.max(...workoutRanking.map((x) => x.count));
              const widthPct = Math.max((r.count / max) * 100, 6);
              return (
                <div key={r.workoutId}>
                  <div className="flex items-baseline justify-between mb-1 text-sm">
                    <span className="font-medium text-slate-700">{r.workoutName}</span>
                    <span className="text-slate-400">
                      {r.count} treino{r.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${widthPct}%`, backgroundColor: COLORS.ranking }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
