import EntryView from '@/app/(journal)/entries/[slug]/_components/entry-view'

type EntryPageProps = {
  params: {
    slug: string
  }
}

const EntryPage = ({ params }: EntryPageProps) => {
  const { slug } = params

  return (
    <div className="px-4 pb-10">
      <EntryView slug={slug} />
    </div>
  )
}

export default EntryPage
