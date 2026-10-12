import { useEffect, useRef, useState } from "react";
import { apiBaseUrl } from "../config/api.js";

/**
 * Barcha yurishlarning jonli holati (SSE orqali).
 *
 * Nega `EventSource` emas: u custom header yubora olmaydi, ya'ni
 * tokenni URL'ga qo'yish kerak bo'lardi — u esa brauzer tarixi va
 * server loglariga tushadi. `fetch` bilan oqimni o'qisak, token
 * odatdagidek `Authorization` header'ida ketadi.
 *
 * Ulanish uzilsa, o'zi qayta ulanadi (brauzerning `EventSource`
 * mexanizmi bu yerda yo'q, shuning uchun qo'lda).
 */
export const useRegistrationStream = (isEnabled = true) => {
  const [runs, setRuns] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const abortRef = useRef(null);
  const retryRef = useRef(null);

  useEffect(() => {
    if (!isEnabled) return undefined;

    let stopped = false;

    const connect = async () => {
      if (stopped) return;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/registration/stream`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok || !response.body) throw new Error("ulanmadi");

        setIsConnected(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done || stopped) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE xabarlari bo'sh qator bilan ajratiladi.
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            // ": ping" — ulanishni tirik ushlab turish uchun, e'tibor
            // bermaymiz.
            if (chunk.startsWith(":")) continue;

            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data:"));

            if (!dataLine) continue;

            try {
              const payload = JSON.parse(dataLine.slice(5).trim());
              if (payload.runs) setRuns(payload.runs);
            } catch {
              // Buzilgan xabar — tashlab yuboramiz.
            }
          }
        }
      } catch {
        // Uzilish yoki xato — pastda qayta ulanamiz.
      }

      setIsConnected(false);

      // Qayta ulanish: darhol emas, 3 soniyadan keyin — server
      // qayta ishga tushayotgan bo'lsa bo'sh urinishlar ko'paymasin.
      if (!stopped) {
        retryRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      stopped = true;
      abortRef.current?.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [isEnabled]);

  return { runs, isConnected };
};
