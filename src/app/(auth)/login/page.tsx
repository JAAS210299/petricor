'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('') // email o username
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')

    let emailToUse = identifier.trim()

    // Si no contiene @, es un username → buscar el email
    if (!emailToUse.includes('@')) {
      const { data, error: fnError } = await supabase
        .rpc('get_email_from_username', { p_username: emailToUse.toLowerCase() })

      if (fnError || !data) {
        setError('usuario no encontrado')
        setLoading(false)
        return
      }
      emailToUse = data
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    })

    if (error) {
      setError('correo/usuario o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/feed')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm px-8">
        <h1 className="text-3xl font-light tracking-widest mb-2" style={{ color: 'var(--text)' }}>
          petricor
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>bienvenido de vuelta</p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="usuario o correo electrónico"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="password"
            placeholder="contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50 mt-2"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {loading ? 'entrando...' : 'entrar'}
          </button>

          <a href="/registro" className="text-xs text-center transition-opacity hover:opacity-60"
            style={{ color: 'var(--text-muted)' }}>
            ¿no tienes cuenta? regístrate
          </a>
        </div>
      </div>
    </main>
  )
}