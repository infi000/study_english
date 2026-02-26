'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Volume2, Eye, Brain, Play, Pause, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AudioPlayer } from '@/components/audio-player'
import { SyncedText } from '@/components/synced-text'
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis'
import { useDataStore } from '@/lib/data-store'
import { useProgressStore } from '@/lib/progress-store'

type LearningMode = 'listening' | 'reading' | 'memory'

export function ArticleClient({ articleId }: { articleId: string }) {
  const { getArticle, loadData } = useDataStore()
  const { completeArticle } = useProgressStore()
  const [mode, setMode] = useState<LearningMode>('reading')
  const [rate, setRate] = useState(1)
  const [showEnglish, setShowEnglish] = useState(true)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [listeningProgress, setListeningProgress] = useState(0)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [descriptionLang, setDescriptionLang] = useState<'cn' | 'en'>('cn')
  const { speak, isPlaying, pause, stop, progress, isPaused } = useSpeechSynthesis({ rate })

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
  }, [loadData])

  const article = getArticle(articleId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">加载中...</h2>
      </div>
    )
  }

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

  const renderListeningMode = () => (
    <div className="space-y-6">
      <AudioPlayer audioPath={article.audioPath} text={article.english} rate={rate} onRateChange={setRate} onProgress={setListeningProgress} />

      <Card>
        <CardHeader>
          <CardTitle>中文翻译</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncedText
            text={article.chinese}
            progress={listeningProgress}
            playedColor="text-purple-900"
            unplayedColor="text-gray-600"
            className="text-lg"
          />
        </CardContent>
      </Card>

      {showEnglish && (
        <Card>
          <CardHeader>
            <CardTitle>英文原文</CardTitle>
          </CardHeader>
          <CardContent>
            <SyncedText
              text={article.english}
              progress={listeningProgress}
              playedColor="text-purple-900"
              unplayedColor="text-gray-600"
              className="text-lg"
            />
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        onClick={() => setShowEnglish(!showEnglish)}
        className="w-full"
      >
        {showEnglish ? '隐藏' : '显示'}英文
      </Button>
    </div>
  )

  const renderReadingMode = () => (
    <div className="space-y-6">
      <AudioPlayer text={article.english} rate={rate} onRateChange={setRate} onProgress={setReadingProgress} />

      <Card>
        <CardHeader>
          <CardTitle>中文翻译</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncedText
            text={article.chinese}
            progress={readingProgress}
            playedColor="text-green-700"
            unplayedColor="text-gray-500"
            className="text-lg"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>词汇表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.vocabulary.map((word, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900">{word.word}</div>
                    <div className="text-sm text-blue-700">{word.phonetic}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-blue-100"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      speak(word.word)
                    }}
                    title="播放发音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-700 mt-2 flex-1">{word.translation}</div>
                <Badge className="mt-2 w-fit">{word.partOfSpeech}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMemoryMode = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>记忆模式 ({currentSentenceIndex + 1}/{article.sentences.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-6 rounded-lg">
            <SyncedText
              text={article.sentences[currentSentenceIndex]?.english}
              progress={progress}
              playedColor="text-purple-900"
              unplayedColor="text-purple-300"
              className="text-2xl font-semibold mb-4"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isPlaying && !isPaused ? 'default' : 'outline'}
                onClick={() => {
                  if (isPlaying && !isPaused) {
                    pause()
                  } else if (isPlaying && isPaused) {
                    // Restart for now since Web Speech doesn't have true resume
                    speak(article.sentences[currentSentenceIndex]?.english || '')
                  } else {
                    speak(article.sentences[currentSentenceIndex]?.english || '')
                  }
                }}
              >
                {isPlaying && !isPaused ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying && !isPaused ? '暂停' : '播放'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
                disabled={!isPlaying}
              >
                <Square className="w-4 h-4 mr-2" />
                停止
              </Button>
            </div>
          </div>

          {showEnglish && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <SyncedText
                text={article.sentences[currentSentenceIndex]?.chinese}
                progress={progress}
                playedColor="text-purple-900"
                unplayedColor="text-gray-600"
                className="text-lg"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSentenceIndex(Math.max(0, currentSentenceIndex - 1))}
              disabled={currentSentenceIndex === 0}
            >
              上一句
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentSentenceIndex(Math.min(article.sentences.length - 1, currentSentenceIndex + 1))}
              disabled={currentSentenceIndex === article.sentences.length - 1}
            >
              下一句
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowEnglish(!showEnglish)}
            className="w-full"
          >
            {showEnglish ? '隐藏' : '显示'}翻译
          </Button>
        </CardContent>
      </Card>
    </div>
  )

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
        <h1 className="text-4xl font-bold mb-4 text-gray-800">{article.title}</h1>

        {/* 难度等级 */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-600 font-medium">难度等级：</span>
          <div className="flex gap-0.5">
            {Array.from({ length: article.difficulty }).map((_, i) => (
              <span key={`filled-${i}`} className="text-yellow-500 text-lg">★</span>
            ))}
            {Array.from({ length: 5 - article.difficulty }).map((_, i) => (
              <span key={`empty-${i}`} className="text-slate-300 text-lg">★</span>
            ))}
          </div>
        </div>

        {/* 描述切换和展开/收起 */}
        <div className="mb-6">
          {/* 语言切换按钮 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setDescriptionLang('cn')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                descriptionLang === 'cn'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setDescriptionLang('en')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                descriptionLang === 'en'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={!article.descriptionEn}
            >
              英文
            </button>
          </div>

          {/* 描述文本 */}
          <p className={`text-gray-600 ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
            {descriptionLang === 'cn' ? article.description : (article.descriptionEn || article.description)}
          </p>

          {/* 展开/收起按钮 */}
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors font-medium"
          >
            {isDescriptionExpanded ? (
              <>
                收起 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                展开 <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 学习模式切换按钮 */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={mode === 'listening' ? 'default' : 'outline'}
            onClick={() => setMode('listening')}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            听力模式
          </Button>
          <Button
            variant={mode === 'reading' ? 'default' : 'outline'}
            onClick={() => setMode('reading')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            阅读模式
          </Button>
          <Button
            variant={mode === 'memory' ? 'default' : 'outline'}
            onClick={() => setMode('memory')}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            记忆模式
          </Button>
        </div>

        {mode === 'listening' && renderListeningMode()}
        {mode === 'reading' && renderReadingMode()}
        {mode === 'memory' && renderMemoryMode()}

        <div className="flex gap-4 mt-8">
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

