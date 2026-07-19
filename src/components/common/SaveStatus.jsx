export default function SaveStatus({ status }) {
  if (status === "saving") {
    return (
      <div className="text-sm text-yellow-400 font-medium">
        Saving...
      </div>
    );
  }

  return (
    <div className="text-sm text-green-400 font-medium">
      ✓ Saved
    </div>
  );
}