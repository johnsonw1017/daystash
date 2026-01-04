export default function EntryPage({ params }: { params: { entryId: string } }) {
  return <div>entry {params.entryId}</div>
}
