'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function NuevoPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handlePost() {
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('posts').insert({
      content,
      user_id: user.id
    })

    if (!error) {
      router.push('/feed')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-light tracking-widest text-stone-500">
            nueva publicación
          </h1>
        </div>

        <textarea
          placeholder="¿qué está pasando?"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          autoFocus
          className="w-full bg-transparent text-stone-200 text-base placeholder:text-stone-700 outline-none resize-none"
        />

        <div className="fixed bottom-24 right-4 max-w-xl">
          <button
            onClick={handlePost}
            disabled={loading || !content.trim()}
            className="bg-stone-200 text-stone-900 rounded-full px-6 py-3 text-sm font-medium hover:bg-white transition-colors disabled:opacity-30"
          >
            {loading ? 'publicando...' : 'publicar'}
          </button>
        </div>
      </div>
    </main>
  )
}