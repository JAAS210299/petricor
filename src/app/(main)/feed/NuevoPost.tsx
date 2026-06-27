'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Mic, Square, Send } from 'lucide-react'

interface Props {
  userId: string
}

function AudioPlayerPreview({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  return (
    <div className="flex items-center gap-2 py-2">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <button
        onClick={() => {
          if (!audioRef.current) return
          if (isPlaying) { audioRef.current.pause() } else { audioRef.current.play() }
          setIsPlaying(!isPlaying)
        }}
        className="text-xs px-2 py-1 rounded"
        style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
      >
        {isPlaying ? 'Pausar' : 'Reproducir'}
      </button>
    </div>
  )
}

const MAX_CHARS = 200

export default function NuevoPost({ userId }: Props) {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  async function handlePublish() {
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
          alert('Error al subir archivo: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        media_url = data.publicUrl

        if (media.type.includes('audio')) media_type = 'audio'
        else if (media.type.includes('video')) media_type = 'video'
        else if (media.type.includes('image')) media_type = 'image'
      }

      const { error: postError } = await supabase.from('posts').insert({
        user_id: userId,
        content: content.trim() || '',
        media_url,
        media_type,
      })

      if (postError) {
        alert('Error al publicar: ' + postError.message)
        setLoading(false)
        return
      }

      setContent('')
      setMedia(null)
      setPreview(null)
      setRecordingTime(0)
      location.reload()
    } catch (error) {
      alert('Error al publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl p-5 mb-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>

      <textarea
        placeholder="¿Qué está pasando?"
        value={content}
        onChange={handleContentChange}
        className="w-full bg-transparent text-base outline-none resize-none placeholder:opacity-40"
        style={{ color: 'var(--text)' }}
        rows={3}
      />

      {/* Contador de caracteres (solo si hay audio) */}
      {hasAudio && (
        <p className="text-xs text-right mb-2" style={{ color: overLimit ? '#ef4444' : 'var(--text-subtle)' }}>
          {content.length}/{MAX_CHARS}
        </p>
      )}

      {/* Preview imagen/video */}
      {preview && preview !== 'recording-complete' && (
        <div className="mt-2 relative inline-block">
          {media?.type.includes('video') ? (
            <video src={preview} className="h-40 rounded-xl object-cover" />
          ) : media?.type.includes('image') ? (
            <img src={preview} alt="preview" className="h-40 rounded-xl object-cover" />
          ) : null}
          <button
            onClick={removeMedia}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Preview audio */}
      {preview === 'recording-complete' && (
        <div className="mt-2 flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-input)' }}>
          <AudioPlayerPreview src={URL.createObjectURL(media!)} />
          <button
            onClick={removeMedia}
            className="text-xs px-2 py-1 rounded ml-auto"
            style={{ background: 'var(--border)', color: 'var(--text)' }}
          >
            Quitar
          </button>
        </div>
      )}

      {/* Grabando */}
      {recording && (
        <div className="mt-3 bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm">Grabando: {formatTime(recordingTime)}</span>
        </div>
      )}

      <div className="flex gap-3 mt-4 items-center justify-between">
        <div className="flex gap-2">
          {/* IMG — deshabilitado si ya hay audio */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!!hasAudio}
            className="transition-opacity hover:opacity-60 disabled:opacity-30"
            style={{ color: 'var(--text-muted)' }}
            title={hasAudio ? 'No se puede combinar imagen con audio' : 'Adjuntar imagen o video'}
          >
            <ImagePlus size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMedia} className="hidden" />

          {/* AUDIO — deshabilitado si hay imagen/video */}
          {recording ? (
            <button onClick={stopRecording} className="transition-opacity hover:opacity-60" style={{ color: '#ef4444' }}>
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!!(media && !hasAudio)}
              className="transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
              title={media && !hasAudio ? 'No se puede combinar audio con imagen/video' : 'Grabar nota de voz'}
            >
              <Mic size={18} />
            </button>
          )}
        </div>

        <button
          onClick={handlePublish}
          disabled={loading || (!content.trim() && !media) || recording || overLimit}
          className="transition-opacity hover:opacity-60 disabled:opacity-30"
          style={{ color: 'var(--text-muted)' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}