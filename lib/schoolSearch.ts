import Fuse, { type IFuseOptions } from "fuse.js";
import { SCHOOLS, type School } from "./schools";

/**
 * Fuzzy (not literal-embedding-based semantic) search over `SCHOOLS` — tolerant of typos,
 * partial words, and word order ("chennai boys dav" still finds "DAV Boys Senior Secondary
 * School, Chennai"), without the latency/cost of an embeddings API call on every keystroke or
 * shipping a browser-side embedding model for what's ultimately a few thousand short strings.
 * `name` is weighted highest since that's almost always what someone actually types; `block`/
 * `district` (the town/district — see School's own docstring on the naming) let "coimbatore
 * matric" or similar location-qualified queries still surface the right school.
 */
const FUSE_OPTIONS: IFuseOptions<School> = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "district", weight: 0.18 },
    { name: "block", weight: 0.12 },
  ],
  threshold: 0.35,
  // Long, multi-clause school names ("ADHI PARASAKTHI NURSERY AND PRIMARY SCHOOL, L.ENDATHUR.")
  // mean the useful match is routinely nowhere near character 0 — without this, Fuse penalizes a
  // match purely for showing up late in the string, which is most of the time here.
  ignoreLocation: true,
  minMatchCharLength: 2,
  // Every field back for building the result's label — the label itself needs more than the
  // matched substring.
  includeScore: false,
};

// Built once, lazily — 2,322 records is small enough that indexing cost isn't worth paying at
// import time for a page that might never open this field at all.
let fuse: Fuse<School> | null = null;
function getFuse(): Fuse<School> {
  if (!fuse) fuse = new Fuse(SCHOOLS, FUSE_OPTIONS);
  return fuse;
}

const MAX_RESULTS = 40;

export function searchSchools(query: string): School[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return getFuse()
    .search(trimmed, { limit: MAX_RESULTS })
    .map((result) => result.item);
}
