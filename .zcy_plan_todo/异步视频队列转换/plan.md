# 异步视频队列转换功能 - 详细计划

## 📋 待办清单（按执行顺序）

### 阶段 1：类型系统扩展（1 个任务）
- [x] **1.1** 修改 `types/index.ts`：扩展类型定义 - **[已完成]**

### 阶段 2：状态管理重构（1 个任务，基础任务）
- [x] **2.1** 修改 `lib/admin-store.ts`：核心状态管理改造 - **[已完成]**

### 阶段 3：UI 组件改造（3 个任务，依赖阶段 2）
- [x] **3.1** 修改 `components/admin/ConversionForm.tsx`：多 URL 输入表单 - **[已完成]**
- [x] **3.2** 新建 `components/admin/ConversionQueue.tsx`：队列显示组件 - **[已完成]**
- [x] **3.3** 修改 `components/admin/ConversionProgress.tsx`：显示运行任务进度 - **[已完成]**

### 阶段 4：主容器逻辑（1 个任务，依赖阶段 2、3 完成）
- [x] **4.1** 修改 `app/admin/page.client.tsx`：主容器改造 - **[已完成]**

### 阶段 5：集成与验证（1 个任务，依赖所有阶段完成）
- [x] **5.1** 完整功能测试与调试 - **[已完成]**
  - ✅ TypeScript 类型检查通过
  - ✅ 所有编译错误已修复
  - ✅ Bug 修复：addToQueue 时正确提取 videoId（而不是留空）
  - ✅ Bug 修复：startQueue 时正确传递提取的 videoId

---

## 关键依赖关系

```
1.1 (类型扩展)
  ↓
2.1 (Store 改造) ← 依赖 1.1
  ↓
├→ 3.1 (表单) ← 依赖 2.1
├→ 3.2 (队列组件) ← 依赖 2.1
├→ 3.3 (进度) ← 依赖 2.1
  ↓
4.1 (主容器) ← 依赖 2.1、3.1、3.2、3.3
  ↓
5.1 (测试) ← 依赖 4.1
```

---

## 功能概述

用户可以在 admin 页面一次性提交多个 Bilibili 视频 URL，系统将自动按顺序异步队列转换，每个视频转换完成后自动开始下一个，用户可实时查看队列进度。

## 实现方案概要

### 1. 状态管理层 - Zustand Store 重构

**文件：** `lib/admin-store.ts`

**核心改造：**
```typescript
interface QueuedTask extends AdminTask {
  queueStatus: 'pending' | 'running' | 'completed'  // 队列状态
  queueIndex: number  // 在队列中的位置
}

interface AdminState {
  // 旧的 currentTask 被替换为 queue
  queuedTasks: QueuedTask[]  // 所有队列中的任务
  runningTaskId: string | null  // 当前运行的任务 ID
  history: ConversionHistory[]  // 已完成的任务历史

  // 队列操作方法
  addToQueue: (urls: string[]) => void  // 添加多个 URL 到队列
  startQueue: () => Promise<void>  // 开始处理队列
  handleTaskComplete: (taskId: string, article: Article) => void
  handleTaskError: (taskId: string, error: string) => void
  cancelTask: (taskId: string) => void  // 取消队列中的任务
  getRunningTask: () => QueuedTask | null  // 获取当前运行任务
  getPendingTaskCount: () => number  // 获取待处理数量
  getCompletedTaskCount: () => number  // 获取已完成数量
}
```

**详细变更：**
- 移除 `currentTask: AdminTask | null`
- 添加 `queuedTasks: QueuedTask[]` - 统一管理所有队列任务
- 添加 `runningTaskId: string | null` - 追踪当前运行的任务
- 新增方法 `addToQueue(urls)` - 一次性添加多个 URL
- 新增方法 `startQueue()` - 启动队列自动处理
- 新增方法 `cancelTask(taskId)` - 取消某个队列任务
- 新增方法 `getRunningTask()` - 便捷方法获取当前运行任务
- 修改 `completeConversion()` - 任务完成时自动拉起下一个任务
- 修改 `failConversion()` - 任务失败时自动拉起下一个任务

**持久化策略（关键）：**
- 使用 Zustand 的 `persist` 中间件
- 持久化内容：
  - `queuedTasks` - 保留所有队列任务及其状态
  - `runningTaskId` - 当前运行任务 ID

**刷新恢复机制：**
1. 页面加载时从 localStorage 恢复 queuedTasks 和 runningTaskId
2. 如果有 runningTaskId：
   - 立即重新连接 SSE `/api/admin/progress/[runningTaskId]`
   - 从后端同步最新的任务进度
3. 如果没有 runningTaskId 但有 pending 任务：
   - useEffect 自动触发 startQueue()
4. 刷新后页面立即显示：
   - 待处理队列列表和任务总数
   - 如果有运行中任务，显示其实时进度
   - 已完成任务数

