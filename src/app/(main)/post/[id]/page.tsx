// src/app/(main)/post/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server' // 👈 Cambiado aquí
import { notFound } from 'next/navigation'
import PostDetail from './PostDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient() // 👈 Cambiado aquí también

  // 1. Obtener la sesión del usuario actual si está logueado
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Traer el post completo con su perfil, sus likes y todos sus comentarios ordenados
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url, user_id,
      profiles (id, username, avatar_url),
      likes (id, user_id),
      comments (
        id, content, created_at, user_id,
        profiles (id, username, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  // Si da error o el post no existe, disparamos el 404 nativo de Next.js
  if (error || !post) {
    notFound()
  }

  // Ordenar los comentarios del post por fecha
  if (post.comments) {
    post.comments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <PostDetail initialPost={post} userId={user?.id || null} />
    </div>
  )
}