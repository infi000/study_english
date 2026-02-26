/**
 * Dan Koe 博客爬取脚本
 * 用于从 Dan Koe 博客获取完整英文内容
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface FetchedArticle {
  id: string
  title: string
  url: string
  topic: string
  summary: string
  english: string
  publishDate: string
}

class DanKoeArticleFetcher {
  /**
   * 爬取单篇文章
   */
  async fetchArticle(url: string, title: string, topic: string, summary: string): Promise<FetchedArticle> {
    try {
      console.log(`🔍 正在爬取: ${title}`)

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)

      // 提取标题
      const extractedTitle = $('h1').first().text().trim()

      // 提取发布日期
      const publishDate = $('time').first().text().trim()

      // 提取文章内容：使用 div[class*="content"] 选择器获取最清洁的文本
      let englishContent = ''

      // 首先尝试提取 Elementor 内容
      $('div[class*="content"]').each((_, elem) => {
        const text = $(elem).text().trim()
        if (text.length > englishContent.length) {
          englishContent = text
        }
      })

      // 清理内容：移除重复的导航文本、订阅信息等
      // 只保留主要文章内容（通常在 "As corny as this may sound" 或类似的开头之后）
      englishContent = this.cleanContent(englishContent)

      if (!englishContent || englishContent.length < 500) {
        throw new Error(`未能提取足够的内容 (${englishContent.length} chars)`)
      }

      const id = `dan-koe-${topic.toLowerCase().replace(/\s+/g, '-')}`

      console.log(`✅ 成功爬取: ${extractedTitle} (${englishContent.length} 字符)`)

      return {
        id,
        title: extractedTitle || title,
        url,
        topic,
        summary,
        english: englishContent,
        publishDate: publishDate || new Date().toISOString()
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error)
      console.error(`❌ 爬取失败 [${title}]: ${err}`)
      throw error
    }
  }

  /**
   * 清理爬取的内容
   * 移除导航、订阅框等无关文本，保留核心文章内容
   */
  private cleanContent(text: string): string {
    // 第一步：移除常见的导航和订阅相关的文本块
    let cleaned = text
      .replace(/Read The Koe Letters/g, '')
      .replace(/Not A Subscriber\?/g, '')
      .replace(/Join \d+,\d+\+ getting/g, '')
      .replace(/mindf\*cked every/g, '')
      .replace(/Receive \d+ free/g, '')
      .replace(/Subscribe for further HUMAN 3\.0 exploration\./g, '')
      .replace(/When You're Ready.*?(?=\n|$)/gs, '')
      .replace(/My Personal Content.*?(?=\n\n|$)/gs, '')
      .replace(/The Art Of Focus Book.*?(?=\n\n|$)/gs, '')
      .replace(/Who Is Dan Koe\?.*?(?=\n\n|$)/gs, '')
      .replace(/Gain A New Perspective.*?(?=\n\n|$)/gs, '')
      .replace(/©.*?All Rights Reserved\./g, '')

    // 第二步：移除HTML标签遗留和特殊字符
    cleaned = cleaned
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')

    // 第三步：标准化空白
    cleaned = cleaned
      .replace(/\n\n\n+/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()

    return cleaned
  }
}

export default DanKoeArticleFetcher
