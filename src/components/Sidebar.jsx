import { NavLink, useParams } from "react-router-dom";
import { ChartNoAxesColumn, Database, House, Users } from "lucide-react";
import logo from "../assets/logo.png";
import AccountSwitcher from "./AccountSwitcher.jsx";

/**
 * Chap panel — Figma maketidagi "Sidebar" (node 1:4).
 *
 * Bo'limlar: boshqaruv (Asosiy), hisobot (Statistika), manba
 * (Umumiy ma'lumotlar ba'zasi) va platformadan yuklangan xonadon
 * a'zolari (Qo'shimcha a'zolar).
 *
 * Havolalar mahalla nomidan boshlanadi: `/kiyali/statistika`.
 */
const links = [
  { to: "", label: "Asosiy", icon: House },
  { to: "statistika", label: "Statistika", icon: ChartNoAxesColumn },
  { to: "baza", label: "Umumiy ma'lumotlar ba'zasi", icon: Database },
  { to: "xonadonlar", label: "Qo'shimcha a'zolar", icon: Users },
];

const Sidebar = ({
  mahallaName,
  active,
  mahallas,
  onAccountChanged,
  onSwitchMahalla,
}) => {
  const { mahallaSlug } = useParams();

  return (
    <aside className="flex h-svh w-[396px] shrink-0 flex-col py-2 pl-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel p-2">
        <div className="flex w-full items-center gap-2">
          <div className="size-16 shrink-0 p-2.5">
            <img
              src={logo}
              alt=""
              className="size-full object-contain"
              width="64"
              height="64"
            />
          </div>

          {/*
            Sarlavha o'rnida hisob almashtirgich turadi: maketdagi
            "Onlayn mahalla / Sarnavul MFY" ikki qatori saqlanadi,
            lekin endi bosilsa hisoblar ro'yxati ochiladi.
          */}
          <div className="min-w-0 flex-1">
            <AccountSwitcher
              active={active}
              mahallas={mahallas}
              onChanged={onAccountChanged}
              onSwitchMahalla={onSwitchMahalla}
              mahallaName={mahallaName}
            />
          </div>
        </div>

        {/* MFY tanlanmagan bo'lsa bo'limlar ochilmaydi. */}
        {mahallaSlug && (
          <nav className="flex flex-col gap-2.5">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to || "index"}
                to={to ? `/${mahallaSlug}/${to}` : `/${mahallaSlug}`}
                end
                className={({ isActive }) =>
                  `flex w-full items-center gap-4 rounded-xl px-6 py-4 text-base font-medium transition-colors ${
                    isActive ? "bg-brand text-white" : "text-ink hover:bg-black/5"
                  }`
                }
              >
                <Icon className="size-6 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
