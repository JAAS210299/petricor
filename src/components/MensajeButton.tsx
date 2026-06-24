// src/components/MensajeButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MensajeButton({ currentUserId, targetUserId }: { currentUserId: string, targetUserId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const handleStartChat = async () => {
    // 1. Buscar si ya existe una conversación
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`)
      .maybeSingle()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    // 2. Si no existe, crearla
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user1_id: currentUserId, user2_id: targetUserId })
      .select('id')
      .single()

    if (newConv) router.push(`/chat/${newConv.id}`)
  }

  return (
    <button onClick={handleStartChat} className="px-4 py-1.5 rounded-full text-xs font-medium border border-stone-800 hover:bg-stone-800 text-stone-400">
      mensaje
    </button>
  )
}