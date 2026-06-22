import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CerrarSesion from './CerrarSesion'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Cabecera del perfil */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-xl text-stone-300">
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-stone-200 font-medium">@{profile?.username}</h1>
              <p className="text-stone-500 text-xs mt-1">{user.email}</p>
            </div>
          </div>
          <CerrarSesion />
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-8 pb-8 border-b border-stone-800">
          <div>
            <p className="text-stone-200 font-medium">{posts?.length ?? 0}</p>
            <p className="text-stone-500 text-xs">publicaciones</p>
          </div>
        </div>

        {/* Posts del usuario */}
        <div className="flex flex-col gap-4">
          {posts?.length === 0 && (
            <p className="text-stone-600 text-sm text-center mt-8">
              aún no has publicado nada
            </p>
          )}
          {posts?.map(post => (
            <div key={post.id} className="bg-stone-900 rounded-xl p-5 border border-stone-800">
              <p className="text-stone-200 text-sm leading-relaxed">{post.content}</p>
              <p className="text-stone-600 text-xs mt-3">
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}