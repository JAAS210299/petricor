import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ConexionesTabs from './ConexionesTabs'

export default async function ConexionesPage(props: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username } = await props.params
  const { tab } = await props.searchParams
  const initialTab = tab === 'seguidos' ? 'seguidos' : 'seguidores'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .maybeSingle()

  if (!profile) notFound()

  // Seguidores: ids de quienes siguen a este perfil
  const { data: seguidoresRows } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', profile.id)

  const seguidorIds = seguidoresRows?.map(r => r.follower_id) ?? []

  const { data: seguidoresProfiles } = seguidorIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url, bio').in('id', seguidorIds)
    : { data: [] }

  // Seguidos: ids a quienes sigue este perfil
  const { data: seguidosRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', profile.id)

  const seguidoIds = seguidosRows?.map(r => r.following_id) ?? []

  const { data: seguidosProfiles } = seguidoIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url, bio').in('id', seguidoIds)
    : { data: [] }

  // IDs que el usuario logueado sigue, para pintar correctamente los botones de seguir
  let currentUserFollowingIds: string[] = []
  if (user) {
    const { data: myFollowing } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    currentUserFollowingIds = myFollowing?.map(f => f.following_id) ?? []
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link
          href={`/perfil/${profile.username}`}
          className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm">@{profile.username}</span>
        </Link>

        <ConexionesTabs
          initialTab={initialTab}
          seguidores={seguidoresProfiles ?? []}
          seguidos={seguidosProfiles ?? []}
          currentUserId={user?.id ?? null}
          currentUserFollowingIds={currentUserFollowingIds}
        />
      </div>
    </main>
  )
}