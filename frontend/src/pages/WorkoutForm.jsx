import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getWorkout, createWorkout, updateWorkout } from "../api/client.js";
import WeekdaySelector from "../components/WeekdaySelector.jsx";

export default function WorkoutForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditing) return;
    getWorkout(id).then((w) => {
      setName(w.name);
      setDescription(w.description || "");
      setDaysOfWeek(w.daysOfWeek);
      setLoading(false);
    });
  }, [id, isEditing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome do treino");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), daysOfWeek };
      const workout = isEditing ? await updateWorkout(id, payload) : await createWorkout(payload);
      navigate(`/workouts/${workout.id}`);
    } catch {
      setError("Não foi possível salvar o treino");
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-800 mb-4">
        {isEditing ? "Editar treino" : "Novo treino"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do treino</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Treino A - Peito e Tríceps"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Dias da semana</label>
          <WeekdaySelector value={daysOfWeek} onChange={setDaysOfWeek} />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Salvar treino"}
          </button>
        </div>
      </form>
    </div>
  );
}
