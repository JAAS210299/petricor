'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Check, X, Clock } from 'lucide-react'

interface Props {
  initialReports: any[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'pendiente', color: '#f59e0b' },
  resolved: { label: 'resuelto', color: '#22c55e' },
  dismissed: { label: 'descartado', color: 'var(--text-subtle)' },
}

export default function ReportesLista({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  async function updateStatus(reportId: string, status: string) {
    setUpdatingId(reportId)
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
    setUpdatingId(null)

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => (r.status ?? 'pending') === filter)

  const counts = {
    all: reports.length,
    pending: reports.filter(r => (r.status ?? 'pending') === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['pending', 'all', 'resolved', 'dismissed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
            style={{
              background: filter === f ? 'var(--text)' : 'var(--bg-input)',
              color: filter === f ? 'var(--bg)' : 'var(--text-muted)',
            }}
          >
            {f === 'all' ? 'todos' : STATUS_LABELS[f]?.label ?? f} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
          no hay reportes en esta categoría
        </p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(report => {
          const status = report.status ?? 'pending'
          const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.pending
          const targetUrl = report.post_id ? `/post/${report.post_id}` : null
          const isUserReport = !!report.reported_user_id && !report.post_id && !report.comment_id

          return (
            <div
              key={report.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {report.reason}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                    reportado por @{report.reporter?.username ?? 'desconocido'} ·{' '}
                    {new Date(report.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                  style={{ background: 'var(--bg-input)', color: statusInfo.color }}
                >
                  <Clock size={10} />
                  {statusInfo.label}
                </span>
              </div>

              {report.details && (
                <p className="text-xs mb-2 p-2 rounded-lg" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  {report.details}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {isUserReport ? (
                    <Link
                      href={`/perfil/${report.reported_user?.username}`}
                      className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ExternalLink size={11} />
                      ver perfil de @{report.reported_user?.username}
                    </Link>
                  ) : targetUrl ? (
                    <Link
                      href={targetUrl}
                      className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ExternalLink size={11} />
                      {report.comment_id ? 'ver comentario' : 'ver publicación'}
                    </Link>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                      contenido eliminado
                    </span>
                  )}
                </div>

                {status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      disabled={updatingId === report.id}
                      className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: '#22c55e', color: 'white' }}
                    >
                      <Check size={11} /> resolver
                    </button>
                    <button
                      onClick={() => updateStatus(report.id, 'dismissed')}
                      disabled={updatingId === report.id}
                      className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
                    >
                      <X size={11} /> descartar
                    </button>
                  </div>
                )}

                {status !== 'pending' && (
                  <button
                    onClick={() => updateStatus(report.id, 'pending')}
                    disabled={updatingId === report.id}
                    className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    reabrir
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}