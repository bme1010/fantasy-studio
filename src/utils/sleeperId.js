/**
 * Your players.json headshot URLs look like:
 *   https://sleepercdn.com/content/nfl/players/9221.jpg
 * The number in there IS Sleeper's player id — so we can pull it out and use
 * it for exact-match syncing instead of guessing by name.
 */
export function getSleeperIdFromHeadshot(headshotUrl) {
  if (!headshotUrl) return null;
  const match = headshotUrl.match(/players\/(\d+)\.jpg/);
  return match ? match[1] : null;
}