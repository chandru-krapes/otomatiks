import { headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";

/** Shared hostname → subdomain → event resolution used by every route. */
export async function resolveEvent() {
  const headersList = await headers();
  const host = headersList.get("host");
  const subdomain = extractSubdomain(host);
  const event = subdomain ? await getEventBySlug(subdomain) : null;
  return { subdomain, event };
}
