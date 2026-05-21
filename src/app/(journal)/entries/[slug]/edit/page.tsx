import EntryEdit from '@/app/(journal)/entries/[slug]/edit/_components/entry-edit'

type EntryEditPageProps = {
  params: {
    slug: string
  }
}

const EntryEditPage = ({ params }: EntryEditPageProps) => {
  const { slug } = params

  return (
    <div className="px-4 pb-10">
      <EntryEdit slug={slug} />
    </div>
  )
}

export default EntryEditPage
