import { useNewVmPayload } from '@/modules/vm/composables/use-new-vm-payload.composable.ts'
import type { NewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import { useUnsavedChangesGuard } from '@/shared/composables/unsaved-changes-guard.composable.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const STEPS = ['environment', 'configuration', 'review'] as const

export type NewVmStep = (typeof STEPS)[number]

const getStep = (stepIndex: number): NewVmStep => STEPS[stepIndex] ?? 'environment'

const getStepIndex = (step: unknown) => Math.max((STEPS as readonly unknown[]).indexOf(step), 0)

export function useNewVmWizard(form: NewVmForm) {
  const { t } = useI18n()

  const router = useRouter()

  const route = useRoute()

  const payload = useNewVmPayload(form)

  // TODO: multiple VM creation not possible in the UI for now
  // Only pass a single payload
  const { run, isRunning, canRun } = useXoVmCreateJob([payload])

  const currentStepIndex = ref(0)

  const currentStep = computed(() => getStep(currentStepIndex.value))

  const requestedStepIndex = computed(() => getStepIndex(route.query.step))

  const steps = computed<StepDefinition[]>(() => [
    { label: t('new-vm:environment-setup') },
    { label: t('new-vm:vm-configuration') },
    { label: t('new-vm:review-details') },
  ])

  const creationError = ref<Error>()

  const tasksRoute = computed(() => {
    const { pool } = form.vmState

    return pool === undefined ? { name: '/(site)/tasks' } : { name: '/pool/[id]/tasks', params: { id: pool.id } }
  })

  const isCreating = ref(false)

  let isCreated = false

  useUnsavedChangesGuard(() => form.isDirty.value && !isCreating.value && !isCreated)

  let isPageActive = true

  onScopeDispose(() => {
    isPageActive = false
  })

  function getStepLocation(stepIndex: number) {
    return { query: { ...route.query, step: stepIndex === 0 ? undefined : getStep(stepIndex) } }
  }

  async function isStepValid(step: NewVmStep) {
    if (step === 'review' || (await form.validateStep(step))) {
      return true
    }

    await form.focusFirstError()

    return false
  }

  async function moveForwardTo(stepIndex: number) {
    for (let index = currentStepIndex.value; index < stepIndex; index++) {
      if (!(await isStepValid(getStep(index)))) {
        return false
      }

      currentStepIndex.value = index + 1
    }

    return true
  }

  if (route.query.step !== undefined) {
    void router.replace(getStepLocation(0))
  }

  watch(requestedStepIndex, async stepIndex => {
    if (stepIndex <= currentStepIndex.value) {
      currentStepIndex.value = stepIndex

      return
    }

    if (!(await moveForwardTo(stepIndex))) {
      router.go(currentStepIndex.value - stepIndex)
    }
  })

  async function next() {
    if (currentStep.value === 'review') {
      return
    }

    const nextStepIndex = currentStepIndex.value + 1

    if (await moveForwardTo(nextStepIndex)) {
      await router.push(getStepLocation(nextStepIndex))
    }
  }

  function back() {
    if (currentStepIndex.value > 0) {
      router.back()
    }
  }

  function cancel() {
    const { pool } = form.vmState

    return router.push(
      pool === undefined ? { name: '/(site)/dashboard' } : { name: '/pool/[id]/dashboard', params: { id: pool.id } }
    )
  }

  async function create() {
    if (!canRun.value) {
      return
    }

    isCreating.value = true

    try {
      const [promiseResult] = await run()

      if (promiseResult.status === 'rejected') {
        throw promiseResult.reason
      }

      if (isPageActive) {
        isCreated = true

        await router.push({ name: '/vm/[id]/dashboard', params: { id: promiseResult.value } })
      }
    } catch (error) {
      creationError.value = error instanceof Error ? error : new Error(JSON.stringify(error))
    } finally {
      isCreating.value = false
    }
  }

  function dismissCreationError() {
    creationError.value = undefined
  }

  return {
    steps,
    currentStep,
    currentStepIndex,
    isCreating,
    isCreateJobRunning: isRunning,
    canCreate: canRun,
    creationError,
    tasksRoute,
    next,
    back,
    cancel,
    create,
    dismissCreationError,
  }
}
