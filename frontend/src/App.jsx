import { useEffect, useState, useCallback, useMemo } from 'react'
import Header from './components/Header'
import CuratorLog from './components/CuratorLog'
import Feed from './components/Feed'

export default function App() {
  const [articles, setArticles] = useState([])
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [newsRes, profileRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/profile')
      ])
      if (!newsRes.ok) throw new Error(`Server responded with ${newsRes.status}`)
      
      const newsData = await newsRes.json()
      const profileData = await profileRes.json()
      
      const list = Array.isArray(newsData) ? newsData : newsData.articles || []
      setArticles(list)
      setProfile(profileData.profile || null)
      setArticles(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const categories = useMemo(() => {
    const set = new Set(
      articles.map((a) => a.article_type).filter(Boolean)
    )
    return Array.from(set)
  }, [articles])

  return (
    <div className="min-h-screen paper-texture">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,30%)_1px_minmax(0,1fr)] gap-8 lg:gap-10">
          <CuratorLog articleCount={articles.length} categories={categories} profile={profile} />
          <div className="hidden lg:block bg-hairline" />
          <section>
            <Feed
              articles={articles}
              status={status}
              error={error}
              onRetry={fetchData}
            />
          </section>
        </div>
      </main>
      <footer className="border-t border-hairline mt-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
            Signal — end of transmission
          </p>
        </div>
      </footer>
    </div>
  )
}
