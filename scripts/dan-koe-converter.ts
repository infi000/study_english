/**
 * Dan Koe 文章 AI 转换脚本
 * 使用 Qwen 进行翻译、句子提取和词汇表生成
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
   * 将爬取的文章转换为标准格式
   */
  async convert(input: FetchedArticle): Promise<Article> {
    const prompt = `你是英语学习内容生成专家。

将以下 Dan Koe 博客文章转换为结构化的英语学习内容。

【原文标题】
${input.title}

【话题分类】
${input.topic}

【英文原文（前 2500 字供参考）】
${input.english.slice(0, 2500)}
...（全文共 ${input.english.length} 字符）

请返回一个 JSON 对象，包含以下字段：

1. chinese：完整中文翻译（保持原文的段落结构）
2. sentences：10-20 个关键句子，每个包含 english 和 chinese 字段
3. vocabulary：15-30 个关键词汇，每个包含 word、translation、phonetic、partOfSpeech 字段

请使用以下格式返回结果，必须是完整的 JSON 代码块：

\`\`\`json
{
  "chinese": "...",
  "sentences": [...],
  "vocabulary": [...]
}
\`\`\`

务必确保：
- 所有双引号都被正确转义
- 中文文本中的换行用 \\n 表示，不用真实换行符
- JSON 格式完全有效，可直接解析`

    console.log(`🤖 调用 Qwen API 转换 [${input.title}]...`)

    try {
      const response = await axios.post(
        `${this.apiBase}/chat/completions`,
        {
          model: 'qwen-plus',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const content = response.data.choices[0].message.content

      // 尝试从代码块中提取 JSON
      let jsonStr = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (!jsonStr) {
        // 没有代码块，尝试直接提取 JSON 对象
        jsonStr = content.match(/\{[\s\S]*\}/)
      }

      if (!jsonStr) {
        throw new Error('无法从 Qwen 响应中提取 JSON')
      }

      const jsonContent = jsonStr[1] || jsonStr[0]
      let result
      try {
        result = JSON.parse(jsonContent)
      } catch (parseErr) {
        // 保存原始响应用于调试
        const fs = require('fs')
        fs.writeFileSync('qwen-response-debug.txt', `===== 原始完整响应 =====\n${content}\n\n===== 提取的 JSON 部分 =====\n${jsonContent.slice(0, 2000)}`)
        throw parseErr
      }

      const article: Article = {
        id: `dan-koe-${input.topic.toLowerCase().replace(/\s+/g, '-')}`,
        title: input.title,
        description: input.summary,
        difficulty: this.estimateDifficulty(input.topic),
        english: input.english, // 直接使用原文
        chinese: result.chinese || '',
        sentences: result.sentences || [],
        vocabulary: result.vocabulary || []
      }

      console.log(`✅ 转换完成 [${article.id}] - 难度: ${article.difficulty}`)
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
   * 根据话题估计难度
   */
  private estimateDifficulty(topic: string): number {
    const topicLower = topic.toLowerCase()
    // 业务和财富话题难度较高
    if (topicLower.includes('wealth') || topicLower.includes('business') || topicLower.includes('creator')) {
      return 6
    }
    // 个人发展和心态话题为中高难度
    if (topicLower.includes('development') || topicLower.includes('mindset') || topicLower.includes('personal')) {
      return 5
    }
    // 其他话题为中等难度
    return 5
  }
}

export { DanKoeConverter }
export type { Article }
