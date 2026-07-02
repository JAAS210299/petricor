'use client'

import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function EliminarComentario({
  comentarioId,
  userId,
  ownerId,
  onDelete,
}: {
  comentarioId: string
  userId: string
  ownerId: string
  onDelete?: (id: string) => void
}) {
  const supabase = createClient()

  if (userId !== ownerId) return null

  async function handleDelete() {
    if (!confirm('¿Eliminar este comentario?')) return
    await supabase.from('comments').delete().eq('id', comentarioId)
    onDelete?.(comentarioId)
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