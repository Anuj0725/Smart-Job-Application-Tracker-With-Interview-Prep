import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangleIcon, CheckCircle2Icon, NotebookPenIcon } from 'lucide-react'
import { getInterview, getInterviewFeedbackOrNull, upsertInterviewFeedback } from '@/lib/interviews-api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { StarRating } from '@/components/shared/StarRating'
import { clearDraft, readDraft, writeDraft } from '@/lib/drafts'
import { OUTCOME_CHIPS, ROUND_TOPICS, readTopics, withTopics } from '@/lib/debrief-topics'
import { cn } from '@/lib/utils'

interface DebriefDraft {
  selfRating: number | null
  whatWentWell: string
  whatWentPoorly: string
  improvementAreas: string
}

export function InterviewDebriefPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const interviewQuery = useQuery({
    queryKey: ['interview', id],
    queryFn: () => getInterview(id!),
    enabled: Boolean(id),
  })

  const feedbackQuery = useQuery({
    queryKey: ['interview-feedback', id],
    queryFn: () => getInterviewFeedbackOrNull(id!),
    enabled: Boolean(id),
  })

  const [selfRating, setSelfRating] = useState<number | null>(null)
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatWentPoorly, setWhatWentPoorly] = useState('')
  const [improvementAreas, setImprovementAreas] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [chosenTopics, setChosenTopics] = useState<string[] | null>(null)
  const [outcomeChosen, setOutcomeChosen] = useState(false)

  const draftKey = `debrief-${id}`

  useEffect(() => {
    if (feedbackQuery.isLoading) {
      return
    }
    const data = feedbackQuery.data
    const fromServer: DebriefDraft = {
      selfRating: data?.self_rating ?? null,
      whatWentWell: data?.what_went_well ?? '',
      whatWentPoorly: data?.what_went_poorly ?? '',
      improvementAreas: data?.improvement_areas ?? '',
    }
    const draft = readDraft<DebriefDraft>(draftKey) ?? fromServer
    setSelfRating(draft.selfRating)
    setWhatWentWell(draft.whatWentWell)
    setWhatWentPoorly(draft.whatWentPoorly)
    setImprovementAreas(draft.improvementAreas)
    setChosenTopics(readTopics(draft.improvementAreas))
  }, [feedbackQuery.data, feedbackQuery.isLoading, draftKey])

  function handleDraftChange(nextRating: number | null, well: string, poorly: string, improve: string) {
    writeDraft(draftKey, {
      selfRating: nextRating,
      whatWentWell: well,
      whatWentPoorly: poorly,
      improvementAreas: improve,
    })
  }

  const roundTopics = interviewQuery.data ? ROUND_TOPICS[interviewQuery.data.round_type] ?? [] : []
  const topics = chosenTopics ?? roundTopics

  function toggleTopic(topic: string) {
    const nextTopics = topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic]
    setChosenTopics(nextTopics)
  }

  const saveMutation = useMutation({
    mutationFn: (isDraft: boolean) =>
      upsertInterviewFeedback(id!, {
        self_rating: selfRating,
        what_went_well: whatWentWell || null,
        what_went_poorly: whatWentPoorly || null,
        improvement_areas: (outcomeChosen ? withTopics(improvementAreas, topics) : improvementAreas) || null,
        is_draft: isDraft,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['interview-feedback', id] })
      queryClient.invalidateQueries({ queryKey: ['interview', id] })
      clearDraft(draftKey)
      if (!result.is_draft) {
        setJustSubmitted(true)
      }
    },
  })

  if (interviewQuery.isLoading || feedbackQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (interviewQuery.isError || !interviewQuery.data) {
    return (
      <EmptyState
        icon={AlertTriangleIcon}
        title="Interview not found"
        description="It may have been deleted, or the link may be wrong."
        action={
          <Button asChild>
            <Link to="/interviews">Back to interviews</Link>
          </Button>
        }
      />
    )
  }

  const interview = interviewQuery.data

  if (justSubmitted) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={CheckCircle2Icon}
          title="Debrief saved"
          description="Your notes are captured while they're still fresh — you can always come back and edit them."
          action={
            <Button asChild>
              <Link to={`/interviews/${interview.id}`}>Back to interview</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Post-interview debrief</h2>
        <p className="text-sm text-muted-foreground">
          {interview.company.name} — Round {interview.round_number} ({interview.round_type.replace('_', ' ')})
        </p>
      </div>

      {feedbackQuery.data?.is_draft && (
        <Alert>
          <NotebookPenIcon className="h-4 w-4" />
          <AlertTitle>Draft in progress</AlertTitle>
          <AlertDescription>You started this debrief earlier — pick up where you left off.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How did it go?</CardTitle>
          <p className="text-xs text-muted-foreground">One tap is enough. The date, round and company are already filled in.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div role="group" aria-label="Outcome" className="flex flex-wrap gap-2">
            {OUTCOME_CHIPS.map((chip) => (
              <Chip
                key={chip.key}
                selected={outcomeChosen && selfRating === chip.rating}
                onClick={() => {
                  setSelfRating(chip.rating)
                  setOutcomeChosen(true)
                  handleDraftChange(chip.rating, whatWentWell, whatWentPoorly, improvementAreas)
                }}
              >
                {chip.label}
              </Chip>
            ))}
          </div>
          <div role="group" aria-label="Topics that came up" className="flex flex-wrap gap-2">
            {roundTopics
              .concat(topics.filter((topic) => !roundTopics.includes(topic)))
              .map((topic) => (
                <Chip key={topic} selected={topics.includes(topic)} onClick={() => toggleTopic(topic)}>
                  {topic}
                </Chip>
              ))}
          </div>
          {outcomeChosen && (
            <Button onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save debrief'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add more detail</CardTitle>
          <p className="text-xs text-muted-foreground">All optional. A few words now beat a perfect write-up later.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <StarRating
            value={selfRating}
            onChange={(val) => {
              setSelfRating(val)
              handleDraftChange(val, whatWentWell, whatWentPoorly, improvementAreas)
            }}
            label="Overall self-rating"
          />

          <div className="space-y-2">
            <Label htmlFor="whatWentWell">What went well?</Label>
            <Textarea
              id="whatWentWell"
              value={whatWentWell}
              onChange={(event) => {
                setWhatWentWell(event.target.value)
                handleDraftChange(selfRating, event.target.value, whatWentPoorly, improvementAreas)
              }}
              rows={2}
              placeholder="A quick note is enough"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentPoorly">What went poorly?</Label>
            <Textarea
              id="whatWentPoorly"
              value={whatWentPoorly}
              onChange={(event) => {
                setWhatWentPoorly(event.target.value)
                handleDraftChange(selfRating, whatWentWell, event.target.value, improvementAreas)
              }}
              rows={2}
              placeholder="A quick note is enough"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvementAreas">What would you improve next time?</Label>
            <Textarea
              id="improvementAreas"
              value={improvementAreas}
              onChange={(event) => {
                setImprovementAreas(event.target.value)
                handleDraftChange(selfRating, whatWentWell, whatWentPoorly, event.target.value)
              }}
              rows={2}
              placeholder="A quick note is enough"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate(true)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save draft'}
            </Button>
            <Button onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Submit debrief'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        selected ? 'border-primary bg-primary/10 text-primary' : 'bg-card text-muted-foreground hover:border-primary/40',
      )}
    >
      {children}
    </button>
  )
}
