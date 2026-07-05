import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportesLista from './ReportesLista'

export const dynamic = 'force-dynamic'

export default async function AdminReportesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/feed')

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, reason, details, status, created_at, post_id, comment_id, reported_user_id, reporter_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error cargando reportes:', error)
  }

  // Recopilar todos los IDs de usuario que necesitamos (reporter + reported_user)
  const userIds = new Set<string>()
  reports?.forEach(r => {
    if (r.reporter_id) userIds.add(r.reporter_id)
    if (r.reported_user_id) userIds.add(r.reported_user_id)
  })

  const { data: profiles } = userIds.size > 0
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', Array.from(userIds))
    : { data: [] }

  const profilesMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Enriquecer cada reporte con los datos de perfil correspondientes
  const enrichedReports = (reports ?? []).map(r => ({
    ...r,
    reporter: r.reporter_id ? profilesMap.get(r.reporter_id) ?? null : null,
    reported_user: r.reported_user_id ? profilesMap.get(r.reported_user_id) ?? null : null,
  }))

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
          panel de reportes
        </h1>
        <ReportesLista initialReports={enrichedReports} />
      </div>
    </main>
  )
}