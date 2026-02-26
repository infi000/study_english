export interface Sentence {
  english: string
  chinese: string
}

export interface Vocabulary {
  word: string
  translation: string
  phonetic: string
  partOfSpeech: string
}

export interface Article {
  id: string
  title: string
  description: string
  descriptionEn?: string
  difficulty: number
  english: string
  chinese: string
  sentences: Sentence[]
  vocabulary: Vocabulary[]
  audioPath?: string
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

export interface Level {
  id: string
  name: string
  description: string
  articles: Article[]
}

export interface Data {
  levels: Level[]
  achievements: Achievement[]
}

export type ConversionStatus = 'pending' | 'downloading' | 'converting' | 'saving' | 'done' | 'error'

export interface AdminTask {
  taskId: string
  videoId: string
  url: string
  status: ConversionStatus
  progress: number
  message: string
  error?: string
  startTime: number
  endTime?: number
}

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

export interface ProgressUpdate {
  taskId: string
  status: ConversionStatus
  progress: number
  message: string
  error?: string
  article?: Article
}

export interface QueuedTask extends AdminTask {
  queueStatus: 'pending' | 'running' | 'completed'
  queueIndex: number
}
