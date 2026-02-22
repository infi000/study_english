# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
npm run dev              # Start dev server on port 3010
npm run dev:stop        # Stop dev server
npm run dev:restart     # Restart dev server

# Production
npm run build           # Build for production
npm start              # Start production server on port 3010

# Code Quality
npm run lint           # Run ESLint

# Scripts
npm run video:convert  # Convert video to article (uses tsx scripts/video-to-article.ts)
```

## Architecture Overview

### State Management (Zustand + localStorage)

The app uses two main Zustand stores with persistence middleware:

1. **DataStore** (`lib/data-store.ts`)
   - Loads 6 levels (A1, A2, B1, B2, C1, VIDEO) from `public/data/[level]/articles.json`
   - Loads achievements from `public/data/A1/achievements.json`
   - Provides methods: `getLevel()`, `getArticle()`, `getAchievement()`
   - Avoids duplicate loads by checking if data already exists

2. **ProgressStore** (`lib/progress-store.ts`)
   - Tracks user progress: current level, completed articles, streak, achievements
   - Manages article unlock logic: first article auto-unlocked, subsequent articles require previous completion
   - Provides methods: `completeArticle()`, `updateStreak()`, `isLevelUnlocked()`
   - Persists to localStorage keys: `data-storage`, `progress-storage`

### Data Flow

```
public/data/[level]/articles.json
         ↓
    DataStore (loads on app init)
         ↓
    HomeClient / LevelClient / ArticleClient (consume via hooks)
         ↓
    ProgressStore (tracks completion)
         ↓
    localStorage (persists state)
```

### Page Structure

- **`app/page.tsx`** + **`app/home-client.tsx`**: Home page with 6 level cards and stats
- **`app/level/[level]/page.tsx`** + **`app/level/[level]/page.client.tsx`**: Level page showing articles with unlock status
- **`app/article/[article]/page.tsx`** + **`app/article/[article]/page.client.tsx`**: Article page with 3 learning modes

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
