import type { JournalListItem } from '@/lib/journals'
import JournalCard from './journal-card'

export type JournalMonth = {
  key: string
  label: string
  journals: JournalListItem[]
}

type JournalMonthSectionProps = {
  month: JournalMonth
  selectedDate?: string | null
}

const JournalMonthSection = ({
  month,
  selectedDate,
}: JournalMonthSectionProps) => (
  <section aria-labelledby={`month-${month.key}`} className="scroll-mt-24">
    <h2 id={`month-${month.key}`} className="mb-4 text-2xl font-semibold">
      {month.label}
    </h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {month.journals.map((journal) => (
        <div
          key={journal.id}
          data-journal-date={journal.date}
          className={
            selectedDate === journal.date
              ? 'ring-primary rounded-xl ring-2 ring-offset-2'
              : undefined
          }
        >
          <JournalCard journal={journal} />
        </div>
      ))}
    </div>
  </section>
)

export default JournalMonthSection
