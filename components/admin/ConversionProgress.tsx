'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Download, Zap, Save } from 'lucide-react'
import { QueuedTask } from '@/types'

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'downloading': '下载中',
    'converting': '转换中',
    'saving': '保存中',
    'done': '完成',
    'error': '失败',
    'pending': '待处理'
  }
  return labels[status] || status
}

function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'done':
      return 'default'
    case 'error':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'downloading':
      return <Download className="h-4 w-4" />
    case 'converting':
      return <Zap className="h-4 w-4" />
    case 'saving':
      return <Save className="h-4 w-4" />
    case 'done':
      return <CheckCircle2 className="h-4 w-4" />
    default:
      return null
  }
}

interface ConversionProgressProps {
  task: QueuedTask | null
  totalTasks?: number
  completedTasks?: number
}

export function ConversionProgress({ task, totalTasks = 0, completedTasks = 0 }: ConversionProgressProps) {
  if (!task) {
    return null
  }

  const queueInfo = totalTasks > 0 ? ` (${completedTasks + 1}/${totalTasks})` : ''

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">当前转换{queueInfo}</CardTitle>
          <Badge variant={getStatusBadgeVariant(task.status)} className="gap-1">
            {getStatusIcon(task.status)}
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-3 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">视频 ID</p>
            <p className="font-mono text-sm mt-2 text-slate-900 break-all">{task.videoId || task.taskId.substring(0, 12)}</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">进度</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">{task.progress}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-700">转换进度</p>
            <p className="text-xs text-slate-500">{task.progress}% 完成</p>
          </div>
          <Progress value={task.progress} className="h-3" />
        </div>

        <div className="rounded-lg bg-white p-3 border border-slate-200">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">状态消息</p>
          <p className="text-sm text-slate-900 leading-relaxed">{task.message}</p>
        </div>

        {task.error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{task.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}


