import { useCallback, useRef, useState, useEffect } from 'react'

interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
}

// 全局变量：确保预加载只发生一次
let isPreloaded = false

// 预加载 Speech Synthesis API
function preloadSpeechSynthesis() {
  if (isPreloaded) return
  if (!('speechSynthesis' in window)) return

  isPreloaded = true

  // 创建一个空的 utterance 来触发 API 初始化
  const utterance = new SpeechSynthesisUtterance('')
  utterance.volume = 0 // 静音
  try {
    window.speechSynthesis.speak(utterance)
    // 立即取消，避免有声音
    window.speechSynthesis.cancel()
  } catch (error) {
    // 忽略任何错误
  }
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { rate = 1, pitch = 1, volume = 1 } = options
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // 组件挂载时预加载 API
  useEffect(() => {
    preloadSpeechSynthesis()
  }, [])

  // 计算进度百分比
  const progress = estimatedDuration > 0 ? Math.min(elapsedTime / estimatedDuration, 1) : 0

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        return
      }

      window.speechSynthesis.cancel()
      setIsPaused(false)
      setElapsedTime(0)

      // 计算估计时长：每秒读 10 个字符
      const charCount = text.length
      const avgCharsPerSecond = 10 * rate
      const duration = charCount / avgCharsPerSecond
      setEstimatedDuration(duration)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      utterance.lang = 'en-US'

      // 显式设置语音
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        utterance.voice = voices[0]
      }

      utterance.onstart = () => {
        setIsPlaying(true)
        startTimeRef.current = Date.now()
        document.body.style.overflow = 'hidden'
        setTimeout(() => {
          document.body.style.overflow = ''
        }, 100)
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
        setElapsedTime(0)
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        document.body.style.overflow = ''
      }

      utterance.onerror = () => {
        setIsPlaying(false)
        setIsPaused(false)
        setElapsedTime(0)
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        document.body.style.overflow = ''
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)

      // Chrome 兼容性修复：检查 speaking 状态而不只依赖 onstart 事件
      const checkInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          setIsPlaying(true)
          clearInterval(checkInterval)
        }
      }, 10)
    },
    [rate, pitch, volume]
  )

  // 时间更新机制
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      return
    }

    const updateTime = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setElapsedTime(elapsed)
      rafIdRef.current = requestAnimationFrame(updateTime)
    }

    rafIdRef.current = requestAnimationFrame(updateTime)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isPlaying, isPaused])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
      setElapsedTime(0)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  const pause = useCallback(() => {
    if ('speechSynthesis' in window && isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isPlaying, isPaused])

  const resume = useCallback(() => {
    if ('speechSynthesis' in window && isPlaying && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      startTimeRef.current = Date.now() - (elapsedTime * 1000)
    }
  }, [isPlaying, isPaused, elapsedTime])

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isPaused,
    elapsedTime,
    estimatedDuration,
    progress
  }
}
