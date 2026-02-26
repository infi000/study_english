# 后台管理界面 - 详细实现计划

## 待办清单

- [x] 1. 创建后台路由和布局（app/admin/）
- [x] 2. 创建 AdminStore（状态管理）
- [x] 3. 创建后台首页组件（AdminClient）
- [x] 4. 创建 API 路由（/api/admin/convert）
- [x] 5. 创建进度推送系统（Server-Sent Events）
- [x] 6. 创建历史记录管理
- [x] 7. 集成 shadcn/ui 组件
- [x] 8. 测试完整流程

---

## 1. 架构设计

### 1.1 文件结构

```
app/
├── admin/
│   ├── page.tsx (服务器组件)
│   ├── page.client.tsx (客户端组件 - AdminClient)
│   └── layout.tsx (后台布局)
├── api/
│   └── admin/
│       ├── convert/route.ts (POST 转换请求)
│       ├── progress/[taskId]/route.ts (GET 进度推送 - SSE)
│       └── history/route.ts (GET 历史记录)
└── ...

lib/
├── admin-store.ts (Zustand store)
└── ...

types/
├── index.ts (添加 AdminTask, ConversionHistory 类型)
└── ...
```

### 1.2 数据流

```
用户输入 URL
    ↓
AdminClient 提交
    ↓
POST /api/admin/convert
    ↓
后端启动转换任务
    ↓
GET /api/admin/progress/[taskId] (SSE)
    ↓
前端实时接收进度
    ↓
任务完成 → 更新历史记录
```

---

## 2. 类型定义（types/index.ts）

### 2.1 新增类型

```typescript
// 转换任务状态
export type ConversionStatus = 'pending' | 'downloading' | 'converting' | 'saving' | 'done' | 'error'

// 当前转换任务
export interface AdminTask {
  taskId: string
  videoId: string
  url: string
  status: ConversionStatus
  progress: number // 0-100
  message: string
  error?: string
  startTime: number
  endTime?: number
}

// 历史记录
export interface ConversionHistory {
  id: string
  videoId: string
  title: string
  difficulty: number
  status: 'success' | 'failed'
  createdAt: string
  audioPath: string
  error?: string
}

// 进度更新消息
export interface ProgressUpdate {
  taskId: string
  status: ConversionStatus
  progress: number
  message: string
  error?: string
}
```

---

## 3. 状态管理（lib/admin-store.ts）

### 3.1 AdminStore 设计

```typescript
interface AdminState {
  // 当前任务
  currentTask: AdminTask | null

  // 历史记录
  history: ConversionHistory[]

  // 方法
  startConversion: (url: string, videoId: string) => void
  updateProgress: (taskId: string, update: ProgressUpdate) => void
  completeConversion: (taskId: string, article: Article) => void
  failConversion: (taskId: string, error: string) => void
  loadHistory: () => Promise<void>
  clearHistory: () => void
  deleteHistoryItem: (id: string) => void
}

// 使用 Zustand + persist 中间件
// localStorage key: 'admin-storage'
```

### 3.2 核心方法

```typescript
startConversion(url, videoId) {
  // 生成 taskId
  // 创建新任务
  // 调用 POST /api/admin/convert
  // 建立 SSE 连接监听进度
}

updateProgress(taskId, update) {
  // 更新当前任务状态
  // 触发 UI 重新渲染
}

completeConversion(taskId, article) {
  // 标记任务为完成
  // 添加到历史记录
  // 保存到 localStorage
}

failConversion(taskId, error) {
  // 标记任务为失败
  // 保存错误信息
  // 添加到历史记录
}

loadHistory() {
  // 从 localStorage 加载历史记录
  // 或从 GET /api/admin/history 加载
}
```

---

## 4. 后台页面（app/admin/）

### 4.1 app/admin/layout.tsx

```typescript
// 后台布局
// 包含导航栏、侧边栏等
// 可选：添加身份验证检查

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white">
        {/* 导航菜单 */}
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

### 4.2 app/admin/page.tsx

```typescript
// 服务器组件
// 简单的包装器

export default function AdminPage() {
  return <AdminClient />
}
```

### 4.3 app/admin/page.client.tsx（AdminClient）

**功能分解**：

#### 区域 1：输入表单
```typescript
// 使用 shadcn/ui 组件
// - Input（URL 输入框）
// - Button（提交按钮）
// - Alert（错误提示）

// 功能：
// 1. 输入 Bilibili URL
// 2. 验证 URL 格式
// 3. 提取 videoId
// 4. 提交转换请求
// 5. 禁用表单（转换中）
```

#### 区域 2：当前转换状态
```typescript
// 使用 shadcn/ui 组件
// - Card（容器）
// - Progress（进度条）
// - Badge（状态标签）
// - Skeleton（加载状态）

