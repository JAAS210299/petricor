import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ChatBox from './MensajeForm'

export const dynamic = 'force-dynamic'

async function marcarLeidos(conversationId: string, userId: string) {
  'use server'
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false)
}

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id,
      user1:profiles!conversations_user1_id_fkey (id, username),
      user2:profiles!conversations_user2_id_fkey (id, username)
    `)
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  const other = (conversation.user1 as any)?.id === user.id
    ? conversation.user2 as any
    : conversation.user1 as any

  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at, read, media_url, media_type, story_reply_media_url, story_reply_media_type, profiles!messages_sender_id_fkey (username)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  const messages = (rawMessages ?? []).map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    sender_id: msg.sender_id,
    created_at: msg.created_at,
    read: msg.read,
    media_url: msg.media_url,
    media_type: msg.media_type,
    story_reply_media_url: msg.story_reply_media_url,
    story_reply_media_type: msg.story_reply_media_type,
    profiles: msg.profiles,
  }))

  await marcarLeidos(id, user.id)

  return (
    <main className="min-h-screen pb-36" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/mensajes" className="transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
            {other?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>@{other?.username}</span>
        </div>

        <ChatBox
          conversationId={id}
          senderId={user.id}
          initialMessages={messages}
        />

      </div>
    </main>
  )
}