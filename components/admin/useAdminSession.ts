"use client";

import { useCallback, useEffect, useState } from "react";
import { refreshAccessToken, type ApiResult } from "@/lib/api";
import { clearSession, loadSession, updateTokens, type StoredSession } from "@/lib/auth";

export function useAdminSession() {
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Reads localStorage once on mount — this can't happen in useState's initializer since that
    // would also run during server rendering, where localStorage doesn't exist and would
    // desync the client's first hydration render from the server's.
    setSession(loadSession("admin"));
  }, []);

  const withAuth = useCallback(
    async function withAuth<T>(fn: (token: string) => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
      if (!session) return { ok: false, status: 401, message: "Not signed in." };

      const first = await fn(session.accessToken);
      if (first.ok || first.status !== 401) return first;

      const refreshed = await refreshAccessToken(session.refreshToken);
      if (!refreshed.ok) {
        clearSession("admin");
        setExpired(true);
        return first;
      }
      updateTokens("admin", session, refreshed.data);
      setSession((current) => (current ? { ...current, accessToken: refreshed.data.access, refreshToken: refreshed.data.refresh } : current));
      return fn(refreshed.data.access);
    },
    [session],
  );

  const logout = useCallback(() => {
    clearSession("admin");
    setSession(null);
  }, []);

  return { session, loading: session === undefined, expired, withAuth, logout, setSession };
}
