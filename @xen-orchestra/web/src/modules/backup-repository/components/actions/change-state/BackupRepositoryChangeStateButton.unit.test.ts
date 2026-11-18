import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { toValue } from 'vue'

// The job patches the repositories through the REST API
const changeStateJob = createJobStub(useXoBackupRepositoryChangeStateJob)

const mountButton = itRunsJobFromButton(BackupRepositoryChangeStateButton, {
  targetProp: 'br',
  createTarget: createBr,
  getButton: wrapper => wrapper.getComponent(UiButton),
  job: changeStateJob,
  toJobTarget: null,
})

// The job receives the repositories and the targeted state as getters
function findJobArgs() {
  const [brs, enabled] = changeStateJob.use.mock.lastCall ?? []

  return { brs: toValue(brs), enabled: toValue(enabled) }
}

const STATE_CASES = [
  {
    state: 'an enabled',
    enabled: true,
    action: 'disable',
    label: 'action:disable',
    icon: 'action:disable',
    targetedState: false,
  },
  {
    state: 'a disabled',
    enabled: false,
    action: 'connect',
    label: 'action:connect',
    icon: 'action:connect',
    targetedState: true,
  },
] as const

// Not `describe.each`: its `$state` would quote the name
for (const { state, enabled, action, label, icon, targetedState } of STATE_CASES) {
  describe(`on ${state} repository`, () => {
    it(`offers to ${action} it`, () => {
      const button = mountButton(createBr({ enabled })).getComponent(UiButton)

      expect(button.text()).toBe(t(label))
      expect(button.props('leftIcon')).toBe(icon)
    })

    it(`runs the job to ${action} it`, () => {
      const br = createBr({ enabled })
      mountButton(br)

      expect(findJobArgs()).toEqual({ brs: [br], enabled: targetedState })
    })
  })
}
