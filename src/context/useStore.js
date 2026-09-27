import { useContext } from "react";
import { StoreContext } from "./store-context.js";

/** To'liq store API: { store, get, set, remove, clear } */
export const useStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore StoreProvider ichida ishlatilishi kerak");
  }

  return context;
};

/**
 * Faqat berilgan key qiymatini o'qish uchun qisqa yo'l.
 *   const user = useStoreValue("user");
 */
export const useStoreValue = (key) => {
  const { store } = useStore();
  return store[key];
};
