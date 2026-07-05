'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import EliminarPost from './EliminarPost'
import ReportarModal from '@/components/ReportarModal'

interface Props {
  postId: string
  userId: string
  ownerId: string
}

export default function AccionesPost({ postId, userId, ownerId }: Props) {
  const [showReport, setShowReport] = useState(false)
  const isOwner = userId === ownerId

  if (isOwner) {
    return <EliminarPost postId={postId} userId={userId} ownerId={ownerId} />
  }

  return (
    <>
      <button
        onClick={() => setShowReport(true)}
        className="transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-subtle)' }}
      >
        <Flag size={14} />
      </button>
      {showReport && (
        <ReportarModal
          reporterId={userId}
          postId={postId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}