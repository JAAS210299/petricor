'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function EliminarComentario({
  comentarioId,
  userId,
  ownerId
}: {
  comentarioId: string
  userId: string
  ownerId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  if (userId !== ownerId) return null

  async function handleDelete() {
    if (!confirm('¿Eliminar este comentario?')) return
    await supabase.from('comments').delete().eq('id', comentarioId)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="transition-opacity hover:opacity-60"
      style={{ color: 'var(--text-subtle)' }}
    >
      <Trash2 size={14} />
    </button>
  )
}