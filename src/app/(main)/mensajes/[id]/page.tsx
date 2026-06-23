import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MensajeForm from './MensajeForm'

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

  const { data: messages } = await supabase
    .from('messages')
    .select(`*, sender:profiles!messages_sender_id_fkey (username)`)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-36">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/mensajes" className="text-stone-500 hover:text-stone-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs text-stone-300">
            {other?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-stone-300 text-sm">@{other?.username}</span>
        </div>

        <div className="flex flex-col gap-3">
          {messages?.map(msg => {
            const isOwn = msg.sender_id === user.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                  isOwn
                    ? 'bg-stone-200 text-stone-900 rounded-br-sm'
                    : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <MensajeForm conversationId={id} senderId={user.id} />
    </main>
  )
}