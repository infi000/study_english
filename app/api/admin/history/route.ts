import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const HISTORY_FILE = path.join(process.cwd(), 'public/data/conversion-history.json')

// 确保目录存在
function ensureDir() {
  const dir = path.dirname(HISTORY_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// GET: 获取转换历史
export async function GET() {
  try {
    ensureDir()
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      return NextResponse.json(JSON.parse(data))
    }
    return NextResponse.json([])
  } catch (err) {
    console.error('[History] 读取历史记录失败:', err)
    return NextResponse.json([])
  }
}

// POST: 保存转换历史
export async function POST(request: NextRequest) {
  try {
    ensureDir()
    const history = await request.json()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
    console.log('[History] 保存转换历史成功')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[History] 保存历史记录失败:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

// DELETE: 删除指定的历史记录
export async function DELETE(request: NextRequest) {
  try {
    ensureDir()
    const { id } = await request.json()

    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
      const filtered = data.filter((item: any) => item.id !== id)
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
      console.log('[History] 删除历史记录成功:', id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[History] 删除历史记录失败:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
