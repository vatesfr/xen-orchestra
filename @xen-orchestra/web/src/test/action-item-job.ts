import type { JobResultState } from '@/test/create-job-result.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'

type ActionItemJobCase = {
  // Mounts the composable, then reads the action
  getAction: () => LeafActionItem
  // Puts the job the action runs in that state
  setJobState: (state: JobResultState) => void
  errorMessage: string
  // Given, a click on the action calls `run` (in a test named `name`, "runs the job on click" by default), the action
  // showing `item`
  click?: { run: ReturnType<typeof vi.fn>; name?: string; item?: Partial<LeafActionItem> }
  // The other jobs that disable the action while they run, without a hint, by the end of the test name
  disabledWhile?: Record<string, () => void>
}

/**
 * Registers the tests every menu action running a job shares: a click runs it, and the action follows its state,
 * disabled with the reason as hint when it cannot run, busy while it runs, disabled while another job runs.
 */
export function itRunsJobFromAction({
  getAction,
  setJobState,
  errorMessage,
  click,
  disabledWhile = {},
}: ActionItemJobCase) {
  if (click !== undefined) {
    it(click.name ?? 'runs the job on click', () => {
      const action = getAction()

      action.onClick()

      if (click.item !== undefined) {
        expect(action).toMatchObject(click.item)
      }

      expect(click.run).toHaveBeenCalledOnce()
    })
  }

  it('can run when the job can run', () => {
    expect(getAction()).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    setJobState({ canRun: false, errorMessage })

    expect(getAction()).toMatchObject({ disabled: true, hint: errorMessage })
  })

  it('is busy while the job runs', () => {
    setJobState({ canRun: false, isRunning: true })

    expect(getAction().busy).toBe(true)
  })

  const otherJobs = Object.entries(disabledWhile)

  if (otherJobs.length > 0) {
    it.each(otherJobs)('is disabled while %s', (_, startOtherJob) => {
      startOtherJob()

      expect(getAction()).toMatchObject({ disabled: true, hint: undefined })
    })
  }
}
