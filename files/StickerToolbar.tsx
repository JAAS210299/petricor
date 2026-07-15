'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Type, Smile, AtSign, MapPin, BarChart3, Timer, X } from 'lucide-react'
import {
  EMOJI_PALETTE,
  createTextSticker,
  createEmojiSticker,
  createMentionSticker,
  createLocationSticker,
  createPollSticker,
  createCountdownSticker,
  type Sticker,
} from '@/lib/stickers'
import LocationSearch from './LocationSearch'

interface Props {
  onAdd: (sticker: Sticker) => void
}

type PanelType = 'text' | 'emoji' | 'mention' | 'location' | 'poll' | 'countdown' | null

const TEXT_COLORS = ['#ffffff', '#000000', '#ef4444', '#60a5fa', '#facc15', '#4ade80', '#a78bfa']

export default function StickerToolbar({ onAdd }: Props) {
  const [panel, setPanel] = useState<PanelType>(null)

  // Estado de cada mini-formulario
  const [textValue, setTextValue] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<{ id: string; username: string }[]>([])
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollA, setPollA] = useState('Sí')
  const [pollB, setPollB] = useState('No')
  const [countdownLabel, setCountdownLabel] = useState('')
  const [countdownDate, setCountdownDate] = useState('')

  const supabase = createClient()

  function closePanel() {
    setPanel(null)
    setTextValue('')
    setMentionQuery('')
    setMentionResults([])
    setPollQuestion('')
    setCountdownLabel('')
    setCountdownDate('')
  }

  async function searchMentions(value: string) {
    setMentionQuery(value)
    if (!value.trim()) { setMentionResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `${value}%`)
      .limit(5)
    setMentionResults(data ?? [])
  }

  function addText() {
    if (!textValue.trim()) return
    onAdd(createTextSticker(textValue.trim(), textColor))
    closePanel()
  }

  function addEmoji(emoji: string) {
    onAdd(createEmojiSticker(emoji))
    closePanel()
  }

  function addMention(username: string, userId: string) {
    onAdd(createMentionSticker(username, userId))
    closePanel()
  }

  function addLocationFromSearch(text: string) {
    onAdd(createLocationSticker(text))
    closePanel()
  }

  function addPoll() {
    onAdd(createPollSticker(pollQuestion.trim() || '¿Qué opinas?', pollA.trim() || 'Sí', pollB.trim() || 'No'))
    closePanel()
  }

  function addCountdown() {
    if (!countdownDate) return
    onAdd(createCountdownSticker(countdownLabel.trim() || 'Evento', new Date(countdownDate).toISOString()))
    closePanel()
  }

  const TOOLS = [
    { key: 'text' as const, icon: Type, label: 'Texto' },
    { key: 'emoji' as const, icon: Smile, label: 'Emoji' },
    { key: 'mention' as const, icon: AtSign, label: 'Mención' },
    { key: 'location' as const, icon: MapPin, label: 'Ubicación' },
    { key: 'poll' as const, icon: BarChart3, label: 'Encuesta' },
    { key: 'countdown' as const, icon: Timer, label: 'Cuenta atrás' },
  ]

  return (
    <div>
      {/* Barra de iconos */}
      <div className="flex items-center justify-center gap-3 flex-wrap py-2">
        {TOOLS.map(t => (
          <button
            key={t.key}
            onClick={() => setPanel(panel === t.key ? null : t.key)}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors"
            style={{
              background: panel === t.key ? 'var(--bg-input)' : 'transparent',
              color: panel === t.key ? '#60a5fa' : 'var(--text-muted)',
            }}
          >
            <t.icon size={18} />
            <span style={{ fontSize: '10px' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel de texto */}
      {panel === 'text' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Añadir texto</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <input
            type="text"
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            placeholder="Escribe algo..."
            className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <div className="flex items-center gap-2 mb-3">
            {TEXT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setTextColor(c)}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: c,
                  border: textColor === c ? '2px solid #60a5fa' : '1px solid var(--border)',
                }}
              />
            ))}
          </div>
          <button onClick={addText} className="w-full text-sm py-2 rounded-lg" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            añadir
          </button>
        </div>
      )}

      {/* Panel de emoji */}
      {panel === 'emoji' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Elige un emoji</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_PALETTE.map(e => (
              <button key={e} onClick={() => addEmoji(e)} className="text-xl p-1 rounded-lg hover:opacity-70">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel de mención */}
      {panel === 'mention' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Mencionar a alguien</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <input
            type="text"
            value={mentionQuery}
            onChange={e => searchMentions(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full text-sm outline-none rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          {mentionResults.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {mentionResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => addMention(u.username, u.id)}
                  className="text-sm text-left px-3 py-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ background: 'var(--bg-card)', color: 'var(--text)' }}
                >
                  @{u.username}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel de ubicación — búsqueda real de sitios */}
      {panel === 'location' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Añadir ubicación</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <LocationSearch onSelect={(text) => addLocationFromSearch(text)} />
        </div>
      )}

      {/* Panel de encuesta */}
      {panel === 'poll' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Crear encuesta</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <input
            type="text"
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="¿Qué opinas?"
            className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={pollA}
              onChange={e => setPollA(e.target.value)}
              placeholder="Opción A"
              className="flex-1 text-sm outline-none rounded-lg px-3 py-2"
              style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <input
              type="text"
              value={pollB}
              onChange={e => setPollB(e.target.value)}
              placeholder="Opción B"
              className="flex-1 text-sm outline-none rounded-lg px-3 py-2"
              style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          <button onClick={addPoll} className="w-full text-sm py-2 rounded-lg" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            añadir
          </button>
        </div>
      )}

      {/* Panel de cuenta atrás */}
      {panel === 'countdown' && (
        <div className="p-3 rounded-xl mt-1" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cuenta atrás</span>
            <button onClick={closePanel}><X size={14} style={{ color: 'var(--text-subtle)' }} /></button>
          </div>
          <input
            type="text"
            value={countdownLabel}
            onChange={e => setCountdownLabel(e.target.value)}
            placeholder="Ej: Lanzamiento"
            className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <input
            type="datetime-local"
            value={countdownDate}
            onChange={e => setCountdownDate(e.target.value)}
            className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button onClick={addCountdown} className="w-full text-sm py-2 rounded-lg" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            añadir
          </button>
        </div>
      )}
    </div>
  )
}
