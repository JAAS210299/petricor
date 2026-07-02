'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Heart, MessageCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TextConHashtags from '@/components/TextConHashtags'
import LazyImage from '@/components/LazyImage'
import AudioPlayer from '@/components/AudioPlayer'

interface Props {
  initialPosts: any[]
  currentUserId: string
}

export default function ExplorarClient({ initialPosts, currentUserId }: Props) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchType, setSearchType] = useState<'users' | 'posts' | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSearch(value: string) {
    setQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      setSearchType(null)
      return
    }
    setLoading(true)

    if (value.trim().startsWith('#')) {
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, media_url, media_type, profiles(username, avatar_url), likes(id), comments(id)')
        .ilike('content', `%${value.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(30)
      setSearchResults(data ?? [])
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

  const showSearch = query.trim().length > 0

  return (
    <div>
      {/* Buscador */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Search size={15} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="buscar usuarios o #hashtags..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: 'var(--text)' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSearchResults([]); setSearchType(null) }}
            className="text-xs transition-opacity hover:opacity-60" style={{ color: 'var(--text-subtle)' }}>
            ✕
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {showSearch && (
        <div className="flex flex-col gap-3 mb-6">
          {loading && (
            <p className="text-sm text-center py-4 animate-pulse" style={{ color: 'var(--text-subtle)' }}>buscando...</p>
          )}
          {!loading && searchResults.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-subtle)' }}>sin resultados</p>
          )}

          {/* Usuarios */}
          {searchType === 'users' && searchResults.map(profile => (
            <Link key={profile.id} href={`/perfil/${profile.username}`}
              className="flex items-center gap-3 rounded-xl p-4 transition-opacity hover:opacity-70"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>@{profile.username}</p>
                {profile.bio && <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{profile.bio}</p>}
              </div>
            </Link>
          ))}

          {/* Posts por hashtag */}
          {searchType === 'posts' && searchResults.map(post => (
            <div key={post.id} onClick={() => router.push(`/post/${post.id}`)}
              className="rounded-xl p-4 cursor-pointer transition-opacity hover:opacity-70"
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
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{post.profiles?.username}</span>
              </div>
              {post.content && (
                <TextConHashtags text={post.content} style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }} />
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                  <Heart size={11} /> {(post.likes as any[])?.length ?? 0}
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                  <MessageCircle size={11} /> {(post.comments as any[])?.length ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts populares — solo si no hay búsqueda */}
      {!showSearch && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: '#60a5fa' }} />
            <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>populares</p>
          </div>

          {/* Grid de miniaturas estilo Instagram */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
            {initialPosts.map(post => {
              const likeCount = (post.likes as any[])?.length ?? 0
              const commentCount = (post.comments as any[])?.length ?? 0
              const hasImage = post.media_url && post.media_type === 'image'
              const hasLegacyImage = post.image_url && !post.media_url
              const hasVideo = post.media_url && post.media_type === 'video'
              const hasAudio = post.media_url && post.media_type === 'audio'

              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  style={{
                    position: 'relative', aspectRatio: '1', cursor: 'pointer',
                    background: 'var(--bg-input)', overflow: 'hidden'
                  }}
                >
                  {/* Miniatura */}
                  {(hasImage || hasLegacyImage) && (
                    <LazyImage
                      src={hasImage ? post.media_url : post.image_url}
                      alt="post"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {hasVideo && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '24px' }}>🎥</span>
                    </div>
                  )}
                  {hasAudio && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '24px' }}>🎤</span>
                    </div>
                  )}
                  {!hasImage && !hasLegacyImage && !hasVideo && !hasAudio && post.content && (
                    <div style={{ width: '100%', height: '100%', padding: '8px', display: 'flex', alignItems: 'center' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: '1.3',
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                        {post.content}
                      </p>
                    </div>
                  )}

                  {/* Overlay con stats al hacer hover */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    opacity: 0, transition: 'opacity 0.15s ease',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <span style={{ color: 'white', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Heart size={13} fill="white" /> {likeCount}
                    </span>
                    <span style={{ color: 'white', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={13} fill="white" /> {commentCount}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {initialPosts.length === 0 && (
            <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
              aún no hay publicaciones para explorar
            </p>
          )}
        </>
      )}
    </div>
  )
}