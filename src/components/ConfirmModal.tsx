'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'confirmar',
  cancelText = 'cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      onClick={onCancel}
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
          borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '340px',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} style={{ color: danger ? '#ef4444' : '#f59e0b' }} />
          <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>{title}</h2>
        </div>

        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {message}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 text-sm py-2 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 text-sm py-2 rounded-lg disabled:opacity-50 transition-opacity"
            style={{ background: danger ? '#ef4444' : 'var(--text)', color: danger ? 'white' : 'var(--bg)' }}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}