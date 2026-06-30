'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Suggestion {
  id: string
  username: string
  avatar_url: string | null
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  rows?: number
  disabled?: boolean
  maxLength?: number
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  autoFocus?: boolean
  as?: 'textarea' | 'input'
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
  rows = 3,
  disabled,
  maxLength,
  onKeyDown,
  autoFocus,
  as = 'textarea',
}: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<any>(null)
  const supabase = createClient()

  async function searchUsers(prefix: string) {
    if (!prefix) {
      setSuggestions([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `${prefix}%`)
      .limit(5)
    setSuggestions(data ?? [])
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart ?? newValue.length
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@(\w*)$/)

    if (match) {
      setMentionStart(cursorPos - match[0].length)
      setShowDropdown(true)
      setActiveIndex(0)
      searchUsers(match[1])
    } else {
      setShowDropdown(false)
      setMentionStart(null)
    }
  }

  function selectUser(username: string) {
    if (mentionStart === null) return
    const cursorPos = inputRef.current?.selectionStart ?? value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursorPos)
    const newValue = `${before}@${username} ${after}`
    onChange(newValue)
    setShowDropdown(false)
    setMentionStart(null)
    setSuggestions([])

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newCursorPos = before.length + username.length + 2
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectUser(suggestions[activeIndex].username)
        return
      }
      if (e.key === 'Escape') {
        setShowDropdown(false)
        return
      }
    }
    onKeyDown?.(e)
  }

  const sharedProps: any = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className,
    style,
    disabled,
    maxLength,
    autoFocus,
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {as === 'textarea' ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input type="text" {...sharedProps} />
      )}

      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
            zIndex: 50,
            minWidth: '180px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          {suggestions.map((user, i) => (
            <div
              key={user.id}
              onMouseDown={(e) => { e.preventDefault(); selectUser(user.username) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === activeIndex ? 'var(--bg-input)' : 'transparent',
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'var(--bg-input)', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 'bold', flexShrink: 0
                }}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>@{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}