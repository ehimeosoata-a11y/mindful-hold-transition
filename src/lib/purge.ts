/**
 * PURGE_ALL_DATA — global "Vaporize" sequence.
 *
 * Wipes every client-side trace of the user's narrative and dispatches a
 * prioritized DELETE to the Lagos residency endpoint. Intentionally
 * fire-and-forget on the network side: local destruction must never block
 * on remote acknowledgement.
 */
export async function PURGE_ALL_DATA(): Promise<void> {
  // 1. Local stores
  try { window.localStorage?.clear(); } catch { /* no-op */ }
  try { window.sessionStorage?.clear(); } catch { /* no-op */ }

  // 2. IndexedDB (best-effort across browsers)
  try {
    const anyIdb = indexedDB as IDBFactory & {
      databases?: () => Promise<{ name?: string }[]>;
    };
    if (typeof anyIdb.databases === "function") {
      const dbs = await anyIdb.databases();
      await Promise.all(
        (dbs ?? []).map(
          (d) =>
            new Promise<void>((resolve) => {
              if (!d?.name) return resolve();
              const req = indexedDB.deleteDatabase(d.name);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            }),
        ),
      );
    }
  } catch { /* no-op */ }

  // 3. Cache Storage (PWA shell)
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* no-op */ }

  // 4. Prioritized DELETE → Lagos-Residency-1.
  //    Uses fetch with keepalive so the request survives navigation.
  const endpoint =
    (import.meta.env.VITE_PURGE_ENDPOINT as string | undefined) ??
    "/api/lagos-residency-1/purge";
  try {
    void fetch(endpoint, {
      method: "DELETE",
      keepalive: true,
      headers: { "X-Priority": "high", "X-Residency": "lagos-1" },
    });
  } catch { /* no-op */ }
}
