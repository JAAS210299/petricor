'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

export default function EliminarPost({ postId, userId, ownerId }: { postId: string, userId: string, ownerId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (userId !== ownerId) return null

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    setLoading(false)
    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }
    setShowConfirm(false)
    router.push('/feed')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
      >
        <Trash2 size={16} />
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Eliminar publicación"
          message="¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer."
          confirmText="eliminar"
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}