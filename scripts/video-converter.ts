import * as fs from 'fs'
import * as path from 'path'

interface ConvertedArticle {
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

// 简单的英文单词提取和词性标注
const commonWords: Record<string, { translation: string; partOfSpeech: string }> = {
  'the': { translation: '这个', partOfSpeech: '冠词' },
  'a': { translation: '一个', partOfSpeech: '冠词' },
  'is': { translation: '是', partOfSpeech: '动词' },
  'are': { translation: '是', partOfSpeech: '动词' },
  'be': { translation: '是', partOfSpeech: '动词' },
  'have': { translation: '有', partOfSpeech: '动词' },
  'has': { translation: '有', partOfSpeech: '动词' },
  'do': { translation: '做', partOfSpeech: '动词' },
  'does': { translation: '做', partOfSpeech: '动词' },
  'can': { translation: '能够', partOfSpeech: '情态动词' },
  'will': { translation: '将会', partOfSpeech: '情态动词' },
  'would': { translation: '会', partOfSpeech: '情态动词' },
  'should': { translation: '应该', partOfSpeech: '情态动词' },
  'could': { translation: '能够', partOfSpeech: '情态动词' },
  'may': { translation: '可能', partOfSpeech: '情态动词' },
  'might': { translation: '可能', partOfSpeech: '情态动词' },
  'must': { translation: '必须', partOfSpeech: '情态动词' },
  'and': { translation: '和', partOfSpeech: '连词' },
  'or': { translation: '或者', partOfSpeech: '连词' },
  'but': { translation: '但是', partOfSpeech: '连词' },
  'in': { translation: '在...里', partOfSpeech: '介词' },
  'on': { translation: '在...上', partOfSpeech: '介词' },
  'at': { translation: '在', partOfSpeech: '介词' },
  'to': { translation: '到', partOfSpeech: '介词' },
  'for': { translation: '为了', partOfSpeech: '介词' },
  'with': { translation: '和', partOfSpeech: '介词' },
  'from': { translation: '来自', partOfSpeech: '介词' },
  'by': { translation: '被', partOfSpeech: '介词' },
  'of': { translation: '的', partOfSpeech: '介词' },
  'about': { translation: '关于', partOfSpeech: '介词' },
  'as': { translation: '作为', partOfSpeech: '介词' },
  'into': { translation: '进入', partOfSpeech: '介词' },
  'through': { translation: '通过', partOfSpeech: '介词' },
  'during': { translation: '在...期间', partOfSpeech: '介词' },
  'before': { translation: '在...之前', partOfSpeech: '介词' },
  'after': { translation: '在...之后', partOfSpeech: '介词' },
  'above': { translation: '在...上方', partOfSpeech: '介词' },
  'below': { translation: '在...下方', partOfSpeech: '介词' },
  'between': { translation: '在...之间', partOfSpeech: '介词' },
  'among': { translation: '在...之中', partOfSpeech: '介词' },
  'under': { translation: '在...下面', partOfSpeech: '介词' },
  'over': { translation: '在...上面', partOfSpeech: '介词' },
  'out': { translation: '出去', partOfSpeech: '副词' },
  'up': { translation: '向上', partOfSpeech: '副词' },
  'down': { translation: '向下', partOfSpeech: '副词' },
  'back': { translation: '回来', partOfSpeech: '副词' },
  'very': { translation: '非常', partOfSpeech: '副词' },
  'just': { translation: '刚刚', partOfSpeech: '副词' },
  'only': { translation: '只有', partOfSpeech: '副词' },
  'also': { translation: '也', partOfSpeech: '副词' },
  'well': { translation: '好', partOfSpeech: '副词' },
  'too': { translation: '也', partOfSpeech: '副词' },
  'so': { translation: '所以', partOfSpeech: '副词' },
  'not': { translation: '不', partOfSpeech: '副词' },
  'no': { translation: '不', partOfSpeech: '副词' },
  'yes': { translation: '是的', partOfSpeech: '副词' },
  'good': { translation: '好的', partOfSpeech: '形容词' },
  'bad': { translation: '坏的', partOfSpeech: '形容词' },
  'big': { translation: '大的', partOfSpeech: '形容词' },
  'small': { translation: '小的', partOfSpeech: '形容词' },
  'new': { translation: '新的', partOfSpeech: '形容词' },
  'old': { translation: '旧的', partOfSpeech: '形容词' },
  'high': { translation: '高的', partOfSpeech: '形容词' },
  'low': { translation: '低的', partOfSpeech: '形容词' },
  'long': { translation: '长的', partOfSpeech: '形容词' },
  'short': { translation: '短的', partOfSpeech: '形容词' },
  'fast': { translation: '快的', partOfSpeech: '形容词' },
  'slow': { translation: '慢的', partOfSpeech: '形容词' },
  'hot': { translation: '热的', partOfSpeech: '形容词' },
  'cold': { translation: '冷的', partOfSpeech: '形容词' },
  'warm': { translation: '温暖的', partOfSpeech: '形容词' },
  'cool': { translation: '凉爽的', partOfSpeech: '形容词' },
  'happy': { translation: '快乐的', partOfSpeech: '形容词' },
  'sad': { translation: '悲伤的', partOfSpeech: '形容词' },
  'beautiful': { translation: '美丽的', partOfSpeech: '形容词' },
  'ugly': { translation: '丑陋的', partOfSpeech: '形容词' },
  'clean': { translation: '干净的', partOfSpeech: '形容词' },
  'dirty': { translation: '脏的', partOfSpeech: '形容词' },
  'easy': { translation: '容易的', partOfSpeech: '形容词' },
  'difficult': { translation: '困难的', partOfSpeech: '形容词' },
  'hard': { translation: '困难的', partOfSpeech: '形容词' },
  'soft': { translation: '柔软的', partOfSpeech: '形容词' },
  'strong': { translation: '强壮的', partOfSpeech: '形容词' },
  'weak': { translation: '虚弱的', partOfSpeech: '形容词' },
  'rich': { translation: '富有的', partOfSpeech: '形容词' },
  'poor': { translation: '贫穷的', partOfSpeech: '形容词' },
  'young': { translation: '年轻的', partOfSpeech: '形容词' },
  'man': { translation: '男人', partOfSpeech: '名词' },
  'woman': { translation: '女人', partOfSpeech: '名词' },
  'child': { translation: '孩子', partOfSpeech: '名词' },
  'boy': { translation: '男孩', partOfSpeech: '名词' },
  'girl': { translation: '女孩', partOfSpeech: '名词' },
  'person': { translation: '人', partOfSpeech: '名词' },
  'people': { translation: '人们', partOfSpeech: '名词' },
  'family': { translation: '家庭', partOfSpeech: '名词' },
  'father': { translation: '父亲', partOfSpeech: '名词' },
  'mother': { translation: '母亲', partOfSpeech: '名词' },
  'brother': { translation: '哥哥/弟弟', partOfSpeech: '名词' },
  'sister': { translation: '姐姐/妹妹', partOfSpeech: '名词' },
  'friend': { translation: '朋友', partOfSpeech: '名词' },
  'teacher': { translation: '教师', partOfSpeech: '名词' },
  'student': { translation: '学生', partOfSpeech: '名词' },
  'doctor': { translation: '医生', partOfSpeech: '名词' },
  'nurse': { translation: '护士', partOfSpeech: '名词' },
  'house': { translation: '房子', partOfSpeech: '名词' },
  'home': { translation: '家', partOfSpeech: '名词' },
  'school': { translation: '学校', partOfSpeech: '名词' },
  'work': { translation: '工作', partOfSpeech: '名词' },
  'job': { translation: '工作', partOfSpeech: '名词' },
  'day': { translation: '天', partOfSpeech: '名词' },
  'night': { translation: '夜晚', partOfSpeech: '名词' },
  'morning': { translation: '早上', partOfSpeech: '名词' },
  'afternoon': { translation: '下午', partOfSpeech: '名词' },
  'evening': { translation: '晚上', partOfSpeech: '名词' },
  'time': { translation: '时间', partOfSpeech: '名词' },
  'year': { translation: '年', partOfSpeech: '名词' },
  'month': { translation: '月', partOfSpeech: '名词' },
  'week': { translation: '周', partOfSpeech: '名词' },
  'hour': { translation: '小时', partOfSpeech: '名词' },
  'minute': { translation: '分钟', partOfSpeech: '名词' },
  'second': { translation: '秒', partOfSpeech: '名词' },
  'water': { translation: '水', partOfSpeech: '名词' },
  'food': { translation: '食物', partOfSpeech: '名词' },
  'drink': { translation: '饮料', partOfSpeech: '名词' },
  'book': { translation: '书', partOfSpeech: '名词' },
  'pen': { translation: '笔', partOfSpeech: '名词' },
  'paper': { translation: '纸', partOfSpeech: '名词' },
  'table': { translation: '桌子', partOfSpeech: '名词' },
  'chair': { translation: '椅子', partOfSpeech: '名词' },
  'door': { translation: '门', partOfSpeech: '名词' },
  'window': { translation: '窗户', partOfSpeech: '名词' },
  'car': { translation: '汽车', partOfSpeech: '名词' },
  'bus': { translation: '公交车', partOfSpeech: '名词' },
  'train': { translation: '火车', partOfSpeech: '名词' },
  'plane': { translation: '飞机', partOfSpeech: '名词' },
  'money': { translation: '钱', partOfSpeech: '名词' },
  'price': { translation: '价格', partOfSpeech: '名词' },
  'color': { translation: '颜色', partOfSpeech: '名词' },
  'red': { translation: '红色', partOfSpeech: '形容词' },
  'blue': { translation: '蓝色', partOfSpeech: '形容词' },
  'green': { translation: '绿色', partOfSpeech: '形容词' },
  'yellow': { translation: '黄色', partOfSpeech: '形容词' },
  'black': { translation: '黑色', partOfSpeech: '形容词' },
  'white': { translation: '白色', partOfSpeech: '形容词' },
  'gray': { translation: '灰色', partOfSpeech: '形容词' },
  'grey': { translation: '灰色', partOfSpeech: '形容词' },
  'brown': { translation: '棕色', partOfSpeech: '形容词' },
  'pink': { translation: '粉红色', partOfSpeech: '形容词' },
  'purple': { translation: '紫色', partOfSpeech: '形容词' },
  'orange': { translation: '橙色', partOfSpeech: '形容词' },
}

function extractVocabulary(text: string): Array<{
  word: string
  translation: string
  phonetic: string
  partOfSpeech: string
}> {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || []
  const uniqueWords = [...new Set(words)]

  return uniqueWords
    .filter(word => word.length > 3 && commonWords[word])
    .slice(0, 10)
    .map(word => ({
      word,
      translation: commonWords[word]?.translation || '',
      phonetic: `/${word}/`,
      partOfSpeech: commonWords[word]?.partOfSpeech || '名词'
    }))
}

function splitIntoSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [text]
}

