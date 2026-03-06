import { useCallback, useRef, useState, useEffect } from 'react'

interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
}

// 3个新闻主播风格的语音（按优先级排序）
const VOICE_PREFERENCES = [
  // 男美语（美国英语男声）
  'Google US English',
  'Microsoft David',
  'Alex',
  'Daniel',
  // 男英语（英国英语男声）
  'Google UK English Male',
  'Microsoft Guy',
  // 女英语（英国英语女声）
  'Google UK English Female',
  'Microsoft Zira',
  'Samantha',
  'Karen',
  'Victoria',
]

// 存储选中语音的 localStorage key
const SELECTED_VOICE_KEY = 'selected-voice-name'

// 全局变量：确保预加载只发生一次
let isPreloaded = false

// 获取用户选择的语音
function getUserSelectedVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices()
  const savedVoiceName =
    typeof window !== 'undefined' ? localStorage.getItem(SELECTED_VOICE_KEY) : null

  if (!savedVoiceName) return null

  return voices.find((v) => v.name === savedVoiceName) || null
}

// 获取最佳语音
function getBestVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // 优先使用用户选择的语音
  const userSelected = getUserSelectedVoice()
  if (userSelected) {
    return userSelected
  }

  // 优先选择英语语音
  const englishVoices = voices.filter(
    (voice) => voice.lang.startsWith('en-') && voice.localService
  )

  if (englishVoices.length === 0) {
    // 如果没有本地英语语音，回退到任意英语语音
    const anyEnglishVoices = voices.filter((voice) => voice.lang.startsWith('en-'))
    if (anyEnglishVoices.length > 0) {
      return anyEnglishVoices[0]
    }
    return voices[0]
  }

  // 按照偏好列表排序
  for (const prefName of VOICE_PREFERENCES) {
    const voice = englishVoices.find((v) => v.name === prefName)
    if (voice) {
      return voice
    }
  }

  // 如果没有匹配的偏好语音，选择第一个英语语音
  return englishVoices[0]
}

// 预加载 Speech Synthesis API
function preloadSpeechSynthesis() {
  if (isPreloaded) return
  if (!('speechSynthesis' in window)) return

  isPreloaded = true

  // 加载语音列表
  window.speechSynthesis.getVoices()

  // 监听语音列表加载完成事件
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }

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
  const { rate = 1, pitch = 0.95, volume = 1 } = options
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
      // 优化参数以获得更自然的语音
      utterance.rate = rate
      utterance.pitch = pitch // 稍微降低音调让声音更自然
      utterance.volume = volume
      utterance.lang = 'en-US'

      // 获取并使用最佳语音
      const bestVoice = getBestVoice()
      if (bestVoice) {
        utterance.voice = bestVoice
        utterance.lang = bestVoice.lang
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
