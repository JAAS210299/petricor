'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function checkUsername(value: string) {
    const clean = value.trim().toLowerCase()
    setUsername(value)
    if (clean.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', clean)
      .maybeSingle()
    setUsernameStatus(data ? 'taken' : 'available')
  }

  async function handleRegistro() {
    if (usernameStatus === 'taken') { setError('ese nombre de usuario ya está en uso'); return }
    if (usernameStatus !== 'available') { setError('elige un nombre de usuario válido'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim().toLowerCase() } }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/feed')
    }
  }

  const usernameBorder = {
    idle: 'var(--border)',
    checking: 'var(--border)',
    available: '#22c55e',
    taken: '#ef4444',
  }[usernameStatus]

  const usernameHint = {
    idle: null,
    checking: <span style={{ color: 'var(--text-subtle)' }}>comprobando...</span>,
    available: <span style={{ color: '#22c55e' }}>✓ disponible</span>,
    taken: <span style={{ color: '#ef4444' }}>✗ ya está en uso</span>,
  }[usernameStatus]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm px-8">
        <h1 className="text-3xl font-light tracking-widest mb-2" style={{ color: 'var(--text)' }}>
          petricor
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>crea tu cuenta</p>

        <div className="flex flex-col gap-4">
          {/* Username con comprobación en tiempo real */}
          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="nombre de usuario"
              value={username}
              onChange={e => checkUsername(e.target.value)}
              className="rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${usernameBorder}`,
                color: 'var(--text)',
              }}
            />
            {usernameHint && (
              <p className="text-xs pl-1">{usernameHint}</p>
            )}
          </div>

          <input
            type="email"
            placeholder="correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="password"
            placeholder="contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            onClick={handleRegistro}
            disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
            className="rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50 mt-2"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {loading ? 'creando cuenta...' : 'crear cuenta'}
          </button>

          <a href="/login" className="text-xs text-center transition-colors hover:opacity-60"
            style={{ color: 'var(--text-muted)' }}>
            ¿ya tienes cuenta? inicia sesión
          </a>
        </div>
      </div>
    </main>
  )
}