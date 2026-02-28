/**
 * Dan Koe 文章 AI 转换脚本
 * 使用 Qwen 进行翻译、句子提取和词汇表生成
 * 支持分段翻译，解决长文章截断问题
 */

import axios from 'axios'
import { FetchedArticle } from './fetch-dan-koe-articles'

interface Article {
  id: string
  title: string
  description: string
  difficulty: number
  english: string
  chinese: string
  sentences: Array<{ english: string; chinese: string }>
  vocabulary: Array<{
    word: string
    translation: string
    phonetic: string
    partOfSpeech: string
  }>
}

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-075f94b0ea514f629947085eba81158b'

/** 每批翻译的最大字符数 */
const CHUNK_SIZE = 3000

class DanKoeConverter {
  private apiKey: string
  private apiBase: string

  constructor() {
    this.apiKey = QWEN_API_KEY
    this.apiBase = process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY 环境变量未设置')
    }
  }

  /**
   * 调用 Qwen API
   */
  private async callApi(prompt: string, maxTokens: number = 8000): Promise<string> {
    const response = await axios.post(
      `${this.apiBase}/chat/completions`,
      {
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data.choices[0].message.content
  }

  /**
   * 从 API 响应中提取 JSON
   */
  private extractJson(content: string): any {
    let jsonStr = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
    if (!jsonStr) {
      jsonStr = content.match(/\{[\s\S]*\}/)
    }
    if (!jsonStr) {
      // 尝试匹配数组
      jsonStr = content.match(/\[[\s\S]*\]/)
    }
    if (!jsonStr) {
      throw new Error('无法从响应中提取 JSON')
    }
    const jsonContent = jsonStr[1] || jsonStr[0]
    try {
      return JSON.parse(jsonContent)
    } catch (parseErr) {
      const fs = require('fs')
      fs.writeFileSync('qwen-response-debug.txt',
        `===== 原始响应 =====\n${content}\n\n===== 提取的 JSON =====\n${jsonContent.slice(0, 3000)}`)
      throw parseErr
    }
  }

  /**
   * 将英文按段落分批，每批不超过 CHUNK_SIZE 字符
   */
  private splitIntoChunks(text: string): string[] {
    const paragraphs = text.split(/\n\n+/)
    const chunks: string[] = []
    let current = ''

    for (const para of paragraphs) {
      if (current.length + para.length + 2 > CHUNK_SIZE && current.length > 0) {
        chunks.push(current.trim())
        current = para
      } else {
        current += (current ? '\n\n' : '') + para
      }
    }
    if (current.trim()) {
      chunks.push(current.trim())
    }
    return chunks
  }

  /**
   * 步骤1：分段翻译中文
   */
  private async translateChinese(english: string, title: string): Promise<string> {
    const chunks = this.splitIntoChunks(english)
    console.log(`  📝 翻译分为 ${chunks.length} 批`)

    const translations: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  📝 翻译第 ${i + 1}/${chunks.length} 批 (${chunks[i].length} 字符)...`)

      const prompt = `你是专业的英中翻译专家。请将以下英文段落翻译为流畅的中文。

【文章标题】${title}
【这是第 ${i + 1}/${chunks.length} 部分】

【英文原文】
${chunks[i]}

要求：
- 翻译准确、流畅、自然
- 保持原文的段落结构，段落之间用空行分隔
- 直接返回翻译结果，不要添加任何说明或标记
- 不要返回 JSON，直接返回纯中文文本`

      const result = await this.callApi(prompt, 8000)
      // 清理可能的多余标记
      const cleaned = result.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim()
      translations.push(cleaned)

      // 避免 API 限流
      if (i < chunks.length - 1) {
        await this.delay(1000)
      }
    }

    return translations.join('\n\n')
  }

  /**
   * 步骤2：提取关键句子
   */
  private async extractSentences(english: string, title: string): Promise<Array<{ english: string; chinese: string }>> {
    const totalLen = english.length
    // 根据文章长度动态调整句子数量
    const sentenceCount = totalLen > 15000 ? 40 : totalLen > 10000 ? 30 : 20

    console.log(`  📖 提取 ${sentenceCount} 个关键句子...`)

    const prompt = `你是英语学习内容专家。从以下文章中提取 ${sentenceCount} 个最有学习价值的关键句子。

【文章标题】${title}

【英文全文】
${english}

请返回 JSON 数组，每个元素包含 english 和 chinese 字段。
选择标准：
- 覆盖文章的不同部分（开头、中间、结尾都要有）
- 包含有价值的词汇或表达
- 句子长度适中，适合学习

返回格式：
\`\`\`json
[
  {"english": "...", "chinese": "..."},
  ...
]
\`\`\`

务必确保 JSON 格式有效，所有引号正确转义。`

    const content = await this.callApi(prompt, 8000)
    const result = this.extractJson(content)
    return Array.isArray(result) ? result : (result.sentences || [])
  }

  /**
   * 步骤3：提取词汇表
   */
  private async extractVocabulary(english: string, title: string): Promise<Array<{
    word: string; translation: string; phonetic: string; partOfSpeech: string
  }>> {
    console.log(`  📚 提取词汇表...`)

    const prompt = `你是英语学习内容专家。从以下文章中提取 25-35 个关键词汇。

【文章标题】${title}

【英文全文】
${english}

请返回 JSON 数组，每个元素包含：
- word：英文单词或短语
- translation：中文翻译
- phonetic：音标
- partOfSpeech：词性（noun/verb/adjective/adverb/phrase 等）

选择标准：
- 优先选择中高级词汇（B1-C1 级别）
- 包含文章中的关键概念词
- 包含实用的短语和搭配

返回格式：
\`\`\`json
[
  {"word": "...", "translation": "...", "phonetic": "...", "partOfSpeech": "..."},
  ...
]
\`\`\`

务必确保 JSON 格式有效。`

    const content = await this.callApi(prompt, 4000)
    const result = this.extractJson(content)
    return Array.isArray(result) ? result : (result.vocabulary || [])
  }

  /**
   * 将爬取的文章转换为标准格式（分段处理）
   */
  async convert(input: FetchedArticle): Promise<Article> {
    console.log(`🤖 开始转换 [${input.title}] (${input.english.length} 字符)...`)

    try {
      // 三步分别调用
      const chinese = await this.translateChinese(input.english, input.title)
      await this.delay(1000)

      const sentences = await this.extractSentences(input.english, input.title)
      await this.delay(1000)

      const vocabulary = await this.extractVocabulary(input.english, input.title)

      const article: Article = {
        id: `dan-koe-${input.topic.toLowerCase().replace(/\s+/g, '-')}`,
        title: input.title,
        description: input.summary,
        difficulty: this.estimateDifficulty(input.topic),
        english: input.english,
        chinese,
        sentences,
        vocabulary
      }

      const ratio = (chinese.length / input.english.length * 100).toFixed(1)
      console.log(`✅ 转换完成 [${article.id}] - 翻译覆盖率: ${ratio}% | 句子: ${sentences.length} | 词汇: ${vocabulary.length}`)
      return article
    } catch (error) {
      const err = error as any
      if (axios.isAxiosError(err)) {
        console.error(`❌ Qwen API 错误: ${err.response?.status} ${err.response?.statusText}`)
        console.error(err.response?.data)
      } else {
        console.error(`❌ 转换失败: ${error instanceof Error ? error.message : String(error)}`)
      }
      throw error
    }
  }

  /**
   * 仅重新转换翻译内容（保留原有 id/title/description/english 等字段）
   */
  async reconvert(article: Article): Promise<{ chinese: string; sentences: Array<{ english: string; chinese: string }>; vocabulary: Article['vocabulary'] }> {
    console.log(`🔄 重新转换 [${article.id}] (${article.english.length} 字符)...`)

    const chinese = await this.translateChinese(article.english, article.title)
    await this.delay(1000)

    const sentences = await this.extractSentences(article.english, article.title)
    await this.delay(1000)

    const vocabulary = await this.extractVocabulary(article.english, article.title)

    const ratio = (chinese.length / article.english.length * 100).toFixed(1)
    console.log(`✅ 重新转换完成 [${article.id}] - 翻译覆盖率: ${ratio}% | 句子: ${sentences.length} | 词汇: ${vocabulary.length}`)

    return { chinese, sentences, vocabulary }
  }

  /**
   * 根据话题估计难度
   */
  private estimateDifficulty(topic: string): number {
    const topicLower = topic.toLowerCase()
    if (topicLower.includes('wealth') || topicLower.includes('business') || topicLower.includes('creator')) {
      return 6
    }
    if (topicLower.includes('development') || topicLower.includes('mindset') || topicLower.includes('personal')) {
      return 5
    }
    return 5
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export { DanKoeConverter }
export type { Article }
