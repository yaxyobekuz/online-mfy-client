import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { RUN_STATUS_LABELS } from "../config/registration-labels.js";

/*
  Asosiy sahifaning PDF hisoboti. Brauzerning o'zida tuziladi: serverdan
  faqat jamlama (JSON) olinadi.

  Shrift: Inter (SIL OFL 1.1, public/fonts/OFL.txt). jsPDF ning standart
  shriftlari o‘ va g‘ dagi maxsus belgilarni hamda kirill yozuvini
  chizolmaydi, shuning uchun Inter'ning kichraytirilgan nusxasi ishlatiladi.
*/

const FONT_FILES = [
  { style: "normal", file: "Inter-Regular.ttf" },
  { style: "bold", file: "Inter-SemiBold.ttf" },
];

// Ilova ranglari (index.css) bilan bir xil.
const COLORS = {
  ink: [51, 51, 51],
  muted: [119, 119, 119],
  panel: [245, 245, 245],
  white: [255, 255, 255],
  brand: [0, 136, 255],
  ok: [52, 199, 89],
  bad: [199, 52, 52],
  warn: [199, 121, 52],
};

const PAGE_WIDTH = 210;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Son: 2125 -> "2 125". Locale'ga bog'liq emas, shuning uchun qo'lda.
const formatCount = (value) =>
  String(Math.round(value ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const percentOf = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const formatDuration = (ms) => {
  const totalSeconds = Math.round((ms ?? 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) return `${hours} soat ${minutes} daqiqa`;
  if (minutes) return `${minutes} daqiqa ${seconds} soniya`;
  return `${seconds} soniya`;
};

const TASHKENT_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// 17/10/2026, 22:16 -> 17.10.2026 22:16
const formatDateTime = (iso) =>
  iso
    ? TASHKENT_DATE_TIME.format(new Date(iso)).replace(/\//g, ".").replace(",", "")
    : "—";

const bytesToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

// Shriftlar faqat PDF birinchi marta so'ralganda yuklanadi va keshda
// turadi — asosiy sahifa hajmiga ta'sir qilmaydi.
let fontsPromise = null;

const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_FILES.map(async ({ style, file }) => {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
        if (!response.ok) throw new Error(`Shrift yuklanmadi: ${file}`);
        return { style, file, data: bytesToBase64(await response.arrayBuffer()) };
      }),
    ).catch((error) => {
      fontsPromise = null;
      throw error;
    });
  }
  return fontsPromise;
};

const registerFonts = (doc, fonts) => {
  for (const { style, file, data } of fonts) {
    doc.addFileToVFS(file, data);
    doc.addFont(file, "Inter", style);
  }
};

const setText = (doc, { style = "normal", size, color }) => {
  doc.setFont("Inter", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

// Qiymat kengligiga sig'masa, shrift kichrayadi (masalan "12 soat 45 daqiqa").
const fitValue = (doc, text, maxWidth, maxSize) => {
  let size = maxSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > 9) {
    size -= 1;
    doc.setFontSize(size);
  }
};

const drawHeader = (doc, report) => {
  const run = report.run;

  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, PAGE_WIDTH, 42, "F");
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 42, PAGE_WIDTH, 2, "F");

  setText(doc, { size: 8, color: [158, 201, 255] });
  doc.text("ONLAYN MAHALLA", MARGIN, 13);

  setText(doc, { style: "bold", size: 20, color: COLORS.white });
  doc.text("Ro'yxatga olish hisoboti", MARGIN, 23);

  setText(doc, { size: 12, color: COLORS.white });
  doc.text(report.mahallaName ?? "Mahalla aniqlanmagan", MARGIN, 31);

  const meta = [
    `Yaratildi: ${formatDateTime(report.generatedAt)}`,
    run ? `Boshlangan: ${formatDateTime(run.startedAt)}` : null,
    run ? `Holat: ${RUN_STATUS_LABELS[run.status] ?? run.status}` : "Yurish boshlanmagan",
  ]
    .filter(Boolean)
    .join("   ·   ");

  setText(doc, { size: 8.5, color: [207, 207, 207] });
  doc.text(meta, MARGIN, 38);
};

const drawTile = (doc, { x, y, w, h, label, value, sub, tone, valueSize = 16 }) => {
  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "F");

  setText(doc, { size: 8.5, color: COLORS.muted });
  doc.text(label, x + 5, y + 8);

  setText(doc, { style: "bold", size: valueSize, color: COLORS[tone] });
  fitValue(doc, value, w - 10, valueSize);
  doc.text(value, x + 5, y + 19);

  setText(doc, { size: 8, color: COLORS.muted });
  doc.text(sub, x + 5, y + 24);
};

const drawSection = (doc, title, y) => {
  setText(doc, { style: "bold", size: 10, color: COLORS.ink });
  doc.text(title, MARGIN, y);
};

