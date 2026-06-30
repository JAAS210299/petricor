'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import TextConHashtags from '@/components/TextConHashtags'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
}

interface TrendingTag {
  hashtag: string
  count: number
}

export default function BuscarPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const supabase = createClient()

  const isHashtag = query.trim().startsWith('#')

  useEffect(() => {
    if (query.trim()) handleSearch(query)
    loadTrending()
  }, [])

  async function loadTrending() {
    setLoadingTrending(true)
    const { data, error } = await supabase.rpc('get_trending_hashtags', { limit_count: 10 })
    if (!error && data) setTrending(data)
    setLoadingTrending(false)
  }

  async function handleSearch(value: string) {
    setQuery(value)
    setProfiles([])
    setPosts([])
    if (!value.trim()) return
    setLoading(true)

    if (value.trim().startsWith('#')) {
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, profiles(username, avatar_url)')
        .ilike('content', `%${value.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(30)
      setPosts(data ?? [])
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${value}%`)
        .limit(20)
      setProfiles(data ?? [])
    }

    setLoading(false)
  }

  function handleTrendingClick(tag: string) {
    handleSearch(tag)
    router.push(`/buscar?q=${encodeURIComponent(tag)}`, { scroll: false })
  }

  function clearSearch() {
    setQuery('')
    setProfiles([])
    setPosts([])
    router.push('/buscar', { scroll: false })
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          buscar
        </h1>

        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="usuario o #hashtag"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button onClick={clearSearch} className="text-xs transition-opacity hover:opacity-60"
              style={{ color: 'var(--text-subtle)' }}>
              limpiar
            </button>
          )}
        </div>

        {/* Trending — solo cuando no hay búsqueda activa */}
        {!query.trim() && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} style={{ color: '#60a5fa' }} />
              <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>
                tendencias de la semana
              </p>
            </div>

            {loadingTrending && (
              <p className="text-sm text-center mt-8 animate-pulse" style={{ color: 'var(--text-subtle)' }}>
                cargando tendencias...
              </p>
            )}

            {!loadingTrending && trending.length === 0 && (
              <p className="text-sm text-center mt-8" style={{ color: 'var(--text-subtle)' }}>
                aún no hay tendencias esta semana
              </p>
            )}

            <div className="flex flex-col gap-2">
              {trending.map((tag, i) => (
                <button
                  key={tag.hashtag}
                  onClick={() => handleTrendingClick(tag.hashtag)}
                  className="flex items-center justify-between rounded-xl p-3 text-left transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-4 text-right" style={{ color: 'var(--text-subtle)' }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>
                      {tag.hashtag}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                    {tag.count} {tag.count === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isHashtag && query.trim() && (
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            publicaciones con <span style={{ color: '#60a5fa' }}>{query.trim()}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-sm text-center mt-8 animate-pulse" style={{ color: 'var(--text-subtle)' }}>
              buscando...
            </p>
          )}

          {!loading && query && profiles.length === 0 && posts.length === 0 && (
            <p className="text-sm text-center mt-8" style={{ color: 'var(--text-subtle)' }}>
              no se encontraron resultados
            </p>
          )}

          {profiles.map(profile => (
            <Link
              key={profile.id}
              href={`/perfil/${profile.username}`}
              className="flex items-center gap-3 rounded-xl p-4 transition-opacity hover:opacity-70"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm" style={{ color: 'var(--text)' }}>@{profile.username}</span>
            </Link>
          ))}

          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => router.push(`/post/${post.id}`)}
              className="rounded-xl p-4 transition-opacity hover:opacity-70 cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {post.profiles?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  @{post.profiles?.username}
                </span>
              </div>
              {post.content && (
                <TextConHashtags
                  text={post.content}
                  style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}
                />
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}