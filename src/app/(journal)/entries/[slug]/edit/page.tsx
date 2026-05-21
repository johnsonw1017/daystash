import EntryEdit from '@/app/(journal)/entries/[slug]/edit/_components/entry-edit'

type EntryEditPageProps = {
  params: Promise<{
    slug: string
  }>
}

const EntryEditPage = async ({ params }: EntryEditPageProps) => {
  const { slug } = await params

  return (
    <div className="px-4 pb-10">
      <EntryEdit slug={slug} />
    </div>
  )
}

export default EntryEditPage
