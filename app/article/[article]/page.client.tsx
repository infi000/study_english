'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

export function ArticleClient({ articleId }: { articleId: string }) {
  const { getArticle } = useDataStore()
  const { completeArticle } = useProgressStore()

  const article = getArticle(articleId)

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">文章不存在</h2>
        <p className="text-gray-600 mb-4">请选择一个有效的文章</p>
        <Button onClick={() => window.location.href = '/'}>返回首页</Button>
      </div>
    )
  }

  const handleComplete = () => {
    completeArticle(articleId)
    window.location.href = '/'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <article className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">{article.title}</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">英文原文</h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-6">{article.english}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">中文翻译</h2>
          <p className="text-lg leading-relaxed text-gray-600">{article.chinese}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">关键词汇</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.vocab.map((word, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg">
                <div className="font-semibold text-blue-900">{word.word}</div>
                <div className="text-sm text-blue-700">{word.pronunciation}</div>
                <div className="text-sm text-gray-700 mt-2">{word.meaning}</div>
                <div className="text-sm text-gray-600 italic mt-2">例: {word.example}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleComplete} className="flex-1">
            标记为完成
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
        </div>
      </article>
    </div>
  )
}
