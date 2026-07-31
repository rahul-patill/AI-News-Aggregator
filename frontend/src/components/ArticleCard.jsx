function scoreColor(score) {
  if (score >= 7) return 'bg-score-high'
  if (score >= 4) return 'bg-score-mid'
  return 'bg-score-low'
}

function stripeColor(score) {
  if (score >= 7) return 'bg-accent'
  if (score >= 4) return 'bg-text-tertiary'
  return 'bg-score-low'
}

function formatSource(type) {
  const labels = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    youtube: 'YouTube',
  }
  return labels[type] || type
}

export function ArticleCard({ article }) {
  const { title, summary, url, relevance_score, article_type, reasoning } = article

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-glass-border bg-surface/40 hover:bg-surface/70 hover:border-border-hover transition-all duration-200 ease-out overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
    >
      <div className="flex">
        {/* Relevance stripe */}
        <div className={`w-[3px] shrink-0 ${stripeColor(relevance_score)} transition-all duration-300`} />

        <div className="flex-1 p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-2.5">
            <h2 className="font-display text-[0.95rem] font-semibold text-text-primary leading-snug group-hover:text-accent-hover transition-colors duration-200">
              {title}
            </h2>
            <span className={`shrink-0 font-display text-[0.7rem] font-bold px-2.5 py-1 rounded-md text-white/90 ${scoreColor(relevance_score)}`}>
              {relevance_score?.toFixed(1)}
            </span>
          </div>

          {/* Summary */}
          <p className="text-[0.84rem] text-text-secondary leading-relaxed mb-3.5">
            {summary}
          </p>

          {/* Footer */}
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-text-tertiary">
              {formatSource(article_type)}
            </span>
            {reasoning && (
              <p className="text-[0.72rem] text-text-tertiary/80 italic text-right max-w-sm leading-snug">
                {reasoning}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
