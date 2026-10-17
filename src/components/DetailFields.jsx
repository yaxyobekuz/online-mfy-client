/*
  Ba'tafsil oynalari uchun umumiy qismlar (odam, fuqaro, xonadon).

  `dl`/`dt`/`dd` ataylab ishlatilmaydi: HeroUI modal ichida ularga
  o'z ranglarini beradi (navbatma-navbat ko'k, sariq...) va ro'yxat
  ola-bula bo'lib ko'rinardi. Oddiy `div` bunday uslubga tushmaydi.
*/
export const Field = ({ label, value, mono }) => (
  <div className="min-w-0">
    <p className="text-xs text-muted">{label}</p>
    <p className={`truncate text-sm text-ink ${mono ? "font-mono" : ""}`}>
      {value ?? "—"}
    </p>
  </div>
);

export const Section = ({ title, children }) => (
  <div className="rounded-xl bg-panel p-4">
    <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
      {title}
    </h4>
    {children}
  </div>
);

export const Json = ({ data }) => (
  <pre className="max-h-64 overflow-auto rounded-lg bg-neutral-950 px-3 py-2 font-mono text-xs leading-relaxed text-white/80">
    {JSON.stringify(data, null, 2)}
  </pre>
);
