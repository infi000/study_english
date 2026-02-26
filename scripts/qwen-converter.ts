import axios from 'axios'

interface QwenConverterInput {
  videoId: string
  title: string
  description: string
  subtitles: string
  duration: number
  audioPath: string
}

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
  audioPath: string
}
const QWEN_API_KEY='sk-075f94b0ea514f629947085eba81158b';

class QwenConverter {
  private apiKey: string
  private apiBase: string

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || QWEN_API_KEY
    this.apiBase = process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY 环境变量未设置')
    }
  }

  async convert(input: QwenConverterInput): Promise<Article> {
    const prompt = `你是英语学习内容生成专家。

将以下视频字幕转换为结构化的英语学习内容。

视频标题：${input.title}
视频描述：${input.description}
字幕内容：${input.subtitles}

请生成以下 JSON 格式的内容：
{
  "id": "video-${input.videoId}",
  "title": "...",
  "description": "...",
  "difficulty": 1-5,
  "english": "完整的英文内容（段落形式）",
  "chinese": "完整的中文翻译（段落形式）",
  "sentences": [
    {"english": "...", "chinese": "..."},
    ...
  ],
  "vocabulary": [
    {"word": "...", "translation": "...", "phonetic": "...", "partOfSpeech": "..."},
    ...
  ]
}

要求：
1. difficulty 根据词汇难度评估（1=A1, 2=A2, 3=B1, 4=B2, 5=C1）
2. sentences 包含 10-20 个关键句子
3. vocabulary 包含 15-30 个关键词汇
4. 确保内容准确、自然、适合学习`

    console.log(`🤖 调用 Qwen API 转换内容...`)

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
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const content = response.data.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('无法从 Qwen 响应中提取 JSON')
      }

      const result = JSON.parse(jsonMatch[0])

      const article: Article = {
        id: result.id || `video-${input.videoId}`,
        title: result.title || input.title,
        description: result.description || input.description,
        difficulty: result.difficulty || 2,
        english: result.english || '',
        chinese: result.chinese || '',
        sentences: result.sentences || [],
        vocabulary: result.vocabulary || [],
        audioPath: input.audioPath
      }

      console.log(`✅ 转换完成: ${article.id}`)
      return article
    } catch (error) {
      const err = error as Error & { response?: { status: number; statusText: string; data: unknown } }
      if (axios.isAxiosError(err)) {
        console.error(`❌ Qwen API 错误: ${err.response?.status} ${err.response?.statusText}`)
        console.error(err.response?.data)
      } else {
        console.error(`❌ 转换失败: ${err.message}`)
      }
      throw error
    }
  }
}

export { QwenConverter }
export type { QwenConverterInput, Article }
