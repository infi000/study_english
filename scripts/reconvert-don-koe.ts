/**
 * DON_KOE 文章重新转换脚本
 * 读取现有 articles.json，对每篇文章重新调用分段翻译，
 * 只更新 chinese、sentences、vocabulary 字段，保留其他原有字段
 */

import * as fs from 'fs'
import * as path from 'path'

// 直接导入转换器类（复用 API 调用和分段逻辑）
import { DanKoeConverter } from './dan-koe-converter'
import type { Article } from './dan-koe-converter'

const DATA_PATH = path.join(__dirname, '../public/data/DON_KOE/articles.json')
const BACKUP_PATH = path.join(__dirname, '../public/data/DON_KOE/articles.backup.json')

async function main() {
  // 读取现有数据
  const raw = fs.readFileSync(DATA_PATH, 'utf8')
  const data = JSON.parse(raw) as { articles: Article[] }

  console.log(`📂 读取到 ${data.articles.length} 篇文章`)
  console.log('')

  // 转换前统计
  console.log('=== 转换前统计 ===')
  for (const a of data.articles) {
    const ratio = (a.chinese.length / a.english.length * 100).toFixed(1)
    console.log(`  ${a.id} | en:${a.english.length} cn:${a.chinese.length} ratio:${ratio}% | sent:${a.sentences.length} | vocab:${a.vocabulary.length}`)
  }
  console.log('')

  // 备份原文件
  fs.writeFileSync(BACKUP_PATH, raw, 'utf8')
  console.log(`💾 已备份到 ${BACKUP_PATH}`)
  console.log('')

  // 逐篇重新转换
  const converter = new DanKoeConverter()
  const updated: Article[] = []

  for (let i = 0; i < data.articles.length; i++) {
    const article = data.articles[i]
    console.log(`\n[${ i + 1}/${data.articles.length}] 处理 ${article.id}`)
    console.log('─'.repeat(60))

    try {
      const result = await converter.reconvert(article)

      // 保留原有字段，只更新翻译相关内容
      updated.push({
        ...article,
        chinese: result.chinese,
        sentences: result.sentences,
        vocabulary: result.vocabulary
      })

      console.log('')
    } catch (err) {
      console.error(`❌ 转换失败，保留原数据: ${err instanceof Error ? err.message : String(err)}`)
      updated.push(article)
    }

    // 每篇文章之间等待，避免限流
    if (i < data.articles.length - 1) {
      console.log('⏳ 等待 2 秒...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 写入结果
  const output = JSON.stringify({ articles: updated }, null, 2)
  fs.writeFileSync(DATA_PATH, output, 'utf8')
  console.log(`\n📝 已写入 ${DATA_PATH}`)

  // 转换后统计
  console.log('\n=== 转换后统计 ===')
  for (const a of updated) {
    const ratio = (a.chinese.length / a.english.length * 100).toFixed(1)
    console.log(`  ${a.id} | en:${a.english.length} cn:${a.chinese.length} ratio:${ratio}% | sent:${a.sentences.length} | vocab:${a.vocabulary.length}`)
  }

  console.log('\n🎉 全部完成！')
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
