'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

export default function NuevoPost() {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImage(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handlePost() {
    if (!content.trim() && !image) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let image_url = null

    if (image) {
      const ext = image.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('posts')
        .upload(path, image)

      if (!error) {
        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    await supabase.from('posts').insert({
      content,
      user_id: user.id,
      image_url
    })

    setContent('')
    setImage(null)
    setPreview(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <textarea
        placeholder="¿qué está pasando?"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="w-full bg-transparent text-sm placeholder:opacity-40 outline-none resize-none"
        style={{ color: 'var(--text)' }}
      />

      {preview && (
        <div className="relative mt-3 rounded-lg overflow-hidden">
          <img src={preview} alt="preview" className="w-full max-h-64 object-cover rounded-lg" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="hidden"
        />
        <button
          onClick={handlePost}
          disabled={loading || (!content.trim() && !image)}
          className="rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-30"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
        >
          {loading ? 'publicando...' : 'publicar'}
        </button>
      </div>
    </div>
  )
}