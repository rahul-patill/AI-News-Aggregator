export function Header({ articleCount }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="mb-10 text-center">
      <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-accent mb-4">
        AI News Aggregator
      </p>
      <h1 className="font-display text-4xl font-bold text-text-primary tracking-tight leading-tight mb-3">
        Today's briefing
      </h1>
      <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
        {articleCount} articles scraped, summarized, and ranked by relevance using Gemini.
      </p>
      <div className="mt-5 pt-5 border-t border-glass-border">
        <span className="text-sm text-text-tertiary">{today}</span>
      </div>
    </header>
  )
}
