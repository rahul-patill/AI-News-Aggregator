export default function CuratorLog({ articleCount, categories, profile }) {
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber mb-3">
        Curator's Log
      </div>

      <div className="border-l-2 border-hairline pl-5 space-y-6">
        <div>
          <p className="font-display text-xl leading-snug text-ink">
            An editorial pass over the day's technical &amp; research feeds,
            ranked by relevance to what you track.
          </p>
          {profile && (
            <div className="mt-4 p-4 border border-hairline bg-ink/5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite mb-1">
                Curator: {profile.name}
              </p>
              <p className="font-mono text-[10px] text-ink-soft mb-2">
                {profile.title} • {profile.expertise_level}
              </p>
              <p className="font-serif text-[13px] leading-relaxed text-ink/80 italic">
                "{profile.background}"
              </p>
            </div>
          )}
        </div>

        <dl className="space-y-3 font-mono text-[12px]">
          <div className="flex justify-between border-b border-hairline pb-2">
            <dt className="text-graphite uppercase tracking-wide">Entries logged</dt>
            <dd className="text-ink">{String(articleCount).padStart(3, '0')}</dd>
          </div>
          <div className="flex justify-between border-b border-hairline pb-2">
            <dt className="text-graphite uppercase tracking-wide">Wire status</dt>
            <dd className="text-ink">Live</dd>
          </div>
        </dl>

        {categories?.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite mb-2">
              Beats covered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="font-mono text-[10px] uppercase tracking-wide text-ink-soft border border-hairline rounded-full px-2.5 py-1"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="font-mono text-[10.5px] leading-relaxed text-graphite border-t border-hairline pt-4">
          Scores reflect the model's estimate of relevance. Higher deflection,
          higher signal.
        </p>
      </div>
    </aside>
  )
}
