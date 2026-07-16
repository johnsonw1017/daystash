import type { JournalListItem } from '@/lib/journals'
import JournalCard from './journal-card'

export type JournalMonth = {
  key: string
  label: string
  year: number
  journals: JournalListItem[]
}

type JournalMonthSectionProps = {
  isFirstMonthOfYear: boolean
  month: JournalMonth
}

const JournalMonthSection = ({
  isFirstMonthOfYear,
  month,
}: JournalMonthSectionProps) => (
  <section
    id={isFirstMonthOfYear ? `journal-year-${month.year}` : undefined}
    data-journal-year={month.year}
    aria-labelledby={`month-${month.key}`}
    className="scroll-mt-24"
  >
    <h2 id={`month-${month.key}`} className="mb-4 text-2xl font-semibold">
      {month.label}
    </h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {month.journals.map((journal) => (
        <JournalCard key={journal.id} journal={journal} />
      ))}
    </div>
  </section>
)

export default JournalMonthSection
