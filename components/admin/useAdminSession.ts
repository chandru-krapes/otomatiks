"use client";

import { useCallback, useEffect, useState } from "react";
import { refreshAccessToken, type ApiResult } from "@/lib/api";
import { clearSession, loadSession, updateTokens, type StoredSession } from "@/lib/auth";

/**
 * Session plumbing shared by every admin section: loads the "admin" session
 * slot (see lib/auth.ts), and wraps a call against lib/adminApi.ts so a
 * request that comes back 401 (the 30-minute access token expired — same
 * token lifetime as the booking dashboard, see components/account/
 * BookingDashboard.tsx) transparently refreshes and retries once before
 * giving up and forcing a re-login, instead of every section reimplementing
 * that dance.
 */
export function useAdminSession() {
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
