import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

export interface BilibiliInput {
  url: string
  videoId: string
}

export interface BilibiliOutput {
  videoId: string
  title: string
  description: string
  subtitles: string
  audioPath: string
  duration: number
}

export class BilibiliDownloader {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), `bilibili-${Date.now()}`)
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async download(input: BilibiliInput): Promise<BilibiliOutput> {
    const { url, videoId } = input

    try {
      console.log(`📥 下载视频: ${url}`)
      this.checkDependencies()

      const audioPath = path.join(process.cwd(), `public/audio/${videoId}.m4a`)
      const subtitlePath = path.join(this.tempDir, 'subtitle.vtt')

      this.downloadAudio(url, audioPath)
      this.downloadSubtitle(url, subtitlePath)

      const metadata = this.extractMetadata(url)
      const subtitles = this.parseSubtitle(subtitlePath)

      return {
        videoId,
        title: metadata.title,
        description: metadata.description,
        subtitles,
        audioPath: `/audio/${videoId}.m4a`,
        duration: metadata.duration
      }
    } catch (error) {
      throw new Error(`下载失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  private checkDependencies() {
    try {
      execSync('python -m yt_dlp --version', { stdio: 'pipe' })
    } catch {
      throw new Error('yt-dlp 未安装。请运行: python -m pip install yt-dlp')
    }
  }

  private downloadAudio(url: string, audioPath: string) {
    console.log(`  ⏳ 下载音频...`)
    const audioDir = path.dirname(audioPath)
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true })
    }

    try {
      execSync(`python -m yt_dlp -f bestaudio -o "${audioPath}" "${url}"`, {
        stdio: 'inherit'
      })
      console.log(`  ✅ 音频下载完成: ${audioPath}`)
    } catch (error) {
      console.error(`  ❌ 音频下载失败:`, error instanceof Error ? error.message : error)
      throw error
    }
  }

  private downloadSubtitle(url: string, subtitlePath: string) {
    console.log(`  ⏳ 下载字幕...`)
    try {
      execSync(`python -m yt_dlp --write-subs --sub-format vtt -o "${subtitlePath}" "${url}"`, {
        stdio: 'pipe'
      })
      console.log(`  ✅ 字幕下载完成`)
    } catch {
      console.warn(`  ⚠️  字幕下载失败，将使用空字幕`)
      fs.writeFileSync(subtitlePath, '', 'utf-8')
    }
  }

  private extractMetadata(url: string) {
    console.log(`  ⏳ 提取元数据...`)
    try {
      const output = execSync(
        `python -m yt_dlp -j "${url}"`,
        { encoding: 'utf-8' }
      )
      const data = JSON.parse(output)
      return {
        title: data.title || '未知标题',
        description: data.description || '无描述',
        duration: data.duration || 0
      }
    } catch {
      return {
        title: '未知标题',
        description: '无描述',
        duration: 0
      }
    }
  }

  private parseSubtitle(subtitlePath: string): string {
    if (!fs.existsSync(subtitlePath)) {
      return ''
    }

    const content = fs.readFileSync(subtitlePath, 'utf-8')
    const lines = content.split('\n')
    const subtitles: string[] = []

    for (const line of lines) {
      if (line.trim() && !line.includes('-->') && !line.match(/^\d{2}:\d{2}:\d{2}/)) {
        subtitles.push(line.trim())
      }
    }

    return subtitles.join(' ')
  }

  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true })
      console.log(`🧹 临时文件已清理`)
    }
  }
}