**注意事项：**
- 如果刷新时任务已在后端完成（但前端不知道），SSE 会立即收到完成消息并自动拉起下一个
- 如果任务在后端失败，SSE 会立即收到错误消息并自动拉起下一个
- localStorage 持久化确保关闭浏览器后重新打开仍可看到未完成的队列
- `history` 由 `/api/admin/history` 单独管理，不重复持久化

### 2. 表单组件改造

**文件：** `components/admin/ConversionForm.tsx`

**改造方向：**
```typescript
interface ConversionFormProps {
  onSubmit: (urls: string[]) => Promise<void>  // 改为数组
  isLoading: boolean
  isDisabled: boolean
  error: string
  onErrorClear: () => void
  queueLength: number  // 显示队列长度
}
```

**UI 变更：**
- 从单个输入框改为多行文本框（支持换行分隔）
- 添加「添加到队列」和「立即开始」两个按钮
  - 「添加到队列」：验证 URL，添加到队列但不立即开始
  - 「立即开始」：添加并立即启动队列处理
- 显示队列统计：待处理数 + 已完成数
- 支持清空表单、撤销添加等快速操作

**URL 验证：**
- 支持一行一个 URL
- 自动过滤空行和重复 URL
- 前端验证 Bilibili URL 格式
- 显示有效 URL 数量

### 3. 主容器组件改造

**文件：** `app/admin/page.client.tsx`

**改造逻辑：**

```typescript
export function AdminClient() {
  const {
    queuedTasks,
    runningTaskId,
    addToQueue,
    startQueue,
    cancelTask
  } = useAdminStore()

  const runningTask = queuedTasks.find(t => t.taskId === runningTaskId)
  const pendingCount = queuedTasks.filter(t => t.queueStatus === 'pending').length
  const completedCount = queuedTasks.filter(t => t.queueStatus === 'completed').length

  // onSubmit 改为处理数组
  const handleSubmit = async (urls: string[]) => {
    // 1. 验证 URL
    // 2. 调用 addToQueue(urls)
    // 3. 自动调用 startQueue()
  }

  // 监听队列变化，自动处理
  useEffect(() => {
    // 如果有待处理任务且无运行任务 → 自动拉起下一个
    if (pendingCount > 0 && !runningTaskId) {
      startQueue()
    }
  }, [queuedTasks, runningTaskId])
}
```

### 4. 新增队列显示组件

**文件：** `components/admin/ConversionQueue.tsx`（新建）

**功能：**
- 显示待处理队列列表（可点击取消）
- 显示已完成任务数
- 显示队列总进度条
- 支持查看队列中任务的预览（BV ID）

**布局：**
```
+------------------------------+
| 队列状态                      |
| 运行中: 1  待处理: 3  完成: 2 |
+------------------------------+
| 待处理队列                    |
| [ ] BV1eBkYB9EQJ   ✕ 取消   |
| [ ] BV2xyzabcd123  ✕ 取消   |
| [ ] BV3pqrstuvwx   ✕ 取消   |
+------------------------------+
```

### 5. 进度组件改造

**文件：** `components/admin/ConversionProgress.tsx`

**改造：**
- 改为显示 `runningTask` 而不是 `currentTask`
- 标题改为「当前转换 (X/Y)」，显示队列进度
- 其他逻辑保持不变

### 6. API 层

**无需改动**

现有 API 已经支持并发任务：
- `/api/admin/convert` 每次处理一个任务，返回 `taskId`
- `/api/admin/progress/[taskId]` 使用 `TaskManager` 支持多任务 SSE 推送
- 任务完全独立，后端无需感知队列概念

### 7. AdminClient 的完整数据流

```
用户输入多个 URL
      ↓
点击「立即开始」
      ↓
validateAndAddUrls()
  - 去重、验证格式
  - 调用 addToQueue(urls) → 添加到 queuedTasks
      ↓
useEffect 监听 queuedTasks 变化
  - 如果 pendingCount > 0 && !runningTaskId
  - 调用 startQueue()
      ↓
startQueue()
  - 找到第一个 pending 任务
  - 调用 /api/admin/convert POST
  - 获得 taskId，更新 queueStatus='running'
  - 连接 /api/admin/progress/[taskId] SSE
      ↓
SSE 流式推送进度
  - updateProgress() 更新任务信息
      ↓
任务完成 (status='done')
  - completeConversion() 保存历史记录
  - 自动调用 startQueue() 拉起下一个
      ↓
所有任务完成
  - queuedTasks 全为 completed
  - runningTaskId = null
```

### 8. 刷新恢复流程（完整）

