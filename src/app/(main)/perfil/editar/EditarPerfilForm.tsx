'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

export default function EditarPerfilForm({ profile, userId }: { profile: any, userId: string }) {
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    let avatar_url = profile?.avatar_url

    if (avatar) {
      const ext = avatar.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatar, { upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = data.publicUrl
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username, bio, avatar_url })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/perfil')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-20 h-20 rounded-full cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
              {username[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            <Camera size={12} />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>toca para cambiar foto</p>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>nombre de usuario</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="rounded-xl px-4 py-3 text-sm outline-none border transition-colors"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          placeholder="cuéntanos algo sobre ti..."
          className="rounded-xl px-4 py-3 text-sm outline-none border resize-none transition-colors"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
      </div>

      {error && <p className="text-rose-400 text-xs">{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading}
        className="rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
        style={{ background: 'var(--text)', color: 'var(--bg)' }}
      >
        {loading ? 'guardando...' : 'guardar cambios'}
      </button>
    </div>
  )
}