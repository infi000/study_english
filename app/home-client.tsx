'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Flame, Trophy, Lock, Unlock, Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

export function HomeClient() {
  const { levels } = useDataStore()
  const { achievements: userAchievements } = useProgressStore()
  const { streak, completedArticles, isLevelUnlocked } = useProgressStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      const currentLevels = useDataStore.getState().levels
      if (currentLevels.length > 0) {
        if (isMounted) setIsLoading(false)
        return
      }

      if (isMounted) setIsLoading(true)

      try {
        await useDataStore.getState().loadData()
        if (isMounted) setIsLoading(false)
      } catch (error) {
        console.error('数据加载出错:', error)
        if (isMounted) setIsLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  const getLevelProgress = (levelId: string) => {
    return Math.min((completedArticles / (levels.findIndex(l => l.id === levelId) + 1) / 3) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900/50">
      <div className="container mx-auto px-4 py-6 sm:py-12 safe-area-top">
        {/* Header */}
        <header className="mb-6 sm:mb-12 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-3 sm:mb-6">
            <div className="relative">
              <div className="text-4xl sm:text-6xl">📰</div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold gradient-text-primary">
              NewsMaster
            </h1>
          </div>

          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-8 max-w-2xl mx-auto px-4">
            通过打磨新闻文章，提高英语水平
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-center sm:gap-4 md:gap-6 px-1 sm:px-2">
            <Card className="border-0 shadow-soft bg-gradient-to-br from-orange-50/90 to-orange-100/90 dark:from-orange-950/30 dark:to-orange-900/30 backdrop-blur-sm">
              <CardContent className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-3 sm:py-3 px-2 sm:px-5">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">连续学习</div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{streak}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50/90 to-blue-100/90 dark:from-blue-950/30 dark:to-blue-900/30 backdrop-blur-sm">
              <CardContent className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-3 sm:py-3 px-2 sm:px-5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">已完成</div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{completedArticles}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft bg-gradient-to-br from-purple-50/90 to-purple-100/90 dark:from-purple-950/30 dark:to-purple-900/30 backdrop-blur-sm">
              <CardContent className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 py-3 sm:py-3 px-2 sm:px-5">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">成就</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{userAchievements?.length || 0}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : levels.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">暂无数据</p>
            </div>
          ) : (
            levels.map((level, index) => {
              const isUnlocked = isLevelUnlocked(level.id)
              const progress = getLevelProgress(level.id)

              return (
                <Card
                  key={level.id}
                  className={`learning-card relative overflow-hidden ${!isUnlocked ? 'learning-card-locked' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => {
                    if (isUnlocked) {
                      window.location.href = `/level/${level.id.toLowerCase()}`
                    }
                  }}
                >
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8"></div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <CardTitle className="text-xl sm:text-2xl">{level.name}</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">{level.description}</CardDescription>
                      </div>
                      <div className={`p-2 rounded-full ${isUnlocked ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {isUnlocked ? (
                          <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                          <span className="text-gray-600 dark:text-gray-400">进度</span>
                          <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 sm:h-2.5 progress-bar-animated" />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span>{level.articles?.length || 0} 篇文章</span>
                        {isUnlocked && (
                          <span className="flex items-center gap-1 text-primary">
                            开始学习
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
