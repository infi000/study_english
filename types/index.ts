export interface Article {
  id: string
  title: string
  english: string
  chinese: string
  sentences: Sentence[]
  vocab: Vocabulary[]
  audioUrl?: string
}

export interface Sentence {
  id: string
  english: string
  chinese: string
}

export interface Vocabulary {
  word: string
  pronunciation: string
  meaning: string
  example: string
}

export interface Level {
  id: string
  name: string
  description: string
  articles: Article[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

export interface ArticleProgress {
  completed?: boolean
  completedDate?: string
  testScore?: number
  testTotal?: number
}

export interface UserProgress {
  currentLevel: string
  currentArticleIndex: number
  completedArticles: number
  unlockedLevels: string[]
  streak: number
  lastStudyDate: string
  totalStudyTime: number
  achievements: string[]
  articleProgress: Record<string, ArticleProgress>
  perfectTests: number
}

export interface Data {
  levels: Level[]
  achievements: Achievement[]
}
