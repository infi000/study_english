'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, BookOpen, Lock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

export function LevelClient({ level }: { level: string }) {
  const { levels, loadData } = useDataStore()
  const { articleProgress } = useProgressStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const currentLevels = useDataStore.getState().levels
      if (currentLevels.length > 0) {
        setIsLoading(false)
        return
      }

      try {
        await loadData()
        setIsLoading(false)
      } catch (error) {
        console.error('加载数据失败:', error)
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  const levelId = level.toUpperCase()
  const levelData = levels.find(l => l.id === levelId)

  const isArticleUnlocked = (index: number) => {
    if (levelData?.id === 'VIDEO' || levelData?.id === 'DON_KOE') return true
    if (index === 0) return true
    const prevArticleId = levelData?.articles[index - 1].id
    return !!prevArticleId && !!articleProgress[prevArticleId]?.completed
  }

  const isArticleCompleted = (articleId: string) => {
    return !!articleProgress[articleId]?.completed
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center safe-area-top">
        <div className="text-5xl sm:text-6xl mb-4">⏳</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">加载中...</h2>
      </div>
    )
  }

  if (!levelData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center safe-area-top">
        <div className="text-5xl sm:text-6xl mb-4">😢</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">等级不存在</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">请选择一个有效的等级</p>
        <Button onClick={() => window.location.href = '/'} className="btn-mobile-safe">返回首页</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/50 dark:from-gray-900 dark:via-gray-800/60 dark:to-gray-900/50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl safe-area-top">
        {/* 浮动返回按钮 */}
        <div className="sticky top-2 sm:top-4 z-10 mb-4 sm:mb-8">
          <button
            className="tap-indicator flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-soft text-primary hover:text-primary-dark transition-colors"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        </div>

        {/* 标题区域 */}
        <header className="mb-6 sm:mb-8 animate-fade-in">
          <div className="text-xs sm:text-sm text-muted-foreground font-medium mb-2 sm:mb-3 px-1">{levelData.id} 等级</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 gradient-text-primary">
            {levelData.name}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{levelData.description}</p>
        </header>

        {/* 文章列表 */}
        <div className="space-y-3 sm:space-y-4">
          {levelData.articles.map((article, index) => {
            const unlocked = isArticleUnlocked(index)
            const completed = isArticleCompleted(article.id)

            return (
              <Card
                key={article.id}
                className={`relative overflow-hidden learning-card ${!unlocked ? 'learning-card-locked' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  if (unlocked) {
                    window.location.href = `/article/${article.id}`
                  }
                }}
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4"></div>

                <div className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                  {/* 状态图标 */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                        completed
                          ? 'bg-success-light dark:bg-success/20 text-success'
                          : unlocked
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {completed ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : unlocked ? (
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>
                  </div>

                  {/* 文章内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题和标签 */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-xl font-semibold text-foreground truncate flex-1">{article.title}</h3>
                      {completed && (
                        <div className="text-xs bg-success-light dark:bg-success/20 text-success px-2 py-1 rounded-full flex-shrink-0">
                          已完成
                        </div>
                      )}
                      {!unlocked && (
                        <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Lock className="h-3 w-3" />
                          锁定
                        </div>
                      )}
                    </div>

                    {/* 预览文本 */}
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {article.english.substring(0, 100)}...
                    </p>

                    {/* 统计信息 */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{article.sentences.length} 句</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-success">★</span>
                        <span>{article.vocabulary.length} 生词</span>
                      </div>
                      {unlocked && !completed && (
                        <span className="flex items-center gap-1 text-primary ml-auto">
                          开始学习
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
