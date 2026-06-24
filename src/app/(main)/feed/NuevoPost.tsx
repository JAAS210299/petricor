// src/app/feed/NuevoPost.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image } from 'lucide-react'
// NOTA: Usa aquí el import de Supabase que ya tengas en tus componentes de cliente
// por ejemplo: import { supabase } from '@/lib/supabase/client' o el que uses normalmente.

export default function NuevoPost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)

    try {
      // 1. Aquí va tu lógica actual para insertar en Supabase, asegúrate de mantenerla:
      /*
      const { error } = await supabase
        .from('posts')
        .insert({ content: content.trim() })
      if (error) throw error
      */

      // 2. CORRECCIÓN CLAVE: Limpiamos el input y refrescamos los componentes de servidor
      setContent('') 
      router.refresh() // 👈 Esto le avisa a Next.js que traiga los nuevos datos al FeedList
      
    } catch (error) {
      console.error('Error al publicar en petricor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="¿Qué está pasando?"
          className="w-full min-h-[80px] text-sm p-3 rounded-lg resize-none focus:outline-none transition-colors"
          style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
          disabled={loading}
        />
        
        <div className="flex items-center justify-between mt-4">
          {/* Icono de imagen (Media/Multimedia) */}
          <button 
            type="button" 
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-subtle)' }}
          >
            <Image size={18} />
          </button>

          {/* Botón publicar */}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="text-xs font-medium px-4 py-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ 
              background: 'var(--text)', 
              color: 'var(--bg)' 
            }}
          >
            {loading ? 'publicando...' : 'publicar'}
          </button>
        </div>
      </form>
    </div>
  )
}