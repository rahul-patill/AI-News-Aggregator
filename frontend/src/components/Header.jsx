export default function Header() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="border-b border-hairline">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-[2.35rem] font-semibold tracking-tight text-ink leading-none">
            AI News Aggregator
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-graphite mt-2">
            Curated Intelligence Wire
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite hidden sm:block">
          {dateStr}
        </p>
      </div>
    </header>
  )
}
