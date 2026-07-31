import { useEffect, useState } from "react";
import { getProfile, saveProfile, saveWeight } from "../api/client.js";

function toDateInputValue(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 10);
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentWeightKg, setCurrentWeightKg] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        if (profile) {
          setName(profile.name);
          setBirthDate(toDateInputValue(profile.birthDate));
          setBiologicalSex(profile.biologicalSex || "");
          setHeightCm(profile.heightCm ?? "");
          setCurrentWeightKg(profile.currentWeightKg);
          setWeightInput(profile.currentWeightKg ?? "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Não foi possível carregar o perfil");
        setLoading(false);
      });
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome");
      return;
    }

    setSavingProfile(true);
    try {
      await saveProfile({
        name: name.trim(),
        birthDate: birthDate || null,
        biologicalSex: biologicalSex || null,
        heightCm: heightCm === "" ? null : Number(heightCm),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      setError("Não foi possível salvar o perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveWeight() {
    const weight = Number(weightInput);
    if (weightInput === "" || !Number.isFinite(weight) || weight <= 0) return;

    setSavingWeight(true);
    setError(null);
    try {
      const updated = await saveWeight(weight);
      setCurrentWeightKg(updated.currentWeightKg);
      setWeightSaved(true);
      setTimeout(() => setWeightSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível salvar o peso");
    } finally {
      setSavingWeight(false);
    }
  }

  const weightDirty = String(weightInput) !== String(currentWeightKg ?? "");
  const weightValid = weightInput !== "" && Number(weightInput) > 0;

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Perfil</h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-4 bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de nascimento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full min-w-0 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sexo biológico</label>
            <select
              value={biologicalSex}
              onChange={(e) => setBiologicalSex(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          {profileSaved && <span className="text-sm text-emerald-600 font-medium">Salvo ✓</span>}
          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Peso atual (kg)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-32 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSaveWeight}
            disabled={!weightDirty || !weightValid || savingWeight}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingWeight ? "Salvando..." : "Salvar peso"}
          </button>
          {weightSaved && <span className="text-sm text-emerald-600 font-medium">Salvo ✓</span>}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Cada peso salvo aqui fica no histórico, para acompanhar a evolução ao longo do tempo.
        </p>
      </div>
    </div>
  );
}
