'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import ReportarModal from '@/components/ReportarModal'

interface Props {
  reporterId: string
  reportedUserId: string
}

export default function ReportarPerfilButton({ reporterId, reportedUserId }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
        title="Reportar usuario"
      >
        <Flag size={18} />
      </button>

      {showModal && (
        <ReportarModal
          reporterId={reporterId}
          reportedUserId={reportedUserId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}