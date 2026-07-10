import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FollowButton from './FollowButton'
import MensajeButton from './MensajeButton'
import BloquearButton from './BloquearButton'
import PostsConReportar from './PostsConReportar'
import ReportarPerfilButton from './ReportarPerfilButton'
import VerifiedBadge from '@/components/VerifiedBadge'
import Link from 'next/link'

export default async function PerfilUsuarioPage(props: {
  params: Promise<{ username: string }>
}) {
  const params = await props.params
  const username = params.username

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle()

  if (!profile) notFound()

  // Si el visitante bloqueó a este perfil o fue bloqueado por él, no se muestra contenido normal
  let iBlockedThem = false
  let theyBlockedMe = false

  if (user) {
    const { data: blockData } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`)

    iBlockedThem = blockData?.some(b => b.blocker_id === user.id) ?? false
    theyBlockedMe = blockData?.some(b => b.blocker_id === profile.id) ?? false
  }

  if (theyBlockedMe) {
    return (
      <main className="min-h-screen pb-24 flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>este perfil no está disponible</p>
      </main>
    )
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const { count: seguidoresCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: seguidosCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  const isOwnProfile = user?.id === profile.id

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-8">

        {/* Cabecera */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                loading="lazy"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
              >
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-medium flex items-center gap-1" style={{ color: 'var(--text)' }}>
                @{profile.username}
                {profile.is_verified && <VerifiedBadge size={15} />}
              </h1>
              {profile.bio && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{profile.bio}</p>
              )}
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="flex items-center gap-2">
              {!iBlockedThem && (
                <>
                  <FollowButton
                    targetUserId={profile.id}
                    currentUserId={user.id}
                  />
                  <MensajeButton
                    currentUserId={user.id}
                    targetUserId={profile.id}
                  />
                </>
              )}
              <BloquearButton
                currentUserId={user.id}
                targetUserId={profile.id}
                targetUsername={profile.username}
                initialBlocked={iBlockedThem}
              />
              <ReportarPerfilButton
                reporterId={user.id}
                reportedUserId={profile.id}
              />
            </div>
          )}
        </div>

        {/* Stats — seguidores y seguidos clicables */}
        <div className="flex gap-6 mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-medium" style={{ color: 'var(--text)' }}>{posts?.length ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>publicaciones</p>
          </div>
          <Link
            href={`/perfil/${profile.username}/conexiones?tab=seguidores`}
            className="hover:opacity-70 transition-opacity"
          >
            <p className="font-medium" style={{ color: 'var(--text)' }}>{seguidoresCount ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>seguidores</p>
          </Link>
          <Link
            href={`/perfil/${profile.username}/conexiones?tab=seguidos`}
            className="hover:opacity-70 transition-opacity"
          >
            <p className="font-medium" style={{ color: 'var(--text)' }}>{seguidosCount ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>seguidos</p>
          </Link>
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-4">
          {iBlockedThem && (
            <p className="text-sm text-center mt-8" style={{ color: 'var(--text-subtle)' }}>
              has bloqueado a este usuario
            </p>
          )}
          {!iBlockedThem && (
            <PostsConReportar posts={posts ?? []} currentUserId={user?.id ?? null} />
          )}
        </div>

      </div>
    </main>
  )
}