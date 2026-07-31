import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { ProfileCard } from './components/ProfileCard'
import { Feed } from './components/Feed'

export default function App() {
  const [articles, setArticles] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsRes, profileRes] = await Promise.all([
          fetch('/api/news'),
          fetch('/api/profile'),
        ])
        const newsData = await newsRes.json()
        const profileData = await profileRes.json()

        setArticles(newsData.articles || [])
        setProfile(profileData.profile || null)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-glass-border border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading your briefing…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center px-6 sm:px-10 lg:px-16 py-14 pb-24">
      <div className="w-full max-w-[780px]">
        <Header articleCount={articles.length} />
        <ProfileCard profile={profile} />
        <Feed articles={articles} />
      </div>
    </div>
  )
}
