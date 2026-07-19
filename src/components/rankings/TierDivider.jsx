import {
  FaLayerGroup,
  FaTrash,
} from "react-icons/fa6";

export default function TierDivider({
  tier,
  onRemove,
}) {
  return (
    <div className="my-4 flex items-center gap-4">
      <div className="h-px flex-1 bg-blue-500/40" />

      <div className="flex items-center gap-3 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1">
        <FaLayerGroup
          size={12}
          className="text-blue-400"
        />

        <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
          Tier {tier}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="ml-2 text-zinc-500 hover:text-red-400 transition-colors"
          title="Remove tier"
        >
          <FaTrash size={11} />
        </button>
      </div>

      <div className="h-px flex-1 bg-blue-500/40" />
    </div>
  );
}