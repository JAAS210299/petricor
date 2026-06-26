import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FollowButton from './FollowButton'
import MensajeButton from './MensajeButton'

export default async function PerfilUsuarioPage(props: {
  params: Promise<{ username: string }>
}) {
  const params = await props.params
  const username = params.username

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usamos .ilike para ignorar mayúsculas/minúsculas y .maybeSingle() por seguridad
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username) 
    .maybeSingle()

  // Si después del RLS y el ilike sigue sin existir, ahora sí disparamos el 404 real
  if (!profile) {
    notFound()
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // ✨ CORREGIDO: Cambiado .single() por .maybeSingle() para evitar que la página
  // se rompa con un error de base de datos si el usuario actual no sigue a este perfil.
  const { data: followData } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user?.id ?? '')
    .eq('following_id', profile.id)
    .maybeSingle()

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const isOwnProfile = user?.id === profile.id
  const isFollowing = !!followData

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-xl text-stone-300">
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-stone-200 font-medium">@{profile.username}</h1>
              {profile.bio && (
                <p className="text-stone-500 text-xs mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
          {!isOwnProfile && user && (
            <FollowButton
              followerId={user.id}
              followingId={profile.id}
              initialFollowing={isFollowing}
            />
          )}
          {!isOwnProfile && user && (
            <MensajeButton
              currentUserId={user.id}
              targetUserId={profile.id}
            />
          )} 
        </div>

        <div className="flex gap-6 mb-8 pb-8 border-b border-stone-800">
          <div>
            <p className="text-stone-200 font-medium">{posts?.length ?? 0}</p>
            <p className="text-stone-500 text-xs">publicaciones</p>
          </div>
          <div>
            <p className="text-stone-200 font-medium">{followersCount ?? 0}</p>
            <p className="text-stone-500 text-xs">seguidores</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {posts?.map(post => (
            <div key={post.id} className="bg-stone-900 rounded-xl p-5 border border-stone-800">
              <p className="text-stone-200 text-sm leading-relaxed">{post.content}</p>
              <p className="text-stone-600 text-xs mt-3">
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