'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { QueuedTask } from '@/types'
import { Trash2, Clock, CheckCircle2 } from 'lucide-react'

interface ConversionQueueProps {
  tasks: QueuedTask[]
  onCancelTask: (taskId: string) => void
}

export function ConversionQueue({ tasks, onCancelTask }: ConversionQueueProps) {
  const pendingTasks = tasks.filter(t => t.queueStatus === 'pending')
  const completedTasks = tasks.filter(t => t.queueStatus === 'completed')
  const runningTask = tasks.find(t => t.queueStatus === 'running')

  if (tasks.length === 0) {
    return null
  }

  const totalTasks = tasks.length
  const completedCount = completedTasks.length
  const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">转换队列</CardTitle>
          <div className="flex gap-2">
            {runningTask && (
              <Badge variant="default" className="gap-1 bg-blue-600">
                <Clock className="h-3 w-3" />
                运行中
              </Badge>
            )}
            <Badge variant="secondary">{completedCount}/{totalTasks}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-700">队列进度</p>
            <p className="text-xs text-slate-500">{overallProgress}%</p>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">待处理队列 ({pendingTasks.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingTasks.map((task, index) => (
                <div
                  key={task.taskId}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-500 flex-shrink-0">#{index + 1}</span>
                    <code className="text-xs text-slate-600 truncate">{task.videoId || task.taskId.substring(0, 8)}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancelTask(task.taskId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">已完成 ({completedTasks.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {completedTasks.slice(0, 5).map((task) => (
                <div
                  key={task.taskId}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-green-700 truncate">{task.videoId || task.taskId.substring(0, 8)}</span>
                  {task.status === 'error' && (
                    <span className="text-xs text-red-600 flex-shrink-0">失败</span>
                  )}
                </div>
              ))}
              {completedTasks.length > 5 && (
                <p className="text-xs text-slate-500 text-center py-1">
                  还有 {completedTasks.length - 5} 个已完成任务
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
