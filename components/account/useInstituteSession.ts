"use client";

import { useCallback, useEffect, useState } from "react";
import { refreshAccessToken, type ApiResult } from "@/lib/api";
import { clearSession, loadSession, updateTokens, type StoredSession } from "@/lib/auth";

/** Institute/school portal counterpart to components/admin/useAdminSession — same "load once on
 * mount, retry a 401 through a token refresh once" shape, just against the "institute" session
 * slot instead of "admin". Kept as its own hook rather than parameterizing the admin one so
 * neither ever has to import from the other's directory. */
export function useInstituteSession() {
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setSession(loadSession("institute"));
  }, []);

  const withAuth = useCallback(
    async function withAuth<T>(fn: (token: string) => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
      if (!session) return { ok: false, status: 401, message: "Not signed in." };

      const first = await fn(session.accessToken);
      if (first.ok || first.status !== 401) return first;

      const refreshed = await refreshAccessToken(session.refreshToken);
      if (!refreshed.ok) {
        clearSession("institute");
        setExpired(true);
        return first;
      }
      updateTokens("institute", session, refreshed.data);
      setSession((current) => (current ? { ...current, accessToken: refreshed.data.access, refreshToken: refreshed.data.refresh } : current));
      return fn(refreshed.data.access);
    },
    [session],
  );

  const logout = useCallback(() => {
    clearSession("institute");
    setSession(null);
  }, []);

  return { session, loading: session === undefined, expired, withAuth, logout, setSession };
}
