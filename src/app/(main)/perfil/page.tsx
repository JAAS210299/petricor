import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CerrarSesion from './CerrarSesion'
import ThemeToggle from '@/components/ThemeToggle'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: posts } = await supabase
    .from('posts').select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-medium" style={{ color: 'var(--text)' }}>@{profile?.username}</h1>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CerrarSesion />
          </div>
        </div>

        <div className="flex gap-6 mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-medium" style={{ color: 'var(--text)' }}>{posts?.length ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>publicaciones</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {posts?.length === 0 && (
            <p className="text-sm text-center mt-8" style={{ color: 'var(--text-subtle)' }}>
              aún no has publicado nada
            </p>
          )}
          {posts?.map(post => (
            <div key={post.id} className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
              <p className="text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}