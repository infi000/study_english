'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis'
import { SyncedText } from '@/components/synced-text'
import { Play, Pause, Square, Volume2 } from 'lucide-react'

interface AudioPlayerProps {
  text?: string
  audioPath?: string
  rate?: number
  hideText?: boolean
  onRateChange?: (rate: number) => void
  onProgress?: (progress: number) => void
}

export function AudioPlayer({ text, audioPath, rate = 1, hideText, onRateChange, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentRate, setCurrentRate] = useState(rate)
  const [progress, setProgress] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const { speak, stop, pause, isPlaying } = useSpeechSynthesis({
    rate: currentRate
  })

  const handleRateChange = (newRate: number) => {
    setCurrentRate(newRate)
    onRateChange?.(newRate)
    if (audioRef.current && !useFallback) {
      audioRef.current.playbackRate = newRate
    }
    if (isPlaying) {
      stop()
      if (text) {
        setTimeout(() => speak(text), 100)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current
      const p = duration ? currentTime / duration : 0
      setProgress(p)
      onProgress?.(p)
    }
  }

  const handleEnded = () => {
    setProgress(0)
    onProgress?.(0)
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
    }
    setProgress(0)
    onProgress?.(0)
  }

  const handleAudioError = () => {
    console.warn(`无法加载音频文件: ${audioPath}，使用文本转语音作为备用`)
    setAudioError(true)
    setUseFallback(true)
  }

  // 如果有有效的 audioPath 且没有错误，使用原生音频播放
  if (audioPath && !useFallback && !audioError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <audio
            ref={audioRef}
            src={audioPath}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleAudioError}
            controls
            className="flex-1 min-w-0 h-[36px]"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-500">速度</span>
            <select
              value={currentRate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="px-1.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {text && !hideText && (
          <>
            <SyncedText
              text={text}
              progress={progress}
              playedColor="text-purple-900"
              unplayedColor="text-gray-600"
              className="text-lg"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              disabled={progress === 0}
            >
              <Square className="w-4 h-4 mr-2" />
              重置进度
            </Button>
          </>
        )}

        {audioError && (
          <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
            ⚠️ 音频加载失败，已切换到文本转语音
          </div>
        )}
      </div>
    )
  }

  // 无音频文件或加载失败，使用 Text-to-Speech fallback
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <Button
            size="sm"
            variant={isPlaying ? 'default' : 'outline'}
            className="p-0 w-9 h-9"
            onClick={() => {
              if (isPlaying) {
                pause()
              } else if (text) {
                speak(text)
              }
            }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="p-0 w-9 h-9"
            onClick={stop}
            disabled={!isPlaying}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-500">速度</span>
          <select
            value={currentRate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="px-1.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      {text && !hideText && (
        <SyncedText
          text={text}
          progress={progress}
          playedColor="text-purple-900"
          unplayedColor="text-gray-600"
          className="text-lg"
        />
      )}

      {useFallback && (
        <div className="text-sm text-blue-600 p-2 bg-blue-50 rounded">
          ℹ️ 使用浏览器文本转语音功能（仅支持英文）
        </div>
      )}
    </div>
  )
}
