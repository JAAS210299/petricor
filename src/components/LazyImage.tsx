'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

export default function LazyImage({ src, alt, className, style }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // empieza a cargar 200px antes de entrar en pantalla
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {/* Skeleton mientras no es visible o no ha cargado */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'var(--bg-input)',
            animation: 'lazyimg-pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            display: 'block',
          }}
        />
      )}
      <style>{`
        @keyframes lazyimg-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}