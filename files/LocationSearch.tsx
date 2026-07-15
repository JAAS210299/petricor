'use client'

import { useState, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface Place {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  onSelect: (text: string, lat?: number, lon?: number) => void
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setQuery(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!value.trim()) {
      setResults([])
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=0&limit=6`
        )
        const data = await res.json()
        setResults(data ?? [])
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 400)
  }

  function shortenName(fullName: string) {
    // Muestra solo los primeros 2-3 fragmentos para que no sea un párrafo entero
    const parts = fullName.split(',').map((p) => p.trim())
    return parts.slice(0, 2).join(', ')
  }

  function handleSelect(place: Place) {
    onSelect(shortenName(place.display_name), parseFloat(place.lat), parseFloat(place.lon))
    setQuery('')
    setResults([])
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <MapPin size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar un lugar..."
          className="w-full text-sm outline-none bg-transparent"
          style={{ color: 'var(--text)' }}
        />
        {loading && <Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-subtle)' }} />}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-1 mt-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {results.map((place, i) => (
            <button
              key={i}
              onClick={() => handleSelect(place)}
              className="text-left text-sm px-3 py-2 rounded-lg transition-colors hover:opacity-70 flex items-center gap-2"
              style={{ background: 'var(--bg-card)', color: 'var(--text)' }}
            >
              <MapPin size={12} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
              <span className="truncate">{place.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
