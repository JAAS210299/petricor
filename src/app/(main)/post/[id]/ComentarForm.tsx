'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ComentarForm({ postId, userId }: { postId: string, userId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleComment() {
    if (!content.trim()) return
    setLoading(true)

    await supabase.from('comments').insert({
      content,
      post_id: postId,
      user_id: userId
    })

    setContent('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-3 items-end border-t border-stone-800 pt-4">
      <textarea
        placeholder="escribe un comentario..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={2}
        className="flex-1 bg-stone-900 border border-stone-800 text-stone-200 text-sm placeholder:text-stone-600 rounded-xl px-4 py-3 outline-none resize-none focus:border-stone-600 transition-colors"
      />
      <button
        onClick={handleComment}
        disabled={loading || !content.trim()}
        className="bg-stone-200 text-stone-900 rounded-xl px-4 py-3 text-xs font-medium hover:bg-white transition-colors disabled:opacity-30 shrink-0"
      >
        {loading ? '...' : 'comentar'}
      </button>
    </div>
  )
}