import { useCallback, useState } from "react";
import { StoreContext } from "./store-context.js";

/**
 * Global, xotirada (runtime) saqlanadigan key-value store.
 * localStorage'ga o'xshaydi, lekin qiymat o'zgarganda componentlar
 * qayta render bo'ladi.
 *
 *   const { set } = useStore();
 *   set("user", userData);
 *
 *   const user = useStoreValue("user");
 */
export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState({});

  const get = useCallback((key) => store[key], [store]);

  const set = useCallback((key, value) => {
    setStore((prev) => ({ ...prev, [key]: value }));
  }, []);

  const remove = useCallback((key) => {
    setStore((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clear = useCallback(() => setStore({}), []);

  return (
    <StoreContext.Provider value={{ store, get, set, remove, clear }}>
      {children}
    </StoreContext.Provider>
  );
};
