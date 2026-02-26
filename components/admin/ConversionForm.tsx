'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface ConversionFormProps {
  onSubmit: (urls: string[]) => Promise<void>
  error: string
  onErrorClear: () => void
  pendingCount: number
  completedCount: number
}

function extractBilibiliVideoId(url: string): string | null {
  const match = url.match(/video\/(BV[a-zA-Z0-9]+)/)
  if (match) return match[1]
  if (url.match(/^BV[a-zA-Z0-9]+$/)) return url
  return null
}

export function ConversionForm({
  onSubmit,
  error,
  onErrorClear,
  pendingCount,
  completedCount
}: ConversionFormProps) {
  const [input, setInput] = useState('')
  const [validUrls, setValidUrls] = useState<string[]>([])
  const [invalidCount, setInvalidCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInput(text)

    const lines = text.split('\n')
    const valid: string[] = []
    let invalid = 0

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const videoId = extractBilibiliVideoId(trimmed)
      if (videoId) {
        if (!valid.includes(videoId)) {
          valid.push(videoId)
        }
      } else {
        invalid++
      }
    })

    setValidUrls(valid)
    setInvalidCount(invalid)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onErrorClear()

    if (validUrls.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(validUrls)
      setInput('')
      setValidUrls([])
      setInvalidCount(0)
    } catch (err) {
      console.log('[ConversionForm] Error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl">添加新视频</CardTitle>
        <CardDescription>粘贴 Bilibili 视频链接，每行一个，支持多个链接</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">视频链接</label>
            <textarea
              placeholder="https://www.bilibili.com/video/BV1eBkYB9EQJ/
https://www.bilibili.com/video/BV2xyzabcd123/
BV3pqrstuvwx"
              value={input}
              onChange={handleInputChange}
              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(validUrls.length > 0 || invalidCount > 0) && (
            <div className="flex gap-4 text-sm">
              {validUrls.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-medium">✓ {validUrls.length} 个有效链接</span>
                </div>
              )}
              {invalidCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-medium">✕ {invalidCount} 个无效链接</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              type="submit"
              disabled={validUrls.length === 0 || isSubmitting}
              onClick={handleSubmit}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加到队列'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={validUrls.length === 0 || isSubmitting}
              onClick={() => {
                setInput('')
                setValidUrls([])
                setInvalidCount(0)
              }}
              className="min-w-[100px]"
            >
              清空
            </Button>
          </div>

          {(pendingCount > 0 || completedCount > 0) && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                队列状态：<span className="font-medium text-slate-700">待处理 {pendingCount}</span> · <span className="font-medium text-green-600">已完成 {completedCount}</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

