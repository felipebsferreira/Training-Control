import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const links = [
  { to: "/today", label: "Hoje", icon: "▶️" },
  { to: "/", label: "Semana", icon: "📅" },
  { to: "/workouts", label: "Treinos", icon: "🏋️" },
  { to: "/stats", label: "Stats", icon: "📊" },
  { to: "/profile", label: "Perfil", icon: "👤" },
];

function linkClasses({ isActive }) {
  return [
    "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
    "md:flex-row md:gap-2 md:text-sm md:px-4 md:py-2 md:rounded-lg",
    isActive
      ? "text-indigo-600 md:bg-indigo-50 md:text-indigo-700"
      : "text-slate-500 hover:text-slate-800 md:hover:bg-slate-100",
  ].join(" ");
}

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <span className="text-lg font-bold text-slate-800">💪 TrainingControl</span>
        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end className={linkClasses}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
            {user && <span className="text-sm text-slate-500">{user.email}</span>}
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 font-medium">
              Sair
            </button>
          </div>
        </div>
      </header>

      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <span className="text-base font-bold text-slate-800">💪 TrainingControl</span>
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 font-medium">
          Sair
        </button>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={(state) => linkClasses(state) + " flex-1 py-2"}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
