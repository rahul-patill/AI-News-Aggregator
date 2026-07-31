import SignalMeter from './SignalMeter'

export default function ArticleCard({ article, index }) {
  const { title, summary, url, relevance_score, article_type, reasoning } = article

  return (
    <article className="group border-b border-hairline py-7 first:pt-0">
      <div className="flex items-start gap-4">
        <span className="font-mono text-[11px] text-graphite pt-1 w-8 shrink-0 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[1.4rem] leading-snug font-medium text-ink group-hover:text-amber transition-colors duration-200">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline decoration-1 underline-offset-4"
            >
              {title}
            </a>
          </h2>

          {summary && (
            <p className="font-body text-[15px] leading-relaxed text-ink-soft mt-2.5 max-w-[62ch]">
              {summary}
            </p>
          )}

          {reasoning && (
            <div className="mt-4 border-l-2 border-amber-soft pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber mb-1.5">
                Why this made the wire
              </p>
              <p className="font-display italic text-[14.5px] leading-relaxed text-ink-soft max-w-[58ch]">
                {reasoning}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <SignalMeter score={relevance_score} articleType={article_type} />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite hover:text-amber transition-colors duration-200"
            >
              Read source →
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
