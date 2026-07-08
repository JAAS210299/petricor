'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Heart, MessageCircle, TrendingUp, Mic, Video, SlidersHorizontal, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TextConHashtags from '@/components/TextConHashtags'
import LazyImage from '@/components/LazyImage'

interface Props {
  initialPosts: Post[]
}

export interface Profile {
  id?: string
  username: string
  avatar_url: string | null
  bio?: string | null
}

export interface Post {
  id: string
  content: string | null
  created_at?: string
  media_url: string | null
  media_type: string | null
  image_url?: string | null
  user_id?: string
  profiles: Profile | null
  likes?: { id: string }[] | null
  comments?: { id: string }[] | null
}

type PostRow = Omit<Post, 'profiles'> & {
  profiles: Profile | Profile[] | null
}

interface TrendingTag {
  hashtag: string
  count: number
}

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #1e3a5f, #0f172a)',
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #0d1b2a, #1b263b)',
  'linear-gradient(135deg, #162032, #1e2d3d)',
  'linear-gradient(135deg, #0a1628, #1c2c3e)',
]

function countRows(rows: unknown) {
  return Array.isArray(rows) ? rows.length : 0
}

function normalizeProfile(profile: Profile | Profile[] | null | undefined) {
  return Array.isArray(profile) ? profile[0] ?? null : profile ?? null
}

function normalizePost(post: PostRow): Post {
  return {
    ...post,
    profiles: normalizeProfile(post.profiles),
  }
}

