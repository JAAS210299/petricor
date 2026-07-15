'use client'

import { useRef } from 'react'
import { Trash2, RotateCw, RotateCcw, Plus, Minus, MapPin, BarChart3, Timer } from 'lucide-react'
import type { Sticker } from '@/lib/stickers'

interface Props {
  stickers: Sticker[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<Sticker>) => void
  onDelete: (id: string) => void
  frameRef: React.RefObject<HTMLDivElement | null>
}

export default function StickerLayer({ stickers, selectedId, onSelect, onChange, onDelete, frameRef }: Props) {
  const dragRef = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null)

  function handlePointerDown(e: React.PointerEvent, sticker: Sticker) {
    e.stopPropagation()
    onSelect(sticker.id)
    dragRef.current = {
      id: sticker.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: sticker.x,
      startY: sticker.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    const frame = frameRef.current
    if (!drag || !frame) return
    const rect = frame.getBoundingClientRect()
    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100
    const newX = Math.max(0, Math.min(100, drag.startX + dxPct))
    const newY = Math.max(0, Math.min(100, drag.startY + dyPct))
    onChange(drag.id, { x: newX, y: newY })
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  function renderStickerContent(s: Sticker) {
    switch (s.type) {
      case 'text':
        return (
          <span style={{ color: s.color, fontSize: `${s.fontSize}px`, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
            {s.text}
          </span>
        )
      case 'emoji':
        return <span style={{ fontSize: '48px', lineHeight: 1 }}>{s.emoji}</span>
      case 'mention':
        return (
          <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '20px', color: 'white', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            @{s.username}
          </div>
        )
      case 'location':
        return (
          <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '20px', color: 'white', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} /> {s.text}
          </div>
        )
      case 'poll':
        return (
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '12px', width: '220px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <BarChart3 size={13} /> {s.question || 'Pregunta de la encuesta'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', border: '1.5px solid #111', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#111' }}>
                {s.optionA || 'Opción A'}
              </div>
              <div style={{ padding: '8px', borderRadius: '10px', border: '1.5px solid #111', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#111' }}>
                {s.optionB || 'Opción B'}
              </div>
            </div>
          </div>
        )
      case 'countdown':
        return (
          <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '16px', padding: '10px 16px', textAlign: 'center', color: 'white' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Timer size={11} /> CUENTA ATRÁS
            </p>
            <p style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{s.label || 'Evento'}</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {stickers.map(s => {
        const isSelected = s.id === selectedId
        return (
          <div
            key={s.id}
            onPointerDown={(e) => handlePointerDown(e, s)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
              cursor: 'grab',
              touchAction: 'none',
              outline: isSelected ? '2px dashed #60a5fa' : 'none',
              outlineOffset: '6px',
              borderRadius: '8px',
            }}
          >
            {renderStickerContent(s)}
          </div>
        )
      })}

      {/* Barra de controles del sticker seleccionado */}
      {selectedId && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '6px 10px', zIndex: 10,
          }}
        >
          <button onClick={() => onChange(selectedId, { scale: Math.max(0.4, (stickers.find(s => s.id === selectedId)?.scale ?? 1) - 0.15) })} style={{ color: 'white' }}>
            <Minus size={15} />
          </button>
          <button onClick={() => onChange(selectedId, { scale: Math.min(3, (stickers.find(s => s.id === selectedId)?.scale ?? 1) + 0.15) })} style={{ color: 'white' }}>
            <Plus size={15} />
          </button>
          <button onClick={() => onChange(selectedId, { rotation: (stickers.find(s => s.id === selectedId)?.rotation ?? 0) - 15 })} style={{ color: 'white' }}>
            <RotateCcw size={15} />
          </button>
          <button onClick={() => onChange(selectedId, { rotation: (stickers.find(s => s.id === selectedId)?.rotation ?? 0) + 15 })} style={{ color: 'white' }}>
            <RotateCw size={15} />
          </button>
          <button onClick={() => { onDelete(selectedId); onSelect(null) }} style={{ color: '#f87171' }}>
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </>
  )
}
