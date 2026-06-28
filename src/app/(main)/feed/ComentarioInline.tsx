'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Props {
  postId: string
  userId: string
  onSuccess: () => void
}

const MAX_CHARS = 200

export default function ComentarioInline({ postId, userId, onSuccess }: Props) {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const hasAudio = media?.type.includes('audio')
  const charLimit = hasAudio ? MAX_CHARS : undefined
  const overLimit = charLimit !== undefined && content.length > charLimit

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    if (charLimit !== undefined && val.length > charLimit) return
    setContent(val)
  }

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setMedia(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }))
        setPreview('recording-complete')
      }

      mediaRecorder.start()
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      alert('No se pudo acceder al micrófono')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  async function handleComment() {
    if (!content.trim() && !media) return
    if (overLimit) return
    setLoading(true)

    try {
      let media_url = null
      let media_type = null

      if (media) {
        const ext = media.type.includes('audio') ? 'webm' : media.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, media, { contentType: media.type, upsert: false })

        if (uploadError) {
          alert('Error: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        media_url = data.publicUrl

        if (media.type.includes('audio')) media_type = 'audio'
        else if (media.type.includes('video')) media_type = 'video'
        else if (media.type.includes('image')) media_type = 'image'
      }

      console.log('userId al comentar:', userId)
      console.log('postId:', postId)
      console.log('media_url:', media_url)
      console.log('media_type:', media_type)

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: userId,
        content: content.trim() || '',
        media_url,
        media_type,
      })

      if (error) {
        alert('Error: ' + error.message)
        setLoading(false)
        return
      }

      setContent('')
      setMedia(null)
      setPreview(null)
      setRecordingTime(0)
      onSuccess()
    } catch (error) {
      alert('Error al comentar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>

      {/* Preview imagen/video */}
      {preview && preview !== 'recording-complete' && (
        <div style={{ marginBottom: '10px', position: 'relative', display: 'inline-block' }}>
          {media?.type.includes('video') ? (
            <video src={preview} style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <img src={preview} alt="preview" style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <button onClick={removeMedia} style={{
            position: 'absolute', top: '-6px', right: '-6px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'var(--text)', color: 'var(--bg)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={10} />
          </button>
        </div>
      )}

      {/* Audio listo */}
      {preview === 'recording-complete' && (
        <div style={{
          marginBottom: '10px', padding: '8px 12px',
          background: 'var(--bg-input)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>✓ Nota de voz lista</span>
          <button onClick={removeMedia} style={{
            fontSize: '11px', padding: '4px 8px',
            background: 'var(--text)', color: 'var(--bg)',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}>
            Cambiar
          </button>
        </div>
      )}

      {/* Grabando */}
      {recording && (
        <div style={{
          marginBottom: '10px', padding: '8px 12px',
          background: '#ef4444', color: 'white', borderRadius: '8px', fontSize: '13px'
        }}>
          🔴 Grabando: {formatTime(recordingTime)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
        {/* IMG — deshabilitado si hay audio */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!!hasAudio}
          style={{
            padding: '10px 6px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px',
            cursor: hasAudio ? 'not-allowed' : 'pointer',
            opacity: hasAudio ? 0.4 : 1,
            fontSize: '12px', fontWeight: 'bold'
          }}
        >
          📷 IMG
        </button>

        {/* AUDIO / STOP */}
        {recording ? (
          <button onClick={stopRecording} style={{
            padding: '10px 6px', background: '#ef4444', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 'bold'
          }}>
            ⏹ STOP
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={!!(media && !hasAudio)}
            style={{
              padding: '10px 6px', background: '#ec4899', color: 'white',
              border: 'none', borderRadius: '6px',
              cursor: media && !hasAudio ? 'not-allowed' : 'pointer',
              opacity: media && !hasAudio ? 0.4 : 1,
              fontSize: '12px', fontWeight: 'bold'
            }}
          >
            🎤 AUDIO
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMedia} style={{ display: 'none' }} />

        <div />

        {/* ENVIAR */}
        <button
          onClick={handleComment}
          disabled={loading || (!content.trim() && !media) || recording || overLimit}
          style={{
            padding: '10px 6px', background: '#10b981', color: 'white',
            border: 'none', borderRadius: '6px',
            cursor: loading || (!content.trim() && !media) || recording || overLimit ? 'not-allowed' : 'pointer',
            opacity: loading || (!content.trim() && !media) || recording || overLimit ? 0.4 : 1,
            fontSize: '12px', fontWeight: 'bold'
          }}
        >
          ✓ ENVIAR
        </button>

        <textarea
          placeholder="Comentario..."
          value={content}
          onChange={handleContentChange}
          style={{
            gridColumn: '1 / -1',
            padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit',
            color: 'var(--text)', background: 'var(--bg-input)',
            border: `1px solid ${overLimit ? '#ef4444' : 'var(--border)'}`,
            borderRadius: '6px', resize: 'none',
            minHeight: '40px', maxHeight: '100px', outline: 'none'
          }}
          rows={1}
        />
      </div>

      

      {/* Contador */}
      {hasAudio && (
        <p style={{ fontSize: '11px', textAlign: 'right', marginTop: '4px', color: overLimit ? '#ef4444' : 'var(--text-subtle)' }}>
          {content.length}/{MAX_CHARS}
        </p>
      )}
    </div>
  )
}
