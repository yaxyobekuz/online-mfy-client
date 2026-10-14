/**
 * Chart'lar uchun ranglar — loyihaning CSS tokenlaridan.
 *
 * Recharts to'g'ridan-to'g'ri CSS o'zgaruvchilarini chizishda
 * ba'zan noto'g'ri o'lchaydi, shuning uchun aniq HEX qiymatlar
 * [index.css] dagi `--color-*` bilan bir xil saqlanadi.
 */
export const C = {
  brand: "#0088ff",
  ok: "#34c759",
  bad: "#c73434",
  warn: "#c77934",
  pending: "#c79434",
  ink: "#333333",
  muted: "#777777",
  panel: "#f5f5f5",
  canvas: "#ffffff",
  // Qo'shimcha palitra — ko'p bo'lakli chartlar uchun.
  violet: "#7c5cff",
  teal: "#17b8a6",
  pink: "#e85d9e",
  amber: "#f0a52e",
};

// Doira/segment chartlar uchun navbatma-navbat ranglar.
export const PALETTE = [
  C.brand,
  C.ok,
  C.warn,
  C.violet,
  C.teal,
  C.pink,
  C.amber,
  C.bad,
  C.pending,
  C.muted,
];

// Tooltip uchun umumiy ko'rinish.
export const tooltipStyle = {
  background: C.canvas,
  border: `1px solid ${C.panel}`,
  borderRadius: 12,
  fontSize: 13,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
  padding: "8px 12px",
};
