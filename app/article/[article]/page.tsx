import { ArticleClient } from './page.client'

export async function generateStaticParams() {
  const articles = [
    'a1-1', 'a1-2', 'a1-3',
    'a2-1', 'a2-2',
    'b1-1', 'b1-2',
    'b2-1', 'b2-2',
    'c1-1', 'c1-2',
    'video-1',
    'dan-koe-personal-development',
    'dan-koe-mindset',
    'dan-koe-business/wealth',
    'dan-koe-learning-methodology',
    'dan-koe-wealth',
    'dan-koe-life-advice',
    'dan-koe-cognition',
    'dan-koe-creative-work',
    'dan-koe-philosophy'
  ]
  return articles.map(article => ({ article }))
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ article: string }>
}) {
  const { article } = await params
  return <ArticleClient articleId={article} />
}
