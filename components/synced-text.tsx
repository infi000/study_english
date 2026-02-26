'use client'

import React from 'react'

interface SyncedTextProps {
  text: string
  progress: number
  playedColor?: string
  unplayedColor?: string
  className?: string
}

export const SyncedText = React.memo(({
  text,
  progress,
  playedColor = 'text-purple-900',
  unplayedColor = 'text-gray-600',
  className = ''
}: SyncedTextProps) => {
  const charIndex = Math.floor(text.length * Math.min(Math.max(progress, 0), 1))
  const played = text.substring(0, charIndex)
  const unplayed = text.substring(charIndex)

  return (
    <p className={`${className} leading-relaxed`}>
      <span className={playedColor}>{played}</span>
      <span className={unplayedColor}>{unplayed}</span>
    </p>
  )
})

SyncedText.displayName = 'SyncedText'
