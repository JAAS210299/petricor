import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export default async function NotifBadge() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <Link href="/notificaciones" className="relative transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
      <Bell size={22} />
      {count && count > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-medium">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}