'use client'

import { useEffect, useState } from 'react'

interface VoiceSelectorProps {
  selectedVoiceName?: string
  onVoiceChange?: (voiceName: string) => void
}

// 存储选中语音的 localStorage key
const SELECTED_VOICE_KEY = 'selected-voice-name'

// 3个新闻主播风格的语音
const TOP_VOICES = [
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

export function VoiceSelector({
  selectedVoiceName: propSelectedVoiceName,
  onVoiceChange
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return propSelectedVoiceName || localStorage.getItem(SELECTED_VOICE_KEY) || ''
    }
    return ''
  })

  // 加载语音列表
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()

      // 定义3种语音类型
      const voiceTypes = [
        {
          label: '男美语 (新闻主播)',
          lang: 'en-US',
          candidates: ['Google US English', 'Microsoft David', 'Alex', 'Daniel']
        },
        {
          label: '男英语 (新闻主播)',
          lang: 'en-GB',
          candidates: ['Google UK English Male', 'Microsoft Guy', 'Daniel']
        },
        {
          label: '女英语 (新闻主播)',
          lang: 'en-GB',
          candidates: ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'Karen', 'Victoria']
        }
      ]

      const filteredVoices: Array<{ voice: SpeechSynthesisVoice; label: string }> = []

      // 为每种类型找到最佳语音
      for (const type of voiceTypes) {
        let foundVoice: SpeechSynthesisVoice | null = null

        // 优先按名称找
        for (const candidateName of type.candidates) {
          const voice = availableVoices.find(
            (v) => v.name === candidateName && v.localService
          )
          if (voice) {
            foundVoice = voice
            break
          }
        }

        // 如果没找到，按语言找
        if (!foundVoice) {
          const voicesByLang = availableVoices.filter(
            (v) => v.lang.startsWith(type.lang) && v.localService
          )
          if (voicesByLang.length > 0) {
            foundVoice = voicesByLang[0]
          }
        }

        if (foundVoice) {
          filteredVoices.push({ voice: foundVoice, label: type.label })
        }
      }

      setVoices(filteredVoices.map((v) => v.voice))

      // 存储语音标签映射
      const voiceLabelMap = new Map(
        filteredVoices.map((v) => [v.voice.name, v.label])
      )

      // 如果没有选择的语音，自动选择第一个
      if (!selectedVoiceName && filteredVoices.length > 0) {
        const defaultVoice = filteredVoices[0].voice
        setSelectedVoiceName(defaultVoice.name)
        localStorage.setItem(SELECTED_VOICE_KEY, defaultVoice.name)
        onVoiceChange?.(defaultVoice.name)
      }

      // 如果当前选择的语音不在列表中，切换到第一个
      if (selectedVoiceName && filteredVoices.length > 0) {
        const exists = filteredVoices.find((v) => v.voice.name === selectedVoiceName)
        if (!exists) {
          const defaultVoice = filteredVoices[0].voice
          setSelectedVoiceName(defaultVoice.name)
          localStorage.setItem(SELECTED_VOICE_KEY, defaultVoice.name)
          onVoiceChange?.(defaultVoice.name)
        }
      }

      // 保存标签映射到全局供显示使用
      ;(window as any)._voiceLabelMap = voiceLabelMap
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoiceName, onVoiceChange])

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceName = e.target.value
    setSelectedVoiceName(voiceName)
    localStorage.setItem(SELECTED_VOICE_KEY, voiceName)
    onVoiceChange?.(voiceName)
  }

  if (!('speechSynthesis' in window)) return null
  if (voices.length === 0) return null

  // 获取显示标签
  const getDisplayLabel = (voice: SpeechSynthesisVoice) => {
    const labelMap = (window as any)._voiceLabelMap as Map<string, string>
    if (labelMap && labelMap.has(voice.name)) {
      return labelMap.get(voice.name)
    }
    // 备用标签
    if (voice.lang.startsWith('en-US')) {
      return '男美语 (新闻主播)'
    } else if (voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha')) {
      return '女英语 (新闻主播)'
    } else {
      return '男英语 (新闻主播)'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">语音</span>
      <select
        value={selectedVoiceName}
        onChange={handleVoiceChange}
        className="px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-gray-700 dark:border-gray-600"
      >
        {voices.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {getDisplayLabel(voice)}
          </option>
        ))}
      </select>
    </div>
  )
}

// 获取用户选择的语音
export function getSelectedVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices()
  const savedVoiceName =
    typeof window !== 'undefined' ? localStorage.getItem(SELECTED_VOICE_KEY) : null

  if (!savedVoiceName) return null

  return voices.find((v) => v.name === savedVoiceName) || null
}
