import ArticleCard from './ArticleCard'

function LoadingState() {
  return (
    <div className="space-y-7 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="border-b border-hairline py-7 first:pt-0">
          <div className="flex items-start gap-4">
            <div className="w-8 h-4 bg-linen rounded shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-linen rounded w-3/4" />
              <div className="h-4 bg-linen rounded w-full" />
              <div className="h-4 bg-linen rounded w-2/3" />
              <div className="h-5 bg-linen rounded w-40 mt-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="border border-hairline rounded-md py-12 px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber mb-3">
        Wire interrupted
      </p>
      <p className="font-display text-lg text-ink mb-1">
        Couldn't reach the news feed.
      </p>
      <p className="font-body text-sm text-graphite mb-6 max-w-md mx-auto">
        {message || 'The server at localhost:8000 did not respond. Confirm it is running, then try again.'}
      </p>
      <button
        onClick={onRetry}
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink border border-ink rounded-full px-5 py-2 hover:bg-ink hover:text-paper transition-colors duration-200"
      >
        Retry
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="border border-hairline rounded-md py-12 px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite mb-3">
        No entries yet
      </p>
      <p className="font-display text-lg text-ink">
        The curator hasn't logged anything for this run.
      </p>
    </div>
  )
}

export default function Feed({ articles, status, error, onRetry }) {
  if (status === 'loading') return <LoadingState />
  if (status === 'error') return <ErrorState message={error} onRetry={onRetry} />
  if (!articles || articles.length === 0) return <EmptyState />

  return (
    <div>
      {articles.map((article, i) => (
        <ArticleCard key={article.url || i} article={article} index={i} />
      ))}
    </div>
  )
}