export default function ExplorarClient({ initialPosts }: Props) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(Profile | Post)[]>([])
  const [searchType, setSearchType] = useState<'users' | 'posts' | null>(null)
  const [loading, setLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [loadingTrending, setLoadingTrending] = useState(true)

  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false)
  const [filterUsername, setFilterUsername] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const hasActiveFilters = !!(filterUsername || filterDateFrom || filterDateTo)

  useEffect(() => {
    let cancelled = false

    async function loadTrending() {
      const { data, error } = await supabase.rpc('get_trending_hashtags', { limit_count: 10 })
      if (cancelled) return

      if (!error && data) setTrending(data)
      setLoadingTrending(false)
    }

    loadTrending()

    return () => {
      cancelled = true
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [supabase])

  async function handleSearch(value: string) {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }

    setQuery(value)
    if (!value.trim() && !hasActiveFilters) { setSearchResults([]); setSearchType(null); return }
    setLoading(true)

    const isTag = value.trim().startsWith('#')

    if (isTag || hasActiveFilters) {
      let q = supabase
        .from('posts')
        .select('id, content, created_at, media_url, media_type, profiles!inner(username, avatar_url), likes(id), comments(id)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (value.trim()) q = q.ilike('content', `%${value.trim()}%`)
      if (filterUsername.trim()) q = q.ilike('profiles.username', `%${filterUsername.trim()}%`)
      if (filterDateFrom) q = q.gte('created_at', new Date(filterDateFrom).toISOString())
      if (filterDateTo) {
        const end = new Date(filterDateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data, error } = await q
      if (error) console.error(error)
      setSearchResults(data?.map(post => normalizePost(post as PostRow)) ?? [])
      setSearchType('posts')
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${value}%`)
        .limit(20)
      setSearchResults(data ?? [])
      setSearchType('users')
    }
    setLoading(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 350)
  }

  function handleTrendingClick(tag: string) {
    handleSearch(tag)
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

  function clearAll() {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }

    setQuery('')
    setSearchResults([])
    setSearchType(null)
    clearFilters()
  }

  const showSearch = query.trim().length > 0 || hasActiveFilters

  return (
    <div>
      {/* Buscador */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Search size={15} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="buscar usuarios o #hashtags..."
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
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
        {(query || hasActiveFilters) && (
          <button onClick={clearAll} style={{ color: 'var(--text-subtle)', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>×</button>
        )}
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
              <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>usuario específico</label>
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
                <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>desde</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="w-full text-sm outline-none rounded-lg px-3 py-2"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs block mb-1" style={{ color: 'var(--text-subtle)' }}>hasta</label>
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
      {!showSearch && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} style={{ color: '#60a5fa' }} />
            <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>tendencias de la semana</p>
          </div>

          {loadingTrending && (
            <p className="text-sm text-center py-4 animate-pulse" style={{ color: 'var(--text-subtle)' }}>cargando...</p>
          )}

          {!loadingTrending && trending.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {trending.slice(0, 6).map(tag => (
                <button
                  key={tag.hashtag}
                  onClick={() => handleTrendingClick(tag.hashtag)}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#60a5fa' }}
                >
                  {tag.hashtag} · {tag.count}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultados búsqueda */}
      {showSearch && (
        <div className="flex flex-col gap-3">
          {loading && <p className="text-sm text-center py-6 animate-pulse" style={{ color: 'var(--text-subtle)' }}>buscando...</p>}
          {!loading && searchResults.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-subtle)' }}>sin resultados</p>
          )}

          {searchType === 'users' && searchResults.map(result => {
            const profile = result as Profile

            return (
              <Link key={profile.id} href={`/perfil/${profile.username}`}
                className="flex items-center gap-3 rounded-2xl p-4 transition-opacity hover:opacity-70"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>@{profile.username}</p>
                  {profile.bio && <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{profile.bio}</p>}
                </div>
              </Link>
            )
          })}

          {searchType === 'posts' && searchResults.map(result => {
            const post = result as Post

            return (
              <div key={post.id} onClick={() => router.push(`/post/${post.id}`)}
                className="rounded-2xl p-4 cursor-pointer transition-opacity hover:opacity-70"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                      {post.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>@{post.profiles?.username}</span>
                </div>
                {post.content && (
                  <TextConHashtags text={post.content} style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }} />
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                    <Heart size={11} /> {countRows(post.likes)}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                    <MessageCircle size={11} /> {countRows(post.comments)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grid populares */}
      {!showSearch && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} style={{ color: '#60a5fa' }} />
            <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>populares</p>
          </div>

          {initialPosts.length === 0 && (
            <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
              aún no hay publicaciones para explorar
            </p>
          )}

          {/* Grid variado estilo Instagram */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridAutoFlow: 'dense', gap: '3px', borderRadius: '12px', overflow: 'hidden' }}>
            {initialPosts.map((post, index) => {
              const likeCount = countRows(post.likes)
              const hasImage = post.media_url && post.media_type === 'image'
              const hasLegacyImage = post.image_url && !post.media_url
              const hasVideo = post.media_url && post.media_type === 'video'
              const hasAudio = post.media_url && post.media_type === 'audio'
              const username = post.profiles?.username ?? ''
              const avatarUrl = post.profiles?.avatar_url
              const gradientBg = GRADIENT_COLORS[index % GRADIENT_COLORS.length]

              // Cada 7 posts, el primero ocupa 2 columnas y 2 filas — solo si hay suficientes posts para que tenga sentido
              const isBig = initialPosts.length >= 9 && index % 7 === 0
              const gridStyle = isBig
                ? { gridColumn: 'span 2', gridRow: 'span 2' }
                : {}

              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  style={{
                    position: 'relative',
                    aspectRatio: isBig ? 'auto' : '1',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: gradientBg,
                    minHeight: isBig ? '200px' : '120px',
                    ...gridStyle,
                  }}
                >
                  {/* Contenido */}
                  {(hasImage || hasLegacyImage) && (
                    <LazyImage
                      src={(hasImage ? post.media_url : post.image_url) ?? ''}
                      alt="post"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {hasVideo && (
                    <>
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
                      }}>
                        <Video size={isBig ? 32 : 22} color="rgba(255,255,255,0.6)" />
                      </div>
                    </>
                  )}

                  {hasAudio && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)'
                    }}>
                      <Mic size={isBig ? 28 : 18} color="rgba(96,165,250,0.8)" />
                      {isBig && (
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '20px' }}>
                          {[4,7,5,9,6,8,4,7].map((h, i) => (
                            <div key={i} style={{ width: '3px', height: `${h}px`, background: '#60a5fa', borderRadius: '2px', opacity: 0.7 }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!hasImage && !hasLegacyImage && !hasVideo && !hasAudio && post.content && (
                    <div style={{
                      position: 'absolute', inset: 0, padding: isBig ? '16px' : '10px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}>
                      <p style={{
                        fontSize: isBig ? '13px' : '10px',
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: isBig ? 6 : 4,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {post.content}
                      </p>
                    </div>
                  )}

                  {/* Gradient overlay inferior */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Info usuario abajo */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: isBig ? '10px 12px' : '6px 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" loading="lazy" style={{
                          width: isBig ? '20px' : '16px', height: isBig ? '20px' : '16px',
                          borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.3)'
                        }} />
                      ) : (
                        <div style={{
                          width: isBig ? '20px' : '16px', height: isBig ? '20px' : '16px',
                          borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '8px', color: 'white', flexShrink: 0
                        }}>
                          {username[0]?.toUpperCase()}
                        </div>
                      )}
                      {(isBig || index < 3) && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {username}
                        </span>
                      )}
                    </div>
                    {likeCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
                        <Heart size={9} fill="rgba(255,255,255,0.8)" color="transparent" /> {likeCount}
                      </span>
                    )}
                  </div>

                  {/* Badge tipo video/audio en esquina */}
                  {hasVideo && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                      <Video size={12} color="white" />
                    </div>
                  )}
                  {hasAudio && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                      <Mic size={12} color="rgba(96,165,250,0.9)" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
