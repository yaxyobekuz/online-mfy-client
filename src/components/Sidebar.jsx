import { NavLink } from "react-router-dom";
import { ChartNoAxesColumn, Database, House } from "lucide-react";
import logo from "../assets/logo.png";

/**
 * Chap panel — Figma maketidagi "Sidebar" (node 1:4).
 *
 * Uch bo'lim: boshqaruv (Asosiy), hisobot (Statistika) va manba
 * (Umumiy ma'lumotlar ba'zasi). Boshqa sahifa yo'q — ish shu
 * uchtasidan iborat.
 */
const links = [
  { to: "/", label: "Asosiy", icon: House },
  { to: "/statistika", label: "Statistika", icon: ChartNoAxesColumn },
  { to: "/baza", label: "Umumiy ma'lumotlar ba'zasi", icon: Database },
];

const Sidebar = ({ mahallaName }) => (
  <aside className="flex h-svh w-[396px] shrink-0 flex-col py-2 pl-2">
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel p-2">
      <div className="flex w-full items-center gap-4 p-2.5">
        <div className="size-16 shrink-0">
          <img
            src={logo}
            alt=""
            className="size-full object-contain"
            width="64"
            height="64"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate text-xl font-bold text-ink">Onlayn mahalla</p>
          <p className="truncate text-sm text-muted">
            {mahallaName ?? "Mahalla tanlanmagan"}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex w-full items-center gap-4 rounded-xl px-6 py-4 text-base font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-ink hover:bg-black/5"
              }`
            }
          >
            <Icon className="size-6 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </aside>
);

export default Sidebar;
