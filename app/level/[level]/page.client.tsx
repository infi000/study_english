'use client'

import { ArrowLeft, CheckCircle, BookOpen, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

export function LevelClient({ level }: { level: string }) {
  const { levels } = useDataStore()
  const { articleProgress, isLevelUnlocked } = useProgressStore()

  const levelId = level.toUpperCase()
  const levelData = levels.find(l => l.id === levelId)

  const isArticleUnlocked = (index: number, articleId: string) => {
    if (index === 0) return true
    const prevArticleId = levelData?.articles[index - 1].id
    return !!prevArticleId && !!articleProgress[prevArticleId]?.completed
  }

  const isArticleCompleted = (articleId: string) => {
    return !!articleProgress[articleId]?.completed
  }

  if (!levelData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">等级不存在</h2>
        <p className="text-gray-600 mb-4">请选择一个有效的等级</p>
        <Button onClick={() => window.location.href = '/'}>返回首页</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <button
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
          onClick={() => window.location.href = '/'}
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>

        <div className="text-sm text-gray-500 mb-2">{levelData.id} 等级</div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {levelData.name}
        </h1>
        <p className="text-gray-600 text-lg">{levelData.description}</p>
      </header>

      <div className="space-y-4">
        {levelData.articles.map((article, index) => {
          const unlocked = isArticleUnlocked(index, article.id)
          const completed = isArticleCompleted(article.id)

          return (
            <Card
              key={article.id}
              className={`transition-all cursor-pointer hover:shadow-xl ${
                unlocked ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (unlocked) {
                  window.location.href = `/article/${article.id}`
                }
              }}
            >
              <div className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <BookOpen className="h-6 w-6" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{article.title}</h3>
                    {completed && (
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        已完成
                      </div>
                    )}
                    {!unlocked && (
                      <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        锁定
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {article.english.substring(0, 100)}...
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{article.sentences.length} 句</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      <span>{article.vocab.length} 生词</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
