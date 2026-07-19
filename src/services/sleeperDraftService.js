const BASE_URL = "https://api.sleeper.app/v1";

/**
 * Returns the Sleeper player ids (as strings) of every player drafted so
 * far in the given draft. Sleeper's API is public and needs no auth —
 * this works out of the box, including for private leagues.
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
    .map((pick) => pick.player_id)
    .filter(Boolean)
    .map(String);
}