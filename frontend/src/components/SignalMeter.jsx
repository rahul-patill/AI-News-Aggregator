// Normalizes a score that may arrive as 0-1, 0-10, or 0-100 into a 0-100 scale.
function normalize(score) {
  if (score == null || isNaN(score)) return 0
  if (score <= 1) return score * 100
  if (score <= 10) return score * 10
  return score
}

export default function SignalMeter({ score, articleType }) {
  const value = normalize(score)
  const clamped = Math.max(0, Math.min(100, value))
  // Needle sweeps across a 0-100 horizontal track, arriving at the % position.
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5)

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-44 shrink-0">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
          {articleType || 'General'}
        </span>
        <span className="font-mono text-[11px] text-amber font-medium">
          RANK: {clamped.toFixed(0)}
        </span>
      </div>

      <div className="relative h-5 flex items-center">
        {/* tick track */}
        <div className="absolute left-0 right-0 h-px bg-hairline top-1/2 -translate-y-1/2" />
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-1/2 -translate-y-1/2 bg-hairline"
            style={{
              left: `${t}%`,
              width: '1px',
              height: t % 20 === 0 ? '10px' : '5px',
            }}
          />
        ))}
        {/* needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-[left] duration-500 ease-out"
          style={{ left: `${clamped}%` }}
        >
          <div className="w-[2px] h-[14px] bg-amber rounded-full" />
        </div>
      </div>
    </div>
  )
}
