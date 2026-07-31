import { ArticleCard } from './ArticleCard'

export function Feed({ articles }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
          No articles yet
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          Run the pipeline to scrape and curate today's AI news. Articles will appear here once they're ranked.
        </p>
      </div>
    )
  }

  return (
    <section>
      <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-text-tertiary mb-4 text-center">
        Ranked by relevance
      </p>
      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