**场景 1：刷新时有运行中的任务**
```
用户在运行中的任务上点击刷新
      ↓
页面加载，从 localStorage 恢复状态
  - queuedTasks: [task1, task2(running), task3...]
  - runningTaskId: task2.taskId
      ↓
AdminClient useEffect 检测 runningTaskId
      ↓
立即重新连接 /api/admin/progress/[task2.taskId] SSE
      ↓
SSE 立即发送最新进度（后端会缓存最后的状态）
  - 如果任务还在运行 → 显示实时进度
  - 如果任务已完成 → 立即触发 completeConversion
  - 如果任务已失败 → 立即触发 failConversion
      ↓
用户看到：队列进度、运行中任务的实时状态
```

**场景 2：刷新时有待处理任务**
```
用户在有待处理任务但无运行任务时刷新
      ↓
页面加载，从 localStorage 恢复状态
  - queuedTasks: [task1(pending), task2(pending)...]
  - runningTaskId: null
      ↓
AdminClient useEffect 检测：
  - pendingCount > 0 && !runningTaskId
      ↓
自动调用 startQueue()
      ↓
开始处理第一个 pending 任务
      ↓
用户看到：队列进度更新，第一个任务开始运行
```

**场景 3：完全关闭后重新打开**
```
用户关闭浏览器，稍后重新打开网站
      ↓
页面加载，localStorage 仍包含队列信息
  - 包含所有待处理、运行中的任务
      ↓
恢复逻辑同场景 1 或场景 2
      ↓
用户看到之前的队列进度，继续处理
```

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|--------|------|
| `lib/admin-store.ts` | 修改 | 核心状态管理重构 |
| `components/admin/ConversionForm.tsx` | 修改 | 改为多URL输入 |
| `app/admin/page.client.tsx` | 修改 | 添加队列管理逻辑 |
| `components/admin/ConversionProgress.tsx` | 修改 | 改为显示运行中任务 |
| `components/admin/ConversionQueue.tsx` | 新建 | 队列预览组件 |
| `types/index.ts` | 修改 | 扩展类型定义 |

## 关键实现细节

### URL 解析与验证
```typescript
// 支持格式
// https://www.bilibili.com/video/BV1eBkYB9EQJ
// https://www.bilibili.com/video/BV1eBkYB9EQJ/
// BV1eBkYB9EQJ (直接输入 ID)

function parseUrls(input: string): {valid: string[], invalid: string[]} {
  const lines = input.split('\n')
  const results = { valid: [], invalid: [] }

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return

    // 尝试提取 BV ID
    let match = trimmed.match(/video\/(BV[a-zA-Z0-9]+)/)
    if (!match && trimmed.match(/^BV[a-zA-Z0-9]+$/)) {
      match = [null, trimmed]
    }

    if (match) {
      results.valid.push(match[1])
    } else {
      results.invalid.push(trimmed)
    }
  })

  return results
}
```

### 队列自动启动逻辑
```typescript
useEffect(() => {
  const pending = queuedTasks.filter(t => t.queueStatus === 'pending')
  const hasRunning = !!runningTaskId

  // 条件：有待处理任务 且 无运行任务
  if (pending.length > 0 && !hasRunning) {
    // 微小延迟，确保状态同步
    const timer = setTimeout(() => {
      startQueue()
    }, 100)
    return () => clearTimeout(timer)
  }
}, [queuedTasks, runningTaskId, startQueue])
```

### SSE 多任务监听
- 每个运行中的任务建立独立的 EventSource
- 旧任务完成时关闭其 EventSource
- 新任务启动时创建新的 EventSource
- 不存在冲突，因为每个 taskId 都有独立的 listener

## 性能考虑

1. **内存占用**
   - queuedTasks 数组增长：正常情况下用户不会添加超过 100+ 个任务
   - 可考虑添加队列大小限制（如最多 50 个待处理）

2. **网络占用**
   - 每个任务独立的 SSE 连接
   - 服务器只处理 1 个任务，不会形成并发转换

3. **存储持久化**
   - 仅持久化队列状态，不持久化完成的任务

## 权衡分析

| 方案 | 优点 | 缺点 | 选择理由 |
|------|-----|-----|--------|
| **前端队列管理** | 简单、无后端改动 | 需配合持久化 | ✅ 选择 |
| **后端队列管理** | 自动持久化 | 需改动 API、增加复杂性 | 不选 |
| **localStorage 持久化** | 简单、自动恢复 | 刷新时需重新连接 SSE | ✅ 选择（Zustand persist） |
| **数组 vs Map** | 数组更简单，索引清晰 | Map 更灵活但复杂 | ✅ 使用数组 + queueStatus |
| **自动拉起 vs 手动确认** | 自动流畅、用户友好 | 队列很长时可能意外耗时 | ✅ 选择自动（可考虑队列大小限制） |

## 后续可扩展点

1. 支持并发处理（同时处理 N 个任务）
2. 支持优先级队列（某些任务优先处理）
3. 支持队列持久化到后端数据库
4. 支持重试失败任务
5. 支持暂停/恢复队列
