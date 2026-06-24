'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
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
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles!messages_sender_id_fkey (username)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function handleSend() {
    if (!content.trim()) return
    setLoading(true)
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    setContent('')
    setLoading(false)
  }

  return (
    <>
      {/* Mensajes */}
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
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
        <div
          className="max-w-xl mx-auto flex gap-2 items-end rounded-2xl px-4 py-3 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
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
            disabled={loading || !content.trim()}
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