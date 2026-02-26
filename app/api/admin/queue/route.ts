import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const QUEUE_FILE = path.join(process.cwd(), 'public/data/admin-queue.json')

interface QueueState {
  queuedTasks: any[]
  runningTaskId: string | null
}

function ensureQueueFile() {
  if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify({ queuedTasks: [], runningTaskId: null }))
  }
}

function readQueue(): QueueState {
  ensureQueueFile()
  try {
    const data = fs.readFileSync(QUEUE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { queuedTasks: [], runningTaskId: null }
  }
}

function writeQueue(state: QueueState) {
  ensureQueueFile()
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(state, null, 2))
}

export async function GET() {
  try {
    let queue = readQueue()

    // 激进清理：任何 queueStatus 为 'running' 的任务都被视为失败
    // 这是因为如果服务重启了，running 的任务肯定已经失败了
    if (queue.queuedTasks.length > 0) {
      let hasRunningTask = false
      queue.queuedTasks = queue.queuedTasks.map(task => {
        if (task.queueStatus === 'running') {
          hasRunningTask = true
          console.log('[Queue API] 清理失败的 running 任务:', task.taskId)
          return {
            ...task,
            queueStatus: 'completed',
            status: 'error',
            message: '服务重启，任务已中断'
          }
        }
        return task
      })

      // 如果有 running 任务被清理，清除 runningTaskId
      if (hasRunningTask && queue.runningTaskId) {
        console.log('[Queue API] 清除 runningTaskId:', queue.runningTaskId)
        queue.runningTaskId = null
        writeQueue(queue)
      }
    }

    return NextResponse.json(queue)
  } catch (err) {
    console.error('[Queue API] GET 失败:', err)
    return NextResponse.json(
      { error: '获取队列失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const queue = readQueue()

    if (body.action === 'add') {
      queue.queuedTasks = body.queuedTasks
    } else if (body.action === 'update') {
      queue.queuedTasks = body.queuedTasks
      queue.runningTaskId = body.runningTaskId
    } else if (body.action === 'clear') {
      queue.queuedTasks = []
      queue.runningTaskId = null
    }

    writeQueue(queue)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Queue API] POST 失败:', err)
    return NextResponse.json(
      { error: '更新队列失败' },
      { status: 500 }
    )
  }
}
