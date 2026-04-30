const THRESHOLD = 10;

export default function DemandBadge({ views }: { views: number }) {
  if (views < THRESHOLD) return null;
  return (
    <p className="text-sm text-gray-400">
      👁 {views} people viewed this today
    </p>
  );
}
