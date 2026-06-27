'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface Props {
  src: string
  isOwn: boolean
}

export default function AudioPlayer({ src, isOwn }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Truco para forzar la duración en archivos webm
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        // Forzar escaneo del archivo
        audio.currentTime = 1e101
      } else {
        setDuration(audio.duration)
      }
    }

    const handleTimeUpdate = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) return
      if (audio.currentTime > 0 && duration === 0) {
        setDuration(audio.duration)
        audio.currentTime = 0
      }
    }

    const handleDurationChange = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration)
        // Si estábamos en el truco, volver al inicio
        if (audio.currentTime > 100) {
          audio.currentTime = 0
        }
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
    }
  }, [duration])

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.currentTime <= duration) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) audioRef.current.currentTime = time
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full flex items-center gap-2 py-1">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ color: isOwn ? 'var(--bg)' : 'var(--text)' }}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-5 bg-black bg-opacity-20 rounded-full relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-full opacity-0 cursor-pointer absolute"
          />
          <div
            className="h-0.5 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: isOwn ? 'var(--bg)' : 'var(--text)',
            }}
          />
        </div>
      </div>

      <span
        className="text-xs flex-shrink-0 tabular-nums"
        style={{ color: isOwn ? 'var(--bg)' : 'var(--text)', opacity: 0.7 }}
      >
        {isPlaying || currentTime > 0
          ? formatTime(currentTime)
          : formatTime(duration)}
      </span>
    </div>
  )
}