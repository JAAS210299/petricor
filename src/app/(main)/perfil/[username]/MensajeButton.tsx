'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

export default function MensajeButton({ currentUserId, targetUserId }: { currentUserId: string, targetUserId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleMessage() {
    const user1 = currentUserId < targetUserId ? currentUserId : targetUserId
    const user2 = currentUserId < targetUserId ? targetUserId : currentUserId

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1)
      .eq('user2_id', user2)
      .single()

    if (existing) {
      router.push(`/mensajes/${existing.id}`)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user1_id: user1, user2_id: user2 })
        .select('id')
        .single()

      if (newConv) router.push(`/mensajes/${newConv.id}`)
    }
  }

  return (
    <button
      onClick={handleMessage}
      className="text-stone-500 hover:text-stone-300 transition-colors ml-2"
    >
      <MessageCircle size={20} />
    </button>
  )
}