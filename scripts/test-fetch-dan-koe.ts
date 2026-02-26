/**
 * 测试脚本：爬取 Dan Koe 博客第一篇文章
 * 用于检查 HTML 结构和提取策略
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import * as fs from 'fs'

async function testFetchArticle() {
  // 修正 URL 格式：使用 /letters/ 而不是根路径
  const url = 'https://thedankoe.com/letters/human-3-0-a-map-to-reach-the-top-1/'

  try {
    console.log(`🔍 正在爬取: ${url}`)

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    // 尝试多种常见的文章内容选择器
    const selectors = {
      'article tag': 'article',
      '.post-content': '.post-content',
      '[data-content]': '[data-content]',
      'main': 'main',
      '[role="main"]': '[role="main"]',
      '.entry-content': '.entry-content',
      '.the-content': '.the-content',
      '.page-content': '.page-content',
      '.elementor-widget-container': '.elementor-widget-container',
      '[class*="content"]': 'div[class*="content"]'
    }

    console.log('\n📊 尝试的选择器及内容长度：\n')

    const results: Record<string, { found: boolean; length: number; sample?: string }> = {}

    for (const [name, selector] of Object.entries(selectors)) {
      const element = $(selector)
      const content = element.text().trim()
      results[name] = {
        found: content.length > 0,
        length: content.length,
        sample: content.slice(0, 150)
      }
      console.log(`${name}: ${content.length > 0 ? '✅' : '❌'} (${content.length} chars)`)
    }

    // 获取标题
    const title = $('h1').first().text().trim()
    console.log(`\n📌 标题: ${title || '(未找到)'}`)

    // 获取发布日期
    const dateSelectors = ['time', '.publish-date', '[datetime]', '.date']
    let publishDate = ''
    for (const sel of dateSelectors) {
      const date = $(sel).first().text().trim()
      if (date) {
        publishDate = date
        break
      }
    }
    console.log(`📅 发布日期: ${publishDate || '(未找到)'}`)

    // 保存结果到文件用于人工审查
    const output = {
      url,
      title,
      publishDate,
      selectorResults: results,
      htmlSample: response.data.slice(0, 3000),
      allText: $('body').text().slice(0, 5000)
    }

    fs.writeFileSync(
      'debug-dan-koe-fetch.json',
      JSON.stringify(output, null, 2)
    )

    console.log('\n✅ 调试信息已保存到 debug-dan-koe-fetch.json')

  } catch (error) {
    console.error('❌ 爬取失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testFetchArticle()
