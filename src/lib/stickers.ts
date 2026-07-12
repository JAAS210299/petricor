// Tipos y helpers compartidos para el sistema de stickers de historias

export interface StickerBase {
  id: string
  type: string
  x: number // porcentaje (0-100) del centro del sticker respecto al ancho del marco
  y: number // porcentaje (0-100) del centro del sticker respecto al alto del marco
  scale: number // multiplicador de tamaño, 1 = tamaño base
  rotation: number // grados
}

export interface TextSticker extends StickerBase {
  type: 'text'
  text: string
  color: string
  fontSize: number
}

export interface EmojiSticker extends StickerBase {
  type: 'emoji'
  emoji: string
}

export interface MentionSticker extends StickerBase {
  type: 'mention'
  username: string
  userId: string
}

export interface LocationSticker extends StickerBase {
  type: 'location'
  text: string
}

export interface PollSticker extends StickerBase {
  type: 'poll'
  question: string
  optionA: string
  optionB: string
}

export interface CountdownSticker extends StickerBase {
  type: 'countdown'
  label: string
  targetDate: string // ISO
}

export type Sticker =
  | TextSticker
  | EmojiSticker
  | MentionSticker
  | LocationSticker
  | PollSticker
  | CountdownSticker

export function newStickerId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createTextSticker(text: string, color = '#ffffff'): TextSticker {
  return { id: newStickerId(), type: 'text', x: 50, y: 50, scale: 1, rotation: 0, text, color, fontSize: 24 }
}

export function createEmojiSticker(emoji: string): EmojiSticker {
  return { id: newStickerId(), type: 'emoji', x: 50, y: 50, scale: 1, rotation: 0, emoji }
}

export function createMentionSticker(username: string, userId: string): MentionSticker {
  return { id: newStickerId(), type: 'mention', x: 50, y: 30, scale: 1, rotation: 0, username, userId }
}

export function createLocationSticker(text: string): LocationSticker {
  return { id: newStickerId(), type: 'location', x: 50, y: 30, scale: 1, rotation: 0, text }
}

export function createPollSticker(question: string, optionA: string, optionB: string): PollSticker {
  return { id: newStickerId(), type: 'poll', x: 50, y: 50, scale: 1, rotation: 0, question, optionA, optionB }
}

export function createCountdownSticker(label: string, targetDate: string): CountdownSticker {
  return { id: newStickerId(), type: 'countdown', x: 50, y: 50, scale: 1, rotation: 0, label, targetDate }
}

// Emojis/avatares predefinidos para el selector rápido
export const EMOJI_PALETTE = [
  '😀', '😂', '😍', '🥳', '😎', '🔥', '❤️', '✨',
  '👍', '👏', '🎉', '💯', '😭', '🙌', '😅', '🤩',
  '🐶', '🐱', '🌈', '☀️', '🌙', '⭐', '💫', '🎵',
]