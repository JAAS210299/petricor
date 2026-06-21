import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-white">
      <h1 className="text-5xl font-light tracking-widest text-stone-200">
        petricor
      </h1>
      <p className="mt-4 text-stone-500 text-sm tracking-wider">
        Los que escriben gotas de sueños en el suelo de la vida
      </p>
      <p className="mt-8 text-stone-600 text-xs">
        {user ? `Hola, ${user.email}` : 'Supabase conectado ✓'}
      </p>
    </main>
  )
}