// 显示内容：
// - 视频 ID
// - 当前状态（下载中、转换中、保存中）
// - 进度百分比
// - 详细消息
// - 错误信息（如果有）
// - 取消按钮（可选）
```

#### 区域 3：历史记录表格
```typescript
// 使用 shadcn/ui 组件
// - Table（表格）
// - Badge（状态）
// - Button（操作）
// - Dialog（删除确认）

// 表格列：
// 1. 标题
// 2. 难度（1-5）
// 3. 状态（✓ 成功 / ✗ 失败）
// 4. 转换时间
// 5. 操作（查看、删除）

// 功能：
// - 分页显示（每页 10 条）
// - 排序（按时间倒序）
// - 删除历史记录
// - 查看详情
```

### 4.4 组件结构

```typescript
export function AdminClient() {
  const { currentTask, history, startConversion, deleteHistoryItem } = useAdminStore()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold">后台管理</h1>
        <p className="text-gray-600">添加 Bilibili 视频转换为学习内容</p>
      </div>

      {/* 输入表单 */}
      <ConversionForm onSubmit={startConversion} disabled={!!currentTask} />

      {/* 当前转换状态 */}
      {currentTask && <ConversionProgress task={currentTask} />}

      {/* 历史记录 */}
      <ConversionHistory
        items={history}
        onDelete={deleteHistoryItem}
      />
    </div>
  )
}
```

---

## 5. API 路由

### 5.1 POST /api/admin/convert

```typescript
// 请求体
{
  url: string        // Bilibili URL
  videoId: string    // 提取的 videoId
}

// 响应
{
  taskId: string     // 任务 ID
  message: string
}

// 功能：
// 1. 验证 URL 和 videoId
// 2. 生成 taskId
// 3. 启动后台任务（child_process）
// 4. 返回 taskId
// 5. 不等待任务完成（异步）
```

### 5.2 GET /api/admin/progress/[taskId]

```typescript
// Server-Sent Events (SSE)
// 实时推送进度更新

// 响应格式
data: {
  "taskId": "...",
  "status": "downloading",
  "progress": 25,
  "message": "正在下载视频..."
}

// 功能：
// 1. 建立 SSE 连接
// 2. 监听后台任务进度
// 3. 实时推送更新
// 4. 任务完成时关闭连接
```

### 5.3 GET /api/admin/history

```typescript
// 请求参数
?page=1&limit=10

// 响应
{
  items: ConversionHistory[]
  total: number
  page: number
}

// 功能：
// 1. 从 localStorage 或数据库加载历史记录
// 2. 分页返回
// 3. 按时间倒序排列
```

---

## 6. 后台任务管理

### 6.1 任务队列

```typescript
// 使用内存队列管理任务
// 防止并发过多

class TaskQueue {
  private queue: Task[] = []
  private running: Map<string, Task> = new Map()
  private maxConcurrent = 1  // 同时只运行 1 个任务

  async enqueue(task: Task) {
    this.queue.push(task)
    this.process()
  }

  private async process() {
    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift()!
      this.running.set(task.taskId, task)

      try {
        await this.executeTask(task)
      } finally {
        this.running.delete(task.taskId)
      }
    }
  }

  private async executeTask(task: Task) {
    // 运行脚本
    // 捕获进度
    // 推送更新
  }
}
```

### 6.2 进度捕获

```typescript
// 使用 child_process 运行脚本
// 监听 stdout/stderr

const child = spawn('tsx', ['scripts/video-to-article.ts', ...args])

child.stdout.on('data', (data) => {
  const message = data.toString()

  // 解析进度信息
  if (message.includes('下载中')) {
    updateProgress(taskId, { status: 'downloading', progress: 25 })
  } else if (message.includes('转换中')) {
    updateProgress(taskId, { status: 'converting', progress: 50 })
  } else if (message.includes('保存中')) {
    updateProgress(taskId, { status: 'saving', progress: 75 })
  }
})

child.on('close', (code) => {
  if (code === 0) {
    completeConversion(taskId)
  } else {
    failConversion(taskId, 'Script execution failed')
  }
})
```

---

## 7. shadcn/ui 组件使用

### 7.1 需要的组件

```typescript
// 已有组件（直接使用）
- Button
- Card
- Badge
- Progress
- Separator

