import { NavLink } from "react-router-dom";
import { Home, MapPin } from "lucide-react";

const links = [
  { to: "/", label: "Ko'chalar", icon: MapPin },
  { to: "/homes", label: "Xonadonlar", icon: Home },
];

const Sidebar = () => {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-background md:block">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold text-foreground">
          Onlayn Mahalla
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:bg-surface hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