const drawSummary = (doc, report) => {
  const { people, timeSpentMs } = report;
  const reviewed = Math.max(0, people.total - people.pending);
  const otherOrExisting = people.exists + people.movedAway;

  drawSection(doc, "Asosiy ko'rsatkichlar", 56);

  const row1 = { y: 61, h: 27, w: 58 };
  const row2 = { y: 92, h: 27, w: 89 };

  drawTile(doc, {
    x: MARGIN,
    ...row1,
    label: "Sarflangan umumiy vaqt",
    value: formatDuration(timeSpentMs),
    sub: "so'rovlar davomiyligi yig'indisi",
    tone: "ink",
    valueSize: 14,
  });
  drawTile(doc, {
    x: MARGIN + 62,
    ...row1,
    label: "Ma'lumotlari olingan aholi",
    value: `${formatCount(people.total)} ta`,
    sub: `ko'rib chiqildi: ${formatCount(reviewed)} ta`,
    tone: "ink",
  });
  drawTile(doc, {
    x: MARGIN + 124,
    ...row1,
    label: "Ro'yxatga olingan aholi",
    value: `${formatCount(people.added)} ta`,
    sub: `aholining ${percentOf(people.added, people.total)}%`,
    tone: "ok",
  });
  drawTile(doc, {
    x: MARGIN,
    ...row2,
    label: "Boshqa MFY yoki allaqachon ro'yxatda",
    value: `${formatCount(otherOrExisting)} ta`,
    sub: `boshqa MFY da: ${formatCount(people.movedAway)} · avvaldan mavjud: ${formatCount(people.exists)}`,
    tone: "warn",
  });
  drawTile(doc, {
    x: MARGIN + 95,
    ...row2,
    label: "Ro'yxatga olib bo'lmagan (xato)",
    value: `${formatCount(people.failed)} ta`,
    sub: `aholining ${percentOf(people.failed, people.total)}%`,
    tone: "bad",
  });
};

const drawHomes = (doc, report) => {
  const { homes } = report;

  setText(doc, { size: 9.5, color: COLORS.ink });
  doc.text(
    `Xonadonlar: ${formatCount(homes.done)} / ${formatCount(homes.total)} ta (${homes.percent}%)`,
    MARGIN,
    126,
  );

  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(MARGIN, 130, CONTENT_WIDTH, 2.5, 1.25, 1.25, "F");
  doc.setFillColor(...COLORS.brand);
  const fill = Math.max(0, Math.min(100, homes.percent));
  if (fill > 0) {
    doc.roundedRect(MARGIN, 130, (CONTENT_WIDTH * fill) / 100, 2.5, 1.25, 1.25, "F");
  }
};

const drawStreetBreakdown = (doc, report) => {
  const streets = report.byStreet ?? [];
  const totalAdded = report.people.added;

  drawSection(doc, "Ko'chalar kesimida ro'yxatga olingan aholi", 142);

  // Yurish hali boshlanmagan yoki ko'cha ma'lumoti yo'q bo'lsa —
  // bo'sh jadval o'rniga qisqa izoh.
  if (!streets.length) {
    setText(doc, { size: 9.5, color: COLORS.muted });
    doc.text("Ko'chalar bo'yicha ma'lumot hali mavjud emas.", MARGIN, 150);
    return;
  }

  const row = (street) => [
    street.streetName,
    {
      content: formatCount(street.added),
      styles: { textColor: COLORS.ok, fontStyle: "bold" },
    },
    `${percentOf(street.added, totalAdded)}%`,
  ];

  autoTable(doc, {
    startY: 146,
    // Pastki chegara — footer chizig'i (y=284) ustiga qatorlar
    // tushmasligi uchun bo'sh joy qoldiramiz.
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [
      [
        "Ko'cha",
        { content: "Ro'yxatga olingan", styles: { halign: "right" } },
        { content: "Ulushi", styles: { halign: "right" } },
      ],
    ],
    body: streets.map(row),
    foot: [
      [
        "Jami",
        { content: formatCount(totalAdded), styles: { halign: "right" } },
        { content: `${totalAdded > 0 ? 100 : 0}%`, styles: { halign: "right" } },
      ],
    ],
    styles: {
      font: "Inter",
      fontSize: 9.5,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: COLORS.ink,
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: COLORS.ink, textColor: COLORS.white, fontStyle: "bold" },
    footStyles: { fillColor: COLORS.panel, textColor: COLORS.ink, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 40 },
      2: { halign: "right", cellWidth: 28 },
    },
  });
};

const drawFooter = (doc) => {
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(230, 230, 230);
    doc.line(MARGIN, 284, PAGE_WIDTH - MARGIN, 284);

    setText(doc, { size: 8, color: COLORS.muted });
    doc.text("Onlayn mahalla · Ro'yxatga olish hisoboti", MARGIN, 289);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, 289, { align: "right" });
  }
};

/**
 * Hisobotning barcha sahifalarini `doc` ga chizadi. Shriftlar oldindan
 * `registerFonts` orqali ro'yxatdan o'tgan bo'lishi kerak.
 */
export const renderDashboardReport = (doc, report) => {
  drawHeader(doc, report);
  drawSummary(doc, report);
  drawHomes(doc, report);
  drawStreetBreakdown(doc, report);
  drawFooter(doc);
  return doc;
};

const fileNameFor = (report) => {
  const slug =
    (report.mahallaName ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mahalla";

  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(
    new Date(report.generatedAt),
  );

  return `hisobot-${slug}-${day}.pdf`;
};

/** Hisobotni PDF qilib yuklab oladi. */
export const downloadDashboardReport = async (report) => {
  const fonts = await loadFonts();

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  registerFonts(doc, fonts);
  renderDashboardReport(doc, report);

  doc.save(fileNameFor(report));
};
