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
  const [isTextExpanded, setIsTextExpanded] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const { speak, isPlaying, pause, stop, progress, isPaused } = useSpeechSynthesis({ rate })
console.log(listeningProgress)
console.log(readingProgress)
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
      <div className="container mx-auto px-4 py-8 max-w-md text-center safe-area-top min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/50 dark:from-gray-900 dark:via-gray-800/60 dark:to-gray-900/50">
        <div className="text-5xl sm:text-6xl mb-4">⏳</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">加载中...</h2>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center safe-area-top min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/50 dark:from-gray-900 dark:via-gray-800/60 dark:to-gray-900/50">
        <div className="text-5xl sm:text-6xl mb-4">😢</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">文章不存在</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">请选择一个有效的文章</p>
        <Button onClick={() => window.location.href = '/'} className="btn-mobile-safe">返回首页</Button>
      </div>
    )
  }

  const handleComplete = () => {
    completeArticle(articleId)
    window.location.href = '/'
  }

  const FOLD_THRESHOLD = 5
  const hasManysentences = article.sentences.length > FOLD_THRESHOLD
  const visibleSentences = isTextExpanded ? article.sentences : article.sentences.slice(0, FOLD_THRESHOLD)

  const renderListeningMode = () => {
    const chineseParagraphs = article.chinese.split('\n\n').filter(p => p.trim())
    const englishParagraphs = article.english.split('\n\n').filter(p => p.trim())
    const totalParagraphs = chineseParagraphs.length

    return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-soft border-0">
        <CardContent className="p-4 sm:p-6">
          <AudioPlayer audioPath={article.audioPath} text={article.english} hideText rate={rate} onRateChange={setRate} onProgress={setListeningProgress} />
        </CardContent>
      </Card>

      {/* 段落导航 */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">段落导航</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {chineseParagraphs.map((para, idx) => {
              const preview = para.slice(0, 20) + (para.length > 20 ? '...' : '')
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentParagraphIndex(idx)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors text-left max-w-[120px] truncate ${
                    idx === currentParagraphIndex
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={para.slice(0, 50)}
                >
                  {idx + 1}. {preview}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentParagraphIndex(Math.max(0, currentParagraphIndex - 1))}
              disabled={currentParagraphIndex === 0}
              className="btn-mobile-safe"
            >
              上一段
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentParagraphIndex + 1} / {totalParagraphs}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentParagraphIndex(Math.min(totalParagraphs - 1, currentParagraphIndex + 1))}
              disabled={currentParagraphIndex >= totalParagraphs - 1}
              className="btn-mobile-safe"
            >
              下一段
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">中文翻译</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {isTextExpanded ? (
              chineseParagraphs.map((para, i) => (
                <p key={i} className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                {chineseParagraphs[currentParagraphIndex]}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            className="mt-4 text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
          >
            {isTextExpanded ? (
              <>收起 <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>展开全部 ({totalParagraphs}段) <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </CardContent>
      </Card>

      {showEnglish && (
        <Card className="shadow-soft">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">英文原文</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {isTextExpanded ? (
                englishParagraphs.map((para, i) => (
                  <p key={i} className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                    {para}
                  </p>
                ))
              ) : (
                <p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  {englishParagraphs[currentParagraphIndex]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        onClick={() => setShowEnglish(!showEnglish)}
        className="w-full btn-mobile-safe"
      >
        {showEnglish ? '隐藏' : '显示'}英文
      </Button>
    </div>
  )
  }

  const renderReadingMode = () => (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-soft border-0">
        <CardContent className="p-4 sm:p-6">
          <AudioPlayer text={article.english} hideText rate={rate} onRateChange={setRate} onProgress={setReadingProgress} />
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">中英对照</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {visibleSentences.map((s, i) => (
              <div key={i} className="pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 last:pb-0">
                <p className="text-base sm:text-lg leading-relaxed text-foreground mb-1.5">{s.english}</p>
                <p className="text-sm sm:text-base leading-relaxed text-gray-500 dark:text-gray-400">{s.chinese}</p>
              </div>
            ))}
          </div>
          {hasManysentences && (
            <button
              onClick={() => setIsTextExpanded(!isTextExpanded)}
              className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
            >
              {isTextExpanded ? (<>收起 <ChevronUp className="w-4 h-4" /></>) : (<>展开全部 ({article.sentences.length}句) <ChevronDown className="w-4 h-4" /></>)}
            </button>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">词汇表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3">
            {article.vocabulary.map((word, index) => (
              <div key={index} className="bg-blue-50/80 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border border-blue-100 dark:border-blue-800/30 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 text-base sm:text-lg">{word.word}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">{word.phonetic}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-800/50 btn-mobile-safe"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      speak(word.word)
                    }}
                    title="播放发音"
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 flex-1">{word.translation}</div>
                <Badge className="mt-2 w-fit text-xs">{word.partOfSpeech}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMemoryMode = () => (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-soft">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">记忆模式</CardTitle>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {currentSentenceIndex + 1} / {article.sentences.length}
            </span>
          </div>
          {/* 句子进度条 */}
          <div className="flex gap-1 mt-2">
            {article.sentences.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === currentSentenceIndex
                    ? 'bg-primary'
                    : i < currentSentenceIndex
                    ? 'bg-primary/30'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          <div className="bg-purple-50/80 dark:bg-purple-900/20 p-5 sm:p-8 rounded-xl border border-purple-100 dark:border-purple-800/30 min-h-[120px] sm:min-h-[160px] flex flex-col justify-center">
            <SyncedText
              text={article.sentences[currentSentenceIndex]?.english}
              progress={progress}
              playedColor="text-primary"
              unplayedColor="text-purple-800 dark:text-purple-300"
              className="text-xl sm:text-3xl font-semibold leading-relaxed mb-4"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={isPlaying && !isPaused ? 'default' : 'outline'}
                onClick={() => {
                  if (isPlaying && !isPaused) {
                    pause()
                  } else {
                    speak(article.sentences[currentSentenceIndex]?.english || '')
                  }
                }}
                className="btn-mobile-safe"
              >
                {isPlaying && !isPaused ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying && !isPaused ? '暂停' : '播放'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
                disabled={!isPlaying}
                className="btn-mobile-safe"
              >
                <Square className="w-4 h-4 mr-2" />
                停止
              </Button>
            </div>
          </div>

          {showEnglish && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-gray-700/30">
              <SyncedText
                text={article.sentences[currentSentenceIndex]?.chinese}
                progress={progress}
                playedColor="text-primary"
                unplayedColor="text-gray-600 dark:text-gray-400"
                className="text-base sm:text-lg leading-relaxed"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSentenceIndex(Math.max(0, currentSentenceIndex - 1))}
              disabled={currentSentenceIndex === 0}
              className="btn-mobile-safe"
            >
              上一句
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentSentenceIndex(Math.min(article.sentences.length - 1, currentSentenceIndex + 1))}
              disabled={currentSentenceIndex === article.sentences.length - 1}
              className="btn-mobile-safe"
            >
              下一句
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowEnglish(!showEnglish)}
            className="w-full btn-mobile-safe"
          >
            {showEnglish ? '隐藏' : '显示'}翻译
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/50 dark:from-gray-900 dark:via-gray-800/60 dark:to-gray-900/50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl safe-area-top">
        {/* 浮动返回按钮 */}
        <div className="sticky top-2 sm:top-4 z-10 mb-4 sm:mb-6">
          <button
            className="tap-indicator flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-soft text-primary hover:text-primary-dark transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        {/* 文章内容卡片 */}
        <article className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-6 lg:p-8 animate-fade-in">
          {/* 标题 */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 text-foreground">{article.title}</h1>

          {/* 难度等级 */}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">难度等级：</span>
            <div className="flex gap-0.5">
              {Array.from({ length: article.difficulty }).map((_, i) => (
                <span key={`filled-${i}`} className="text-yellow-500 text-sm sm:text-lg">★</span>
              ))}
              {Array.from({ length: 5 - article.difficulty }).map((_, i) => (
                <span key={`empty-${i}`} className="text-slate-300 dark:text-slate-600 text-sm sm:text-lg">★</span>
              ))}
            </div>
          </div>

          {/* 描述切换和展开/收起 */}
          <div className="mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
            {/* 语言切换按钮 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDescriptionLang('cn')}
                className={`tap-indicator px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  descriptionLang === 'cn'
                    ? 'bg-primary text-white shadow-glow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setDescriptionLang('en')}
                className={`tap-indicator px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  descriptionLang === 'en'
                    ? 'bg-primary text-white shadow-glow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={!article.descriptionEn}
              >
                英文
              </button>
            </div>

            {/* 描述文本 */}
            <p className={`text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
              {descriptionLang === 'cn' ? article.description : (article.descriptionEn || article.description)}
            </p>

            {/* 展开/收起按钮 */}
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-2 text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors font-medium"
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
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3 mb-6 sm:mb-8">
            <Button
              variant={mode === 'listening' ? 'default' : 'outline'}
              onClick={() => setMode('listening')}
              className="flex items-center justify-center gap-1.5 sm:gap-2 btn-mobile-safe text-xs sm:text-sm"
            >
              <Volume2 className="w-4 h-4 flex-shrink-0" />
              <span>听力</span>
            </Button>
            <Button
              variant={mode === 'reading' ? 'default' : 'outline'}
              onClick={() => setMode('reading')}
              className="flex items-center justify-center gap-1.5 sm:gap-2 btn-mobile-safe text-xs sm:text-sm"
            >
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span>阅读</span>
            </Button>
            <Button
              variant={mode === 'memory' ? 'default' : 'outline'}
              onClick={() => setMode('memory')}
              className="flex items-center justify-center gap-1.5 sm:gap-2 btn-mobile-safe text-xs sm:text-sm"
            >
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span>记忆</span>
            </Button>
          </div>

          {/* 学习内容区域 */}
          <div className="animate-slide-up">
            {mode === 'listening' && renderListeningMode()}
            {mode === 'reading' && renderReadingMode()}
            {mode === 'memory' && renderMemoryMode()}
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleComplete} className="flex-1 btn-mobile-safe">
              标记为完成
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="btn-mobile-safe">
              返回
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}