export async function convertVideoToArticle(
  videoTitle: string,
  subtitleText: string,
  videoId: string,
  difficulty: number = 2
): Promise<ConvertedArticle> {
  const sentences = splitIntoSentences(subtitleText)

  // 简单的翻译模拟（实际应用中应使用真实翻译API）
  const chineseSentences = sentences.map(s => `[翻译] ${s}`)

  return {
    id: videoId,
    title: videoTitle,
    description: `来自视频: ${videoTitle}`,
    difficulty,
    english: subtitleText,
    chinese: chineseSentences.join(' '),
    sentences: sentences.map((eng, idx) => ({
      english: eng,
      chinese: chineseSentences[idx] || ''
    })),
    vocabulary: extractVocabulary(subtitleText)
  }
}

export async function saveArticlesToFile(
  articles: ConvertedArticle[],
  outputPath: string
): Promise<void> {
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify({ articles }, null, 2),
    'utf-8'
  )

  console.log(`✅ 文章已保存到: ${outputPath}`)
}

// 命令行使用示例
async function main() {
  const sampleSubtitle = `Hello everyone. Today we're going to learn about English learning tips.
  Watching English videos is a great way to improve your listening skills.
  Try to speak aloud and practice regularly.
  Don't be afraid to make mistakes.`

  const article = await convertVideoToArticle(
    'English Learning Tips',
    sampleSubtitle,
    'video-1',
    2
  )

  await saveArticlesToFile(
    [article],
    path.join(process.cwd(), 'public/data/VIDEO/articles.json')
  )
}

if (require.main === module) {
  main().catch(console.error)
}
