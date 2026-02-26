/**
 * Dan Koe 文章导入主脚本
 * 编排流程：爬取 → AI转换 → 保存 JSON
 */

import * as fs from 'fs'
import * as path from 'path'
import DanKoeArticleFetcher from './fetch-dan-koe-articles'
import { DanKoeConverter, Article } from './dan-koe-converter'

interface WenzhangjsonStructure {
  source: string
  content_type: string
  articles: Array<{
    title: string
    url: string
    topic: string
    summary: string
  }>
}

class DanKoeIntegrator {
  private fetcher: DanKoeArticleFetcher
  private converter: DanKoeConverter
  private outputDir: string

  constructor() {
    this.fetcher = new DanKoeArticleFetcher()
    this.converter = new DanKoeConverter()
    this.outputDir = path.join(process.cwd(), 'public', 'data', 'DON_KOE')
  }

  /**
   * 确保输出目录存在
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
      console.log(`📁 创建目录: ${this.outputDir}`)
    }
  }

  /**
   * 从 wenzhang.json 读取文章列表
   */
  private readWenzhangjson(): WenzhangjsonStructure {
    const filePath = path.join(process.cwd(), 'wenzhang.json')
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  }

  /**
   * 处理单篇文章
   */
  async processArticle(
    title: string,
    url: string,
    topic: string,
    summary: string
  ): Promise<Article> {
    // 步骤 1: 爬取
    const fetched = await this.fetcher.fetchArticle(url, title, topic, summary)

    // 步骤 2: AI 转换
    const article = await this.converter.convert(fetched)

    return article
  }

  /**
   * 保存单篇文章到临时文件（用于测试）
   */
  saveSingleArticle(article: Article, filename: string = 'test-article.json'): void {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8')
    console.log(`💾 已保存: ${filePath}`)
  }

  /**
   * 批量处理所有文章
   */
  async processAllArticles(limit?: number): Promise<Article[]> {
    const wenzhang = this.readWenzhangjson()
    const articles = wenzhang.articles.slice(0, limit || wenzhang.articles.length)
    const results: Article[] = []

    console.log(`\n📚 开始处理 ${articles.length} 篇文章\n`)

    for (let i = 0; i < articles.length; i++) {
      const { title, url, topic, summary } = articles[i]
      console.log(`\n[${i + 1}/${articles.length}] 处理: ${title}`)
      console.log('─'.repeat(60))

      try {
        const article = await this.processArticle(title, url, topic, summary)
        results.push(article)

        // 延迟以避免 API 限流
        if (i < articles.length - 1) {
          console.log('⏳ 等待 2 秒后处理下一篇...')
          await this.delay(2000)
        }
      } catch (error) {
        console.error(`⚠️  跳过文章 [${title}]: ${error instanceof Error ? error.message : String(error)}`)
        // 继续处理下一篇
        continue
      }
    }

    return results
  }

  /**
   * 保存所有文章到最终位置
   */
  saveAllArticles(articles: Article[]): void {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, 'articles.json')
    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf-8')
    console.log(`\n💾 已保存: ${filePath}`)
    console.log(`📊 总计: ${articles.length} 篇文章`)
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 主函数
 */
async function main() {
  const integrator = new DanKoeIntegrator()

  // 检查命令行参数
  const args = process.argv.slice(2)
  const testMode = args.includes('--test') || args.includes('-t')
  const limitArg = args.find(arg => /^\d+$/.test(arg))
  const limit = limitArg ? parseInt(limitArg, 10) : undefined

  try {
    if (testMode) {
      // 测试模式：处理第一篇
      const wenzhang = integrator['readWenzhangjson']()
      const { title, url, topic, summary } = wenzhang.articles[0]
      console.log(`\n🧪 测试模式: 处理第 1 篇文章\n`)
      console.log(`📖 标题: ${title}`)
      console.log(`🔗 URL: ${url}`)
      console.log('─'.repeat(60))

      const article = await integrator.processArticle(title, url, topic, summary)
      integrator.saveSingleArticle(article, `article-0.json`)

      console.log('\n✅ 测试完成！')
      console.log(`📝 请在 public/data/DON_KOE/article-0.json 中查看结果`)
    } else {
      // 批量处理模式
      const articles = await integrator.processAllArticles(limit)
      integrator.saveAllArticles(articles)

      console.log('\n✅ 导入完成！')
      console.log('📝 下一步：修改 lib/data-store.ts 和 app/home-client.tsx 集成新等级')
    }
  } catch (error) {
    console.error('\n❌ 处理失败:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
