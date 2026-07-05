'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, X } from 'lucide-react'

interface Props {
  reporterId: string
  postId?: string
  commentId?: string
  reportedUserId?: string
  onClose: () => void
}

const REASONS_CONTENT = [
  'Spam',
  'Contenido de odio o acoso',
  'Violencia o contenido gráfico',
  'Desnudez o contenido sexual',
  'Información falsa',
  'Otro',
]

const REASONS_USER = [
  'Suplantación de identidad',
  'Acoso o intimidación',
  'Spam o cuenta falsa',
  'Contenido inapropiado en su perfil',
  'Otro',
]

export default function ReportarModal({ reporterId, postId, commentId, reportedUserId, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const isUserReport = !postId && !commentId && !!reportedUserId
  const reasons = isUserReport ? REASONS_USER : REASONS_CONTENT

  async function handleSubmit() {
    if (!reason) return
    setLoading(true)

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      post_id: postId ?? null,
      comment_id: commentId ?? null,
      reported_user_id: reportedUserId ?? null,
      reason,
      details: details.trim() || null,
    })

    setLoading(false)

    if (error) {
      alert('Error al enviar el reporte: ' + error.message)
      return
    }

    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '380px',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--text)' }}>
              ✓ Reporte enviado. Gracias por ayudarnos a mantener Petricor seguro.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag size={16} style={{ color: '#ef4444' }} />
                <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {isUserReport ? 'Reportar usuario' : commentId ? 'Reportar comentario' : 'Reportar publicación'}
                </h2>
              </div>
              <button onClick={onClose} style={{ color: 'var(--text-subtle)' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              ¿Por qué quieres reportar este contenido?
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {reasons.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="text-left text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: reason === r ? 'var(--text)' : 'var(--bg-input)',
                    color: reason === r ? 'var(--bg)' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason && (
              <textarea
                placeholder="Detalles adicionales (opcional)"
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={2}
                className="w-full text-sm outline-none resize-none mb-4"
                style={{
                  background: 'var(--bg-input)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  padding: '8px 10px',
                }}
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 text-sm py-2 rounded-lg transition-opacity hover:opacity-70"
                style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
              >
                cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="flex-1 text-sm py-2 rounded-lg disabled:opacity-40 transition-opacity"
                style={{ background: '#ef4444', color: 'white' }}
              >
                {loading ? 'enviando...' : 'reportar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}