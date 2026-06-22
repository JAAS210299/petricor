'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
}

export default function BuscarPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSearch(value: string) {
    setQuery(value)
    if (!value.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${value}%`)
      .limit(20)

    setResults(data ?? [])
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest text-stone-500 mb-8">
          buscar
        </h1>

        <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 mb-6">
          <Search size={16} className="text-stone-600" />
          <input
            type="text"
            placeholder="buscar usuarios..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
            className="bg-transparent text-stone-200 text-sm placeholder:text-stone-600 outline-none w-full"
          />
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-stone-600 text-sm text-center mt-8">buscando...</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-stone-600 text-sm text-center mt-8">
              no se encontraron usuarios
            </p>
          )}
          {results.map(profile => (
            <Link
              key={profile.id}
              href={`/perfil/${profile.username}`}
              className="flex items-center gap-3 bg-stone-900 rounded-xl p-4 border border-stone-800 hover:border-stone-600 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-sm text-stone-300">
                {profile.username[0].toUpperCase()}
              </div>
              <span className="text-stone-200 text-sm">@{profile.username}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}