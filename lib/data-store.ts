import { create } from 'zustand'
import type { Data, Level, Article, Achievement } from '@/types'

interface DataState extends Data {
  loadData: () => Promise<boolean>
  getLevel: (levelId: string) => Level | undefined
  getArticle: (articleId: string) => Article | undefined
  getAchievement: (id: string) => Achievement | undefined
}

const initialState: Data = {
  levels: [],
  achievements: []
}

export const useDataStore = create<DataState>((set, get) => ({
  ...initialState,

  loadData: async () => {
    const state = get()
    if (state.levels.length > 0) {
      console.log('✅ 数据已加载，跳过重复加载')
      return true
    }

    try {
      console.log('🔄 开始加载数据...')
      const levelIds = ['A1', 'A2', 'B1', 'B2', 'C1', 'VIDEO', 'DON_KOE']
      const levels: Level[] = []
      const levelNames: Record<string, string> = {
        'A1': '入门级',
        'A2': '进阶级',
        'B1': '中级',
        'B2': '中高级',
        'C1': '高级',
        'VIDEO': '视频课程',
        'DON_KOE': 'Dan Koe'
      }
      const levelDescriptions: Record<string, string> = {
        'A1': '适合初学者，短句简单，词汇基础',
        'A2': '中等难度，段落较长，话题更多样',
        'B1': '适合有基础的学习者，词汇量增加',
        'B2': '接近母语者水平，话题深入',
        'C1': '母语水平，复杂词汇和表达',
        'VIDEO': 'Bilibili视频转换的学习内容',
        'DON_KOE': 'Dan Koe 博客 - 个人发展与商业思维'
      }

      for (const levelId of levelIds) {
        try {
          const url = `/data/${levelId}/articles.json`
          console.log(`📥 正在加载: ${url}`)
          const response = await fetch(url)
          console.log(`📊 ${levelId} 响应状态: ${response.status}`)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          console.log(`✅ ${levelId} 加载成功，文章数: ${data.articles?.length || 0}`)

          levels.push({
            id: levelId,
            name: levelNames[levelId],
            description: levelDescriptions[levelId],
            articles: data.articles || []
          })
        } catch (error) {
          console.error(`❌ 加载 ${levelId}/articles.json 失败:`, error instanceof Error ? error.message : error)
          levels.push({
            id: levelId,
            name: levelNames[levelId],
            description: levelDescriptions[levelId],
            articles: []
          })
        }
      }

      let achievements: Achievement[] = []
      try {
        const response = await fetch('/data/A1/achievements.json')
        console.log(`📊 成就响应状态: ${response.status}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        achievements = data.achievements || []
        console.log(`✅ 成就加载成功，数量: ${achievements.length}`)
      } catch (error) {
        console.error('❌ 加载 achievements.json 失败:', error instanceof Error ? error.message : error)
      }

      console.log(`📊 最终加载结果: ${levels.length} 个等级，${achievements.length} 个成就`)
      set({
        levels,
        achievements
      })
      return true
    } catch (error) {
      console.error('❌ 数据加载出错:', error instanceof Error ? error.message : error)
      return false
    }
  },

  getLevel: (levelId: string) => {
    return get().levels.find(l => l.id === levelId)
  },

  getArticle: (articleId: string) => {
    for (const level of get().levels) {
      const article = level.articles.find(a => a.id === articleId)
      if (article) return article
    }
    return undefined
  },

  getAchievement: (id: string) => {
    return get().achievements.find(a => a.id === id)
  }
}))