// 需要新增的组件
- Input（文本输入框）
- Form（表单管理）
- Table（表格）
- Dialog（对话框）
- Alert（警告提示）
- Skeleton（加载骨架）
- Tabs（标签页）
- Pagination（分页）
```

### 7.2 组件安装命令

```bash
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add pagination
```

### 7.3 组件使用示例

#### Input 组件
```typescript
import { Input } from "@/components/ui/input"

<Input
  type="url"
  placeholder="粘贴 Bilibili 视频地址"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
  disabled={isLoading}
/>
```

#### Form 组件
```typescript
import { useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const form = useForm({
  defaultValues: { url: '' }
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bilibili 视频地址</FormLabel>
          <FormControl>
            <Input placeholder="https://www.bilibili.com/video/..." {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

#### Table 组件
```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>标题</TableHead>
      <TableHead>难度</TableHead>
      <TableHead>状态</TableHead>
      <TableHead>时间</TableHead>
      <TableHead>操作</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {history.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.title}</TableCell>
        <TableCell>{item.difficulty}</TableCell>
        <TableCell>
          <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
            {item.status}
          </Badge>
        </TableCell>
        <TableCell>{item.createdAt}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">删除</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Dialog 组件
```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">删除</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认删除</DialogTitle>
      <DialogDescription>
        此操作无法撤销
      </DialogDescription>
    </DialogHeader>
    <div className="flex gap-4">
      <Button onClick={handleDelete}>确认</Button>
      <Button variant="outline">取消</Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## 8. 关键实现细节

### 8.1 URL 验证和 videoId 提取

```typescript
function extractBilibiliVideoId(url: string): string | null {
  // 支持的 URL 格式：
  // https://www.bilibili.com/video/BV1eBkYB9EQJ/
  // https://www.bilibili.com/video/BV1eBkYB9EQJ/?...

  const match = url.match(/video\/(BV[a-zA-Z0-9]+)/)
  return match ? match[1] : null
}
```

### 8.2 SSE 连接管理

```typescript
// 前端
function useProgressStream(taskId: string) {
  useEffect(() => {
    const eventSource = new EventSource(`/api/admin/progress/${taskId}`)

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data)
      updateProgress(taskId, update)
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }, [taskId])
}
```

### 8.3 localStorage 持久化

```typescript
// 历史记录保存到 localStorage
// key: 'admin-history'
// 格式：JSON 数组

// 限制：最多保存 100 条记录
// 超过时删除最旧的记录
```

---

## 9. 错误处理

### 9.1 前端错误

```typescript
// URL 验证失败
// 网络错误
// SSE 连接断开
// 任务超时

// 处理方式：
// 1. 显示 Alert 组件
// 2. 允许用户重试
// 3. 记录错误日志
```

### 9.2 后端错误

```typescript
// 脚本执行失败
// 依赖缺失（yt-dlp, ffmpeg）
// API 调用失败
// 磁盘空间不足

// 处理方式：
// 1. 捕获异常
// 2. 返回错误信息
// 3. 更新任务状态为 'error'
// 4. 推送错误消息到前端
```

---

## 10. 性能优化

### 10.1 进度更新频率
- 每 1-2 秒推送一次更新
- 避免过于频繁的网络请求

### 10.2 历史记录分页
- 每页 10 条记录
- 虚拟滚动（可选）

### 10.3 任务队列
- 同时只运行 1 个转换任务
- 防止系统过载

---

## 11. 安全考虑

### 11.1 输入验证
- 验证 URL 格式
- 防止 URL 注入

### 11.2 API 认证
- 可选：添加简单的 token 认证
- 防止未授权访问

### 11.3 资源限制
- 限制单个文件大小（500MB）
- 任务超时时间（30 分钟）
- 磁盘空间检查

---

## 12. 测试计划

### 12.1 单元测试
- URL 验证函数
- videoId 提取函数
- 进度更新逻辑

### 12.2 集成测试
- 完整的转换流程
- SSE 连接和断开
- 错误处理

### 12.3 手动测试
- 粘贴真实 Bilibili URL
- 观察进度更新
- 检查历史记录
- 测试删除功能

---

## 13. 部署考虑

### 13.1 环境变量
- QWEN_API_KEY
- QWEN_API_BASE
- 可选：管理员密码

### 13.2 系统依赖
- yt-dlp
- ffmpeg
- ffprobe

### 13.3 磁盘空间
- 预留足够空间存储音频文件
- 定期清理过期文件

---

## 14. 后续扩展

- [ ] 支持多个并发转换任务
- [ ] 添加用户认证系统
- [ ] 数据库存储历史记录
- [ ] 支持其他视频平台
- [ ] 音频压缩和优化
- [ ] 转换结果预览
- [ ] 批量导入功能
