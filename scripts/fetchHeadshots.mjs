/**
 * scripts/fetchHeadshots.mjs
 *
 * One-time (or once-a-day, per Sleeper's own guidance) script that:
 *   1. Fetches Sleeper's full NFL player database (~5MB, ~6,000 players)
 *   2. Matches each player in src/data/players.json by normalized name + team
 *   3. Writes real headshot URLs back into players.json
 *
 * Run with:
 *   node scripts/fetchHeadshots.mjs
 *
 * Requires Node 18+ (built-in fetch). Run this from your machine - it needs
 * real internet access, which the environment that wrote this script did not
 * have.
 *
 * Players that don't confidently match (name collisions, DST entries, rookies
 * not yet in Sleeper's DB, etc.) are left with headshot: null - PlayerAvatar
 * already falls back to a colored initials circle for those, so nothing
 * breaks, it just won't have a real photo yet.
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYERS_PATH = path.join(__dirname, "..", "src", "data", "players.json");

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[.'']/g, "")
    .split(/\s+/)
    .filter((word) => !SUFFIXES.has(word))
    .join(" ")
    .trim();
}

async function main() {
  console.log("Reading players.json...");
  const raw = await readFile(PLAYERS_PATH, "utf-8");
  const players = JSON.parse(raw);

  console.log("Fetching Sleeper player database (~5MB, this can take a few seconds)...");
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) {
    throw new Error(`Sleeper API request failed: ${res.status} ${res.statusText}`);
  }
  const sleeperPlayers = await res.json();

  // Build a lookup: normalized full name -> list of sleeper entries with that name
  const byName = new Map();
  for (const sleeperId in sleeperPlayers) {
    const p = sleeperPlayers[sleeperId];
    if (!p?.first_name || !p?.last_name) continue;
    const key = normalizeName(`${p.first_name} ${p.last_name}`);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({ ...p, sleeper_id: sleeperId });
  }

  let matched = 0;
  let ambiguous = 0;
  let unmatched = 0;

  const updated = players.map((player) => {
    if (player.position === "DST") return player; // no per-player headshot for defenses

    const key = normalizeName(player.name);
    const candidates = byName.get(key);

    if (!candidates || candidates.length === 0) {
      unmatched++;
      return { ...player, headshot: null };
    }

    let match = candidates[0];
    if (candidates.length > 1) {
      // Disambiguate by team when there's a name collision
      const teamMatch = candidates.find(
        (c) => c.team?.toUpperCase() === player.team?.toUpperCase()
      );
      if (teamMatch) {
        match = teamMatch;
      } else {
        ambiguous++;
      }
    }

    matched++;
    return {
      ...player,
      headshot: `https://sleepercdn.com/content/nfl/players/${match.sleeper_id}.jpg`,
    };
  });

  await writeFile(PLAYERS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  console.log(`Done. Matched ${matched}/${players.length} players.`);
  if (ambiguous > 0) {
    console.log(`${ambiguous} had multiple name matches - picked the first (no team match found), double check those.`);
  }
  if (unmatched > 0) {
    console.log(`${unmatched} had no match at all (rookies not yet in Sleeper's DB, name spelling differences, or DSTs) - they'll fall back to initials avatars.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
