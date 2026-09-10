import schoolsData from "./data/schools.json";

/**
 * One row of `lib/data/schools.json` — a Tamil Nadu government school directory (2,322 unique
 * schools after de-duping identical name+district+block rows), uploaded once and checked into
 * the repo rather than fetched from a backend: it's static reference data, not something an
 * organizer edits, and shipping it as a bundled JSON keeps the attendee school field working
 * offline/without a round trip. Only ever loaded by the checkout route (see SchoolCombobox),
 * not the main event bundle.
 */
export interface School {
  name: string;
  /** e.g. "Acharapakkam" — the block/taluk-level area the school's own name doesn't always spell
   * out, shown as secondary text in the picker so two same-named schools in different towns are
   * still distinguishable. */
  district: string;
  /** e.g. "CHENGALPATTU" — the district. Despite the "district"-sounding name, the source sheet's
   * own column headers call the block-level column "District" and the actual district "Block" —
   * kept exactly as the source file labels them here rather than guessing and getting it
   * backwards; `SchoolCombobox` just displays both together regardless of which is which. */
  block: string;
  pincode: string;
}

export const SCHOOLS: School[] = schoolsData as School[];
