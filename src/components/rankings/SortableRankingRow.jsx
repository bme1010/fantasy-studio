import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import RankingRow from "./RankingRow";

export default function SortableRankingRow({
  player,
  rank,
  tier,
  selected,
  onClick,

  hasTierBreak,
  toggleTierBreak,
  removeTierBreak,
  onDraftPlayer,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <RankingRow
        player={player}
        rank={rank}
        tier={tier}
        selected={selected}
        onClick={onClick}
        hasTierBreak={hasTierBreak}
        toggleTierBreak={toggleTierBreak}
        removeTierBreak={removeTierBreak}
        onDraftPlayer={onDraftPlayer}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
}