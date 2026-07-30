import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

export const WEEKDAYS = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda" },
  { value: 2, label: "Ter", fullLabel: "Terça" },
  { value: 3, label: "Qua", fullLabel: "Quarta" },
  { value: 4, label: "Qui", fullLabel: "Quinta" },
  { value: 5, label: "Sex", fullLabel: "Sexta" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

export const TECHNIQUE_PRESETS = [
  "Normal",
  "Pirâmide Crescente",
  "Pirâmide Decrescente",
  "Drop Set",
  "Bi-set",
  "Tri-set",
  "Super-set",
  "Rest-Pause",
];

export async function listWorkouts(day) {
  const { data } = await api.get("/workouts", { params: day !== undefined ? { day } : {} });
  return data;
}

export async function getWorkout(id) {
  const { data } = await api.get(`/workouts/${id}`);
  return data;
}

export async function createWorkout(payload) {
  const { data } = await api.post("/workouts", payload);
  return data;
}

export async function updateWorkout(id, payload) {
  const { data } = await api.put(`/workouts/${id}`, payload);
  return data;
}

export async function deleteWorkout(id) {
  await api.delete(`/workouts/${id}`);
}

export async function createExercise(workoutId, payload) {
  const { data } = await api.post(`/workouts/${workoutId}/exercises`, payload);
  return data;
}

export async function updateExercise(id, payload) {
  const { data } = await api.put(`/exercises/${id}`, payload);
  return data;
}

export async function deleteExercise(id) {
  await api.delete(`/exercises/${id}`);
}

export async function updateExerciseLoad(id, payload) {
  const { data } = await api.patch(`/exercises/${id}/load`, payload);
  return data;
}

export async function startWorkout(workoutId) {
  const { data } = await api.post(`/workouts/${workoutId}/log/start`);
  return data;
}

export async function finishWorkout(logId) {
  const { data } = await api.patch(`/workout-logs/${logId}/finish`);
  return data;
}

export async function getActiveWorkoutLog() {
  const { data } = await api.get("/workout-logs/active");
  return data;
}

export async function cancelWorkout(logId) {
  await api.delete(`/workout-logs/${logId}`);
}

export async function listWorkoutLogs(limit = 20) {
  const { data } = await api.get("/workout-logs", { params: { limit } });
  return data;
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}min`;
}

export async function getProfile() {
  const { data } = await api.get("/profile");
  return data;
}

export async function saveProfile(payload) {
  const { data } = await api.put("/profile", payload);
  return data;
}

export async function saveWeight(weightKg) {
  const { data } = await api.post("/profile/weight", { weightKg });
  return data;
}

export async function getWeightHistory(limit = 100) {
  const { data } = await api.get("/profile/weight-history", { params: { limit } });
  return data;
}

export async function getExerciseLoadHistory(exerciseId) {
  const { data } = await api.get(`/exercises/${exerciseId}/load-history`);
  return data;
}

export async function getStatsSummary() {
  const { data } = await api.get("/stats/summary");
  return data;
}

export function calculateAge(birthDate, atDate = new Date()) {
  const birth = new Date(birthDate);
  let age = atDate.getFullYear() - birth.getFullYear();
  const monthDiff = atDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && atDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function classifyBMI(bmi) {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

export function calculateBMR(weightKg, heightCm, age, biologicalSex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return biologicalSex === "M" ? base + 5 : base - 161;
}
