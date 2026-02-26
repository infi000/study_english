import { NextRequest, NextResponse } from 'next/server'
import { TaskManager } from '@/lib/task-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  console.log(`[Progress] SSE 连接 task=${taskId}`)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false

      const listener = (update: any) => {
        if (isClosed) return

        try {
          const data = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(encoder.encode(data))
          console.log(`[Progress] 发送更新 task=${taskId}, status=${update.status}`)

          if (update.status === 'done' || update.status === 'error') {
            TaskManager.removeListener(taskId, listener)
            isClosed = true
            controller.close()
            console.log(`[Progress] 关闭连接 task=${taskId}`)
          }
        } catch (error) {
          console.error(`[Progress] 发送失败 task=${taskId}:`, error)
          if (!isClosed) {
            TaskManager.removeListener(taskId, listener)
            isClosed = true
          }
        }
      }

      // 如果任务已有更新，立即发送
      const lastUpdate = TaskManager.getLastUpdate(taskId)
      if (lastUpdate) {
        console.log(`[Progress] 发送缓存状态 task=${taskId}, status=${lastUpdate.status}`)
        try {
          const data = `data: ${JSON.stringify(lastUpdate)}\n\n`
          controller.enqueue(encoder.encode(data))

          if (lastUpdate.status === 'done' || lastUpdate.status === 'error') {
            isClosed = true
            controller.close()
            console.log(`[Progress] 任务已完成，关闭连接 task=${taskId}`)
            return
          }
        } catch (error) {
          console.error(`[Progress] 发送缓存失败 task=${taskId}:`, error)
          isClosed = true
          return
        }
      }

      // 注册监听器
      TaskManager.addListener(taskId, listener)
      console.log(`[Progress] 监听器已注册 task=${taskId}`)

      // 如果没有缓存状态，发送初始状态
      if (!lastUpdate) {
        console.log(`[Progress] 没有缓存状态，发送初始状态 task=${taskId}`)
        try {
          const initialData = `data: ${JSON.stringify({
            taskId,
            status: 'downloading',
            progress: 0,
            message: '准备下载...'
          })}\n\n`
          controller.enqueue(encoder.encode(initialData))
        } catch (error) {
          console.error(`[Progress] 发送初始状态失败 task=${taskId}:`, error)
        }
      }

      const cleanup = () => {
        if (!isClosed) {
          TaskManager.removeListener(taskId, listener)
          isClosed = true
          console.log(`[Progress] 清理监听器 task=${taskId}`)
        }
      }

      request.signal.addEventListener('abort', cleanup)
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

