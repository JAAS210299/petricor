'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegistro() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/feed')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-950">
      <div className="w-full max-w-sm px-8">
        <h1 className="text-3xl font-light tracking-widest text-stone-200 mb-2">
          petricor
        </h1>
        <p className="text-stone-500 text-sm mb-10">crea tu cuenta</p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="nombre de usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-stone-600 transition-colors placeholder:text-stone-600"
          />
          <input
            type="email"
            placeholder="correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-stone-600 transition-colors placeholder:text-stone-600"
          />
          <input
            type="password"
            placeholder="contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-stone-600 transition-colors placeholder:text-stone-600"
          />

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            onClick={handleRegistro}
            disabled={loading}
            className="bg-stone-200 text-stone-900 rounded-lg py-3 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'creando cuenta...' : 'crear cuenta'}
          </button>

          <a href="/login" className="text-stone-500 text-xs text-center hover:text-stone-300 transition-colors">
            ¿ya tienes cuenta? inicia sesión
          </a>
        </div>
      </div>
    </main>
  )
}