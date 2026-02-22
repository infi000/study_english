import { ArticleClient } from './page.client'

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ article: string }>
}) {
  const { article } = await params
  return <ArticleClient articleId={article} />
}
