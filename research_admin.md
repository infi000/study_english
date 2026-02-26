# 后台管理界面 - 深度研究报告

## 1. UI 组件库和设计系统

### 1.1 现有组件库
项目使用 **Radix UI** + **Tailwind CSS** 的组合：

**核心组件**：
- Button（变体：default, outline, destructive, ghost）
- Card（CardHeader, CardTitle, CardContent, CardFooter）
- Badge（用于标签和状态）
- Progress（进度条）
- Separator（分隔线）
- Avatar（头像）

**设计风格**：
- 颜色系统：紫色主色（hsl(262.1 80% 50.4%)）
- 圆角：0.5rem
- 阴影和渐变效果
- 响应式布局（grid/flex）
- 深色模式支持

### 1.2 Tailwind 配置特点
- 容器最大宽度：1400px
- 字体：Inter
- 动画：accordion-down/up
- 插件：tailwindcss-animate

---

## 2. 状态管理架构

### 2.1 Zustand Store 设计

**DataStore** (`lib/data-store.ts`)：
- 管理学习内容（6 个等级 + 成就）
- 方法：loadData(), getLevel(), getArticle(), getAchievement()
- 从 JSON 文件加载，不持久化

**ProgressStore** (`lib/progress-store.ts`)：
- 管理用户进度（当前等级、完成文章、streak、成就）
- 持久化到 localStorage（key: 'progress-storage'）
- 方法：completeArticle(), updateStreak(), checkAchievements()

### 2.2 数据流
```
JSON 文件 → DataStore → 页面组件 → 用户交互 → ProgressStore → localStorage
```

---

## 3. 现有页面结构

### 3.1 路由
- `/` - 首页（HomeClient）
- `/level/[level]` - 等级页面（LevelClient）
- `/article/[article]` - 文章页面（ArticleClient）

### 3.2 页面特点
- 使用 Next.js 静态生成（generateStaticParams）
- 服务器组件 + 客户端组件分离
- 所有数据通过 fetch 加载 JSON 文件

---

## 4. 脚本集成

### 4.1 视频转换流程
```
npm run video:convert -- --url "https://..." --video-id "BV1xxx"
↓
BilibiliDownloader.download()
  ├─ yt-dlp 下载视频
  ├─ ffmpeg 提取音频到 public/audio/
  ├─ ffmpeg 提取字幕
  └─ ffprobe 提取元数据
↓
QwenConverter.convert()
  ├─ 调用 Qwen API
  └─ 生成 Article JSON
↓
保存到 public/data/VIDEO/articles.json
```

### 4.2 依赖
- yt-dlp（下载视频）
- ffmpeg（提取音频和字幕）
- axios（调用 API）
- 环境变量：QWEN_API_KEY, QWEN_API_BASE

---

## 5. 数据结构

### 5.1 Article 类型
```typescript
{
  id: string
  title: string
  description: string
  difficulty: number (1-5)
  english: string
  chinese: string
  sentences: Array<{ english, chinese }>
  vocabulary: Array<{ word, translation, phonetic, partOfSpeech }>
  audioPath?: string
}
```

### 5.2 文件位置
- 文章数据：`public/data/[level]/articles.json`
- 音频文件：`public/audio/[videoId].mp3`
- 成就数据：`public/data/A1/achievements.json`

---

## 6. 当前限制

### 6.1 无后台管理界面
- 所有数据管理通过直接编辑 JSON 文件
- 脚本只能通过命令行调用
- 无实时进度显示

### 6.2 无 API 路由
- 所有数据通过静态 JSON 加载
- 无数据库连接
- 无用户认证系统

---

## 7. 后台功能需求分析

### 7.1 需要实现的功能
1. **视频输入界面**
   - 粘贴 Bilibili URL
   - 提交按钮
   - 输入验证

2. **转换状态显示**
   - 当前转换进度（下载、转换、保存）
   - 实时状态更新
   - 错误提示

3. **历史记录列表**
   - 所有已转换的文章
   - 转换时间、状态、难度
   - 删除/编辑功能

4. **后端支持**
   - API 路由处理转换请求
   - WebSocket 或 Server-Sent Events 推送进度
   - 数据库存储转换历史

