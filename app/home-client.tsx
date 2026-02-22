'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Flame, Trophy, TrendingUp, Lock, Unlock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

export function HomeClient() {
  const { levels, loadData, getAchievement } = useDataStore()
  const { achievements: userAchievements } = useProgressStore()
  const { streak, completedArticles, unlockedLevels, isLevelUnlocked } = useProgressStore()
  const [isLoading, setIsLoading] = useState(true)

  console.log('🏠 HomeClient 渲染，levels:', levels.length, 'isLoading:', isLoading)

  useEffect(() => {
    console.log('🏠 useEffect 执行')
    let isMounted = true

    const initialize = async () => {
      console.log('🏠 initialize 函数执行')

      // 检查数据是否已加载
      const currentLevels = useDataStore.getState().levels
      if (currentLevels.length > 0) {
        console.log('🏠 数据已加载，跳过重复加载')
        if (isMounted) setIsLoading(false)
        return
      }

      if (isMounted) setIsLoading(true)

      try {
        console.log('🏠 调用 loadData()')
        const result = await useDataStore.getState().loadData()
        console.log('🏠 loadData() 返回:', result)
        if (isMounted) {
          console.log('🏠 当前 levels:', useDataStore.getState().levels)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('🏠 数据加载出错:', error)
        if (isMounted) setIsLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  const getDifficultyColor = (levelId: string) => {
    switch (levelId) {
      case 'A1': return 'from-green-500 to-emerald-600'
      case 'A2': return 'from-blue-500 to-cyan-600'
      case 'B1': return 'from-indigo-500 to-purple-600'
      case 'B2': return 'from-orange-500 to-red-600'
      case 'C1': return 'from-red-500 to-rose-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  const getLevelProgress = (levelId: string) => {
    return Math.min((completedArticles / (levels.findIndex(l => l.id === levelId) + 1) / 3) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="text-6xl">📰</div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              NewsMaster
            </h1>
          </div>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            通过打磨新闻文章，提高英语水平
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="flex items-center gap-3 py-3 px-5">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">连续学习</div>
                  <div className="text-2xl font-bold text-orange-600">{streak}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="flex items-center gap-3 py-3 px-5">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">已完成</div>
                  <div className="text-2xl font-bold text-blue-600">{completedArticles}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="flex items-center gap-3 py-3 px-5">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Trophy className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">成就</div>
                  <div className="text-2xl font-bold text-purple-600">{userAchievements?.length || 0}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : levels.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">暂无数据</p>
            </div>
          ) : (
            levels.map((level) => {
              const isUnlocked = isLevelUnlocked(level.id)
              const progress = getLevelProgress(level.id)

              return (
                <Card
                  key={level.id}
                  className={`cursor-pointer transition-all hover:shadow-xl ${
                    isUnlocked ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (isUnlocked) {
                      window.location.href = `/level/${level.id.toLowerCase()}`
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{level.name}</CardTitle>
                        <CardDescription>{level.description}</CardDescription>
                      </div>
                      {isUnlocked ? (
                        <Unlock className="h-6 w-6 text-green-500" />
                      ) : (
                        <Lock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">进度</span>
                          <span className="font-semibold">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {level.articles?.length || 0} 篇文章
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
