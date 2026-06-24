'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function EliminarPost({ postId, userId, ownerId }: { postId: string, userId: string, ownerId: string }) {
  const router = useRouter()
  const supabase = createClient()

  if (userId !== ownerId) return null

  async function handleDelete() {
    if (!confirm('¿Eliminar esta publicación?')) return
    await supabase.from('posts').delete().eq('id', postId)
    router.push('/feed')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="transition-opacity hover:opacity-60"
      style={{ color: 'var(--text-subtle)' }}
    >
      <Trash2 size={16} />
    </button>
  )
}