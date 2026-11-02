import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, PlusIcon } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { listApplications } from '@/lib/applications-api'
import { listInterviews, type InterviewSummary } from '@/lib/interviews-api'
import { formatLabel } from '@/lib/labels'
import { ErrorState } from '@/components/shared/QueryStates'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Ascent, type AscentStage } from '@/components/board/Ascent'
import { FlapText } from '@/components/board/FlapText'
import { PageHeader } from '@/components/shared/PageHeader'
import { STATUS_LINE } from '@/lib/stage-lines'
import type { ApplicationStatusValue, ApplicationSummary } from '@/lib/applications-api'

const UPCOMING_LIMIT = 5
const PIPELINE_STAGES: { status: ApplicationStatusValue; label: string }[] = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'OA', label: 'OA' },
  { status: 'INTERVIEW', label: 'Interview' },
  { status: 'FINAL_ROUND', label: 'Final' },
  { status: 'OFFER', label: 'Offer' },
]

function stagesFor(applications: ApplicationSummary[]): AscentStage[] {
  return PIPELINE_STAGES.map(({ status, label }) => ({
    key: status,
    label,
    count: applications.filter((application) => application.status === status && !application.archived).length,
    line: STATUS_LINE[status],
    to: '/applications/board',
  }))
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

export function DashboardPage() {
  const applicationsQuery = useQuery({
    queryKey: ['dashboard-applications'],
    queryFn: () => listApplications({ size: 500 }),
  })
  const upcomingInterviewsQuery = useQuery({
    queryKey: ['dashboard-upcoming-interviews'],
    queryFn: () => listInterviews({ upcoming: true, size: 50, sort: 'scheduled_at', direction: 'asc' }),
  })

  const applications = applicationsQuery.data?.items ?? []
  const upcomingInterviews = upcomingInterviewsQuery.data?.items ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        eyebrow={<DashboardClock />}
        description="Where each application stands, what is coming up, and what needs a nudge."
        actions={
          <Button variant="cta" size="lg" asChild>
            <Link to="/applications/new">
              <PlusIcon aria-hidden />
              Log an application
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="line-heading" className="space-y-4">
        <BoardHeading id="line-heading" action={<PanelLink to="/applications/board">Open board</PanelLink>}>
          Where you stand
        </BoardHeading>
        {applicationsQuery.isLoading && <Skeleton className="h-28 w-full" data-testid="pipeline-loading" />}
        {applicationsQuery.isError && <ErrorState title="Could not load data." description="Try again in a moment." />}
        {applicationsQuery.data && (
          <div data-testid="pipeline-strip" className="rounded-md border bg-card px-4 pt-6 pb-4 sm:px-6">
            <Ascent stages={stagesFor(applications)} />
          </div>
        )}
      </section>

      <section aria-labelledby="interviews-heading" className="min-w-0">
        <div className="flex items-center justify-between gap-3 rounded-t-md bg-brand px-4 py-2.5 text-brand-foreground">
          <h3 id="interviews-heading" className="text-display text-2xl">
            Next interviews
          </h3>
          <Link to="/interviews" className="board-label inline-flex items-center gap-1 hover:underline hover:decoration-signal hover:decoration-2 hover:underline-offset-4">
            All interviews
            <ArrowRightIcon aria-hidden className="size-3.5" />
          </Link>
        </div>
        <div className="rounded-b-md border border-t-0 bg-card">
          {upcomingInterviewsQuery.isLoading && <Skeleton className="h-48 w-full" />}
          {upcomingInterviewsQuery.data && <UpcomingInterviews interviews={upcomingInterviews.slice(0, UPCOMING_LIMIT)} />}
        </div>
      </section>
    </div>
  )
}

function DashboardClock() {
  const now = useClock()
  return (
    <span className="inline-flex items-center gap-3">
      <span>{format(now, 'EEEE d MMMM')}</span>
      <span aria-hidden className="h-3 w-px bg-border" />
      <time dateTime={now.toISOString()} className="tabular text-foreground">
        {format(now, 'HH:mm')}
      </time>
    </span>
  )
}

function BoardHeading({ id, action, children }: { id: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h3 id={id} className="text-display text-2xl">
        {children}
      </h3>
      {action}
    </div>
  )
}

function relativeDay(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return `today at ${format(date, 'HH:mm')}`
  if (isTomorrow(date)) return `tomorrow at ${format(date, 'HH:mm')}`
  return format(date, 'EEE d MMM')
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="board-label inline-flex items-center gap-1 text-foreground underline decoration-signal decoration-2 underline-offset-4 hover:decoration-foreground"
    >
      {children}
      <ArrowRightIcon aria-hidden className="size-3.5" />
    </Link>
  )
}

function UpcomingInterviews({ interviews }: { interviews: InterviewSummary[] }) {
  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 p-5">
        <p className="text-display text-xl">No interviews on the board</p>
        <p className="text-sm text-muted-foreground">
          When an application reaches an interview, schedule the round so prep and reminders can follow.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/interviews/new">Schedule an interview</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        aria-hidden
        className="board-label hidden grid-cols-[4.5rem_3.5rem_minmax(0,1fr)_minmax(0,9rem)_6.5rem] gap-3 border-b px-4 py-2 text-muted-foreground sm:grid"
      >
        <span>Date</span>
        <span>Time</span>
        <span>Company</span>
        <span>Round</span>
        <span className="text-right">Prep</span>
      </div>
      <ul aria-label="Upcoming interviews" className="divide-y">
        {interviews.map((interview) => {
          const date = interview.scheduled_at ? parseISO(interview.scheduled_at) : null
          return (
            <li
              key={interview.id}
              className="row-interactive grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[4.5rem_3.5rem_minmax(0,1fr)_minmax(0,9rem)_6.5rem]"
            >
              <FlapText value={date ? format(date, 'dd MMM').toUpperCase() : 'TBC'} className="text-sm font-semibold" />
              <span className="tabular hidden text-sm text-muted-foreground sm:block">{date ? format(date, 'HH:mm') : '--:--'}</span>
              <Link to={`/interviews/${interview.id}`} className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{interview.company_name}</span>
                <span className="block truncate text-xs text-muted-foreground sm:hidden">
                  Round {interview.round_number} · {formatLabel(interview.round_type)}
                  {date ? ` · ${format(date, 'HH:mm')}` : ''}
                </span>
              </Link>
              <span className="hidden truncate text-sm sm:block">
                R{interview.round_number} · {formatLabel(interview.round_type)}
              </span>
              <Link
                to={`/interviews/${interview.id}/prep`}
                className="board-label justify-self-end rounded-sm border border-foreground/25 px-2 py-1 hover:border-foreground hover:bg-signal hover:text-signal-foreground"
              >
                Prep pack
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
