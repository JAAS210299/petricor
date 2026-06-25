'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ImagePlus, X } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read: boolean
  media_url?: string
  media_type?: string
  profiles?: { username: string }
}

interface Props {
  conversationId: string
  senderId: string
  initialMessages: Message[]
}

export default function ChatBox({ conversationId, senderId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function marcarLeidos() {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', senderId)
        .eq('read', false)
      window.dispatchEvent(new CustomEvent('mensajes-leidos'))
    }
    marcarLeidos()
  }, [conversationId, senderId])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select('*, profiles!messages_sender_id_fkey (username)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setMessages(prev => [...prev, data])
          if (payload.new.sender_id !== senderId) {
            await supabase.from('messages').update({ read: true }).eq('id', payload.new.id)
            window.dispatchEvent(new CustomEvent('mensajes-leidos'))
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, senderId])

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMedia(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeMedia() {
    setMedia(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSend() {
    if (!content.trim() && !media) return
    setLoading(true)

    let media_url = null
    let media_type = null

    if (media) {
      const ext = media.name.split('.').pop()
      const path = `${senderId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('post')
        .upload(path, media, {
          contentType: media.type,
          upsert: false
        })
      if (!error) {
        const { data } = supabase.storage.from('post').getPublicUrl(path)
        media_url = data.publicUrl
        media_type = media.type.startsWith('video') ? 'video' : 'image'
      }
    }

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      media_url,
      media_type,
    })

    setContent('')
    setMedia(null)
    setPreview(null)
    setLoading(false)
  }

  return (
    <>
      <div className="flex flex-col gap-3 pb-4">
        {messages.map(msg => {
          const isOwn = msg.sender_id === senderId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                  background: isOwn ? 'var(--text)' : 'var(--bg-card)',
                  color: isOwn ? 'var(--bg)' : 'var(--text)',
                  border: isOwn ? 'none' : '1px solid var(--border)'
                }}
              >
                {msg.media_url && msg.media_type === 'image' && (
                  <img src={msg.media_url} alt="imagen" className="w-full rounded-xl mb-2 max-h-48 object-cover" />
                )}
                {msg.media_url && msg.media_type === 'video' && (
                  <video src={msg.media_url} controls className="w-full rounded-xl mb-2 max-h-48" />
                )}
                {msg.content && <p>{msg.content}</p>}
                {isOwn && (
                  <div className="flex justify-end mt-1 gap-0.5">
                    {msg.read ? (
                      <>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>💧</span>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>💧</span>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>💧</span>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>💧</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 8, opacity: 0.5 }}>💧</span>
                        <span style={{ fontSize: 8, opacity: 0.5 }}>💧</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Preview media */}
      {preview && (
        <div className="fixed bottom-36 left-0 right-0 px-4">
          <div className="max-w-xl mx-auto relative inline-block">
            {media?.type.startsWith('video') ? (
              <video src={preview} className="h-32 rounded-xl object-cover" />
            ) : (
              <img src={preview} alt="preview" className="h-32 rounded-xl object-cover" />
            )}
            <button
              onClick={removeMedia}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
        <div
          className="max-w-xl mx-auto flex gap-2 items-end rounded-2xl px-4 py-3 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => fileRef.current?.click()}
            className="transition-opacity hover:opacity-60 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <ImagePlus size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMedia}
            className="hidden"
          />
          <textarea
            placeholder="escribe un mensaje..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:opacity-40"
            style={{ color: 'var(--text)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!content.trim() && !media)}
            className="transition-opacity hover:opacity-60 disabled:opacity-30 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  )
}