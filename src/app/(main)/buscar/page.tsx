'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, TrendingUp, SlidersHorizontal, X } from 'lucide-react'
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

  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false)
  const [filterUsername, setFilterUsername] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const supabase = createClient()

  const isHashtag = query.trim().startsWith('#')
  const hasActiveFilters = !!(filterUsername || filterDateFrom || filterDateTo)

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
    if (!value.trim() && !hasActiveFilters) return
    setLoading(true)

    const isTag = value.trim().startsWith('#')

    // Si hay filtros de fecha/usuario activos, siempre buscamos posts (no perfiles)
    if (isTag || hasActiveFilters) {
      let q = supabase
        .from('posts')
        .select('id, content, created_at, media_url, media_type, profiles!inner(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (value.trim()) {
        q = q.ilike('content', `%${value.trim()}%`)
      }
      if (filterUsername.trim()) {
        q = q.ilike('profiles.username', `%${filterUsername.trim()}%`)
      }
      if (filterDateFrom) {
        q = q.gte('created_at', new Date(filterDateFrom).toISOString())
      }
      if (filterDateTo) {
        const end = new Date(filterDateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data, error } = await q
      if (error) console.error(error)
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

  function clearFilters() {
    setFilterUsername('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  function applyFilters() {
    handleSearch(query)
    setShowFilters(false)
  }

  const showResultsView = query.trim() || hasActiveFilters

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          buscar
        </h1>

        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="transition-opacity hover:opacity-60 shrink-0"
            style={{ color: hasActiveFilters ? '#60a5fa' : 'var(--text-subtle)' }}
          >
            <SlidersHorizontal size={15} />
          </button>
          {query && (
            <button onClick={clearSearch} className="text-xs transition-opacity hover:opacity-60 shrink-0"
              style={{ color: 'var(--text-subtle)' }}>
              limpiar
            </button>
          )}
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>
                filtros avanzados
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs flex items-center gap-1 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-subtle)' }}>
                  <X size={11} /> limpiar filtros
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>
                  usuario específico
                </label>
                <input
                  type="text"
                  placeholder="username"
                  value={filterUsername}
                  onChange={e => setFilterUsername(e.target.value)}
                  className="w-full text-sm outline-none rounded-lg px-3 py-2"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>
                    desde
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full text-sm outline-none rounded-lg px-3 py-2"
                    style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>
                    hasta
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full text-sm outline-none rounded-lg px-3 py-2"
                    style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>

              <button
                onClick={applyFilters}
                className="text-sm py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--text)', color: 'var(--bg)' }}
              >
                aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Trending — solo si no hay búsqueda ni filtros activos */}
        {!showResultsView && (
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

        {hasActiveFilters && (
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            {posts.length} resultado{posts.length !== 1 ? 's' : ''} con filtros aplicados
          </p>
        )}

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-sm text-center mt-8 animate-pulse" style={{ color: 'var(--text-subtle)' }}>
              buscando...
            </p>
          )}

          {!loading && showResultsView && profiles.length === 0 && posts.length === 0 && (
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
              {post.media_url && post.media_type === 'image' && (
                <img src={post.media_url} alt="imagen" loading="lazy" className="w-full rounded-lg mt-2 object-cover max-h-40" />
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