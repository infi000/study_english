import { LevelClient } from './page.client'

export async function generateStaticParams() {
  return [
    { level: 'A1' },
    { level: 'A2' },
    { level: 'B1' },
    { level: 'B2' },
    { level: 'C1' }
  ]
}

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>
}) {
  const { level } = await params
  return <LevelClient level={level} />
}
