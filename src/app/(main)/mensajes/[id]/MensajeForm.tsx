'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ImagePlus, X, Mic, Square, Play, Pause } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read: boolean
  media_url?: string
  media_type?: string
  story_reply_media_url?: string | null
  story_reply_media_type?: string | null
  profiles?: { username: string }
}

interface Props {
  conversationId: string
  senderId: string
  initialMessages: Message[]
}

function AudioPlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full flex items-center gap-3 py-1">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ color: isOwn ? 'var(--bg)' : 'var(--text)' }}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-6 bg-black bg-opacity-20 rounded-full relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-full opacity-0 cursor-pointer absolute"
          />
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: isOwn ? 'var(--bg)' : 'var(--text)',
            }}
          />
        </div>
      </div>

      <span
        className="text-xs flex-shrink-0"
        style={{ color: isOwn ? 'var(--bg)' : 'var(--text)', opacity: 0.7 }}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}

export default function ChatBox({ conversationId, senderId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const markedAsReadRef = useRef<Set<string>>(new Set())
  const processedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function marcarLeidos() {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', senderId)
          .eq('read', false)

        if (error) {
          console.error('Error marcando leídos:', error)
          return
        }

        setMessages(prev =>
          prev.map(m =>
            !m.read && m.sender_id !== senderId ? { ...m, read: true } : m
          )
        )

        window.dispatchEvent(new CustomEvent('mensajes-leidos'))
      } catch (err) {
        console.error('Error:', err)
      }
    }

    marcarLeidos()
  }, [conversationId, senderId, supabase])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          const msgId = entry.target.getAttribute('data-msg-id')
          if (!msgId) continue

          if (entry.isIntersecting && !markedAsReadRef.current.has(msgId)) {
            const msg = messages.find(m => m.id === msgId)
            if (msg && !msg.read && msg.sender_id !== senderId) {
              setTimeout(async () => {
                await supabase
                  .from('messages')
                  .update({ read: true })
                  .eq('id', msgId)

                markedAsReadRef.current.add(msgId)
                setMessages(prev =>
                  prev.map(m => m.id === msgId ? { ...m, read: true } : m)
                )
                window.dispatchEvent(new CustomEvent('mensajes-leidos'))
              }, 300)
            }
          }
        }
      },
      { threshold: 0.5 }
    )

    return () => observerRef.current?.disconnect()
  }, [messages, senderId, supabase])

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
          if (!processedIdsRef.current.has(data.id)) {
            processedIdsRef.current.add(data.id)
            setMessages(prev => [...prev, data])
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, senderId, supabase])

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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecording(true)
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setMedia(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }))
        setPreview('recording-complete')
      }

      mediaRecorder.start()

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accediendo al micrófono:', error)
      alert('No se pudo acceder al micrófono')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  async function handleSend() {
    if (!content.trim() && !media) return
    setLoading(true)

    try {
      let media_url = null
      let media_type = null

      if (media) {
        const ext = media.type.includes('audio') ? 'webm' : media.name.split('.').pop()
        const path = `${senderId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, media, {
            contentType: media.type,
            upsert: false
          })

        if (uploadError) {
          alert('Error al subir archivo: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        media_url = data.publicUrl

        if (media.type.includes('audio')) {
          media_type = 'audio'
        } else if (media.type.includes('video')) {
          media_type = 'video'
        } else if (media.type.includes('image')) {
          media_type = 'image'
        }
      }

      const { data: insertedMsg, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim() || '',
          media_url,
          media_type,
        })
        .select()
        .single()

      if (msgError) {
        alert('Error al enviar mensaje: ' + msgError.message)
        setLoading(false)
        return
      }

      if (insertedMsg) {
        processedIdsRef.current.add(insertedMsg.id)
      }

      setContent('')
      setMedia(null)
      setPreview(null)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <>
      <div className="flex flex-col gap-3 pb-4">
        {messages.map(msg => {
          const isOwn = msg.sender_id === senderId
          const isAudio = msg.media_type === 'audio' || (msg.media_url && msg.media_url.includes('.webm'))
          const isImage = msg.media_type === 'image' || (msg.media_url && (msg.media_url.includes('.jpg') || msg.media_url.includes('.png') || msg.media_url.includes('.gif')))
          const isVideo = msg.media_type === 'video' || (msg.media_url && msg.media_url.includes('.mp4'))

          return (
            <div
              key={msg.id}
              data-msg-id={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                  background: isOwn ? 'var(--text)' : 'var(--bg-card)',
                  color: isOwn ? 'var(--bg)' : 'var(--text)',
                  border: isOwn ? 'none' : '1px solid var(--border)'
                }}
              >
                {/* Vista previa de historia respondida */}
                {msg.story_reply_media_url && (
                  <div
                    className="flex items-center gap-2 mb-2 pb-2"
                    style={{ borderBottom: `1px solid ${isOwn ? 'rgba(0,0,0,0.15)' : 'var(--border)'}` }}
                  >
                    {msg.story_reply_media_type === 'video' ? (
                      <video
                        src={msg.story_reply_media_url}
                        muted
                        style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <img
                        src={msg.story_reply_media_url}
                        alt="historia"
                        style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <span className="text-xs" style={{ opacity: 0.7 }}>
                      {isOwn ? 'Respondiste a su historia' : 'Respondió a tu historia'}
                    </span>
                  </div>
                )}

                {isImage && msg.media_url && !isAudio && !isVideo && (
                  <img src={msg.media_url} alt="imagen" className="w-full rounded-xl mb-2 max-h-48 object-cover" />
                )}
                {isVideo && msg.media_url && (
                  <video src={msg.media_url} controls className="w-full rounded-xl mb-2 max-h-48" />
                )}
                {isAudio && msg.media_url && (
                  <AudioPlayer src={msg.media_url} isOwn={isOwn} />
                )}
                {msg.content && msg.content !== 'EMPTY' && <p>{msg.content}</p>}

                {isOwn && (
                  <div className="flex justify-end mt-1 gap-0.5 text-xs opacity-60">
                    {msg.read ? (
                      <span>✓✓</span>
                    ) : (
                      <span>✓</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {preview && preview !== 'recording-complete' && (
        <div className="fixed bottom-36 left-0 right-0 px-4">
          <div className="max-w-xl mx-auto relative inline-block">
            {media?.type.includes('video') ? (
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

      {recording && (
        <div className="fixed bottom-36 left-0 right-0 px-4">
          <div className="max-w-xl mx-auto bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm">Grabando: {formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {preview === 'recording-complete' && (
        <div className="fixed bottom-36 left-0 right-0 px-4">
          <div className="max-w-xl mx-auto bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-sm">✓ Nota de voz lista</span>
            <button
              onClick={removeMedia}
              className="ml-auto"
            >
              <X size={14} />
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

          {recording ? (
            <button
              onClick={stopRecording}
              className="transition-opacity hover:opacity-60 shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="transition-opacity hover:opacity-60 shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <Mic size={18} />
            </button>
          )}

          <textarea
            placeholder="escribe un mensaje..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={1}
            disabled={recording}
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
            disabled={loading || (!content.trim() && !media) || recording}
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