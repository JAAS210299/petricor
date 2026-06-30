'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil } from 'lucide-react'
import TextConHashtags from '@/components/TextConHashtags'
import MentionTextarea from '@/components/MentionTextarea'

interface Props {
  postId: string
  userId: string | null
  ownerId: string
  initialContent: string
  initialEditedAt: string | null
}

export default function PostBody({ postId, userId, ownerId, initialContent, initialEditedAt }: Props) {
  const [content, setContent] = useState(initialContent)
  const [editedAt, setEditedAt] = useState(initialEditedAt)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isOwner = userId === ownerId

  async function handleSave() {
    if (!draft.trim()) return
    setLoading(true)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('posts')
      .update({ content: draft.trim(), edited_at: now })
      .eq('id', postId)
    setLoading(false)
    if (error) {
      alert('Error al editar: ' + error.message)
      return
    }
    setContent(draft.trim())
    setEditedAt(now)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(content)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-1">
        <MentionTextarea
          value={draft}
          onChange={setDraft}
          className="w-full bg-transparent text-sm outline-none resize-none"
          style={{
            color: 'var(--text)', lineHeight: '1.6',
            background: 'var(--bg-input)', borderRadius: '8px',
            padding: '8px 10px', border: '1px solid var(--border)'
          }}
          rows={3}
          autoFocus
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleSave}
            disabled={loading || !draft.trim()}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {loading ? 'guardando...' : 'guardar'}
          </button>
          <button
            onClick={handleCancel}
            className="text-xs transition-opacity hover:opacity-60"
            style={{ color: 'var(--text-subtle)' }}
          >
            cancelar
          </button>
        </div>
      </div>
    )
  }

  if (!content) {
    // Aún sin contenido — solo mostramos botón de editar si es el dueño (por si quiere añadir texto a un post solo-media)
    if (!isOwner) return null
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
      >
        + añadir texto
      </button>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <TextConHashtags text={content} style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }} />
        {editedAt && (
          <span className="text-xs ml-1.5" style={{ color: 'var(--text-subtle)' }}>(editado)</span>
        )}
      </div>
      {isOwner && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 mt-0.5 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-subtle)' }}
        >
          <Pencil size={13} />
        </button>
      )}
    </div>
  )
}