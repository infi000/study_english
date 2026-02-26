'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import { ConversionForm } from '@/components/admin/ConversionForm'
import { ConversionProgress } from '@/components/admin/ConversionProgress'
import { ConversionQueue } from '@/components/admin/ConversionQueue'
import { ConversionHistoryComponent } from '@/components/admin/ConversionHistory'

function extractBilibiliVideoId(url: string): string | null {
  const match = url.match(/video\/(BV[a-zA-Z0-9]+)/)
  if (match) return match[1]
  if (url.match(/^BV[a-zA-Z0-9]+$/)) return url
  return null
}

export function AdminClient() {
  const {
    queuedTasks,
    runningTaskId,
    history,
    addToQueue,
    startQueue,
    cancelTask,
    deleteHistoryItem,
    loadHistory,
    loadQueueFromServer
  } = useAdminStore()

  const [error, setError] = useState('')
  const [eventSources, setEventSources] = useState<Map<string, EventSource>>(new Map())
  const [isInitialized, setIsInitialized] = useState(false)

  const runningTask = queuedTasks.find(t => t.taskId === runningTaskId)
  const pendingCount = queuedTasks.filter(t => t.queueStatus === 'pending').length
  const completedCount = queuedTasks.filter(t => t.queueStatus === 'completed').length

  // 初始化：仅在组件挂载时运行一次
  useEffect(() => {
    if (isInitialized) return

    const initialize = async () => {
      try {
        console.log('[AdminClient] 初始化...')
        // 从服务器加载队列状态
        await loadQueueFromServer()

        // 加载历史记录
        await loadHistory()

        setIsInitialized(true)
        console.log('[AdminClient] 初始化完成')
      } catch (err) {
        console.error('[AdminClient] 初始化失败:', err)
        setIsInitialized(true)
      }
    }

    initialize()
  }, []) // 空依赖数组，仅在挂载时运行一次

  // 监听队列变化，自动拉起下一个任务
  useEffect(() => {
    if (pendingCount > 0 && !runningTaskId) {
      const timer = setTimeout(() => {
        console.log(`[AdminClient] 自动拉起下一个任务`)
        startQueue()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [pendingCount, runningTaskId, startQueue])

  const handleSubmit = async (urls: string[]) => {
    setError('')

    const validUrls = urls.filter(url => {
      const videoId = extractBilibiliVideoId(url)
      return !!videoId
    })

    if (validUrls.length === 0) {
      setError('没有有效的 Bilibili 视频地址')
      return
    }

    try {
      addToQueue(validUrls)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    }
  }

  const handleCancelTask = (taskId: string) => {
    cancelTask(taskId)
    const es = eventSources.get(taskId)
    if (es) {
      es.close()
      setEventSources(prev => {
        const newMap = new Map(prev)
        newMap.delete(taskId)
        return newMap
      })
    }
  }

  // 处理运行中任务的 SSE 连接（刷新时恢复）
  useEffect(() => {
    if (!runningTaskId) return

    const es = eventSources.get(runningTaskId)

    if (!es) {
      console.log(`[AdminClient] 新建或恢复 SSE 连接: ${runningTaskId}`)
      const eventSource = new EventSource(`/api/admin/progress/${runningTaskId}`)

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data)
          console.log(`[AdminClient] 收到进度更新:`, update)
          useAdminStore.getState().updateProgress(update)

          if (update.status === 'done' || update.status === 'error') {
            console.log(`[AdminClient] 任务完成或失败: ${runningTaskId}`)
            if (update.status === 'done' && update.article) {
              useAdminStore.getState().completeConversion(runningTaskId, update.article)
            } else if (update.status === 'error') {
              useAdminStore.getState().failConversion(runningTaskId, update.error || '转换失败')
            }
            eventSource.close()
            setEventSources(prev => {
              const newMap = new Map(prev)
              newMap.delete(runningTaskId)
              return newMap
            })
          }
        } catch (err) {
          console.error('[AdminClient] SSE 消息处理失败:', err)
        }
      }

      eventSource.onerror = () => {
        console.log(`[AdminClient] SSE 连接错误: ${runningTaskId}`)
        eventSource.close()
        setEventSources(prev => {
          const newMap = new Map(prev)
          newMap.delete(runningTaskId)
          return newMap
        })
      }

      setEventSources(prev => new Map(prev).set(runningTaskId, eventSource))
    }
  }, [runningTaskId, eventSources])

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">视频转换</h1>
        <p className="text-lg text-slate-600">粘贴 Bilibili 视频地址，自动转换为学习内容</p>
      </div>

      {/* 表单区域 */}
      <ConversionForm
        onSubmit={handleSubmit}
        error={error}
        onErrorClear={() => setError('')}
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

      {/* 进度区域 */}
      {runningTask && (
        <ConversionProgress
          task={runningTask}
          totalTasks={queuedTasks.length}
          completedTasks={completedCount}
        />
      )}

      {/* 队列区域 */}
      {queuedTasks.length > 0 && (
        <ConversionQueue
          tasks={queuedTasks}
          onCancelTask={handleCancelTask}
        />
      )}

      {/* 历史记录区域 */}
      <ConversionHistoryComponent
        items={history}
        onDelete={deleteHistoryItem}
      />
    </div>
  )
}


