interface ProgressUpdate {
  taskId: string
  status: string
  progress: number
  message: string
  error?: string
}

class TaskManagerClass {
  private listeners = new Map<string, Set<(update: ProgressUpdate) => void>>()
  private lastUpdates = new Map<string, ProgressUpdate>()

  addListener(taskId: string, listener: (update: ProgressUpdate) => void): void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set())
    }
    this.listeners.get(taskId)!.add(listener)
    const count = this.listeners.get(taskId)!.size
    console.log(`[TaskManager] 注册监听器 task=${taskId}, 总数=${count}`)
  }

  removeListener(taskId: string, listener: (update: ProgressUpdate) => void): void {
    const listeners = this.listeners.get(taskId)
    if (listeners) {
      listeners.delete(listener)
      const remaining = listeners.size
      console.log(`[TaskManager] 移除监听器 task=${taskId}, 剩余=${remaining}`)
      if (listeners.size === 0) {
        this.listeners.delete(taskId)
      }
    }
  }

  broadcast(taskId: string, update: ProgressUpdate): void {
    this.lastUpdates.set(taskId, update)
    const listeners = this.listeners.get(taskId)
    const listenerCount = listeners ? listeners.size : 0
    console.log(`[TaskManager] 广播更新 task=${taskId}, 监听器数=${listenerCount}, status=${update.status}, progress=${update.progress}`)

    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(update)
        } catch (error) {
          console.error(`[TaskManager] 监听器执行失败:`, error)
        }
      })
    } else {
      console.log(`[TaskManager] 无监听器，缓存更新 task=${taskId}`)
    }
  }

  getLastUpdate(taskId: string): ProgressUpdate | undefined {
    return this.lastUpdates.get(taskId)
  }

  cleanup(taskId: string, delay: number = 5000): void {
    setTimeout(() => {
      this.listeners.delete(taskId)
      this.lastUpdates.delete(taskId)
      console.log(`[TaskManager] 清理任务 task=${taskId}`)
    }, delay)
  }
}

// 使用全局变量确保单例在整个应用生命周期内保持一致
declare global {
  var taskManager: TaskManagerClass | undefined
}

if (!global.taskManager) {
  global.taskManager = new TaskManagerClass()
}

export const TaskManager = global.taskManager

