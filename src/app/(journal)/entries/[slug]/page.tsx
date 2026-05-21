import EntryView from '@/app/(journal)/entries/[slug]/_components/entry-view'

type EntryPageProps = {
  params: Promise<{
    slug: string
  }>
}

const EntryPage = async ({ params }: EntryPageProps) => {
  const { slug } = await params

  return (
    <div className="px-4 pb-10">
      <EntryView slug={slug} />
    </div>
  )
}

export default EntryPage
