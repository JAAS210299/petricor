'use client'

import Link from 'next/link'

interface Props {
  text: string
  style?: React.CSSProperties
  className?: string
}

export default function TextConHashtags({ text, style, className }: Props) {
  const parts = text.split(/(#\w+|@\w+)/g)

  return (
    <span style={style} className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <Link
              key={i}
              href={`/buscar?q=${encodeURIComponent(part)}`}
              onClick={e => e.stopPropagation()}
              style={{ color: '#60a5fa' }}
              className="hover:opacity-70 transition-opacity"
            >
              {part}
            </Link>
          )
        }
        if (part.startsWith('@')) {
          return (
            <Link
              key={i}
              href={`/perfil/${part.slice(1)}`}
              onClick={e => e.stopPropagation()}
              style={{ color: '#a78bfa' }}
              className="hover:opacity-70 transition-opacity"
            >
              {part}
            </Link>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}