# Bilibili 视频集成方案 - 深度研究

## 1. 当前数据结构

### Article 类型定义
```typescript
interface Article {
  id: string
  title: string
  description: string
  difficulty: number
  english: string
  chinese: string
  sentences: Array<{ english: string; chinese: string }>
  vocabulary: Array<{
    word: string
    translation: string
    phonetic: string
    partOfSpeech: string
  }>
}
```

### Level 类型定义
```typescript
interface Level {
  id: string
  name: string
  description: string
  articles: Article[]
}
```

### 6 个等级结构
- **A1**：4 篇文章（基础词汇、简单句子）
- **A2**：2 篇文章（中等难度、段落较长）
- **B1**：2 篇文章（词汇量增加、话题多样）
- **B2**：2 篇文章（接近母语水平、话题深入）
- **C1**：2 篇文章（高级词汇、复杂表达）
- **VIDEO**：1 篇文章（视频转换内容）

## 2. 数据加载流程

### DataStore（lib/data-store.ts）
- 使用 Zustand + persist 中间件
- 持久化到 localStorage（键：`data-storage`）
- 从 `/public/data/[level]/articles.json` 加载数据
- 避免重复加载：检查 `levels.length > 0`
- 核心方法：`loadData()`、`getLevel()`、`getArticle()`

### 初始化流程
1. HomeClient 挂载时调用 `useEffect`
2. 检查 DataStore 中数据是否已加载
3. 若未加载，调用 `loadData()` 异步加载所有数据
4. 数据自动持久化到 localStorage

### 数据文件位置
```
public/data/
├── A1/
│   ├── articles.json
│   └── achievements.json
├── A2/articles.json
├── B1/articles.json
├── B2/articles.json
├── C1/articles.json
└── VIDEO/articles.json
```

## 3. 音频播放系统

### 当前实现
- **Hook**：`useSpeechSynthesis`（Web Speech API）
- **组件**：`AudioPlayer`（播放/暂停/速度控制）
- **支持速率**：0.5x - 2x

### 音频播放流程
1. ArticleClient 中使用 `useSpeechSynthesis` hook
2. 调用 `speak(text)` 播放英文内容
3. 支持暂停、停止、速度调整
4. 返回 `isPlaying` 状态

## 4. 学习模式

### 三种学习模式（ArticleClient）
1. **听力模式**：音频播放器 + 中文翻译 + 可选英文
2. **阅读模式**：英文 + 中文对照 + 词汇表
3. **记忆模式**：逐句英文 + 可选中文 + 导航

### 模式切换
- 使用 Tab 组件切换
- 每个模式独立管理状态
- 支持标记为完成

## 5. 进度管理（ProgressStore）

### 核心状态
- 当前等级、当前文章索引、完成文章数
- 解锁等级列表、连续学习天数、成就列表

### 文章解锁逻辑（已确认）
- 第一篇文章自动解锁
- 后续文章需完成前一篇才能解锁
- **VIDEO 等级特殊处理**：不需要解锁，所有视频内容始终可访问

### 成就系统
- `first-article`：完成第一篇
- `streak-7`：连续学习 7 天
- `level-up`：解锁第二个等级
- `perfectionist`：完成一次完美测试

## 6. 页面路由结构

### 静态生成
- 使用 `generateStaticParams()` 预生成 22 个路由
- 6 个等级 × 4 篇文章 + 其他

### 页面结构
- **首页**：`app/page.tsx` + `app/home-client.tsx`
- **等级页**：`app/level/[level]/page.tsx` + `app/level/[level]/page.client.tsx`
- **文章页**：`app/article/[article]/page.tsx` + `app/article/[article]/page.client.tsx`

## 7. 现有视频处理脚本

### video-converter.ts
- 将视频字幕转换为 Article 格式
- 包含词汇字典（commonWords）
- 自动提取关键词并标注词性
- 生成句子和词汇数组

### bilibili-downloader.ts
- 使用 yt-dlp 下载 Bilibili 视频
- 使用 FFmpeg 提取字幕
- 调用 video-converter 转换为文章
- 保存到 `public/data/VIDEO/articles.json`

## 8. 关键技术细节

### localStorage 持久化策略（已确认）

**关键决策：**
- 只持久化用户学习进度到 localStorage
- 所有数据内容（文章、等级、成就）从 JSON 文件加载，不持久化
- VIDEO 等级：不需要解锁，放开所有权限（所有视频内容始终可访问）

**localStorage 键：**
- **progress-storage**：用户学习进度（当前等级、完成文章、streak、解锁等级、成就、文章进度）
- 数据加载时每次都从 public/data/[level]/articles.json 获取最新内容

### 技术栈
- **框架**：Next.js 15 + React 19
- **状态管理**：Zustand 5
- **UI**：Radix UI + Tailwind CSS
- **音频**：Web Speech API
- **脚本**：tsx

## 9. 当前 VIDEO 等级的处理

### 现状
- VIDEO 等级已在系统中定义
- 包含 1 篇文章（video-converter 生成）
- 始终解锁（不受前置文章限制）

### 数据来源
- `public/data/VIDEO/articles.json`
- 由 bilibili-downloader 脚本生成

## 10. 集成 Bilibili 视频的关键点

### 需要解决的问题
1. **视频内容获取**：从 Bilibili 下载视频或获取字幕
2. **内容转换**：将视频内容转换为 Article 格式
3. **音频提取**：从视频中提取音频用于播放
4. **数据存储**：将转换后的数据保存到 JSON 文件
5. **可扩展性**：支持多个 Bilibili 视频的批量处理

### 现有基础
- `bilibili-downloader.ts` 已有下载逻辑框架
- `video-converter.ts` 已有转换逻辑
- VIDEO 等级已在系统中
- 音频播放系统已就位

### 扩展方向
- 完善 bilibili-downloader 实现
- 支持多个视频的管理
- 音频文件的存储和加载
- 自动化处理流程
