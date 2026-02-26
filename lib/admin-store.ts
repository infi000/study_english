import { create } from 'zustand'
import { ConversionHistory, ProgressUpdate, Article, ConversionStatus, QueuedTask } from '@/types'

interface AdminState {
  queuedTasks: QueuedTask[]
  runningTaskId: string | null
  history: ConversionHistory[]

  addToQueue: (urls: string[]) => void
  startQueue: () => Promise<void>
  updateProgress: (update: ProgressUpdate) => void
  completeConversion: (taskId: string, article: Article) => void
  failConversion: (taskId: string, error: string) => void
  loadHistory: () => void
  loadQueueFromServer: () => Promise<void>
  clearHistory: () => void
  deleteHistoryItem: (id: string) => void
  cancelTask: (taskId: string) => void
  getRunningTask: () => QueuedTask | null
  getPendingTaskCount: () => number
  getCompletedTaskCount: () => number
}

export const useAdminStore = create<AdminState>((set, get) => ({
  queuedTasks: [],
  runningTaskId: null,
  history: [],

  loadQueueFromServer: async () => {
    try {
      const response = await fetch('/api/admin/queue')
      if (response.ok) {
        const data = await response.json()
        console.log('[Store] 从服务器加载队列:', data)

        set({
          queuedTasks: data.queuedTasks || [],
          runningTaskId: data.runningTaskId || null
        })

        // 如果后端清理了 running 任务并将其标记为失败，
        // 且还有 pending 任务，自动启动队列
        const pendingTasks = (data.queuedTasks || []).filter((t: any) => t.queueStatus === 'pending')
        if (pendingTasks.length > 0 && !data.runningTaskId) {
          console.log('[Store] 检测到 pending 任务，自动启动队列')
          setTimeout(() => {
            get().startQueue()
          }, 500)
        }
      }
    } catch (err) {
      console.error('[Store] 加载队列失败:', err)
    }
  },

  addToQueue: (urls: string[]) => {
    set((state) => {
      const newTasks: QueuedTask[] = urls.map((url, index) => {
        let videoId = ''
        const match = url.match(/video\/(BV[a-zA-Z0-9]+)/)
        if (match) {
          videoId = match[1]
        } else if (url.match(/^BV[a-zA-Z0-9]+$/)) {
          videoId = url
        }

        return {
          taskId: `task-${Date.now()}-${index}`,
          videoId,
          url,
          status: 'pending' as ConversionStatus,
          progress: 0,
          message: '准备开始...',
          startTime: Date.now(),
          queueStatus: 'pending',
          queueIndex: state.queuedTasks.length + index
        }
      })

      const newQueuedTasks = [...state.queuedTasks, ...newTasks]

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          queuedTasks: newQueuedTasks
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))

      return {
        queuedTasks: newQueuedTasks
      }
    })
  },

  startQueue: async () => {
    const state = get()
    const pendingTask = state.queuedTasks.find(t => t.queueStatus === 'pending')

    if (!pendingTask || state.runningTaskId) {
      return
    }

    try {
      const newQueuedTasks = state.queuedTasks.map(t =>
        t.taskId === pendingTask.taskId
          ? { ...t, queueStatus: 'running' as const }
          : t
      )

      set({
        queuedTasks: newQueuedTasks,
        runningTaskId: pendingTask.taskId
      })

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          queuedTasks: newQueuedTasks,
          runningTaskId: pendingTask.taskId
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))

      const response = await fetch('/api/admin/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pendingTask.url, videoId: pendingTask.videoId })
      })

      if (!response.ok) {
        throw new Error('转换请求失败')
      }

      console.log(`[Store] 启动任务 task=${pendingTask.taskId}`)
    } catch (err) {
      console.error('[Store] 启动队列失败:', err)

      const state = get()
      const newQueuedTasks = state.queuedTasks.map(t =>
        t.taskId === pendingTask.taskId
          ? { ...t, queueStatus: 'completed' as const, status: 'error' as ConversionStatus }
          : t
      )

      set({
        queuedTasks: newQueuedTasks,
        runningTaskId: null
      })

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          queuedTasks: newQueuedTasks,
          runningTaskId: null
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))
    }
  },

  updateProgress: (update: ProgressUpdate) => {
    console.log(`[Store] updateProgress called:`, update)
    set((state) => {
      const taskIndex = state.queuedTasks.findIndex(t => t.taskId === update.taskId)

      if (taskIndex === -1) {
        console.log(`[Store] 任务未找到: ${update.taskId}`)
        return state
      }

      return {
        queuedTasks: state.queuedTasks.map((t, idx) =>
          idx === taskIndex
            ? {
                ...t,
                status: update.status,
                progress: update.progress,
                message: update.message,
                error: update.error
              }
            : t
        )
      }
    })
  },

  completeConversion: (taskId: string, article: Article) => {
    set((state) => {
      const taskIndex = state.queuedTasks.findIndex(t => t.taskId === taskId)
      if (taskIndex === -1) return state

      const newHistory: ConversionHistory = {
        id: taskId,
        videoId: article.id,
        title: article.title,
        difficulty: article.difficulty,
        status: 'success',
        createdAt: new Date().toLocaleString('zh-CN'),
        audioPath: article.audioPath || ''
      }

      const newQueuedTasks = state.queuedTasks.map((t, idx) =>
        idx === taskIndex ? { ...t, queueStatus: 'completed' as const } : t
      )

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          queuedTasks: newQueuedTasks,
          runningTaskId: null
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))

      fetch('/api/admin/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([newHistory, ...state.history])
      }).catch(err => console.error('[Store] 保存历史记录失败:', err))

      return {
        queuedTasks: newQueuedTasks,
        runningTaskId: null,
        history: [newHistory, ...state.history]
      }
    })

    setTimeout(() => {
      get().startQueue()
    }, 100)
  },

  failConversion: (taskId: string, error: string) => {
    set((state) => {
      const taskIndex = state.queuedTasks.findIndex(t => t.taskId === taskId)
      if (taskIndex === -1) return state

      const task = state.queuedTasks[taskIndex]
      const newHistory: ConversionHistory = {
        id: taskId,
        videoId: task.videoId,
        title: '转换失败',
        difficulty: 0,
        status: 'failed',
        createdAt: new Date().toLocaleString('zh-CN'),
        audioPath: '',
        error
      }

      const newQueuedTasks = state.queuedTasks.map((t, idx) =>
        idx === taskIndex ? { ...t, queueStatus: 'completed' as const } : t
      )

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          queuedTasks: newQueuedTasks,
          runningTaskId: null
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))

      fetch('/api/admin/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([newHistory, ...state.history])
      }).catch(err => console.error('[Store] 保存历史记录失败:', err))

      return {
        queuedTasks: newQueuedTasks,
        runningTaskId: null,
        history: [newHistory, ...state.history]
      }
    })

    setTimeout(() => {
      get().startQueue()
    }, 100)
  },

  loadHistory: async () => {
    try {
      const response = await fetch('/data/VIDEO/articles.json')
      const data = await response.json()
      const articles = data.articles || []

      const history: ConversionHistory[] = articles.map((article: Article) => ({
        id: article.id,
        videoId: article.id,
        title: article.title,
        difficulty: article.difficulty,
        status: 'success' as const,
        createdAt: new Date().toLocaleString('zh-CN'),
        audioPath: article.audioPath || ''
      }))

      set({ history })
      console.log('[Store] 加载历史记录成功:', history.length)
    } catch (err) {
      console.error('[Store] 加载历史记录失败:', err)
    }
  },

  clearHistory: () => {
    set({ history: [] })
  },

  deleteHistoryItem: (id: string) => {
    set((state) => {
      const newHistory = state.history.filter((item) => item.id !== id)

      fetch('/api/admin/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.error('[Store] 删除历史记录失败:', err))

      return { history: newHistory }
    })
  },

  cancelTask: (taskId: string) => {
    set((state) => {
      const newQueuedTasks = state.queuedTasks.filter(t => t.taskId !== taskId)

      fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          queuedTasks: newQueuedTasks,
          runningTaskId: state.runningTaskId === taskId ? null : state.runningTaskId
        })
      }).catch(err => console.error('[Store] 同步队列失败:', err))

      return {
        queuedTasks: newQueuedTasks,
        runningTaskId: state.runningTaskId === taskId ? null : state.runningTaskId
      }
    })
  },

  getRunningTask: () => {
    const state = get()
    return state.queuedTasks.find(t => t.taskId === state.runningTaskId) || null
  },

  getPendingTaskCount: () => {
    const state = get()
    return state.queuedTasks.filter(t => t.queueStatus === 'pending').length
  },

  getCompletedTaskCount: () => {
    const state = get()
    return state.queuedTasks.filter(t => t.queueStatus === 'completed').length
  }
}))
