import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditarPerfilForm from './EditarPerfilForm'

export default async function EditarPerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          editar perfil
        </h1>
        <EditarPerfilForm profile={profile} userId={user.id} />
      </div>
    </main>
  )
}