import { normalizeName } from "./espnDraftService";

const BASE_URL = "https://api.sleeper.app/v1";

/**
 * Returns every drafted pick so far in the given draft.
 *
 * Each pick comes back as { sleeperId, name, lastName, team }:
 *   - sleeperId: Sleeper's own player id (string), used to match against
 *     sleeperIdToId in useDraftMode - which itself is built by extracting
 *     ids out of players.json's `headshot` URLs.
 *   - name: normalized "firstname lastname" from the pick's metadata,
 *     used as a fallback match when a player has no headshot (and
 *     therefore no extractable sleeperId) - e.g. Kenneth Gainwell.
 *   - lastName / team: a second fallback tier for when Sleeper's first
 *     name doesn't match players.json exactly (nicknames, e.g. Sleeper
 *     may list "Kenny" where players.json has "Kenneth") - last name +
 *     NFL team is far less likely to drift than a first name is.
 *
 * Sleeper's API is public and needs no auth - this works out of the box,
 * including for private leagues.
 *
 * @param {string} draftId - the id from your draft URL, e.g.
 *   sleeper.com/draft/nfl/1124857482910... -> the long number at the end
 */
export async function fetchSleeperDraftedPlayerIds(draftId) {
  const res = await fetch(`${BASE_URL}/draft/${draftId}/picks`);

  if (!res.ok) {
    throw new Error(`Sleeper request failed (${res.status}). Double check your draft ID.`);
  }

  const picks = await res.json();

  return (picks || [])
    .map((pick) => {
      const sleeperId = pick.player_id != null ? String(pick.player_id) : null;

      const firstName = pick.metadata?.first_name ?? "";
      const lastName = pick.metadata?.last_name ?? "";
      const fullName = `${firstName} ${lastName}`.trim();
      const name = fullName ? normalizeName(fullName) : null;
      const team = pick.metadata?.team || null;

      return { sleeperId, name, lastName: lastName || null, team };
    })
    // Keep a pick as long as we have *something* to match it on - dropping
    // entries with no sleeperId (the old behavior) is exactly what silently
    // broke players missing a headshot.
    .filter((pick) => pick.sleeperId || pick.name);
}