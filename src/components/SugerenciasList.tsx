// src/components/SugerenciasList.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SugerenciasList() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Traer 3 perfiles sugeridos que no sean el propio usuario
  const { data: sugerencias } = await supabase
    .from('profiles')
    .select('id, username')
    .neq('id', user?.id)
    .limit(3)

  return (
    <div className="flex flex-col gap-3">
      {sugerencias?.map(p => (
        <div key={p.id} className="flex items-center justify-between">
          <span className="text-sm font-medium">@{p.username}</span>
          <Link 
            href={`/perfil/${p.username}`}
            className="text-xs px-3 py-1 rounded-full border border-stone-700 hover:bg-stone-800 transition-colors"
          >
            Ver perfil
          </Link>
        </div>
      ))}
    </div>
  )
}