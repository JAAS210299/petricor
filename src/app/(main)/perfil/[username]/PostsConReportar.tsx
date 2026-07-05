'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag } from 'lucide-react'
import ReportarModal from '@/components/ReportarModal'

interface Props {
  posts: any[]
  currentUserId: string | null
}

export default function PostsConReportar({ posts, currentUserId }: Props) {
  const [reportingId, setReportingId] = useState<string | null>(null)
  const router = useRouter()

  if (posts.length === 0) {
    return (
      <p className="text-sm text-center mt-8" style={{ color: 'var(--text-subtle)' }}>
        aún no ha publicado nada
      </p>
    )
  }

  return (
    <>
      {posts.map(post => (
        <div
          key={post.id}
          className="rounded-xl p-5 border relative"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {currentUserId && (
            <button
              onClick={() => setReportingId(post.id)}
              className="absolute top-4 right-4 transition-opacity hover:opacity-60 z-10"
              style={{ color: 'var(--text-subtle)', background: 'var(--bg-card)', borderRadius: '6px', padding: '4px' }}
            >
              <Flag size={13} />
            </button>
          )}

          <div onClick={() => router.push(`/post/${post.id}`)} className="cursor-pointer">
            {post.image_url && !post.media_url && (
              <img src={post.image_url} alt="imagen" loading="lazy" className="w-full rounded-lg mb-3 object-cover max-h-64" />
            )}
            {post.media_url && post.media_type === 'image' && (
              <img src={post.media_url} alt="imagen" loading="lazy" className="w-full rounded-lg mb-3 object-cover max-h-64" />
            )}
            {post.media_url && post.media_type === 'video' && (
              <video src={post.media_url} controls className="w-full rounded-lg mb-3 max-h-64" onClick={e => e.stopPropagation()} />
            )}
            {post.media_url && post.media_type === 'audio' && (
              <div className="mb-3 pr-8" onClick={e => e.stopPropagation()}>
                <audio src={post.media_url} controls className="w-full" />
              </div>
            )}
            {post.content && (
              <p className="text-sm leading-relaxed pr-6" style={{ color: 'var(--text)' }}>
                {post.content}
              </p>
            )}
            <p className="text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>
              {new Date(post.created_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))}

      {reportingId && currentUserId && (
        <ReportarModal
          reporterId={currentUserId}
          postId={reportingId}
          onClose={() => setReportingId(null)}
        />
      )}
    </>
  )
}