import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// 加载 .env.local 和 .env 文件
config({ path: path.join(process.cwd(), '.env.local') })
config({ path: path.join(process.cwd(), '.env') })

import { BilibiliDownloader } from './bilibili-downloader'
import { QwenConverter } from './qwen-converter'

async function main() {
  const args = process.argv.slice(2)
  let url = ''
  let videoId = ''

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
      url = args[i + 1]
    }
    if (args[i] === '--video-id' && i + 1 < args.length) {
      videoId = args[i + 1]
    }
  }

  if (!url || !videoId) {
    console.error('❌ 缺少必要参数')
    console.error('用法: npm run video:convert -- --url "https://..." --video-id "BV1xxx"')
    process.exit(1)
  }

  try {
    console.log(`🚀 [下载] 开始处理视频...`)

    const downloader = new BilibiliDownloader()
    const converter = new QwenConverter()

    console.log(`📥 [下载] 正在下载视频和提取字幕...`)
    const downloadResult = await downloader.download({ url, videoId })

    console.log(`🤖 [转换] 正在使用 Qwen API 转换内容...`)
    const article = await converter.convert({
      videoId: downloadResult.videoId,
      title: downloadResult.title,
      description: downloadResult.description,
      subtitles: downloadResult.subtitles,
      duration: downloadResult.duration,
      audioPath: downloadResult.audioPath
    })

    console.log(`💾 [保存] 正在保存到 articles.json...`)
    const articlesPath = path.join(process.cwd(), 'public/data/VIDEO/articles.json')

    let articles = []
    if (fs.existsSync(articlesPath)) {
      const existing = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
      articles = existing.articles || []
    }

    articles.push(article)
    fs.writeFileSync(articlesPath, JSON.stringify({ articles }, null, 2), 'utf-8')

    console.log(`✅ [完成] 转换成功`)
    console.log(`📍 音频文件: ${downloadResult.audioPath}`)
    console.log(`📍 文章 ID: ${article.id}`)
    console.log(`📍 数据文件: ${articlesPath}`)

    downloader.cleanup()
  } catch (error) {
    console.error('❌ [错误]', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
