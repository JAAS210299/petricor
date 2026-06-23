'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

export default function MensajeForm({ conversationId, senderId }: { conversationId: string, senderId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSend() {
    if (!content.trim()) return
    setLoading(true)

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    })

    setContent('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
      <div className="max-w-xl mx-auto flex gap-2 items-end bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3">
        <textarea
          placeholder="escribe un mensaje..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={1}
          className="flex-1 bg-transparent text-stone-200 text-sm placeholder:text-stone-600 outline-none resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !content.trim()}
          className="text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-30 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}