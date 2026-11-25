import type { JobResultState } from '@/test/create-job-result.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import type { IconName } from '@core/icons'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { VueWrapper } from '@vue/test-utils'
import { type Component, toValue } from 'vue'

type ButtonJobStub = {
  use: { mock: { lastCall?: unknown[] } }
  run: ReturnType<typeof vi.fn>
  setState: (state?: JobResultState) => void
  reset: () => void
}

// Whatever component the button is: the test reads props it does not know the type of
type ButtonWrapper = Pick<VueWrapper<any>, 'props' | 'text' | 'trigger'>

type JobButtonCase<TTarget> = {
  targetProp: string
  createTarget: () => TTarget
  // The component the button hands the job state to, as props: its `VtsActionButton` by default
  getButton?: (wrapper: VueWrapper) => ButtonWrapper
  job: ButtonJobStub
  // Given, the button shows this label and icon (and accent)
  offer?: { label: string; icon: IconName; accent?: string }
  // The first argument the job receives, as a getter: the target in a list by default, `null` when the test file
  // asserts the job arguments itself
  toJobTarget?: ((target: TTarget) => unknown) | null
  // Given, the disabled button also shows it as its hint
  errorMessage?: string
  // `false` for a button opening a drawer whose job only gets its payload once the drawer is confirmed: the button then
  // stays enabled when the job cannot run
  disabledWhenCannotRun?: boolean
  expectBusy?: (button: ButtonWrapper) => void
}

/**
 * Registers the tests every button running a job (a `createJobStub`) shares: what it offers, the job running on the
 * target of the button, on click, and the button following its state, disabled when it cannot run (enabled when
 * `disabledWhenCannotRun` is `false`), busy while it runs. Resets the job before each test. Returns the mount of the
 * button, on a new target by default, for the tests of the file.
 */
export function itRunsJobFromButton<TTarget>(
  component: Component,
  {
    targetProp,
    createTarget,
    getButton = wrapper => wrapper.getComponent(VtsActionButton),
    job,
    offer,
    toJobTarget = target => [target],
    errorMessage,
    disabledWhenCannotRun = true,
    expectBusy = button => expect(button.props('busy')).toBe(true),
  }: JobButtonCase<TTarget>
) {
  beforeEach(() => {
    job.reset()
  })

  function mountButton(target: TTarget = createTarget()) {
    return mountWithProps(component, { [targetProp]: target })
  }

  if (offer !== undefined) {
    it('offers its action', () => {
      const button = getButton(mountButton())

      expect(button.text()).toBe(offer.label)
      expect(button.props('icon')).toBe(offer.icon)

      if (offer.accent !== undefined) {
        expect(button.props('accent')).toBe(offer.accent)
      }
    })
  }

  if (toJobTarget !== null) {
    it('runs the job on its target', () => {
      const target = createTarget()
      mountButton(target)

      const [jobTarget] = job.use.mock.lastCall ?? []

      expect(toValue(jobTarget)).toEqual(toJobTarget(target))
    })
  }

  it('runs the job when clicking the button', async () => {
    await getButton(mountButton()).trigger('click')

    expect(job.run).toHaveBeenCalledOnce()
  })

  if (disabledWhenCannotRun) {
    it('disables the button when the job cannot run', () => {
      job.setState({ canRun: false, errorMessage })

      const button = getButton(mountButton())

      expect(button.props('disabled')).toBe(true)

      if (errorMessage !== undefined) {
        expect(button.props('hint')).toBe(errorMessage)
      }
    })
  } else {
    it('keeps the button enabled when the job cannot run yet', () => {
      job.setState({ canRun: false })

      expect(getButton(mountButton()).props('disabled')).toBeFalsy()
    })
  }

  it('shows the button as busy while the job runs', () => {
    job.setState({ isRunning: true })

    expectBusy(getButton(mountButton()))
  })

  return mountButton
}
