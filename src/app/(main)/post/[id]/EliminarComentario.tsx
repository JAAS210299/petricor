'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (userId !== ownerId) return null

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('comments').delete().eq('id', comentarioId)
    setLoading(false)
    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }
    setShowConfirm(false)
    onDelete?.(comentarioId)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
      >
        <Trash2 size={14} />
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Eliminar comentario"
          message="¿Seguro que quieres eliminar este comentario? Esta acción no se puede deshacer."
          confirmText="eliminar"
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}