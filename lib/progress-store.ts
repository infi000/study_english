import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProgress, ArticleProgress } from '@/types'

interface ProgressState extends UserProgress {
  loadFromStorage: () => void
  updateStreak: () => void
  completeArticle: (articleId: string) => void
  recordTestResult: (articleId: string, score: number, totalQuestions: number) => void
  checkAchievements: () => void
  unlockNextLevel: (currentLevelId: string) => string | null
  isLevelUnlocked: (levelId: string) => boolean
  reset: () => void
}

const initialState: UserProgress = {
  currentLevel: 'A1',
  currentArticleIndex: 0,
  completedArticles: 0,
  unlockedLevels: ['A1'],
  streak: 1,
  lastStudyDate: new Date().toDateString(),
  totalStudyTime: 0,
  achievements: [],
  articleProgress: {},
  perfectTests: 0
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadFromStorage: () => {
        get().updateStreak()
      },

      updateStreak: () => {
        const state = get()
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        if (state.lastStudyDate === today) {
          return
        } else if (state.lastStudyDate === yesterday) {
          set({ streak: state.streak + 1 })
        } else {
          set({ streak: 1 })
        }
        set({ lastStudyDate: today })
      },

      completeArticle: (articleId: string) => {
        const state = get()
        const articleProgress = state.articleProgress || {}

        if (!articleProgress[articleId]) {
          set({
            completedArticles: state.completedArticles + 1,
            articleProgress: {
              ...articleProgress,
              [articleId]: {
                completed: true,
                completedDate: new Date().toISOString()
              }
            }
          }
          )
          get().checkAchievements()
        }
      },

      recordTestResult: (articleId: string, score: number, totalQuestions: number) => {
        const state = get()
        const articleProgress = state.articleProgress || {}

        const progress: ArticleProgress = articleProgress[articleId] || {}
        progress.testScore = score
        progress.testTotal = totalQuestions

        if (score === totalQuestions) {
          set({ perfectTests: (state.perfectTests || 0) + 1 })
        }

        set({ articleProgress: { ...articleProgress, [articleId]: progress } })
        get().checkAchievements()
      },

      checkAchievements: () => {
        const state = get()
        const achievements = state.achievements || []

        if (state.completedArticles >= 1 && !achievements.includes('first-article')) {
          achievements.push('first-article')
        }
        if (state.streak >= 7 && !achievements.includes('streak-7')) {
          achievements.push('streak-7')
        }
        if (state.unlockedLevels.length >= 2 && !achievements.includes('level-up')) {
          achievements.push('level-up')
        }
        if (state.perfectTests >= 1 && !achievements.includes('perfectionist')) {
          achievements.push('perfectionist')
        }

        set({ achievements })
      },

      unlockNextLevel: (currentLevelId: string) => {
        const state = get()
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
        const currentIndex = levels.indexOf(currentLevelId)

        if (currentIndex < levels.length - 1) {
          const nextLevel = levels[currentIndex + 1]
          if (!state.unlockedLevels.includes(nextLevel)) {
            set({ unlockedLevels: [...state.unlockedLevels, nextLevel] })
            return nextLevel
          }
        }
        return null
      },

      isLevelUnlocked: (levelId: string) => {
        // VIDEO 等级始终解锁
        if (levelId === 'VIDEO') {
          return true
        }
        return get().unlockedLevels.includes(levelId)
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'progress-storage'
    }
  )
)
