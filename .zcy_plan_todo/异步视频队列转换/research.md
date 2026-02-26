# 异步视频队列转换功能 - 深度研究

## 现状分析

### 当前架构（单视频处理模式）

**AdminClient (`app/admin/page.client.tsx`)**
- 单一 `currentTask` 状态，同时只能处理一个视频转换
- `isLoading` 状态控制表单禁用：`isDisabled={!!currentTask}`
- 当有任务进行中，表单被禁用，无法提交新视频

**ConversionForm (`components/admin/ConversionForm.tsx`)**
- 单个输入框 + 提交按钮
- 受 `isDisabled` 控制，当有任务时完全禁用

**状态管理 (`lib/admin-store.ts` - Zustand)**
```typescript
interface AdminState {
  currentTask: AdminTask | null      // 单任务模式
  history: ConversionHistory[]
  startConversion: (url, videoId, taskId) => void
  updateProgress: (update) => void
  completeConversion: (taskId, article) => void
  failConversion: (taskId, error) => void
}
```

### API 层架构

**POST `/api/admin/convert`**
- 接收单个 `{url, videoId}` 请求
- 创建子进程执行 `scripts/video-to-article.ts`
- 使用 `TaskManager` 全局单例来广播任务进度
- 返回 `taskId`

**SSE `/api/admin/progress/[taskId]`**
- 建立服务端推送连接，实时发送进度更新
- 任务完成或失败时自动关闭连接

**TaskManager (`lib/task-manager.ts`)**
- 全局单例，维护 Map<taskId, listeners>
- 支持多监听器，但目前只用于单个任务
- 提供 `broadcast(taskId, update)` 方法

### 类型系统

**AdminTask**（当前任务）
```typescript
{
  taskId: string
  videoId: string
  url: string
  status: ConversionStatus  // pending|downloading|converting|saving|done|error
  progress: number
  message: string
  error?: string
  startTime: number
}
```

**ConversionHistory**（历史记录）
```typescript
{
  id: string (taskId)
  videoId: string
  title: string
  difficulty: number
  status: 'success' | 'failed'
  createdAt: string
  audioPath: string
  error?: string
}
```

### UI 组件布局

```
AdminClient
├── ConversionForm（表单输入，单URL）
├── ConversionProgress（进度条，显示当前任务）
└── ConversionHistoryComponent（历史记录表格）
```

## 需要修改的核心点

### 1. 存储层改造（Zustand Store）
**现状：** `currentTask: AdminTask | null`
**需要：** `tasks: Map<string, AdminTask>` 或 `tasks: AdminTask[]`

需要新增方法：
- `getQueueLength()` - 获取队列长度
- `getNextTask()` - 获取下一个待处理任务
- `cancelTask(taskId)` - 取消指定任务
- `isQueueRunning()` - 队列是否正在处理

### 2. 表单组件改造
**现状：** 单个 URL 输入框，输入一个提交一个
**需要：** 支持多URL输入（可以换行或逐个添加）+ 快速提交多个任务

### 3. 队列管理逻辑
**需要添加：**
- 队列状态：pending tasks、running task、completed tasks
- 自动拉起下一个任务（当前任务完成时）
- 可视化显示队列（有多少个等待、多少个完成）

### 4. API 层保持不变
- `/api/admin/convert` 仍然处理单个任务
- 队列管理完全在前端处理

### 5. 显示层（UI）
- ConversionProgress 仍然显示当前正在转换的任务
- 新增队列预览区域：显示待处理和已完成的任务列表
- 可以暂停/取消队列中的任务

## 关键实现细节

### TaskManager 的角色
- **现状：** 只被 `/api/admin/progress` 使用，纯粹用于 SSE 推送
- **不变：** 仍然保持 TaskManager 用于 SSE，不修改它
- **队列逻辑：** 完全在前端 Zustand store 管理

### 数据流
```
用户输入多个 URL
   ↓
[提交多个] 按钮 → startConversion(urls[])
   ↓
Zustand: history.push(...urls)  // 加入待处理队列
   ↓
AdminClient 检测队列变化
   ↓
如果当前无运行任务 → 自动拉起下一个
   ↓
/api/admin/convert POST
   ↓
TaskManager 广播进度
   ↓
任务完成 → 历史记录 → 自动拉起下一个
```

### 队列状态机
```
待处理 (pending)
  ↓ 自动或手动开始
运行中 (downloading → converting → saving → done/error)
  ↓ 完成或失败
已完成 (success/failed) → 移出活跃队列
```

## 关键决策点（需要您批注）

1. **队列队列数据结构**
   - 选项A：使用数组 `tasks: AdminTask[]`，配合 `currentTaskIndex`
   - 选项B：使用 Map + 状态标记 `tasks: Map<string, {data: AdminTask, queueStatus}>`
   - 选项C：分离 `pendingTasks` 和 `runningTask`

2. **表单输入形式**
   - 选项A：多个输入框（动态表单）
   - 选项B：单个大文本框，换行分隔
   - 选项C：粘贴后自动分行展示，可逐个确认

3. **队列可见性**
   - 是否在转换历史上面显示待处理队列？
   - 是否允许重新排序队列？

4. **错误处理**
   - 某个任务失败是否暂停队列？
   - 是否支持重试失败的任务？

## 现有代码的易用性评估

✅ **易于扩展的部分：**
- TaskManager 已支持多任务管理（Map 结构）
- Zustand store 易于添加新方法
- API 层无需改动，已支持多任务

❌ **需要重构的部分：**
- AdminClient 的 `currentTask` 设计过于简单
- ConversionForm 单URL输入无法满足多URL需求
- 缺乏队列控制逻辑
