'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import MentionTextarea from '@/components/MentionTextarea'

interface Props {
  postId: string
  userId: string
  parentId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ReplyForm({ postId, userId, parentId, onSuccess, onCancel }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (!content.trim()) return
    setLoading(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId,
    })
    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }
    setContent('')
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="flex items-center gap-2 mt-2 pl-9">
      <div style={{ flex: 1 }}>
        <MentionTextarea
          as="input"
          value={content}
          onChange={setContent}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="responder... usa @ para mencionar"
          autoFocus
          className="text-sm outline-none w-full"
          style={{
            color: 'var(--text)',
            background: 'var(--bg-input)',
            borderRadius: '8px',
            padding: '6px 10px',
            border: '1px solid var(--border)'
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="transition-opacity hover:opacity-60 disabled:opacity-30"
        style={{ color: 'var(--text-muted)' }}
      >
        <Send size={14} />
      </button>
      <button
        onClick={onCancel}
        className="text-xs transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
      >
        cancelar
      </button>
    </div>
  )
}