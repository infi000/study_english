# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 快速命令

```bash
# 开发
npm run dev              # 在端口 3010 启动开发服务器
npm run dev:stop        # 停止开发服务器
npm run dev:restart     # 重启开发服务器

# 生产
npm run build           # 构建生产版本
npm start              # 在端口 3010 启动生产服务器

# 代码质量
npm run lint           # 运行 ESLint

# 脚本
npm run video:convert  # 将视频转换为文章（使用 tsx scripts/video-to-article.ts）
```

## 架构概览

### 状态管理（Zustand + localStorage）

应用使用两个主要的 Zustand stores，配合持久化中间件：

1. **DataStore** (`lib/data-store.ts`)
   - 从 `public/data/[level]/articles.json` 加载 6 个等级（A1, A2, B1, B2, C1, VIDEO）
   - 从 `public/data/A1/achievements.json` 加载成就
   - 提供方法：`getLevel()`、`getArticle()`、`getAchievement()`
   - 通过检查数据是否已存在来避免重复加载

2. **ProgressStore** (`lib/progress-store.ts`)
   - 追踪用户进度：当前等级、已完成文章、连续学习天数、成就
   - 管理文章解锁逻辑：第一篇文章自动解锁，后续文章需完成前一篇才能解锁
   - 提供方法：`completeArticle()`、`updateStreak()`、`isLevelUnlocked()`
   - 持久化到 localStorage 键：`data-storage`、`progress-storage`

### 数据流

```
public/data/[level]/articles.json
         ↓
    DataStore（应用初始化时加载）
         ↓
    HomeClient / LevelClient / ArticleClient（通过 hooks 消费）
         ↓
    ProgressStore（追踪完成状态）
         ↓
    localStorage（持久化状态）
```

### 页面结构

- **`app/page.tsx`** + **`app/home-client.tsx`**：首页，显示 6 个等级卡片和统计信息
- **`app/level/[level]/page.tsx`** + **`app/level/[level]/page.client.tsx`**：等级页面，显示文章及解锁状态
- **`app/article/[article]/page.tsx`** + **`app/article/[article]/page.client.tsx`**：文章页面，包含 3 种学习模式

All pages use `generateStaticParams()` for static generation of 22 routes.

### Learning Modes (ArticleClient)

1. **Listening Mode**: Play audio, show Chinese translation, optional English
2. **Reading Mode**: Show English and Chinese, display vocabulary table
3. **Memory Mode**: Show English sentence by sentence, optional Chinese

All modes use `useSpeechSynthesis()` hook for Web Speech API audio playback with adjustable speed (0.5x - 2x).

### Type System

Core types in `types/index.ts`:
- `Article`: id, title, description, difficulty, english, chinese, sentences[], vocabulary[]
- `Level`: id, name, description, articles[]
- `UserProgress`: currentLevel, completedArticles, unlockedLevels[], streak, achievements[], articleProgress{}
- `ArticleProgress`: completed, completedDate, testScore, testTotal

## Key Implementation Details

### Article Unlock Logic

Located in `app/level/[level]/page.client.tsx`:
```typescript
const isArticleUnlocked = (index: number) => {
  if (index === 0) return true  // First article always unlocked
  const prevArticleId = levelData?.articles[index - 1].id
  return !!prevArticleId && !!articleProgress[prevArticleId]?.completed
}
```

### Data Loading Pattern

In `app/home-client.tsx`, data loads once on mount:
```typescript
useEffect(() => {
  const currentLevels = useDataStore.getState().levels
  if (currentLevels.length > 0) return  // Skip if already loaded

  useDataStore.getState().loadData()
}, [])
```

### Audio Playback

`hooks/use-speech-synthesis.ts` wraps Web Speech API:
- `speak(text)`: Play audio
- `pause()`: Pause playback
- `stop()`: Stop and reset
- `isPlaying`: Boolean state
- Supports rate adjustment (0.5 - 2.0)

## Data Files

Learning content stored as JSON in `public/data/`:
- `A1/articles.json`: 4 articles (入门级)
- `A2/articles.json`: 2 articles (进阶级)
- `B1/articles.json`: 2 articles (中级)
- `B2/articles.json`: 2 articles (中高级)
- `C1/articles.json`: 2 articles (高级)
- `VIDEO/articles.json`: 1 article (视频课程)
- `A1/achievements.json`: 4 achievements

Each article JSON follows the `Article` interface with sentences and vocabulary.

## Scripts

- **`scripts/video-converter.ts`**: Converts video content to article format (includes vocabulary dictionary)
- **`scripts/bilibili-downloader.ts`**: Downloads Bilibili videos (placeholder for future implementation)

## UI Components

Radix UI + Tailwind CSS components in `components/ui/`:
- Button, Card, Badge, Progress, Separator, Avatar
- Custom `AudioPlayer` component in `components/audio-player.tsx`

## Common Tasks

**Adding a new article**: Add entry to `public/data/[level]/articles.json` following the `Article` interface.

**Adding a new achievement**: Add entry to `public/data/A1/achievements.json` and update unlock logic in `ProgressStore`.

**Modifying learning modes**: Edit `ArticleClient` component in `app/article/[article]/page.client.tsx`.

**Debugging state**: Check localStorage keys `data-storage` and `progress-storage` in browser DevTools.
