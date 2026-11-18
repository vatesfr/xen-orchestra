import type { JobResultState } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { IconName } from '@core/icons'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount, type VueWrapper } from '@vue/test-utils'
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
  expectBusy?: (button: ButtonWrapper) => void
}

/**
 * Registers the tests every button running a job (a `createJobStub`) shares: what it offers, the job running on the
 * target of the button, on click, and the button following its state, disabled when it cannot run, busy while it
 * runs. Resets the job before each test. Returns the mount of the button, on a new target by default, for the tests
 * of the file.
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
    expectBusy = button => expect(button.props('busy')).toBe(true),
  }: JobButtonCase<TTarget>
) {
  beforeEach(() => {
    job.reset()
  })

  function mountButton(target: TTarget = createTarget()) {
    return mount(component, { props: { [targetProp]: target }, global: createGlobalTestConfig() })
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

  it('disables the button when the job cannot run', () => {
    job.setState({ canRun: false, errorMessage })

    const button = getButton(mountButton())

    expect(button.props('disabled')).toBe(true)

    if (errorMessage !== undefined) {
      expect(button.props('hint')).toBe(errorMessage)
    }
  })

  it('shows the button as busy while the job runs', () => {
    job.setState({ isRunning: true })

    expectBusy(getButton(mountButton()))
  })

  return mountButton
}
