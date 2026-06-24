// src/app/(main)/feed/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import SugerenciasList from '@/components/SugerenciasList'

export default async function FeedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener lista de IDs a los que el usuario sigue
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = following?.map(f => f.following_id) || []
  followingIds.push(user.id) // Incluimos al usuario para ver sus propios posts

  // 2. Traer posts filtrados por los que seguimos
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, avatar_url)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Tu Feed</h1>
        
        <div className="flex flex-col gap-6">
          {posts?.length === 0 ? (
            <div className="mt-12 space-y-6">
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Aún no sigues a nadie o no han publicado nada. ¡Busca gente interesante!
              </p>
              
              {/* Sección de sugerencias */}
              <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-semibold mb-4">Sugerencias para ti</h2>
                <Suspense fallback={<p className="text-xs text-stone-500">Cargando sugerencias...</p>}>
                  <SugerenciasList />
                </Suspense>
              </div>
            </div>
          ) : (
            posts?.map(post => (
              <div key={post.id} className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    @{(post.profiles as any)?.username}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
                <p className="text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(post.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}