import { BadgeCheck } from 'lucide-react'

interface Props {
  size?: number
  className?: string
}

export default function VerifiedBadge({ size = 14, className }: Props) {
  return (
    <BadgeCheck
      size={size}
      className={className}
      color="#60a5fa"
      fill="#1e3a5f"
      strokeWidth={2}
    />
  )
}