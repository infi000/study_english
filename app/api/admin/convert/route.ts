import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { TaskManager } from '@/lib/task-manager'

interface TaskState {
  process: any
  listeners: Set<any>
  lastUpdate?: any
  articleId?: string
}

const taskMap = new Map<string, TaskState>()

export async function POST(request: NextRequest) {
  try {
    const { url, videoId } = await request.json()

    if (!url || !videoId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const taskId = `task-${Date.now()}`

    const child = spawn('node', [
      '--import', 'tsx',
      path.join(process.cwd(), 'scripts/video-to-article.ts'),
      '--url', url,
      '--video-id', videoId
    ])

    const listeners = new Set<any>()
    taskMap.set(taskId, { process: child, listeners })
    console.log(`[Convert] 创建任务 task=${taskId}, url=${url}`)

    // 立即发送初始状态
    const initialUpdate = {
      taskId,
      status: 'downloading',
      progress: 0,
      message: '准备下载...'
    }
    TaskManager.broadcast(taskId, initialUpdate)

    child.stdout.on('data', (data) => {
      const message = data.toString()
      let status = 'converting'
      let progress = 50
      let articleId = null

      // 在任何消息中都尝试解析文章 ID
      // 支持多种格式：
      // 1. "文章 ID: video-BV1eBkYB9EQJ"
      // 2. "📍 文章 ID: video-BV1eBkYB9EQJ"
      // 3. "✅ 转换完成: video-BV1eBkYB9EQJ"
      // 4. 多行消息中的任何格式
      let idMatch = message.match(/文章\s+ID:\s*([^\s\n]+)/)
      if (!idMatch) {
        idMatch = message.match(/转换完成:\s*([^\s\n]+)/)
      }
      if (idMatch) {
        articleId = idMatch[1].trim()
        console.log(`[Convert] 解析到文章 ID: ${articleId}`)
      }

      // 根据输出内容判断进度
      if (message.includes('[下载]')) {
        status = 'downloading'
        progress = 25
      } else if (message.includes('[转换]')) {
        status = 'converting'
        progress = 50
      } else if (message.includes('[保存]')) {
        status = 'saving'
        progress = 75
      } else if (message.includes('[完成]')) {
        status = 'done'
        progress = 100
      }

      const task = taskMap.get(taskId)
      if (task) {
        // 保存文章 ID 以便后续使用
        if (articleId) {
          task.articleId = articleId
          console.log(`[Convert] 保存文章 ID 到 task: ${articleId}`)
        }
      }

      let article = null
      // 如果是 done 状态，立即读取文章数据
      if (status === 'done' && (articleId || task?.articleId)) {
        const id = articleId || task?.articleId
        try {
          const articlesPath = path.join(process.cwd(), 'public/data/VIDEO/articles.json')
          console.log(`[Convert] 读取文章数据: ${articlesPath}`)
          if (fs.existsSync(articlesPath)) {
            const data = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
            const articles = data.articles || []
            console.log(`[Convert] 文章总数: ${articles.length}`)
            article = articles.find((a: any) => a.id === id)
            console.log(`[Convert] 查找文章 ID: ${id}, 找到: ${!!article}`)
            if (!article && articles.length > 0) {
              // 如果找不到指定 ID 的文章，使用最后一篇
              article = articles[articles.length - 1]
              console.log(`[Convert] 使用最后一篇文章: ${article?.id}`)
            }
            console.log(`[Convert] 读取到文章: ${article?.id}`)
          } else {
            console.log(`[Convert] 文章数据文件不存在: ${articlesPath}`)
          }
        } catch (err) {
          console.error(`[Convert] 读取文章数据失败:`, err)
        }
      }

      const update = {
        taskId,
        status,
        progress,
        message: message.trim(),
        articleId: articleId || task?.articleId || null,
        article
      }

      if (task) {
        task.lastUpdate = update
      }

      TaskManager.broadcast(taskId, update)
      console.log(`[Convert] 进度更新 task=${taskId}, status=${status}, progress=${progress}, articleId=${update.articleId}, hasArticle=${!!article}`)
    })

    child.stderr.on('data', (data) => {
      const errorMessage = data.toString()
      console.error(`[Convert] stderr task=${taskId}:`, errorMessage)

      TaskManager.broadcast(taskId, {
        taskId,
        status: 'error',
        progress: 0,
        message: errorMessage.trim(),
        error: errorMessage.trim()
      })
    })

    child.on('close', (code) => {
      console.log(`[Convert] 进程结束 task=${taskId}, code=${code}`)

      let article = null
      const task = taskMap.get(taskId)
      console.log(`[Convert] task=${JSON.stringify(task)}`)
      console.log(`[Convert] task.articleId=${task?.articleId}`)

      if (code === 0 && task?.articleId) {
        // 使用保存的文章 ID 读取文章数据
        try {
          const articlesPath = path.join(process.cwd(), 'public/data/VIDEO/articles.json')
          console.log(`[Convert] 读取文章数据: ${articlesPath}`)
          if (fs.existsSync(articlesPath)) {
            const data = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
            const articles = data.articles || []
            console.log(`[Convert] 文章总数: ${articles.length}`)
            article = articles.find((a: any) => a.id === task.articleId)
            console.log(`[Convert] 查找文章 ID: ${task.articleId}, 找到: ${!!article}`)
            if (!article && articles.length > 0) {
              // 如果找不到指定 ID 的文章，使用最后一篇
              article = articles[articles.length - 1]
              console.log(`[Convert] 使用最后一篇文章: ${article?.id}`)
            }
            console.log(`[Convert] 读取到文章: ${article?.id}`)
          } else {
            console.log(`[Convert] 文章数据文件不存在: ${articlesPath}`)
          }
        } catch (err) {
          console.error(`[Convert] 读取文章数据失败:`, err)
        }
      } else {
        console.log(`[Convert] 跳过读取文章: code=${code}, articleId=${task?.articleId}`)
      }

      const update = {
        taskId,
        status: code === 0 ? 'done' : 'error',
        progress: code === 0 ? 100 : 0,
        message: code === 0 ? '转换完成' : '转换失败',
        error: code === 0 ? undefined : '脚本执行失败',
        article
      }

      console.log(`[Convert] 广播最后消息: ${JSON.stringify(update)}`)
      TaskManager.broadcast(taskId, update)

      setTimeout(() => {
        taskMap.delete(taskId)
        TaskManager.cleanup(taskId)
      }, 5000)
    })

    child.on('error', (err) => {
      console.error(`[Convert] 进程错误 task=${taskId}:`, err)

      TaskManager.broadcast(taskId, {
        taskId,
        status: 'error',
        progress: 0,
        message: '进程启动失败',
        error: err.message
      })
    })

    return NextResponse.json({ taskId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发生错误' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // 返回当前正在运行的任务（如果有的话）
  for (const [taskId, task] of taskMap.entries()) {
    if (task.lastUpdate) {
      return NextResponse.json({
        taskId,
        ...task.lastUpdate
      })
    }
  }

  return NextResponse.json(null)
}
