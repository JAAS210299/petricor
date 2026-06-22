'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NuevoPost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handlePost() {
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('posts').insert({
      content,
      user_id: user.id
    })

    setContent('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-stone-900 rounded-xl p-4 border border-stone-800">
      <textarea
        placeholder="¿qué está pasando?"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="w-full bg-transparent text-stone-200 text-sm placeholder:text-stone-600 outline-none resize-none"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handlePost}
          disabled={loading || !content.trim()}
          className="bg-stone-200 text-stone-900 rounded-lg px-4 py-2 text-xs font-medium hover:bg-white transition-colors disabled:opacity-30"
        >
          {loading ? 'publicando...' : 'publicar'}
        </button>
      </div>
    </div>
  )
}