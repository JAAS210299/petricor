// src/app/(main)/feed/FeedList.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, Image as ImageIcon } from 'lucide-react'
import LikeButton from '@/components/LikeButton'
// Verifica que esta ruta sea la que usas para el cliente de Supabase en tu proyecto
import { createClient } from '@/lib/supabase/client' 

interface FeedListProps {
  initialPosts: any[]
  followingIds: string[]
  userId: string | null
}

export default function FeedList({ initialPosts, followingIds, userId }: FeedListProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  
  // Estados para el formulario integrado
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const observerTarget = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Función interna para ordenar los posts
  const sortPosts = (postsToSort: any[]) => {
    return [...postsToSort].sort((a, b) => {
      const aFollowed = followingIds.includes((a.profiles as any)?.id)
      const bFollowed = followingIds.includes((b.profiles as any)?.id)
      if (aFollowed && !bFollowed) return -1
      if (!aFollowed && bFollowed) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  // Sincronizar si entran cambios desde el servidor
  useEffect(() => {
    setPosts(prev => {
      const merged = [...initialPosts, ...prev]
      const unique = merged.filter((post, index, self) =>
        self.findIndex(p => p.id === post.id) === index
      )
      return sortPosts(unique)
    })
  }, [initialPosts])

  // MANEJADOR DE PUBLICACIÓN SEGURO Y DETALLADO
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)

    try {
      if (!supabase) {
        throw new Error('El cliente de Supabase no se ha inicializado correctamente.')
      }

      // Paso 1: Inserción limpia pasando el ID de usuario explícito para el RLS
      const { data: inserted, error: insertError } = await supabase
        .from('posts')
        .insert({ 
          content: content.trim(),
          user_id: userId 
        })
        .select('id')
        .maybeSingle() // Evita crasheos si el RLS bloquea el retorno inmediato

      if (insertError) {
        throw new Error(`Supabase Insert: ${insertError.message} (${insertError.details || 'sin detalles'})`)
      }

      if (!inserted) {
        throw new Error('El post se creó pero la base de datos no devolvió su ID. Revisa las políticas RLS de tu tabla.')
      }

      // Paso 2: Consulta aislada para traer el post con sus relaciones estructuradas
      const { data: fullPost, error: fetchError } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, image_url, user_id,
          profiles (id, username, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .eq('id', inserted.id)
        .maybeSingle()

      if (fetchError) {
        throw new Error(`Supabase Fetch Relaciones: ${fetchError.message}`)
      }

      if (fullPost) {
        // Añadimos el post con éxito a la lista local
        setPosts(prev => [fullPost, ...prev])
        setContent('')
      } else {
        throw new Error('Post creado con éxito, pero tu usuario no tiene permisos de lectura (RLS SELECT) para visualizarlo en tiempo real.')
      }

    } catch (err: any) {
      // Forzamos la extracción del mensaje en formato texto puro para romper el "{}"
      const errorTexto = err?.message || err?.hint || JSON.stringify(err) || 'Error desconocido';
      console.error('❌ Error real capturado:', errorTexto)
      
      // Te mostrará una alerta nativa del navegador con la causa exacta antes de que Next.js pinte la pantalla
      alert(`Error al publicar: ${errorTexto}`)
      
      // Lanzamos el error en texto plano para el overlay de desarrollo
      throw new Error(errorTexto)
    } finally {
      setSubmitting(false)
    }
  }

  // Cargar más posts (Scroll Infinito)
  const loadMorePosts = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const start = posts.length
    const end = start + 19

    try {
      const response = await fetch(`/api/posts?start=${start}&end=${end}`)
      const newPosts = await response.json()

      if (newPosts && newPosts.length > 0) {
        setPosts(prev => {
          const updated = [...prev, ...newPosts]
          return sortPosts(updated)
        })
        if (newPosts.length < 20) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error cargando más posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts()
        }
      },
      { threshold: 0.5 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading, posts.length])

  return (
    <div className="flex flex-col gap-4">
      {/* FORMULARIO DE PUBLICACIÓN */}
      {userId && (
        <div className="rounded-xl border p-5 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <form onSubmit={handlePublish}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando?"
              className="w-full min-h-[80px] text-sm p-3 rounded-lg resize-none focus:outline-none transition-colors"
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
              disabled={submitting}
            />
            <div className="flex items-center justify-between mt-4">
              <button type="button" className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: 'var(--text-subtle)' }}>
                <ImageIcon size={18} />
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="text-xs font-medium px-4 py-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: 'var(--text)', color: 'var(--bg)' }}
              >
                {submitting ? 'publicando...' : 'publicar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE PUBLICACIONES */}
      {posts.length === 0 && (
        <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
          aún no hay publicaciones. sé el primero.
        </p>
      )}

      {posts.map(post => {
        const likesArr = (post.likes as any[]) ?? []
        const likeCount = likesArr.length
        const liked = likesArr.some((l: any) => l.user_id === userId)
        const commentCount = (post.comments as any[])?.length ?? 0
        const username = (post.profiles as any)?.username
        const avatarUrl = (post.profiles as any)?.avatar_url
        const isFollowed = followingIds.includes((post.profiles as any)?.id)

        return (
          <div key={post.id} className="rounded-xl border transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between p-5 pb-0">
              <Link href={`/perfil/${username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{username}</span>
              </Link>
              {isFollowed && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-input)', color: 'var(--text-subtle)' }}>
                  siguiendo
                </span>
              )}
            </div>

            <Link href={`/post/${post.id}`} className="block px-5 pt-3 pb-3">
              {post.content && <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>}
              {post.image_url && <img src={post.image_url} alt="imagen" className="w-full rounded-lg mt-3 object-cover max-h-80" />}
            </Link>

            <div className="flex items-center gap-4 px-5 pb-4">
              <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={userId} />
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}>
                <MessageCircle size={15} />
                <span className="text-xs">{commentCount}</span>
              </div>
              <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )
      })}

      <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
        {loading && <p className="text-xs tracking-widest animate-pulse" style={{ color: 'var(--text-subtle)' }}>removiendo la tierra...</p>}
      </div>
    </div>
  )
}