'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Link as LinkIcon } from 'lucide-react'

interface Props {
  postId: string
  size?: number
}

export default function ShareButton({ postId, size = 15 }: Props) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  function getUrl() {
    return `${window.location.origin}/post/${postId}`
  }

  async function handleNativeShare(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    try {
      await navigator.share({
        title: 'Petricor',
        text: 'Mira esta publicación en Petricor',
        url: getUrl(),
      })
    } catch (err) {
      // Cancelado por el usuario, no hacemos nada
    }
  }

  async function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert('No se pudo copiar el enlace')
    }
  }

  function handleMainClick(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleMainClick}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
        style={{ color: copied ? '#22c55e' : 'var(--text-subtle)' }}
      >
        {copied ? <Check size={size} /> : <Share2 size={size} />}
        {copied && <span className="text-xs">copiado</span>}
      </button>

      {menuOpen && (
        <>
          <div
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden', zIndex: 50,
              minWidth: '170px', boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            }}
          >
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '10px 14px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text)', fontSize: '13px',
                }}
              >
                <Share2 size={14} />
                Compartir
              </button>
            )}
            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '10px 14px', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text)', fontSize: '13px',
              }}
            >
              <LinkIcon size={14} />
              Copiar enlace
            </button>
          </div>
        </>
      )}
    </div>
  )
}