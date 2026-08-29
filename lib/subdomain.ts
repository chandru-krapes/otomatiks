/**
 * Resolves the event subdomain from an incoming HTTP `Host` header.
 *
 * Local testing only cares about the two-label case, e.g.
 * `robotica.localhost:3000` -> `robotica`. This intentionally stays
 * generic (no `if (subdomain === "robotica")` branching) so the same
 * logic keeps working as more events/subdomains are added, per
 * AGENTS.md "Subdomain-Based Rendering".
 */

const RESERVED_SUBDOMAINS = new Set(["www", "localhost", "app", "api"]);

export function extractSubdomain(host: string | null | undefined): string | null {
  if (!host) return null;

  // Strip port (":3000") and lowercase for consistent comparisons.
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname) return null;

  const labels = hostname.split(".");

  // "localhost" or a bare IP has no subdomain to resolve.
  if (labels.length < 2) return null;

  const candidate = labels[0];

  if (!candidate || RESERVED_SUBDOMAINS.has(candidate)) return null;

  return candidate;
}
