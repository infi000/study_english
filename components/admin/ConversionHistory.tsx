'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { ConversionHistory } from '@/types'

interface ConversionHistoryProps {
  items: ConversionHistory[]
  onDelete: (id: string) => void
}

export function ConversionHistoryComponent({
  items,
  onDelete
}: ConversionHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteItem = items.find(item => item.id === deleteId)

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">转换历史</CardTitle>
              <CardDescription>所有已转换的视频记录</CardDescription>
            </div>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {items.length} 条记录
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">暂无转换记录</p>
              <p className="text-sm text-slate-500 mt-1">添加新视频后，转换记录将显示在这里</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">标题</TableHead>
                    <TableHead className="font-semibold text-slate-700">难度</TableHead>
                    <TableHead className="font-semibold text-slate-700">状态</TableHead>
                    <TableHead className="font-semibold text-slate-700">时间</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {item.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: item.difficulty }).map((_, i) => (
                            <span key={i} className="text-yellow-500">★</span>
                          ))}
                          {Array.from({ length: 5 - item.difficulty }).map((_, i) => (
                            <span key={i} className="text-slate-300">★</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'success' ? 'default' : 'destructive'}
                          className="gap-1"
                        >
                          {item.status === 'success' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              成功
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              失败
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{item.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              {deleteItem && (
                <>
                  您确定要删除 <span className="font-semibold text-slate-900">"{deleteItem.title}"</span> 吗？此操作无法撤销。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-slate-200"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
