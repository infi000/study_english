import { Separator } from '@/components/ui/separator'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">后台管理</h1>
              <p className="text-sm text-slate-600 mt-1">视频转换管理系统</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              v1.0
            </div>
          </div>
        </div>
        <Separator className="m-0" />
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

