import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Workouts from "./pages/Workouts.jsx";
import WorkoutForm from "./pages/WorkoutForm.jsx";
import WorkoutDetail from "./pages/WorkoutDetail.jsx";
import TodayWorkout from "./pages/TodayWorkout.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 pb-20 md:pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today" element={<TodayWorkout />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/new" element={<WorkoutForm />} />
          <Route path="/workouts/:id/edit" element={<WorkoutForm />} />
          <Route path="/workouts/:id" element={<WorkoutDetail />} />
        </Routes>
      </main>
    </div>
  );
}
