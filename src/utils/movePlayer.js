export function movePlayer(players, oldIndex, newIndex) {
  if (
    oldIndex < 0 ||
    oldIndex >= players.length ||
    newIndex < 0 ||
    newIndex >= players.length ||
    oldIndex === newIndex
  ) {
    return players;
  }

  const updated = [...players];
  const [movedPlayer] = updated.splice(oldIndex, 1);
  updated.splice(newIndex, 0, movedPlayer);

  return updated;
}