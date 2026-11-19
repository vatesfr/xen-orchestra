import { useNewVmPayload } from '@/modules/vm/composables/use-new-vm-payload.composable.ts'
import type { NewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import { useUnsavedChangesGuard } from '@/shared/composables/unsaved-changes-guard.composable.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const STEPS = ['environment', 'configuration', 'review'] as const

export type NewVmStep = (typeof STEPS)[number]

export function useNewVmWizard(form: NewVmForm) {
  const { t } = useI18n()

  const router = useRouter()

  const payload = useNewVmPayload(form)

  // TODO: multiple VM creation not possible in the UI for now
  // Only pass a single payload
  const { run, isRunning, canRun } = useXoVmCreateJob([payload])

  const currentStepIndex = ref(0)

  const currentStep = computed<NewVmStep>(() => STEPS[currentStepIndex.value] ?? 'environment')

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

  async function next() {
    const stepIndex = currentStepIndex.value
    const step = currentStep.value

    if (step === 'review') {
      return
    }

    if (!(await form.validateStep(step))) {
      await form.focusFirstError()

      return
    }

    currentStepIndex.value = stepIndex + 1
  }

  function back() {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
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