### 7.2 技术选型决策点
1. **进度推送方式**
   - WebSocket（双向通信）
   - Server-Sent Events（单向推送）
   - 轮询（简单但低效）

2. **历史数据存储**
   - 数据库（MongoDB/PostgreSQL）
   - JSON 文件（简单但不可扩展）
   - 混合方案

3. **UI 框架**
   - 使用现有 Radix UI 组件
   - 新增表格、表单、加载动画组件

4. **状态管理**
   - 扩展现有 Zustand store
   - 新增 AdminStore 管理后台状态

---

## 8. 架构建议

### 8.1 前端结构
```
app/
├── admin/
│   ├── page.tsx (后台首页)
│   ├── page.client.tsx (客户端组件)
│   └── layout.tsx (后台布局)
├── api/
│   └── admin/
│       ├── convert/route.ts (转换 API)
│       └── history/route.ts (历史记录 API)
└── ...
```

### 8.2 新增 Store
```typescript
AdminStore {
  // 当前转换任务
  currentTask: {
    videoId: string
    url: string
    status: 'pending' | 'downloading' | 'converting' | 'saving' | 'done' | 'error'
    progress: number (0-100)
    message: string
    error?: string
  }

  // 历史记录
  history: Array<{
    id: string
    videoId: string
    title: string
    difficulty: number
    status: 'success' | 'failed'
    createdAt: string
    audioPath: string
  }>

  // 方法
  startConversion(url: string)
  updateProgress(status, progress, message)
  addToHistory(article)
  clearHistory()
}
```

### 8.3 API 路由
```
POST /api/admin/convert
  请求：{ url: string, videoId: string }
  响应：{ taskId: string }

GET /api/admin/convert/[taskId]
  响应：{ status, progress, message, error }

GET /api/admin/history
  响应：{ articles: Article[] }
```

---

## 9. 关键实现细节

### 9.1 进度推送方案
**推荐：Server-Sent Events**
- 单向推送（服务器 → 客户端）
- 自动重连
- 简单易用
- 无需 WebSocket 库

### 9.2 长时间运行任务
- 后端使用 child_process 运行脚本
- 捕获 stdout/stderr 更新进度
- 任务队列管理（防止并发）

### 9.3 错误处理
- 脚本执行失败时返回错误信息
- 前端显示错误提示
- 允许重试

---

## 10. 设计参考

### 10.1 UI 布局
```
┌─────────────────────────────────────┐
│         后台管理界面                 │
├─────────────────────────────────────┤
│                                     │
│  输入区域                           │
│  ┌─────────────────────────────┐   │
│  │ 粘贴 Bilibili URL           │   │
│  │ [输入框]                    │   │
│  │ [提交按钮]                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  当前转换状态                       │
│  ┌─────────────────────────────┐   │
│  │ 状态：下载中...              │   │
│  │ 进度：████░░░░░░ 40%        │   │
│  │ 消息：正在提取音频...        │   │
│  └─────────────────────────────┘   │
│                                     │
│  历史记录                           │
│  ┌─────────────────────────────┐   │
│  │ 标题 | 难度 | 状态 | 时间   │   │
│  │ ─────────────────────────── │   │
│  │ 文章1 | 2 | ✓ | 2026-02-22 │   │
│  │ 文章2 | 3 | ✓ | 2026-02-22 │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 10.2 颜色和状态
- 待处理：灰色
- 处理中：蓝色
- 成功：绿色
- 失败：红色

---

## 11. 性能考虑

### 11.1 长时间任务
- 视频下载可能需要 5-30 分钟
- 需要后台任务队列
- 不能阻塞主线程

### 11.2 实时更新
- Server-Sent Events 保持连接
- 前端定期轮询备选方案
- 历史记录分页加载

### 11.3 存储
- 音频文件可能很大（10-100MB）
- 需要磁盘空间管理
- 考虑音频压缩

---

## 12. 安全考虑

### 12.1 输入验证
- 验证 Bilibili URL 格式
- 提取 videoId 防止注入

### 12.2 API 认证
- 后台管理需要身份验证
- 防止未授权访问

### 12.3 资源限制
- 限制并发转换任务数
- 限制单个文件大小
- 超时控制
